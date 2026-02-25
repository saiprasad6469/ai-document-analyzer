import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, required: true, index: true }, // ✅ NEW
    name: { type: String, required: true },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    storagePath: { type: String, required: true },
    extractedText: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);