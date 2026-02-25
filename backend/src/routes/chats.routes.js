import express from "express";
import { v4 as uuidv4 } from "uuid";
import ChatSession from "../models/ChatSession.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /chats  -> list chats for logged-in user
router.get("/", requireAuth, async (req, res) => {
  const chats = await ChatSession.find({ owner: req.userId })
    .select("_id sessionId title updatedAt createdAt")
    .sort({ updatedAt: -1 });

  res.json({
    chats: chats.map((c) => ({
      id: c._id.toString(),
      sessionId: c.sessionId,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
});

// POST /chats -> create a new chat
router.post("/", requireAuth, async (req, res) => {
  const sessionId = uuidv4();

  const chat = await ChatSession.create({
    owner: req.userId,
    sessionId,
    title: "New chat",
    messages: [
      {
        role: "assistant",
        content: "Upload documents with the + button, then ask questions about them.",
      },
    ],
  });

  res.status(201).json({
    chat: {
      id: chat._id.toString(),
      sessionId: chat.sessionId,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages,
    },
  });
});

// GET /chats/:id -> get one chat (with messages)
router.get("/:id", requireAuth, async (req, res) => {
  const chat = await ChatSession.findOne({ _id: req.params.id, owner: req.userId });
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  res.json({
    chat: {
      id: chat._id.toString(),
      sessionId: chat.sessionId,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages,
    },
  });
});

// POST /chats/:id/messages -> add message + rename title from first user msg
router.post("/:id/messages", requireAuth, async (req, res) => {
  const { role, content } = req.body || {};
  if (!role || !content) return res.status(400).json({ message: "role and content are required" });

  const chat = await ChatSession.findOne({ _id: req.params.id, owner: req.userId });
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  chat.messages.push({ role, content, ts: new Date() });

  if (chat.title === "New chat" && role === "user") {
    chat.title = String(content).trim().slice(0, 40) || "New chat";
  }

  await chat.save();

  res.json({ ok: true });
});

// DELETE /chats/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const r = await ChatSession.deleteOne({ _id: req.params.id, owner: req.userId });
  if (!r.deletedCount) return res.status(404).json({ message: "Chat not found" });
  res.json({ ok: true });
});

export default router;