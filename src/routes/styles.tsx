import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Tag, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { createStyleExample, listStyleExamples, normaliseKeyword } from "@/lib/style-library";

export const Route = createFileRoute("/styles")({
  head: () => ({
    meta: [
      { title: "Style Library — teach the AI your Roblox UI style" },
      {
        name: "description",
        content:
          "Upload example Roblox UI screenshots, tag each one with a keyword, and every generation that mentions that keyword is built in that style.",
      },
      { property: "og:title", content: "Style Library — teach the AI your Roblox UI style" },
      {
        property: "og:description",
        content: "Upload UI examples, give them a keyword, and generate new UI in that exact style.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StylesPage,
});

function StylesPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const styles = useQuery({ queryKey: ["style-examples"], queryFn: listStyleExamples });

  const save = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Attach an example image first.");
      return createStyleExample({ keyword, title, description, file });
    },
    onSuccess: (kw) => {
      toast.success(`Saved. Mention "${kw}" in a prompt to generate in this style.`);
      setKeyword("");
      setTitle("");
      setDescription("");
      setFile(null);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["style-examples"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the style"),
  });

  function pick(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  return (
    <div className="forge-shell min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={15} /> Back
          </Link>
          <Link to="/builder">
            <Button size="sm" className="forge-button h-8">
              Open builder
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="eyebrow">Style library</p>
        <h1 className="display mt-2 text-5xl md:text-6xl">Teach the hive your style.</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Upload a UI example, give it a keyword. Whenever anyone mentions that keyword in a prompt, the
          generator uses your example as the visual reference.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
          <section className="preview-card h-fit space-y-3 p-5">
            <h2 className="display text-2xl">Add an example</h2>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-40 w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-surface-glass text-xs text-muted-foreground hover:border-primary hover:text-foreground"
            >
              {preview ? (
                <img src={preview} alt="Selected UI example" className="h-full w-full object-contain" />
              ) : (
                <span className="flex items-center gap-2">
                  <ImagePlus size={16} /> Choose a UI screenshot
                </span>
              )}
            </button>

            <div className="space-y-1">
              <label className="eyebrow" htmlFor="keyword">
                Keyword
              </label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="neon-tycoon"
              />
              {keyword && (
                <p className="text-[11px] text-muted-foreground">
                  Saved as <span className="text-primary">{normaliseKeyword(keyword)}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="eyebrow" htmlFor="title">
                Style name
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Neon tycoon HUD"
              />
            </div>

            <div className="space-y-1">
              <label className="eyebrow" htmlFor="notes">
                Notes for the AI
              </label>
              <Textarea
                id="notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dark glass panels, cyan strokes, heavy rounded corners, chunky buttons."
                className="min-h-[80px] resize-none text-xs"
              />
            </div>

            <Button
              className="forge-button w-full"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              Save style
            </Button>
          </section>

          <section>
            <h2 className="display text-2xl">Saved styles</h2>
            {styles.isLoading && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={13} className="animate-spin" /> Loading…
              </p>
            )}
            {styles.data?.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">Nothing saved yet — add the first one.</p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {styles.data?.map((s) => (
                <article key={s.id} className="preview-card overflow-hidden">
                  {s.previewUrl ? (
                    <img
                      src={s.previewUrl}
                      alt={`${s.title} UI example`}
                      loading="lazy"
                      className="h-36 w-full rounded object-cover"
                    />
                  ) : (
                    <div className="h-36 w-full rounded bg-muted" />
                  )}
                  <div className="mt-2">
                    <p className="flex items-center gap-1.5 text-xs text-primary">
                      <Tag size={12} /> {s.keyword}
                    </p>
                    <p className="mt-1 text-sm font-medium">{s.title}</p>
                    {s.description && (
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
