import { createFileRoute } from "@tanstack/react-router";

/** In-memory session store: session code -> payload. Cleared on server restart. */
const sessions = new Map<string, { payload: unknown; at: number }>();

function prune() {
  const cutoff = Date.now() - 1000 * 60 * 60 * 6;
  for (const [k, v] of sessions) if (v.at < cutoff) sessions.delete(k);
}

export const Route = createFileRoute("/api/public/sync")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        prune();
        const code = new URL(request.url).searchParams.get("code")?.toUpperCase() ?? "";
        const entry = sessions.get(code);
        if (!entry) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
        return new Response(JSON.stringify(entry.payload), {
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async ({ request }) => {
        prune();
        const body = (await request.json()) as { code?: string; payload?: unknown };
        const code = (body.code ?? "").toUpperCase();
        if (!/^[A-Z0-9]{4,12}$/.test(code) || !body.payload) {
          return new Response(JSON.stringify({ error: "bad_request" }), { status: 400 });
        }
        sessions.set(code, { payload: body.payload, at: Date.now() });
        return new Response(JSON.stringify({ ok: true, code }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
