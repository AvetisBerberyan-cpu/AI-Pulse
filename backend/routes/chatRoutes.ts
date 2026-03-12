import { Router } from "express";
import {
  chatDocument,
  chatGeneralHandler,
  listChats,
  getChatByDocumentIdHandler,
  getGeneralChatHandler,
} from "../controllers/chatController.js";

const router = Router();

router.post("/chat", chatDocument);
router.post("/chat/general", chatGeneralHandler);

router.get("/chat", listChats);
router.get("/chat/document/:documentId", getChatByDocumentIdHandler);
router.get("/chat/general", getGeneralChatHandler);

export default router;
