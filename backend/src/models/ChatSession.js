import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    ts: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, index: true }, // same as docs sessionId
    title: { type: String, default: "New chat" },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

chatSessionSchema.index({ owner: 1, sessionId: 1 }, { unique: true });

export default mongoose.model("ChatSession", chatSessionSchema);