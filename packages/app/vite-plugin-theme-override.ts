import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

const OVERRIDE_PATH = path.resolve(import.meta.dirname, "public/theme-dev-override.json");

/**
 * Dev-only bridge: Storybook Theme Lab can POST overrides to the Vite app.
 * Writes `public/theme-dev-override.json` and triggers a full reload.
 */
export function themeOverrideDevPlugin(): Plugin {
  return {
    name: "denser-theme-override-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/__denser_theme_override") {
          next();
          return;
        }

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === "DELETE") {
          fs.mkdirSync(path.dirname(OVERRIDE_PATH), { recursive: true });
          fs.writeFileSync(OVERRIDE_PATH, "{}\n", "utf8");
          server.ws.send({ type: "full-reload", path: "*" });
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          req.on("end", () => {
            try {
              const body = Buffer.concat(chunks).toString("utf8");
              JSON.parse(body);
              fs.mkdirSync(path.dirname(OVERRIDE_PATH), { recursive: true });
              fs.writeFileSync(OVERRIDE_PATH, `${body}\n`, "utf8");
              server.ws.send({ type: "full-reload", path: "*" });
              res.statusCode = 204;
              res.end();
            } catch {
              res.statusCode = 400;
              res.end("invalid json");
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}
