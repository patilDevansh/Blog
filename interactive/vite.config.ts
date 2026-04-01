import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/**
 * In local dev (`npm run dev`), the Netlify functions aren't running.
 * This plugin intercepts GET /.netlify/functions/public-manifests and
 * queries Neon directly using DATABASE_URL from the environment.
 * In production the real Netlify function handles this route.
 */
function localDbManifestsPlugin(): Plugin {
  return {
    name: "local-db-manifests",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        "/.netlify/functions/public-manifests",
        async (_req, res) => {
          const dbUrl = process.env.DATABASE_URL?.trim();
          if (!dbUrl) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ manifests: [], source: "none" }));
            return;
          }
          try {
            const { neon } = await import("@neondatabase/serverless");
            const sql = neon(dbUrl);
            const rows = await sql`
              SELECT manifest FROM publishes ORDER BY updated_at DESC
            `;
            const manifests = rows.map((r: { manifest: unknown }) => {
              const m = r.manifest;
              return typeof m === "string" ? JSON.parse(m) : m;
            });
            res.writeHead(200, {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            });
            res.end(JSON.stringify({ manifests, source: "database" }));
          } catch (e) {
            const msg = e instanceof Error ? e.message : "DB error";
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: msg, manifests: [] }));
          }
        }
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ ones) from the repo root .env
  // so the localDbManifestsPlugin can access DATABASE_URL in process.env
  const env = loadEnv(mode, resolve(__dirname, ".."), "");
  Object.assign(process.env, env);

  return {
    envDir: "../",
    resolve: {
      alias: {
        "@schema": resolve(__dirname, "src/schema"),
        "@runtime": resolve(__dirname, "src/runtime"),
        "@widgets": resolve(__dirname, "src/widgets"),
      },
    },
    publicDir: "public",
    plugins: [localDbManifestsPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          journal: resolve(__dirname, "journal.html"),
          creator: resolve(__dirname, "creator.html"),
        },
      },
    },
  };
});
