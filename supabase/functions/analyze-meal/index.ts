import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a nutrition analysis AI for women 40+. Analyze the food in the image and return structured nutritional data. Be accurate and conservative with estimates. Always respond with the tool call.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this meal photo. Identify the foods and estimate the nutritional content for the entire plate/meal.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_nutrition",
              description: "Report the estimated nutritional content of the meal",
              parameters: {
                type: "object",
                properties: {
                  meal_name: {
                    type: "string",
                    description: "A short descriptive name for the meal, e.g. 'Grilled Chicken Salad'",
                  },
                  calories: { type: "number", description: "Total estimated calories" },
                  protein_g: { type: "number", description: "Estimated protein in grams" },
                  carbs_g: { type: "number", description: "Estimated carbohydrates in grams" },
                  fats_g: { type: "number", description: "Estimated fats in grams" },
                  foods_detected: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of individual foods detected in the image",
                  },
                  notes: {
                    type: "string",
                    description: "Any additional notes about the meal, portion sizes, or suggestions",
                  },
                },
                required: ["meal_name", "calories", "protein_g", "carbs_g", "fats_g", "foods_detected"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_nutrition" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return structured nutrition data");
    }

    const nutrition = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(nutrition), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-meal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
