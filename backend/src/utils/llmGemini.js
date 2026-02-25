import { GoogleGenerativeAI } from "@google/generative-ai";

let modelInstance = null;

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in .env");

  if (!modelInstance) {
    const genAI = new GoogleGenerativeAI(key);
    modelInstance = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash", // ✅ IMPORTANT
    });
  }
  return modelInstance;
}

export async function askGemini({ question, documents }) {
  const joined = documents
    .map((d, idx) => {
      const text = (d.extractedText || "").trim();
      const clipped = text.slice(0, 12000);
      return `Document ${idx + 1}: ${d.name}\n---\n${clipped}`;
    })
    .join("\n\n");

  if (!joined.trim()) return "No readable text found in documents.";

  const prompt = `
You are an AI document analyzer.
Answer ONLY using the provided documents.
If the answer is not found in the documents, say "Not found in the documents".

DOCUMENTS:
${joined}

QUESTION:
${question}
`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  return result?.response?.text?.() || "No response text returned.";
}