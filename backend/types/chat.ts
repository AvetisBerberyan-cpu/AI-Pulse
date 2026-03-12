export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
