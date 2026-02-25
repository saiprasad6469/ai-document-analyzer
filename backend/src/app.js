import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import docsRoutes from "./routes/docs.routes.js";

const app = express();

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ CORS: allow Render frontend + local dev
const allowedOrigins = [
  process.env.CLIENT_URL,                 // ✅ set this on Render
  process.env.CLIENT_ORIGIN,              // (optional old var)
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ai-document-analyzer-1-yo3h.onrender.com"
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (Postman/curl)
      if (!origin) return cb(null, true);

      // allow only known origins
      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

// Routes
app.get("/", (req, res) => res.send("AI Document Analyzer API ✅"));

app.use("/auth", authRoutes);
app.use("/docs", docsRoutes);

export default app;