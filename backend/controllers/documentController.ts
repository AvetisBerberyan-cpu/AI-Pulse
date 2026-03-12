import { Request, Response } from "express";
import {
  listDocuments,
  getDocumentById,
  createDocument,
  deleteDocument,
} from "../services/documentService.js";

export async function getDocuments(req: Request, res: Response) {
  const docs = await listDocuments();
  res.json(docs);
}

export async function getDocument(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await getDocumentById(id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
}

export async function uploadDocument(req: Request, res: Response) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const result = await createDocument(file);
  if (result.status === "error") {
    return res.status(500).json({ error: result.error });
  }

  res.json({ message: "Document processed", id: result.id });
}

export async function removeDocument(req: Request, res: Response) {
  const { id } = req.params;
  await deleteDocument(id);
  res.json({ message: "Document and related chats deleted" });
}
