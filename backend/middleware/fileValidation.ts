import { Request, Response, NextFunction } from "express";

const allowedMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/octet-stream",
]);

const allowedExtensions = new Set([".pdf", ".txt", ".md", ".csv"]);

const maxFileSizeBytes = 20 * 1024 * 1024; // 20 MB

export function validateUploadedFile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const ext = (file.originalname || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0];

  if (!allowedMimeTypes.has(file.mimetype)) {
    return res.status(415).json({
      error: "Unsupported file type",
      allowed: Array.from(allowedMimeTypes),
      received: file.mimetype,
    });
  }

  if (file.mimetype === "application/octet-stream" && (!ext || !allowedExtensions.has(ext))) {
    return res.status(415).json({
      error: "Unsupported file type",
      allowed: Array.from(allowedExtensions),
      received: file.mimetype,
    });
  }

  if (file.size > maxFileSizeBytes) {
    return res.status(413).json({
      error: "File too large",
      maxBytes: maxFileSizeBytes,
      receivedBytes: file.size,
    });
  }

  next();
}
