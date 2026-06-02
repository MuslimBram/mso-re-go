import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  question: z.string().min(1).max(2000),
  context: z.string().max(4000).optional(),
});

export const askAiGuide = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY mungon");
    const system = `Ti je një AI guide turistik dhe historik që flet shqip. Përgjigjet janë të shkurtra, miqësore dhe konkrete (max 6 fjali). Kur përdoruesi pyet për një vend, jep fakte historike, kulturore, kuriozitete dhe sugjerime për vizitorë.${
      data.context ? `\nKonteksti aktual: ${data.context}` : ""
    }`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.question },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI gateway: ${res.status} ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const answer = json.choices?.[0]?.message?.content ?? "Nuk munda të gjeneroj përgjigje.";
    return { answer };
  });