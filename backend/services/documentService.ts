import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ObjectId } from "mongodb";
import {
  ensureConnected,
  client,
  dbName,
  documentsCollection,
  chatCollection,
} from "../config/db.js";
import { embeddingsModel } from "./embeddings.js";

function isPdf(mimetype: string, originalName?: string) {
  if (mimetype === "application/pdf") return true;
  const ext = (originalName || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  return mimetype === "application/octet-stream" && ext === ".pdf";
}

export async function extractText(
  filePath: string,
  mimetype: string,
  originalName?: string,
) {
  if (isPdf(mimetype, originalName)) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = new Uint8Array(
      dataBuffer.buffer,
      dataBuffer.byteOffset,
      dataBuffer.byteLength,
    );
    const pdfParser = new PDFParse({ data });
    const textResult = await pdfParser.getText();
    const text = textResult.text;
    if (!text || text.trim().length === 0) {
      throw new Error("OCR Required");
    }
    return text;
  }

  const text = fs.readFileSync(filePath, "utf8");
  if (!text.trim()) throw new Error("Empty file");
  return text;
}

export async function splitTextIntoChunks(
  text: string,
  chunkSize = 1000,
  overlap = 200,
) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
  });
  return splitter.splitText(text);
}

export async function listDocuments() {
  await ensureConnected();
  return client
    .db(dbName)
    .collection(documentsCollection)
    .find({})
    .toArray();
}

export async function getDocumentById(id: string) {
  await ensureConnected();
  return client
    .db(dbName)
    .collection(documentsCollection)
    .findOne({ _id: new ObjectId(id) });
}

export async function createDocument(file: Express.Multer.File) {
  const { originalname, mimetype, size, path } = file;
  const name = originalname.replace(/\.[^/.]+$/, "");
  const uploadedAt = new Date();

  const docData = {
    name,
    originalName: originalname,
    type: mimetype,
    size,
    extractedText: "",
    chunks: [],
    uploadedAt,
    status: "processing",
  };

  await ensureConnected();
  const db = client.db(dbName);
  const docResult = await db.collection(documentsCollection).insertOne(docData);

  try {
    const text = await extractText(path, mimetype, originalname);
    const chunkTexts = await splitTextIntoChunks(text, 1000, 200);

    const chunks = [];
    for (const chunkContent of chunkTexts) {
      const embedding = await embeddingsModel.embedDocuments([chunkContent]);
      chunks.push({ text: chunkContent, embedding: embedding[0] });
    }

    await db
      .collection(documentsCollection)
      .updateOne(
        { _id: docResult.insertedId },
        { $set: { extractedText: text, chunks, status: "ready" } },
      );

    await db.collection(chatCollection).insertOne({
      documentId: docResult.insertedId.toString(),
      type: "document",
      title: `Chat for ${docResult.insertedId.toString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    fs.unlinkSync(path);
    return { id: docResult.insertedId, status: "ready" as const };
  } catch (err) {
    if (err instanceof Error) {
      await db
        .collection(documentsCollection)
        .updateOne(
          { _id: docResult.insertedId },
          { $set: { status: "error", error: err.message } },
        );
      fs.unlinkSync(path);
      return {
        id: docResult.insertedId,
        status: "error" as const,
        error: err.message,
      };
    }
    fs.unlinkSync(path);
    return {
      id: docResult.insertedId,
      status: "error" as const,
      error: "Unknown error",
    };
  }
}

export async function deleteDocument(id: string) {
  await ensureConnected();
  const db = client.db(dbName);

  await db.collection(documentsCollection).deleteOne({ _id: new ObjectId(id) });
  await db.collection(chatCollection).deleteMany({ documentId: id });
}
