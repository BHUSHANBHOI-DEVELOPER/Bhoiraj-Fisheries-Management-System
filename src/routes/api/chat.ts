import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const SYSTEM_PROMPT = `You are the AI assistant for Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk. (भोईराज मत्स्य व्यवसायिक सहकारी संस्था मर्यादित, पिंपळगाव बु.), a registered cooperative in Pimpalgaon Bk., Taluka Pachora, District Jalgaon, Maharashtra, India.

Key facts:
- Registration No: JGA/AGR/PCR OD/530, established 22/06/2004
- Chairman: Shri Bhika Shankar Bhoi
- Operating area: Pimpri, Dambhurni, Ghodasgaon villages
- The society deals with pond/dam-based fisheries, member registrations, government schemes (PM-MKSSY), dam audits, and document management

Your role:
- Help members find information about the society, dam audits, documents, and schemes
- Answer politely in the language the user writes in (English, Hindi, or Marathi)
- If asked something you cannot verify from society records, politely say so and suggest contacting the chairman at +91 94215 17012
- Keep answers concise, helpful, and respectful — this serves rural cooperative members
- Use markdown formatting (lists, bold) for clarity`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as { messages?: UIMessage[] };
          const messages = body.messages;
          if (!Array.isArray(messages)) {
            return new Response("Messages are required", { status: 400 });
          }

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          }

          const gateway = createOpenAICompatible({
            name: "lovable",
            baseURL: "https://ai.gateway.lovable.dev/v1",
            headers: { "Lovable-API-Key": apiKey },
          });

          const result = streamText({
            model: gateway("google/gemini-3.6-flash"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
          });

          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err) {
          console.error("Chat API error:", err);
          const msg = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

