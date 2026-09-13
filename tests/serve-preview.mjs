// Local-only harness for production assets and real service-worker updates.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist");
let version = 0;
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  res.setHeader("Cache-Control", "no-store");
  if (path === "/__test/update" && req.method === "POST") {
    version++;
    res.end("updated");
    return;
  }
  if (path.startsWith("/api/")) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end('{"error":"Services unavailable in browser fixture tests"}');
    return;
  }
  try {
    let file = resolve(root, "." + decodeURIComponent(path));
    if (!file.startsWith(root + sep)) file = resolve(root, "index.html");
    let body;
    try {
      body = await readFile(file);
    } catch {
      file = resolve(root, "index.html");
      body = await readFile(file);
    }
    if (path === "/sw.js")
      body = Buffer.from(
        body.toString() + "\n// Browser test revision " + version,
      );
    res.setHeader(
      "Content-Type",
      types[extname(file)] || "application/octet-stream",
    );
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end("Preview fixture failed");
  }
}).listen(4173, "127.0.0.1");
