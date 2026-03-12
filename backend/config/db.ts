import { MongoClient } from "mongodb";

const mongoUri =
  process.env.MONGO_URI ||
  "mongodb+srv://avetisberberyan72_db_user:avo20032003@cluster0.b7faiy7.mongodb.net/?appName=Cluster0";

export const client = new MongoClient(mongoUri);
export const dbName = "rag_db";
export const documentsCollection = "documents";
export const chatCollection = "chat_sessions";

let connected = false;

export async function ensureConnected() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
}
