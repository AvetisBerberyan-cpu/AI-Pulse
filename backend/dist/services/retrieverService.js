import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { ensureConnected, client, dbName, documentsCollection } from "../config/db.js";
import { embeddingsModel } from "./embeddings.js";
export async function getRetrieverForDocument(docId = null, topK = 5) {
    await ensureConnected();
    const collection = client.db(dbName).collection(documentsCollection);
    const vectorStore = new MongoDBAtlasVectorSearch(embeddingsModel, {
        collection: collection,
        indexName: "vector_index",
        textKey: "chunks.text",
        embeddingKey: "chunks.embedding",
    });
    const retriever = vectorStore.asRetriever({
        k: topK,
        filter: docId ? { _id: docId } : {},
    });
    return retriever;
}
