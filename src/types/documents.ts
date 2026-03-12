type ObjectId = string;

export type UploadedDocument = {
  id: string;
  name: string;
  sizeKb: number;
  chunks: number;
  uploadedAt: string;
};

export interface Chunk {
  text: string;
  embedding: number[];
}

export interface Document {
  _id?: ObjectId;
  name: string;
  originalName: string;
  type: string;
  size: number;
  extractedText: string;
  chunks: Chunk[];
  uploadedAt: Date;
  status: "processing" | "ready" | "error";
  error?: string;
}
