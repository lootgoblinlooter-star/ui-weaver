import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are an expert Roblox UI designer working inside a visual Roblox UI builder.
You output ONLY JSON describing a Roblox UI tree. No prose, no markdown fences.

Node shape:
{ "id": "unique-string", "className": "<RobloxClass>", "name": "PascalCaseName", "props": { ... }, "children": [ ... ] }

Allowed classNames: ScreenGui, Frame, ScrollingFrame, CanvasGroup, ViewportFrame, TextLabel, TextButton, TextBox,
ImageLabel, ImageButton, UICorner, UIStroke, UIGradient, UIPadding, UIListLayout, UIGridLayout, UIPageLayout,
UIAspectRatioConstraint, UIScale, UISizeConstraint, UITextSizeConstraint.

Property value formats:
- Position/Size/CanvasSize/CellSize/CellPadding/CornerRadius/Padding: { "xs": num, "xo": num, "ys": num, "yo": num }
- AnchorPoint/Offset/MinSize/MaxSize: { "x": num, "y": num }
- Colours: hex strings like "#3f8cff"
- Enums: plain strings ("Center", "Stretch", "GothamBold", ...)
- Booleans/numbers as-is.

RESPONSIVE RULES (critical):
- Always use Scale (xs/ys) for Position and Size. Offsets (xo/yo) must be 0 unless strictly needed.
- Use AnchorPoint for centring/edge anchoring, UIAspectRatioConstraint for buttons/icons, UIListLayout/UIGridLayout
  for repeated elements, UIPadding for inner spacing, TextScaled + UITextSizeConstraint for text.
- Mobile touch targets should be at least 0.08 of screen height.

Return the FULL updated tree, root must be a ScreenGui. Preserve existing node ids when a node is kept unchanged
so the editor can keep selection stable. Keep names meaningful (TopBar, Currency, CurrencyIcon, PlayButton...).`;

type StyleRow = {
  keyword: string;
  title: string;
  description: string;
  image_path: string;
};

/**
 * Finds saved style examples that the user referenced, either explicitly
 * (styleKeyword) or by mentioning the keyword anywhere in their prompt,
 * and returns them together with their image as a data URL.
 */
async function loadStyleReferences(prompt: string, explicit?: string | null) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("style_examples")
      .select("keyword,title,description,image_path");
    if (error || !data?.length) return [];

    const haystack = prompt.toLowerCase();
    const wanted = (data as StyleRow[]).filter(
      (row) =>
        (explicit && row.keyword.toLowerCase() === explicit.toLowerCase()) ||
        haystack.includes(row.keyword.toLowerCase()),
    );

    const refs: { row: StyleRow; dataUrl: string }[] = [];
    for (const row of wanted.slice(0, 3)) {
      const file = await supabaseAdmin.storage.from("style-examples").download(row.image_path);
      if (file.error || !file.data) continue;
      const buffer = new Uint8Array(await file.data.arrayBuffer());
      let binary = "";
      for (const byte of buffer) binary += String.fromCharCode(byte);
      const mime = file.data.type || "image/png";
      refs.push({ row, dataUrl: `data:${mime};base64,${btoa(binary)}` });
    }
    return refs;
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/api/ai-ui")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json()) as {
          prompt: string;
          tree: unknown;
          selectionPath?: string;
          device?: string;
          imageDataUrl?: string;
          imageDataUrls?: string[];
          styleKeyword?: string | null;
          mode?: "accurate" | "improve" | "analyze";
        };

        const isAnalyze = body.mode === "analyze";
        const styleRefs = isAnalyze ? [] : await loadStyleReferences(body.prompt ?? "", body.styleKeyword);

        const styleText = styleRefs.length
          ? `\nSTYLE REFERENCES: the user referenced saved style keyword(s) ${styleRefs
              .map((r) => `"${r.row.keyword}"`)
              .join(", ")}. The final image(s) attached below are style examples, NOT content to copy literally.
${styleRefs
  .map((r) => `- ${r.row.keyword} (${r.row.title}): ${r.row.description || "no notes"}`)
  .join("\n")}
Match their colour palette, corner radii, spacing rhythm, stroke/gradient treatment and overall visual language.`
          : "";

        const contextText = `Current UI tree JSON:\n${JSON.stringify(body.tree)}\n
Current selection: ${body.selectionPath ?? "none"}
Current device preview: ${body.device ?? "pc"}
${body.mode === "accurate" ? "Reconstruct the uploaded image as closely as possible using editable Roblox UI objects (never a single ImageLabel of the screenshot)." : ""}
${body.mode === "improve" ? "Reconstruct the uploaded image but clean it up: consistent spacing, colours, corner radii and Roblox-appropriate polish." : ""}${styleText}
User request: ${body.prompt}`;

        const attachments = [
          ...(body.imageDataUrls ?? []),
          ...(body.imageDataUrl ? [body.imageDataUrl] : []),
        ].filter(Boolean);

        const content: unknown[] = [{ type: "text", text: contextText }];
        for (const url of attachments.slice(0, 4)) {
          content.push({ type: "image_url", image_url: { url } });
        }
        for (const ref of styleRefs) {
          content.push({ type: "image_url", image_url: { url: ref.dataUrl } });
        }

        const messages = [
          {
            role: "system",
            content: isAnalyze
              ? `You analyse UI screenshots for a Roblox UI builder. Return ONLY JSON:
{"summary":"one sentence","elements":[{"type":"Background|Frame|Button|Text|Icon|Image|Decoration","count":n,"note":"short"}]}`
              : SYSTEM,
          },
          { role: "user", content },
        ];

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "google/gemini-3.7-flash", messages }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "AI request failed", { status: upstream.status });
        }

        const json = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const raw = json.choices?.[0]?.message?.content ?? "";
        const cleaned = raw
          .trim()
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/, "")
          .trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          const start = cleaned.indexOf("{");
          const end = cleaned.lastIndexOf("}");
          if (start === -1 || end === -1) {
            return new Response(JSON.stringify({ error: "AI returned no usable JSON" }), {
              status: 502,
              headers: { "Content-Type": "application/json" },
            });
          }
          try {
            parsed = JSON.parse(cleaned.slice(start, end + 1));
          } catch {
            return new Response(JSON.stringify({ error: "AI returned malformed JSON" }), {
              status: 502,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        return new Response(
          JSON.stringify({
            result: parsed,
            styleUsed: styleRefs.map((r) => r.row.keyword),
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
