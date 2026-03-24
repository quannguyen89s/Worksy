import { readFileSync } from "fs";
import path from "path";
import type { Express, Request, Response } from "express";

export function mountOpenApiDocs(app: Express): void {
  const openApiPath = path.join(__dirname, "..", "openapi.yaml");

  app.get("/openapi.yaml", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/yaml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.send(readFileSync(openApiPath, "utf8"));
  });

  const scalarHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Worksy API — Scalar</title>
</head>
<body>
  <script
    id="api-reference"
    data-url="/openapi.yaml"
    src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

  app.get("/reference", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(scalarHtml);
  });
}
