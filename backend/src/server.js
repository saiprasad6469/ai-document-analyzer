import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";

import chatRoutes from "./routes/chats.routes.js";
app.use("/chats", chatRoutes);

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGO_URI);


app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log("GEMINI KEY:", process.env.GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌");
});