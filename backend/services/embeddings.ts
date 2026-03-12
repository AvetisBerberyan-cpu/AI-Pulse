import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

const apiKey =
  process.env.HUGGINGFACEHUB_API_TOKEN || process.env.HF_API_KEY;

class LocalHashEmbeddings {
  private dim: number;

  constructor(dim = 384) {
    this.dim = dim;
  }

  private embedText(text: string) {
    const vec = new Array(this.dim).fill(0) as number[];
    const normalized = text.toLowerCase();
    for (let i = 0; i < normalized.length; i += 1) {
      const code = normalized.charCodeAt(i);
      const idx = (code + i * 31) % this.dim;
      vec[idx] += 1;
    }

    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < vec.length; i += 1) vec[i] /= norm;

    return vec;
  }

  async embedQuery(document: string) {
    return this.embedText(document);
  }

  async embedDocuments(documents: string[]) {
    return documents.map((d) => this.embedText(d));
  }
}

export const embeddingsModel = apiKey
  ? new HuggingFaceInferenceEmbeddings({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      apiKey,
    })
  : new LocalHashEmbeddings();

export const embeddingsMode = apiKey ? "huggingface" : "local-hash";
