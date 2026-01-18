import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storageGetContent } from "../../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;

  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: "Invalid path" });
  }

  const filePath = path.join("/");

  try {
    const content = await storageGetContent(filePath);

    if (!content) {
      return res.status(404).json({ error: "File not found" });
    }

    // Set appropriate content type based on file extension
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
      json: "application/json",
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    const contentType = contentTypes[ext || ""] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");

    res.send(content);
  } catch (error) {
    console.error("Storage retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};