import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { PLUGIN_SOURCE } from "@/lib/rbx/serialize";

export const Route = createFileRoute("/plugin")({
  head: () => ({
    meta: [
      { title: "Studio Bridge Plugin — Roblox UI Builder" },
      {
        name: "description",
        content:
          "Install the Roblox Studio bridge plugin to pull AI-designed UI from the builder and create real Instances inside StarterGui.",
      },
      { property: "og:title", content: "Studio Bridge Plugin — Roblox UI Builder" },
      {
        property: "og:description",
        content: "Connect Roblox Studio to the UI builder and sync editable UI hierarchies into StarterGui.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PluginPage,
});

function PluginPage() {
  const [source, setSource] = useState(PLUGIN_SOURCE);

  useEffect(() => {
    setSource(PLUGIN_SOURCE.replace("%ENDPOINT%", `${window.location.origin}/api/public/sync`));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-12 items-center gap-3 border-b border-border px-4">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to builder
        </Link>
        <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold">
          <Plug size={15} className="text-primary" /> Studio Bridge Plugin
        </span>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section>
          <h1 className="text-2xl font-semibold">Connect Roblox Studio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The bridge plugin is the link between this builder and your real Roblox project. It pulls the UI you
            designed here and creates actual Roblox Instances inside <code>StarterGui</code> — never a screenshot.
            Roblox Studio stays your development environment.
          </p>
        </section>

        <section className="space-y-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">Install</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Copy the plugin source below.</li>
            <li>
              In Roblox Studio, right-click <code>ServerStorage</code> → Insert Object → Script, paste the source.
            </li>
            <li>Right-click the script → “Save as Local Plugin…”, then restart Studio.</li>
            <li>
              Enable HTTP: Game Settings → Security → Allow HTTP Requests, and allow plugin HTTP access when
              prompted.
            </li>
            <li>Open the “UI Builder” toolbar button to show the bridge widget.</li>
          </ol>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(source);
              toast.success("Plugin source copied");
            }}
          >
            <Copy size={14} /> Copy plugin source
          </Button>
        </section>

        <section className="space-y-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">Sync workflow</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              In the builder press <strong>Send to Roblox Studio</strong> to get a session code.
            </li>
            <li>Paste the code into the plugin widget and press Sync — the hierarchy appears in StarterGui.</li>
            <li>
              Re-sending with the same code runs <strong>Update Existing UI</strong>: the plugin finds the previous
              build by project attribute and replaces it instead of duplicating.
            </li>
            <li>Every sync is wrapped in a Studio undo waypoint, so you can revert inside Studio too.</li>
          </ul>
        </section>

        <section className="rounded-lg border border-border">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plugin source (Lua)
          </div>
          <pre className="max-h-[420px] overflow-auto p-4 text-[11px] leading-relaxed text-muted-foreground">
            {source}
          </pre>
        </section>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
