// Dev-only Vite plugin: serves the Vercel-style functions in /api during
// `npm run dev`, so the frontend can call /api/* without the Vercel CLI.
// It mimics Vercel's req.query/req.body and res.status()/res.json(), resolves
// nested + [param] dynamic routes, and loads server code via ssrLoadModule so
// edits to /api and /lib hot-reload. NOT used in production (Vercel runs /api itself).
import { existsSync, statSync, readdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { loadEnv } from "vite";

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

function findDynamic(dir, suffix) {
  if (!isDir(dir)) return null;
  for (const name of readdirSync(dir)) {
    const m = /^\[(.+)\]/.exec(name);
    if (!m) continue;
    const full = join(dir, name);
    if (suffix === "dir" && isDir(full)) return { param: m[1], path: full };
    if (suffix === ".js" && isFile(full) && name.endsWith(".js")) return { param: m[1], path: full };
  }
  return null;
}

function resolveHandler(apiDir, subpath) {
  const segments = subpath.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  let dir = apiDir;
  const params = {};
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const last = i === segments.length - 1;
    if (last) {
      const exact = join(dir, `${seg}.js`);
      if (isFile(exact)) return { file: exact, params };
      const dyn = findDynamic(dir, ".js");
      if (dyn) {
        params[dyn.param] = decodeURIComponent(seg);
        return { file: dyn.path, params };
      }
      const index = join(dir, seg, "index.js");
      if (isFile(index)) return { file: index, params };
      return null;
    }
    const sub = join(dir, seg);
    if (isDir(sub)) {
      dir = sub;
      continue;
    }
    const dynDir = findDynamic(dir, "dir");
    if (dynDir) {
      params[dynDir.param] = decodeURIComponent(seg);
      dir = dynDir.path;
      continue;
    }
    return null;
  }
  return null;
}

export default function devApiPlugin() {
  const root = process.cwd();
  const apiDir = resolve(root, "api");

  return {
    name: "dev-api",
    apply: "serve",
    config(_, { mode }) {
      // Make .env (DATABASE_URL, STRIPE_*, etc.) visible to server code in dev.
      const env = loadEnv(mode, root, "");
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        const resolved = resolveHandler(apiDir, url.pathname.slice("/api/".length));
        if (!resolved) return next();

        // req.query (search params + dynamic route params)
        req.query = { ...Object.fromEntries(url.searchParams), ...resolved.params };

        // Collect raw body once; expose raw (for webhook signatures) + parsed JSON.
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks);
        req.rawBody = raw;
        if (raw.length && (req.headers["content-type"] || "").includes("application/json")) {
          try {
            req.body = JSON.parse(raw.toString("utf8"));
          } catch {
            req.body = undefined;
          }
        }

        // Vercel-like response helpers.
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (obj) => {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(obj));
          return res;
        };
        res.send = (data) => {
          if (data !== null && typeof data === "object") return res.json(data);
          res.end(data ?? "");
          return res;
        };

        try {
          const modUrl = `/${relative(root, resolved.file).split("\\").join("/")}`;
          const mod = await server.ssrLoadModule(modUrl);
          await mod.default(req, res);
          if (!res.writableEnded) res.end();
        } catch (err) {
          server.ssrFixStacktrace?.(err);
          console.error("[dev-api]", err);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: String(err?.message ?? err) }));
          }
        }
      });
    },
  };
}
