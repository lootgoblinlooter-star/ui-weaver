import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Blocks,
  ImagePlus,
  Layers,
  Plug,
  Smartphone,
  Sparkles,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roblox UI Builder — AI UI generator for Roblox Studio" },
      {
        name: "description",
        content:
          "Type a prompt, drop a screenshot or reuse a saved style keyword. Get editable, responsive Roblox UI layers and sync them straight into Studio.",
      },
      { property: "og:title", content: "Roblox UI Builder — AI UI generator for Roblox Studio" },
      {
        property: "og:description",
        content:
          "Prompt, image or style keyword in — editable Roblox UI layers out, ready to sync into StarterGui.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const TRY = ["neon tycoon shop", "obby stage select", "simulator HUD", "horror inventory"];

const TICKER = [
  "Editable layers",
  "Screenshot to UI",
  "Style keywords",
  "Auto-scaled for mobile",
  "Studio sync plugin",
  "Explorer + Properties",
];

const STATS = [
  { value: "3", label: "Ways to generate" },
  { value: "20+", label: "Roblox classes supported" },
  { value: "1", label: "Click to Studio" },
  { value: "$0", label: "To start" },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Prompt to UI",
    body: "Describe the interface and the AI writes a full ScreenGui tree — frames, buttons, layouts, constraints.",
  },
  {
    icon: ImagePlus,
    title: "Attach an image",
    body: "Drop a screenshot or mockup. It gets analysed, then rebuilt as real editable objects — never a flat image.",
  },
  {
    icon: Tag,
    title: "Style keywords",
    body: "Upload your own UI examples with a keyword. Mention it in a prompt and every generation follows that style.",
  },
  {
    icon: Layers,
    title: "Studio-style editing",
    body: "Explorer, Properties and a live canvas. Change anything the AI made, undo and redo like you'd expect.",
  },
  {
    icon: Smartphone,
    title: "Responsive by default",
    body: "Scale-based sizing, anchor points and aspect constraints so the UI holds up on phone, tablet and PC.",
  },
  {
    icon: Plug,
    title: "Sync to Studio",
    body: "Send the tree to the bridge plugin with a session code and it lands in StarterGui.",
  },
];

const STEPS = [
  { n: "01", t: "Describe or upload", d: "A prompt, a screenshot, or a saved style keyword." },
  { n: "02", t: "Edit the layers", d: "Tune props in the Studio-style Explorer and Properties panels." },
  { n: "03", t: "Sync to Studio", d: "Paste your session code into the plugin and press Sync." },
];

function Landing() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const start = (text: string) => {
    const value = text.trim();
    navigate({ to: "/builder", search: value ? { prompt: value } : {} });
  };

  return (
    <div className="forge-shell min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Blocks size={18} className="text-primary" />
            <span className="display text-xl">UI Forge</span>
          </Link>
          <div className="hidden items-center gap-5 text-xs text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#styles" className="hover:text-foreground">
              Style library
            </a>
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <Link to="/plugin" className="hover:text-foreground">
              Studio plugin
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/styles">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                Style library
              </Button>
            </Link>
            <Link to="/builder">
              <Button size="sm" className="forge-button h-8 text-xs">
                Open builder
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <section className="forge-glow relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center">
          <p className="eyebrow forge-rise">AI UI maker for Roblox Studio</p>
          <h1 className="display forge-rise rise-delay-1 mx-auto mt-4 max-w-4xl text-6xl md:text-8xl">
            Roblox UI
            <br />
            <span className="text-primary">worth clicking on.</span>
          </h1>
          <p className="forge-rise rise-delay-2 mx-auto mt-5 max-w-2xl text-sm text-muted-foreground md:text-base">
            Type a concept, attach a screenshot, or reuse a saved style keyword. You get editable,
            auto-scaling Roblox UI layers — not a flat picture.
          </p>

          <div className="forge-rise rise-delay-3 mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && start(prompt)}
              placeholder="A neon tycoon shop menu with 6 item cards"
              aria-label="Describe the UI you want"
              className="h-12 flex-1 rounded-md border border-border bg-surface-glass px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <Button className="forge-button h-12 px-6" onClick={() => start(prompt)}>
              Generate <ArrowRight size={16} />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Try:</span>
            {TRY.map((t) => (
              <button
                key={t}
                onClick={() => setPrompt(t)}
                className="rounded-full border border-border px-3 py-1 hover:border-primary hover:text-foreground"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex overflow-hidden border-t border-border py-3">
          <div className="forge-ticker flex shrink-0 gap-6 whitespace-nowrap pr-6 text-xs text-muted-foreground">
            {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-6">
                {t} <span className="text-primary">+</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center">
              <p className="display text-4xl text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">Features</p>
        <h2 className="display mt-2 max-w-2xl text-4xl md:text-5xl">
          Everything between the idea and StarterGui.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="preview-card p-5">
              <f.icon size={18} className="text-primary" />
              <h3 className="display mt-3 text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="styles" className="border-y border-border bg-surface-glass">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow">Style library</p>
            <h2 className="display mt-2 text-4xl md:text-5xl">
              Your UI. <span className="text-primary">Your keyword.</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Upload examples of UI you love and tag each one with a keyword. When anyone types that keyword
              in a prompt, the generator gets your example attached as the reference — same palette, same
              radii, same feel.
            </p>
            <Link to="/styles" className="mt-6 inline-block">
              <Button className="forge-button">
                Open style library <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["neon-tycoon", "Glow strokes, dark glass"],
              ["cartoon-obby", "Fat radii, bright fills"],
              ["horror-hud", "Grain, muted reds"],
              ["clean-sim", "Flat panels, tight grid"],
            ].map(([kw, note], i) => (
              <div key={kw} className={`preview-card forge-drift drift-${["left", "right", "bottom-left", "bottom-right"][i]}`}>
                <p className="flex items-center gap-1.5 text-xs text-primary">
                  <Tag size={12} /> {kw}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">How it works</p>
        <h2 className="display mt-2 text-4xl md:text-5xl">Three steps, no Studio wrestling.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.n} className="preview-card p-5">
              <p className="display text-3xl text-primary">{s.n}</p>
              <h3 className="mt-2 text-sm font-medium">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <h2 className="display text-5xl md:text-6xl">Build your first screen.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            No setup, no Photoshop, no exporting PNGs into Studio.
          </p>
          <Link to="/builder" className="mt-7 inline-block">
            <Button className="forge-button h-12 px-8">
              Open the builder <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground">
          <span className="display text-base text-foreground">UI Forge</span>
          <div className="flex gap-4">
            <Link to="/builder" className="hover:text-foreground">
              Builder
            </Link>
            <Link to="/styles" className="hover:text-foreground">
              Style library
            </Link>
            <Link to="/plugin" className="hover:text-foreground">
              Studio plugin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
