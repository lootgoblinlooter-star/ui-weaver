import { supabase } from "@/integrations/supabase/client";

export type StyleExample = {
  id: string;
  keyword: string;
  title: string;
  description: string;
  image_path: string;
  created_at: string;
};

export type StyleExampleWithPreview = StyleExample & { previewUrl: string | null };

export const normaliseKeyword = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

export async function listStyleExamples(): Promise<StyleExampleWithPreview[]> {
  const { data, error } = await supabase
    .from("style_examples")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as StyleExample[];
  return Promise.all(
    rows.map(async (row) => {
      const signed = await supabase.storage
        .from("style-examples")
        .createSignedUrl(row.image_path, 60 * 60);
      return { ...row, previewUrl: signed.data?.signedUrl ?? null };
    }),
  );
}

export async function createStyleExample(input: {
  keyword: string;
  title: string;
  description: string;
  file: File;
}) {
  const keyword = normaliseKeyword(input.keyword);
  if (!keyword) throw new Error("Give the style a keyword.");
  if (!input.title.trim()) throw new Error("Give the style a name.");

  const ext = input.file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${keyword}/${crypto.randomUUID()}.${ext}`;

  const upload = await supabase.storage
    .from("style-examples")
    .upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (upload.error) throw new Error(upload.error.message);

  const { error } = await supabase.from("style_examples").insert({
    keyword,
    title: input.title.trim(),
    description: input.description.trim(),
    image_path: path,
  });
  if (error) {
    await supabase.storage.from("style-examples").remove([path]);
    throw new Error(
      error.code === "23505" ? `The keyword "${keyword}" is already taken.` : error.message,
    );
  }
  return keyword;
}
