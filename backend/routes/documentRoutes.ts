import { Router } from "express";
import {
  getDocuments,
  getDocument,
  uploadDocument,
  removeDocument,
} from "../controllers/documentController.js";
import { upload } from "../middleware/upload.js";
import { validateUploadedFile } from "../middleware/fileValidation.js";

const router = Router();

router.get("/documents", getDocuments);
router.get("/documents/:id", getDocument);
router.post(
  "/documents",
  upload.single("file"),
  validateUploadedFile,
  uploadDocument,
);
router.delete("/documents/:id", removeDocument);

export default router;
