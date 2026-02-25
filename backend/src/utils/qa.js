import natural from "natural";
const { TfIdf } = natural;

function chunkText(text, chunkSize = 900, overlap = 150) {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const chunks = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + chunkSize, cleaned.length);
    chunks.push(cleaned.slice(i, end));
    if (end === cleaned.length) break;
    i = end - overlap;
  }
  return chunks;
}

export function answerQuestion(question, documents) {
  const q = (question || "").trim();
  if (!q) return "Please ask a question.";

  const combinedText = documents.map((d) => d.extractedText || "").join("\n\n");
  if (!combinedText.trim()) {
    return "I couldn't extract readable text from the uploaded documents (or OCR is needed for images).";
  }

  const chunks = chunkText(combinedText);

  const tfidf = new TfIdf();
  chunks.forEach((c) => tfidf.addDocument(c));

  const scores = chunks.map((_, idx) => {
    let score = 0;
    tfidf.tfidfs(q, (i, measure) => {
      if (i === idx) score = measure;
    });
    return { idx, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 3).filter((x) => x.score > 0);

  if (!top.length) {
    const preview = combinedText.slice(0, 600);
    return `I couldn't find a strong match. Here’s a preview of the documents:\n\n${preview}${combinedText.length > 600 ? "..." : ""}`;
  }

  const bestChunks = top.map((t) => chunks[t.idx]).join("\n\n---\n\n");

  const lowQ = q.toLowerCase();
  if (lowQ.includes("summary") || lowQ.includes("summarize") || lowQ.includes("about")) {
    const summary = bestChunks.slice(0, 900);
    return `Summary (best-matching parts):\n\n${summary}${bestChunks.length > 900 ? "..." : ""}`;
  }

  return `Best-matching text from your documents:\n\n${bestChunks.slice(0, 1400)}${bestChunks.length > 1400 ? "..." : ""}`;
}