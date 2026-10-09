const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const imagesDir = path.join(rootDir, "data", "images");
const port = Number(process.env.PORT) || 5173;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

function send(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function serveFile(res, baseDir, requestedPath) {
  const resolved = path.resolve(baseDir, requestedPath);

  if (!resolved.startsWith(path.resolve(baseDir))) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      send(res, 404, "Not found");
      return;
    }

    const extension = path.extname(resolved).toLowerCase();
    send(res, 200, data, contentTypes[extension] || "application/octet-stream");
  });
}

function listImages(res) {
  fs.readdir(imagesDir, { withFileTypes: true }, (error, entries) => {
    if (error) {
      send(res, 500, JSON.stringify({ error: "Could not read data/images." }), "application/json; charset=utf-8");
      return;
    }

    const images = entries
      .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
      .map((entry) => ({
        name: entry.name,
        url: `/images/${encodeURIComponent(entry.name)}`,
      }));

    send(res, 200, JSON.stringify({ images }), "application/json; charset=utf-8");
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, "http://localhost");
  const pathname = requestUrl.pathname;

  if (pathname === "/api/images") {
    listImages(res);
    return;
  }

  if (pathname.startsWith("/images/")) {
    serveFile(res, imagesDir, safeDecode(pathname.replace("/images/", "")));
    return;
  }

  if (pathname === "/") {
    serveFile(res, publicDir, "index.html");
    return;
  }

  serveFile(res, publicDir, safeDecode(pathname.slice(1)));
});

server.listen(port, () => {
  console.log(`PinRoulette is running at http://localhost:${port}`);
  console.log(`Serving images from ${pathToFileURL(imagesDir)}`);
});
