/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  History,
  ShieldCheck,
  Boxes,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useBuilder } from "@/lib/rbx/store";
import { DEVICES, type RbxNode } from "@/lib/rbx/types";
import { pathOf, uid, createNode, udim2 } from "@/lib/rbx/tree";
import { validate, type Issue } from "@/lib/rbx/validate";
import { cn } from "@/lib/utils";

const QUICK = [
  "Create a clean simulator UI",
  "Add a currency counter to the top right",
  "Optimise this for mobile",
  "Change the colour scheme to blue and white",
  "Add rounded corners to all buttons",
  "Add a settings menu",
];

function normalise(node: any): RbxNode {
  return {
    id: typeof node.id === "string" && node.id ? node.id : uid(),
    className: node.className ?? "Frame",
    name: node.name ?? node.className ?? "Object",
    props: node.props ?? {},
    children: Array.isArray(node.children) ? node.children.map(normalise) : [],
  };
}

export function LeftPanel({
  pendingPrompt,
  onPromptConsumed,
}: {
  pendingPrompt: string | null;
  onPromptConsumed: () => void;
}) {
  const b = useBuilder();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [image, setImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (pendingPrompt && pendingPrompt !== prompt) {
    setPrompt(pendingPrompt);
    onPromptConsumed();
  }

  const selectionPath = b.selection[0]
    ? pathOf(b.root, b.selection[0])
        .map((n) => n.name)
        .join(".")
    : undefined;

  async function callAi(text: string, mode?: "accurate" | "improve" | "analyze", imageDataUrl?: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/ai-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          tree: b.root,
          selectionPath,
          device: b.device,
          mode,
          imageDataUrl,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        if (res.status === 429) toast.error("AI is rate limited — try again shortly.");
        else if (res.status === 402) toast.error("AI credits exhausted. Add credits in Lovable to continue.");
        else toast.error(msg || `AI request failed (${res.status})`);
        return null;
      }
      const json = (await res.json()) as { result: any };
      return json.result;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function run(text: string, mode?: "accurate" | "improve", withImage = false) {
    if (!text.trim() && !withImage) return;
    setLog((l) => [...l, { role: "user", text: text || "Recreate the uploaded image" }]);
    const result = await callAi(text, mode, withImage ? image?.dataUrl : undefined);
    if (!result) return;
    if (result.className) {
      b.setRoot(normalise(result), text.slice(0, 40) || "AI update");
      setLog((l) => [...l, { role: "ai", text: "UI updated." }]);
      setPrompt("");
    } else if (result.summary) {
      setLog((l) => [...l, { role: "ai", text: result.summary }]);
    } else {
      toast.error("AI returned an unexpected result");
    }
  }

  async function onFile(file: File) {
    const dataUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
    const img = new Image();
    img.onload = () => {
      b.addAsset({ id: uid(), name: file.name, dataUrl, width: img.width, height: img.height });
    };
    img.src = dataUrl;
    setImage({ dataUrl, name: file.name });
    setAnalysis(null);
    const result = await callAi("Analyse this UI screenshot.", "analyze", dataUrl);
    if (result) setAnalysis(result);
  }

  const runValidation = () => {
    const spec = DEVICES.find((d) => d.id === b.device) ?? DEVICES[0]!;
    setIssues(validate(b.root, { x: 0, y: 0, w: spec.width, h: spec.height }));
  };

  return (
    <Tabs defaultValue="ai" className="flex h-full flex-col gap-0">
      <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
        {[
          ["ai", "AI", Sparkles],
          ["assets", "Assets", ImagePlus],
          ["components", "Components", Boxes],
          ["checks", "Checks", ShieldCheck],
          ["history", "History", History],
        ].map(([v, label, Icon]: any) => (
          <TabsTrigger
            key={v}
            value={v}
            className="h-9 gap-1.5 rounded-none border-b-2 border-transparent px-2.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Icon size={13} /> {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="ai" className="m-0 flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-auto p-3">
          {image && (
            <div className="rounded-md border border-border p-2">
              <img src={image.dataUrl} alt="reference" className="max-h-40 w-full rounded object-contain" />
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{image.name}</p>
              {busy && !analysis && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" /> Analysing image…
                </p>
              )}
              {analysis && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-muted-foreground">{analysis.summary}</p>
                  <ul className="space-y-0.5">
                    {(analysis.elements ?? []).map((el: any, i: number) => (
                      <li key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-foreground">{el.type} detected</span>
                        <span className="text-muted-foreground">×{el.count}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-1.5 pt-1">
                    <Button
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      disabled={busy}
                      onClick={() => run("Recreate this uploaded image as editable Roblox UI.", "accurate", true)}
                    >
                      Accurate Recreation
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 flex-1 text-xs"
                      disabled={busy}
                      onClick={() => run("Recreate and improve this uploaded image.", "improve", true)}
                    >
                      Recreate + Improve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {log.map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs",
                m.role === "user" ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {m.text}
            </div>
          ))}

          {log.length === 0 && !image && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Describe the UI you want. The AI edits your layers directly.
              </p>
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => setPrompt(q)}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-left text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-2">
          {selectionPath && (
            <p className="mb-1 truncate text-[11px] text-primary">Context: {selectionPath}</p>
          )}
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(prompt);
            }}
            placeholder="Create a modern simulator UI with a currency display…"
            className="min-h-[70px] resize-none text-xs"
          />
          <div className="mt-2 flex gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              hidden
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <Button variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={14} /> Import Image
            </Button>
            <Button size="sm" className="h-8 flex-1" disabled={busy} onClick={() => run(prompt)}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Generate
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="assets" className="m-0 flex-1 overflow-auto p-3">
        <Button variant="outline" size="sm" className="mb-3 w-full" onClick={() => fileRef.current?.click()}>
          <ImagePlus size={14} /> Import Asset
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {b.assets.map((a) => (
            <div key={a.id} className="group relative overflow-hidden rounded-md border border-border">
              <img src={a.dataUrl} alt={a.name} className="h-20 w-full bg-muted object-contain" />
              <p className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">{a.name}</p>
              <div className="absolute inset-x-0 top-0 flex justify-between p-1 opacity-0 group-hover:opacity-100">
                <button
                  className="rounded bg-primary px-1.5 text-[10px] text-primary-foreground"
                  onClick={() => {
                    const parent = b.selection[0] ?? b.root.children[0]?.id ?? b.root.id;
                    const isWide = a.width > a.height * 2.2;
                    const node = createNode(
                      isWide ? "ImageLabel" : "ImageButton",
                      a.name.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9]/g, "") || "Asset",
                      {
                        Image: a.dataUrl,
                        BackgroundTransparency: 1,
                        Size: udim2(0.2, 0, 0.2 * (a.height / a.width), 0),
                        Position: udim2(0.4, 0, 0.4, 0),
                      },
                      [
                        createNode("UIAspectRatioConstraint", "UIAspectRatioConstraint", {
                          AspectRatio: +(a.width / a.height).toFixed(3),
                        }),
                      ],
                    );
                    b.setRoot(
                      (function insert(root: RbxNode): RbxNode {
                        if (root.id === parent) return { ...root, children: [...root.children, node] };
                        return { ...root, children: root.children.map(insert) };
                      })(b.root),
                      "Added asset",
                    );
                    toast.success(`${node.className} added`);
                  }}
                >
                  Add
                </button>
                <button
                  className="rounded bg-destructive px-1 text-[10px] text-white"
                  onClick={() => b.removeAsset(a.id)}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}
          {b.assets.length === 0 && (
            <p className="col-span-2 text-xs text-muted-foreground">
              Import PNG, JPG or WebP artwork, icons and screenshots here.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="components" className="m-0 flex-1 overflow-auto p-3">
        {b.components.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Right-click any layer in the Explorer → “Convert to Component” to save it here for reuse.
          </p>
        )}
        <div className="space-y-1.5">
          {b.components.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
              <Boxes size={13} className="text-primary" />
              <span className="truncate text-xs">{c.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-6 text-[11px]"
                onClick={() =>
                  b.insertComponent(c.id, b.selection[0] ?? b.root.children[0]?.id ?? b.root.id)
                }
              >
                Insert
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="checks" className="m-0 flex-1 overflow-auto p-3">
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="flex-1" onClick={runValidation}>
            <ShieldCheck size={14} /> Validate UI
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={busy || !issues?.length}
            onClick={() =>
              run(
                `Fix these layout problems without changing the visual design: ${issues
                  ?.map((i) => `${i.nodeName}: ${i.message}`)
                  .join("; ")}`,
              )
            }
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Fix with AI
          </Button>
        </div>
        <div className="mt-3 space-y-1.5">
          {issues?.length === 0 && <p className="text-xs text-muted-foreground">No issues found.</p>}
          {issues?.map((i) => (
            <button
              key={i.id}
              onClick={() => b.select([i.nodeId])}
              className={cn(
                "w-full rounded-md border px-2 py-1.5 text-left text-[11px]",
                i.severity === "error"
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-border bg-muted/40",
              )}
            >
              <span className="font-medium text-foreground">{i.nodeName}</span>
              <span className="block text-muted-foreground">{i.message}</span>
            </button>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="history" className="m-0 flex-1 overflow-auto p-3">
        <div className="space-y-1.5">
          {[...b.versions].reverse().map((v) => (
            <div key={v.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-xs">{v.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(v.at).toLocaleTimeString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-6 text-[11px]"
                onClick={() => {
                  b.restoreVersion(v.id);
                  toast.success(`Restored “${v.label}”`);
                }}
              >
                Restore
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
