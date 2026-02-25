import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import { createRequire } from "module";
import Tesseract from "tesseract.js";
import { pdf } from "pdf-to-img";

const require = createRequire(import.meta.url);

function loadPdfParse() {
  try {
    const mod = require("pdf-parse");
    if (typeof mod === "function") return mod;
    if (typeof mod?.default === "function") return mod.default;
    return null;
  } catch {
    return null;
  }
}

const pdfParse = loadPdfParse();

async function ocrImageBuffer(buffer) {
  const res = await Tesseract.recognize(buffer, "eng");
  return (res?.data?.text || "").replace(/\s+/g, " ").trim();
}

async function ocrScannedPdf(filePath, maxPages = 3) {
  // Convert PDF pages to images (buffers), then OCR each page
  let out = [];
  let pageCount = 0;

  for await (const page of pdf(filePath)) {
    pageCount += 1;
    if (pageCount > maxPages) break;

    const text = await ocrImageBuffer(page);
    if (text) out.push(text);
  }

  return out.join(" ").replace(/\s+/g, " ").trim();
}

export async function extractTextFromFile({ filePath, mimeType, originalName }) {
  const ext = (path.extname(originalName || filePath || "") || "").toLowerCase().trim();

  try {
    // ---------- TXT ----------
    if (mimeType === "text/plain" || ext === ".txt") {
      const buf = await fs.readFile(filePath);
      return (buf.toString("utf-8") || "").replace(/\s+/g, " ").trim();
    }

    // ---------- DOCX ----------
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === ".docx"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return (result?.value || "").replace(/\s+/g, " ").trim();
    }

    // ---------- PDF ----------
    if (mimeType === "application/pdf" || ext === ".pdf") {
      // 1) Try normal text extraction
      if (pdfParse) {
        const dataBuffer = await fs.readFile(filePath);
        const parsed = await pdfParse(dataBuffer);
        const text = (parsed?.text || "").replace(/\s+/g, " ").trim();
        if (text) return text;
      }

      // 2) If no text => scanned PDF => OCR first pages
      console.warn("⚠️ PDF has no extractable text. Running OCR (scanned PDF):", originalName);
      const ocrText = await ocrScannedPdf(filePath, 3); // OCR first 3 pages
      return ocrText || "";
    }

    // ---------- Images (OCR enabled) ----------
    const isImage =
      mimeType?.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext);

    if (isImage) {
      console.log("🧠 OCR running for image:", originalName);
      const result = await Tesseract.recognize(filePath, "eng");
      const text = (result?.data?.text || "").replace(/\s+/g, " ").trim();
      return text || "";
    }

    // ---------- DOC (not supported) ----------
    if (ext === ".doc") {
      console.warn("⚠️ .doc not supported:", originalName);
      return "";
    }

    console.warn("⚠️ Unsupported file type:", originalName, mimeType);
    return "";
  } catch (err) {
    console.error("❌ extractTextFromFile failed:", {
      file: originalName,
      mimeType,
      filePath,
      error: err?.message || err,
    });
    return "";
  }
}