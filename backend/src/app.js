import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import docsRoutes from "./routes/docs.routes.js";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ai-document-analyzer-1-yo3h.onrender.com"
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // ✅ IMPORTANT: allow your custom header
  allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
  exposedHeaders: ["x-session-id"],
};

app.use(cors(corsOptions));

// ✅ Preflight handler (safe for Express 5)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

app.get("/", (req, res) => res.send("AI Document Analyzer API ✅"));

app.use("/auth", authRoutes);
app.use("/docs", docsRoutes);

export default app;