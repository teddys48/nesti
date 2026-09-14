import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load .env from monorepo root or local dir
  const env = loadEnv(mode, path.resolve(__dirname, "../../"), "");
  const apiPort = env.PORT || process.env.PORT || "3000";

  return {
    plugins: [svelte()],
    resolve: {
      alias: {
        $lib: path.resolve("./src/lib"),
        $components: path.resolve("./src/components"),
        $features: path.resolve("./src/features"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
