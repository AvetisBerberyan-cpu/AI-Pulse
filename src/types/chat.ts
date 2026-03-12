type ObjectId = string;

export interface ChatSession {
  _id?: ObjectId;
  documentId: string;
  type?: "general";
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}
