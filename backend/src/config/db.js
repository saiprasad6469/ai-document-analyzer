import mongoose from "mongoose";

export async function connectDB(MONGO_URI) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}