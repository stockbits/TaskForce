// Read-only local preview of the production build plus the validation harness.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";

const projectDirectory = process.cwd();
const outputDirectory = resolve(projectDirectory, "dist");
const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const harness = pathname === "/validation/responsive-preview.html";
    const filename = harness
      ? resolve(projectDirectory, "validation/responsive-preview.html")
      : resolve(
          outputDirectory,
          "." + (pathname === "/" ? "/index.html" : pathname),
        );
    if (!harness && !filename.startsWith(outputDirectory + sep)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(filename);
    response.writeHead(200, {
      "Content-Type":
        contentTypes[extname(filename)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
server.listen(4173, "0.0.0.0", () =>
  console.log("Production validation preview listening on port 4173."),
);
