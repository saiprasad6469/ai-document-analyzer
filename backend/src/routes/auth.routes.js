import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

const makeToken = (userId, JWT_SECRET) => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
};

// ✅ GET /auth/me  (fetch user from DB using token)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("_id name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ /auth/me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = makeToken(user._id.toString(), process.env.JWT_SECRET);

    return res.status(201).json({
      message: "Registered successfully",
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = makeToken(user._id.toString(), process.env.JWT_SECRET);

    return res.json({
      message: "Login successful",
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;  