
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const imagesDir = path.join(rootDir, "data", "images");
const soundsDir = path.join(rootDir, "data", "sounds");

console.log("Sounds folder:", soundsDir);
console.log("BG exists:", fs.existsSync(path.join(soundsDir, "BG.mp3")));
console.log("Spin exists:", fs.existsSync(path.join(soundsDir, "spin.mp3")));

const port = Number(process.env.PORT) || 5173;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

const imageExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

function send(
  res,
  statusCode,
  body,
  contentType = "text/plain; charset=utf-8"
) {
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
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, requestedPath);

  // Prevent requests from accessing files outside the intended folder.
  if (
    resolved !== resolvedBase &&
    !resolved.startsWith(resolvedBase + path.sep)
  ) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") {
        send(res, 404, "Not found");
      } else {
        console.error("File read error:", error);
        send(res, 500, "Internal server error");
      }

      return;
    }

    const extension = path.extname(resolved).toLowerCase();
    const contentType =
      contentTypes[extension] || "application/octet-stream";

    send(res, 200, data, contentType);
  });
}

// List images in data/images
function listImages(res) {
  fs.readdir(imagesDir, { withFileTypes: true }, (error, entries) => {
    if (error) {
      send(
        res,
        500,
        JSON.stringify({ error: "Could not read data/images." }),
        "application/json; charset=utf-8"
      );

      return;
    }

    const images = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          imageExtensions.has(
            path.extname(entry.name).toLowerCase()
          )
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      )
      .map((entry) => ({
        name: entry.name,
        url: `/images/${encodeURIComponent(entry.name)}`,
      }));

    send(
      res,
      200,
      JSON.stringify({ images }),
      "application/json; charset=utf-8"
    );
  });
}

// HTTP server
const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, "http://localhost");
  const pathname = requestUrl.pathname;

  // API: list available images
  if (pathname === "/api/images") {
    listImages(res);
    return;
  }

  // Serve images from data/images
  if (pathname.startsWith("/images/")) {
    const requestedPath = safeDecode(
      pathname.slice("/images/".length)
    );

    if (!requestedPath) {
      send(res, 400, "Invalid image path");
      return;
    }

    serveFile(res, imagesDir, requestedPath);
    return;
  }

  // Serve sounds from data/sounds
  if (pathname.startsWith("/sounds/")) {
    const requestedPath = safeDecode(
      pathname.slice("/sounds/".length)
    );

    if (!requestedPath) {
      send(res, 400, "Invalid sound path");
      return;
    }

    serveFile(res, soundsDir, requestedPath);
    return;
  }

  // Serve the main HTML page
  if (pathname === "/") {
    serveFile(res, publicDir, "index.html");
    return;
  }

  // Serve other frontend files from public
  const requestedPath = safeDecode(pathname.slice(1));

  if (!requestedPath) {
    send(res, 400, "Invalid path");
    return;
  }

  serveFile(res, publicDir, requestedPath);
});

// Start server
server.listen(port, () => {
  console.log(`PinRoulette is running at http://localhost:${port}`);
  console.log(`Serving images from ${pathToFileURL(imagesDir)}`);
  console.log(`Serving sounds from ${pathToFileURL(soundsDir)}`);
});
