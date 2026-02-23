import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per isolate lifetime)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max 30 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Input validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_EVENTS = new Set([
  "PURCHASE_APPROVED",
  "PURCHASE_COMPLETE",
  "PURCHASE_REFUNDED",
  "PURCHASE_CANCELED",
  "SUBSCRIPTION_CANCELLATION",
]);

function validateWebhookPayload(body: unknown): {
  valid: boolean;
  error?: string;
  data?: { hottok: string; event: string; buyerEmail: string; transactionId: string };
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid payload" };
  }

  const b = body as Record<string, unknown>;

  const hottok = b.hottok;
  if (typeof hottok !== "string" || hottok.length === 0 || hottok.length > 512) {
    return { valid: false, error: "Invalid hottok" };
  }

  const event = b.event;
  if (typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
    return { valid: false, error: "Invalid or unsupported event type" };
  }

  const data = b.data as Record<string, unknown> | undefined;
  const buyerEmail = (data?.buyer as Record<string, unknown>)?.email;
  if (typeof buyerEmail !== "string" || !EMAIL_REGEX.test(buyerEmail) || buyerEmail.length > 255) {
    return { valid: false, error: "Invalid or missing buyer email" };
  }

  const transactionId = (data?.purchase as Record<string, unknown>)?.transaction;
  if (typeof transactionId !== "string" || transactionId.length === 0 || transactionId.length > 255) {
    return { valid: false, error: "Invalid or missing transaction ID" };
  }

  return {
    valid: true,
    data: { hottok, event, buyerEmail: buyerEmail.toLowerCase().trim(), transactionId: transactionId.trim() },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Validate and extract payload
    const validation = validateWebhookPayload(body);
    if (!validation.valid || !validation.data) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { hottok, event, buyerEmail, transactionId } = validation.data;

    // Validate Hotmart webhook token (hottok)
    const webhookSecret = Deno.env.get("HOTMART_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("HOTMART_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (hottok !== webhookSecret) {
      console.error("Invalid hottok received");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(buyerEmail);
    if (userError || !userData?.user) {
      console.error("User lookup failed:", userError?.message ?? "not found");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;

    // Handle different Hotmart events
    if (event === "PURCHASE_APPROVED" || event === "PURCHASE_COMPLETE") {
      // Idempotency check
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("hotmart_transaction_id", transactionId)
        .eq("status", "active")
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ message: "Already processed" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Activate subscription
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          activated_at: new Date().toISOString(),
          hotmart_transaction_id: transactionId,
          expires_at: null,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError.message);
        return new Response(JSON.stringify({ error: "Failed to activate" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Subscription activated for user:", user.id);
    } else if (
      event === "PURCHASE_REFUNDED" ||
      event === "PURCHASE_CANCELED" ||
      event === "SUBSCRIPTION_CANCELLATION"
    ) {
      // Deactivate subscription
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "inactive",
          expires_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error deactivating subscription:", updateError.message);
        return new Response(JSON.stringify({ error: "Failed to deactivate" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Subscription deactivated for user:", user.id);
    }

    return new Response(JSON.stringify({ message: "OK" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
