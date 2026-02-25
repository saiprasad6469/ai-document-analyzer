import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import docsRoutes from "./routes/docs.routes.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.send("AI Document Analyzer API ✅"));

app.use("/auth", authRoutes);
app.use("/docs", docsRoutes);

export default app;