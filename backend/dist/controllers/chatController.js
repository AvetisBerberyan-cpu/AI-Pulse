import { chatWithDocumentNewMessage, chatGeneral, listChatSessions, getChatByDocumentId, getGeneralChat, } from "../services/chatService.js";
export async function chatDocument(req, res) {
    const { documentId, newMessage } = req.body;
    if (!documentId || !newMessage) {
        return res.status(400).json({ error: "Missing documentId or newMessage" });
    }
    try {
        const result = await chatWithDocumentNewMessage(documentId, newMessage);
        if ("error" in result) {
            return res.status(404).json({ error: result.error });
        }
        res.json({ assistantResponse: result.assistantResponse });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        }
    }
}
export async function chatGeneralHandler(req, res) {
    const newMessage = req.body.newMessage;
    try {
        const result = await chatGeneral(newMessage);
        if ("error" in result) {
            return res.status(404).json({ error: result.error });
        }
        res.json({ assistantResponse: result.assistantResponse });
    }
    catch (err) {
        if (err instanceof Error)
            res.status(500).json({ error: err.message });
    }
}
export async function listChats(req, res) {
    const chats = await listChatSessions();
    res.json(chats);
}
export async function getChatByDocumentIdHandler(req, res) {
    const { documentId } = req.params;
    const chat = await getChatByDocumentId(documentId);
    if (!chat)
        return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
}
export async function getGeneralChatHandler(req, res) {
    const chat = await getGeneralChat();
    if (!chat)
        return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
}
