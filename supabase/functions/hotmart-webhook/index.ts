import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  try {
    const body = await req.json();

    // Validate Hotmart webhook token (hottok)
    const webhookSecret = Deno.env.get("HOTMART_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("HOTMART_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hottok = body.hottok;
    if (hottok !== webhookSecret) {
      console.error("Invalid hottok received");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract event and buyer info
    const event = body.event;
    const buyerEmail = body.data?.buyer?.email;
    const transactionId = body.data?.purchase?.transaction;

    if (!buyerEmail || !transactionId) {
      return new Response(JSON.stringify({ error: "Missing buyer email or transaction ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up user by email
    const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) {
      console.error("Error listing users:", userError.message);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === buyerEmail.toLowerCase()
    );

    if (!user) {
      console.error("No user found for email:", buyerEmail);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          expires_at: null, // Lifetime or managed by Hotmart
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
    } else {
      console.log("Unhandled event type:", event);
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
