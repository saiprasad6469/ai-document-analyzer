import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Document from "../models/Document.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { extractTextFromFile } from "../utils/extractText.js";
import { askGemini } from "../utils/llmGemini.js";

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 15);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = (file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}_${safe}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
});

function getSessionId(req) {
  return req.headers["x-session-id"] || req.query.sessionId || req.body?.sessionId || null;
}

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) return res.status(400).json({ message: "sessionId missing" });

    const docs = await Document.find({ owner: req.userId, sessionId })
      .select("_id name size mimeType createdAt sessionId")
      .sort({ createdAt: -1 });

    return res.json({
      docs: docs.map((d) => ({
        id: d._id.toString(),
        name: d.name,
        size: d.size,
        type: d.mimeType,
        createdAt: d.createdAt,
        sessionId: d.sessionId,
      })),
    });
  } catch (err) {
    console.error("❌ /docs/mine error:", err);
    return res.status(500).json({ message: "Failed to load documents" });
  }
});

router.post("/upload", requireAuth, (req, res) => {
  upload.array("files", 20)(req, res, async (multerErr) => {
    if (multerErr) {
      console.error("❌ Multer error:", multerErr);
      return res.status(400).json({ message: multerErr.message || "Upload error" });
    }

    try {
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ message: "No files uploaded" });

      if (!req.userId) return res.status(401).json({ message: "Unauthorized: userId missing" });

      const sessionId = getSessionId(req);
      if (!sessionId) return res.status(400).json({ message: "sessionId missing" });

      const createdDocs = [];

      for (const f of files) {
        const fullPath = path.join(UPLOAD_DIR, f.filename);

        const extractedTextRaw = await extractTextFromFile({
          filePath: fullPath,
          mimeType: f.mimetype,
          originalName: f.originalname,
        });

        const extractedText = typeof extractedTextRaw === "string" ? extractedTextRaw.trim() : "";

        const doc = await Document.create({
          owner: req.userId,
          sessionId,
          name: f.originalname,
          mimeType: f.mimetype,
          size: f.size,
          storagePath: fullPath,
          extractedText: extractedText || "",
        });

        createdDocs.push({
          id: doc._id.toString(),
          name: doc.name,
          size: doc.size,
          type: doc.mimeType,
          hasText: !!extractedText,
          sessionId: doc.sessionId,
        });
      }

      return res.status(201).json({ docs: createdDocs, sessionId });
    } catch (err) {
      console.error("❌ Upload failed:", err);
      return res.status(500).json({ message: err?.message || "Upload failed" });
    }
  });
});

router.post("/ask", requireAuth, async (req, res) => {
  try {
    const { question } = req.body || {};
    const sessionId = getSessionId(req);

    if (!question || !question.trim()) return res.status(400).json({ message: "question is required" });
    if (!sessionId) return res.status(400).json({ message: "sessionId missing" });

    const docs = await Document.find({ owner: req.userId, sessionId }).select("extractedText name mimeType size");

    if (!docs.length) return res.status(404).json({ message: "No documents uploaded in this chat" });

    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: "GEMINI_API_KEY missing in backend .env" });

    const anyText = docs.some((d) => (d.extractedText || "").trim().length > 0);
    if (!anyText) {
      return res.json({
        answer: "No readable text was extracted from your document. If it's scanned/image-based, enable OCR.",
      });
    }

    const answer = await askGemini({ question, documents: docs });
    return res.json({ answer });
  } catch (err) {
    console.error("❌ /docs/ask error:", err);
    return res.status(500).json({ message: err?.message || "Ask failed" });
  }
});

export default router;