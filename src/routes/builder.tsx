/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Blocks,
  Copy,
  Eye,
  Monitor,
  Redo2,
  Undo2,
  Plug,
  Play,
  Pencil,
} from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { BuilderProvider, useBuilder } from "@/lib/rbx/store";
import { Canvas } from "@/components/builder/Canvas";
import { Explorer } from "@/components/builder/Explorer";
import { Properties } from "@/components/builder/Properties";
import { LeftPanel } from "@/components/builder/LeftPanel";
import { DEVICES } from "@/lib/rbx/types";
import { buildPayload } from "@/lib/rbx/serialize";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Roblox UI Builder — AI Wrapper for Roblox Studio UI" },
      {
        name: "description",
        content:
          "Design Roblox UI with AI: generate layers from a prompt or screenshot, edit them in a Studio-style Explorer and Properties panel, auto-scale for every device, and sync into Roblox Studio.",
      },
      { property: "og:title", content: "Roblox UI Builder — AI Wrapper for Roblox Studio UI" },
      {
        property: "og:description",
        content:
          "Prompt or upload a screenshot, get editable Roblox UI layers, then send them straight into StarterGui with the Studio bridge plugin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <BuilderProvider>
      <Builder />
      <Toaster position="bottom-right" />
    </BuilderProvider>
  ),
});

const randomCode = () =>
  Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

function Builder() {
  const b = useBuilder();
  const [preview, setPreview] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [code] = useState(randomCode);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const projectId = useMemo(() => `prj_${code}`, [code]);

  async function sendToStudio(update: boolean) {
    setSending(true);
    try {
      const res = await fetch("/api/public/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, payload: buildPayload(b.root, projectId, b.root.name) }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSent(true);
      b.snapshot(update ? "Updated Studio UI" : "Sent to Studio");
      toast.success(
        update
          ? "Update queued — press Sync in the Studio plugin to refresh the existing UI."
          : "UI queued — enter your session code in the Studio plugin and press Sync.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to queue UI");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <Blocks size={18} className="text-primary" />
        <div className="mr-3">
          <h1 className="text-sm font-semibold leading-none">Roblox UI Builder</h1>
          <p className="text-[10px] leading-none text-muted-foreground">
            AI wrapper for the Roblox Studio UI workflow
          </p>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={b.undo} title="Undo (Ctrl+Z)">
          <Undo2 size={15} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={b.redo} title="Redo">
          <Redo2 size={15} />
        </Button>

        <div className="ml-2 flex items-center gap-1 rounded-md border border-border p-0.5">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => b.setDevice(d.id)}
              className={cn(
                "rounded px-2 py-1 text-[11px] capitalize",
                b.device === d.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d.id}
            </button>
          ))}
        </div>

        <Button
          variant={preview ? "default" : "outline"}
          size="sm"
          className="ml-2 h-8"
          onClick={() => {
            setPreview((p) => !p);
            b.select([]);
          }}
        >
          {preview ? <Pencil size={14} /> : <Play size={14} />}
          {preview ? "Edit" : "Preview"}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/plugin"
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plug size={13} /> Studio Plugin
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Monitor size={14} /> Send to Roblox Studio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send to Roblox Studio</DialogTitle>
                <DialogDescription>
                  The bridge plugin pulls this UI and builds real Instances inside StarterGui.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Session code</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-2xl tracking-[0.3em]">{code}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        toast.success("Code copied");
                      }}
                    >
                      <Copy size={13} />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button disabled={sending} onClick={() => sendToStudio(false)}>
                    Send to Studio
                  </Button>
                  <Button variant="secondary" disabled={sending || !sent} onClick={() => sendToStudio(true)}>
                    Update Existing UI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(buildPayload(b.root, projectId, b.root.name), null, 2),
                      );
                      toast.success("Project JSON copied");
                    }}
                  >
                    Export Project
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/plugin">Get the plugin</Link>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  In Studio: open the UI Builder Bridge widget, paste the code, press Sync. Re-sending with the
                  same code updates the existing UI instead of duplicating it.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {!preview && (
          <>
            <ResizablePanel defaultSize="20" minSize="14" className="border-r border-border">
              <LeftPanel pendingPrompt={pendingPrompt} onPromptConsumed={() => setPendingPrompt(null)} />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel defaultSize={preview ? "100" : "56"}>
          <Canvas preview={preview} />
        </ResizablePanel>

        {!preview && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="24" minSize="16" className="border-l border-border">
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize="45" minSize="15">
                  <Explorer onAsk={(p) => setPendingPrompt(p)} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="55" minSize="15">
                  <Properties />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {preview && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card/90 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
          <Eye size={12} className="mr-1.5 inline" />
          Preview mode — {DEVICES.find((d) => d.id === b.device)?.label}
        </div>
      )}
    </div>
  );
}
