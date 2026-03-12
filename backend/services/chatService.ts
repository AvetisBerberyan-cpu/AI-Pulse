import Groq from "groq-sdk";
import { ObjectId } from "mongodb";

import {
  ensureConnected,
  client,
  dbName,
  chatCollection,
  documentsCollection,
} from "../config/db.js";
import { embeddingsModel } from "./embeddings.js";
import { GroqMessage } from "../types/chat.js";

function getGroqApiKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("Missing GROQ_API_KEY");
  }
  return key;
}

async function groqChatCompletion(messages: GroqMessage[]) {
  const apiKey = getGroqApiKey();
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  const groq = new Groq({ apiKey });
  const response = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq API returned no content");
  }
  return content;
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function chatWithDocumentNewMessage(
  documentId: string,
  newMessage: string,
) {
  await ensureConnected();
  const db = client.db(dbName);
  const collection = db.collection(chatCollection);
  const chat = await collection.findOne({ documentId });
  if (!chat) return { error: "Chat not found" } as const;

  const userMessage = {
    role: "user",
    content: newMessage,
    createdAt: new Date(),
  };

  await collection.updateOne({ _id: chat!._id }, [
    {
      $set: {
        messages: {
          $concatArrays: [{ $ifNull: ["$messages", []] }, [userMessage]],
        },
        updatedAt: new Date(),
      },
    },
  ]);

  await collection.findOne({ _id: chat!._id });

  const docsCollection = db.collection(documentsCollection);
  const doc = await docsCollection.findOne(
    { _id: new ObjectId(documentId) },
    { projection: { chunks: 1, name: 1, originalName: 1 } },
  );

  if (!doc || !Array.isArray((doc as any).chunks)) {
    return { error: "No document content found for this document." } as const;
  }

  const docName =
    (doc as any).name || (doc as any).originalName || "Unknown document";
  const queryEmbedding = await embeddingsModel.embedQuery(newMessage);
  const scored = (doc as any).chunks
    .map((c: any) => ({
      text: c.text,
      score: cosineSimilarity(queryEmbedding, c.embedding || []),
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  const context = scored
    .map((c: any) => `Document: ${docName}\n${c.text}`)
    .join("\n---\n");

  const systemPrompt = `You are an AI Onboarding Assistant. Use the context below to answer. If answer isn't in the context, say "I don't know". Always cite the document name. Format the response in clean, readable Markdown with short sections, bullet points when helpful, and concise sentences.\n${context}`;
  const assistantResponse = await groqChatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: newMessage },
  ]);

  const assistantMessage = {
    role: "assistant",
    content: assistantResponse,
    createdAt: new Date(),
  };

  await collection.updateOne({ _id: chat!._id }, [
    {
      $set: {
        messages: {
          $concatArrays: [{ $ifNull: ["$messages", []] }, [assistantMessage]],
        },
        updatedAt: new Date(),
      },
    },
  ]);

  return { assistantResponse } as const;
}

export async function chatGeneral(newMessage: string) {
  await ensureConnected();
  const collection = client.db(dbName).collection(chatCollection);

  const now = new Date();
  const upsert = await collection.findOneAndUpdate(
    { type: "general" },
    {
      $setOnInsert: {
        type: "general",
        title: "General Chat",
        messages: [],
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );

  let chat = upsert?.value;
  if (!chat) {
    const createdAt = new Date();
    const insert = await collection.insertOne({
      type: "general",
      title: "General Chat",
      messages: [],
      createdAt,
      updatedAt: createdAt,
    });
    chat = await collection.findOne({ _id: insert.insertedId });
  }
  if (!chat) return { error: "Chat not found" } as const;

  const userMessage = {
    role: "user",
    content: newMessage,
    createdAt: new Date(),
  };

  await collection.updateOne({ _id: chat._id }, [
    {
      $set: {
        messages: {
          $concatArrays: [{ $ifNull: ["$messages", []] }, [userMessage]],
        },
        updatedAt: new Date(),
      },
    },
  ]);

  const docsCollection = client.db(dbName).collection(documentsCollection);
  const docs = await docsCollection
    .find({}, { projection: { chunks: 1, name: 1, originalName: 1 } })
    .toArray();

  const allChunks: { text: string; embedding: number[]; docName: string }[] =
    [];
  for (const d of docs as any[]) {
    const docName = d.name || d.originalName || "Unknown document";
    if (Array.isArray(d.chunks)) {
      for (const c of d.chunks) {
        if (c?.text && Array.isArray(c.embedding)) {
          allChunks.push({ text: c.text, embedding: c.embedding, docName });
        }
      }
    }
  }

  if (!allChunks.length) return { error: "No document chunks found" } as const;

  const queryEmbedding = await embeddingsModel.embedQuery(newMessage);
  const scored = allChunks
    .map((c) => ({
      text: c.text,
      docName: c.docName,
      score: cosineSimilarity(queryEmbedding, c.embedding || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const context = scored
    .map((c) => `Document: ${c.docName}\n${c.text}`)
    .join("\n---\n");

  const systemPrompt = `You are an AI Onboarding Assistant. Use the context below to answer. If answer isn't in the context, say "I don't know". Always cite the document name. Format the response in clean, readable Markdown with short sections, bullet points when helpful, and concise sentences.\n${context}`;
  const assistantContent = await groqChatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: newMessage },
  ]);
  const assistantResponse = {
    role: "assistant",
    content: assistantContent,
    createdAt: new Date(),
  };

  await collection.updateOne({ _id: chat._id }, [
    {
      $set: {
        messages: {
          $concatArrays: [{ $ifNull: ["$messages", []] }, [assistantResponse]],
        },
        updatedAt: new Date(),
      },
    },
  ]);

  return { assistantResponse: assistantResponse.content } as const;
}

export async function listChatSessions() {
  await ensureConnected();
  return client.db(dbName).collection(chatCollection).find({}).toArray();
}

export async function getChatByDocumentId(documentId: string) {
  await ensureConnected();
  return client.db(dbName).collection(chatCollection).findOne({ documentId });
}

export async function getGeneralChat() {
  await ensureConnected();
  const collection = client.db(dbName).collection(chatCollection);
  await collection.deleteMany({ type: "general" });

  const createdAt = new Date();
  const insert = await collection.insertOne({
    type: "general",
    title: "General Chat",
    messages: [],
    createdAt,
    updatedAt: createdAt,
  });

  return collection.findOne({ _id: insert.insertedId });
}
