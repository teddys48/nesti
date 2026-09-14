import { loadEnv } from "./lib/env";
loadEnv();

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { runMigrations } from "./db/migrate";
import { authRoutes } from "./modules/auth/auth.routes";
import { notesRoutes } from "./modules/notes/notes.routes";
import { revisionsRoutes } from "./modules/revisions/revisions.routes";
import { tagsRoutes } from "./modules/tags/tags.routes";
import { searchRoutes } from "./modules/search/search.routes";
import { ApiError } from "./lib/errors";
import { existsSync } from "fs";
import { resolve } from "path";

// Initialize database schema and FTS5 on server start
runMigrations();

// Determine web dist path from environment variable or fallback candidate paths
const configuredWebDistPath = process.env.WEB_DIST_PATH;
const candidatePaths = [
  configuredWebDistPath,
  configuredWebDistPath ? resolve(process.cwd(), configuredWebDistPath) : null,
  resolve(process.cwd(), "apps/web/dist"),
  resolve(process.cwd(), "../web/dist"),
  resolve(import.meta.dir, "../../web/dist"),
  resolve(import.meta.dir, "../web/dist"),
  "./dist",
  "../web/dist",
  "apps/web/dist",
].filter(Boolean) as string[];

const webDistPath = candidatePaths.find((path) => existsSync(path));

export const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  .onError(({ error, code, set }) => {
    if (error instanceof ApiError) {
      set.status = error.status;
      return { error: { code: error.code, message: error.message } };
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: { code: "VALIDATION_ERROR", message: error.message } };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: { code: "NOT_FOUND", message: "Resource not found" } };
    }
    console.error("Unhandled Server Error:", error);
    set.status = 500;
    return {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    };
  })
  .use(authRoutes)
  .use(notesRoutes)
  .use(revisionsRoutes)
  .use(tagsRoutes)
  .use(searchRoutes)
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }));

// If compiled web frontend exists, serve static assets and SPA fallback
if (webDistPath) {
  const indexHtmlPath = resolve(webDistPath, "index.html");

  app.use(
    staticPlugin({
      assets: webDistPath,
      prefix: "",
      alwaysStatic: true,
      indexHTML: true,
    }),
  );

  if (existsSync(indexHtmlPath)) {
    app.get("*", ({ path, set }) => {
      if (path.startsWith("/api")) {
        set.status = 404;
        return { error: { code: "NOT_FOUND", message: "API route not found" } };
      }
      return Bun.file(indexHtmlPath);
    });
  }
}

const port = Number(process.env.PORT) || 3000;

if (import.meta.main) {
  app.listen(port, () => {
    console.log(`🚀 Nesti API Server running at http://localhost:${port}`);
  });
}

export type App = typeof app;
