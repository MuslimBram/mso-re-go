import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/),
});

const DetectionsSchema = z.object({
  detections: z
    .array(
      z.object({
        type: z.enum(["face", "plate", "document", "screen", "other"]),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        w: z.number().min(0).max(1),
        h: z.number().min(0).max(1),
        confidence: z.number().min(0).max(1),
        note: z.string().max(120).optional(),
      }),
    )
    .max(60),
});

export type Detection = z.infer<typeof DetectionsSchema>["detections"][number];

/**
 * Scans a panorama for privacy-sensitive content (faces, license plates,
 * readable documents, phone/computer screens). Returns normalized
 * bounding boxes (0–1) so the client can render and blur them on a
 * higher-resolution canvas.
 */
export const scanPanoramaPrivacy = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY mungon");

    const system = `Ti je një inspektor privatësie për panorama 360° që do të publikohen në Google Street View.
Identifiko ÇDO element të dukshëm që duhet të bëhet blur përpara publikimit publik:
- "face": fytyra njerëzore (edhe pjesërisht të dukshme)
- "plate": targa makinash
- "document": dokumente identifikuese, letra me të dhëna personale të lexueshme
- "screen": ekrane telefoni/laptopi me përmbajtje të lexueshme
- "other": çdo gjë tjetër qartë private (p.sh. emra në kuti postare)

Kthe vetëm JSON që përputhet me skemën. Bounding box-et duhet të jenë në koordinata të normalizuara (0..1) ku (0,0) është këndi i sipërm i majtë dhe (w,h) janë gjerësia/lartësia e kutisë. Lëre kutinë pak më të madhe se objekti për siguri. Mos kthe asgjë nëse imazhi është i pastër.`;

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
          {
            role: "user",
            content: [
              { type: "text", text: "Skano këtë panoramë dhe kthe detektimet sipas skemës." },
              { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "privacy_detections",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["detections"],
              properties: {
                detections: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "x", "y", "w", "h", "confidence"],
                    properties: {
                      type: { type: "string", enum: ["face", "plate", "document", "screen", "other"] },
                      x: { type: "number" },
                      y: { type: "number" },
                      w: { type: "number" },
                      h: { type: "number" },
                      confidence: { type: "number" },
                      note: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Limiti i AI u tejkalua. Provo më vonë.");
      if (res.status === 402) throw new Error("Krediti i AI mbaroi. Shto kredite.");
      throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "{\"detections\":[]}";
    let parsed: unknown;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      parsed = { detections: [] };
    }
    const result = DetectionsSchema.safeParse(parsed);
    if (!result.success) return { detections: [] as Detection[] };
    return { detections: result.data.detections };
  });