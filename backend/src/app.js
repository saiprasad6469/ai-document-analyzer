import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import docsRoutes from "./routes/docs.routes.js";

const app = express();

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ CORS allowlist
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_ORIGIN, // optional (old var)
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ai-document-analyzer-1-yo3h.onrender.com"
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman/curl)
    if (!origin) return cb(null, true);

    // Allow only known origins
    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ Apply CORS for all requests
app.use(cors(corsOptions));

// ✅ Handle ALL preflight requests safely (no wildcard route patterns)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    // run cors for this request then return 204
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

// Routes
app.get("/", (req, res) => res.send("AI Document Analyzer API ✅"));

app.use("/auth", authRoutes);
app.use("/docs", docsRoutes);

export default app;