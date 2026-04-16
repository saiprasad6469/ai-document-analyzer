# AI Document Analyzer

A full-stack web application that lets you upload a document and instantly get an AI-generated summary, key highlights, and answers to questions based on the document's content. Built to save the time people spend manually reading through long PDFs and reports.

---

## The Problem This Solves

Anyone who regularly deals with documents — students reviewing research papers, professionals reading contracts, researchers going through reports — knows how long it takes to extract what actually matters. Reading a 40-page PDF to find three relevant points is not a good use of anyone's time.

This application handles that by running the document through an AI model that understands the content and gives you back what you need: a clean summary, the key points pulled out automatically, and the ability to ask it questions directly. Instead of reading the whole thing, you interact with it.

---

## How It Works

1. The user uploads a PDF or plain text file through the interface.
2. The backend receives the file and extracts the raw text from it using a document parsing library.
3. The extracted text is passed to an AI model, which generates a summary and identifies the most important points.
4. The user can then type questions about the document and the system returns answers grounded in the document's actual content.
5. Everything is displayed in a clean interface — summary, key highlights, and the Q&A all in one place.

The whole process from upload to summary takes a few seconds depending on document length.

---

## What You Can Do With It

- Upload a PDF or text document and get a summary without reading the whole thing
- View the key points the AI pulled out automatically from the content
- Ask natural language questions like "What are the main conclusions?" or "What does the document say about pricing?" and get direct answers
- Use it on research papers, legal documents, reports, study material, or any text-heavy file

---

## Features

**Document Upload and Parsing**
The app accepts PDF and plain text files. Once uploaded, the backend extracts the raw text using a parsing library before sending it for analysis. Basic file validation is handled to avoid broken uploads.

**AI Summarization**
The extracted text is sent to an NLP model that condenses the document into a short, readable summary. This is not keyword extraction — it uses language understanding to generate a coherent overview of what the document actually says.

**Key Point Extraction**
Along with the summary, the model identifies and pulls out the most significant points from the document. These are presented as a clean list so the user can quickly scan what matters most.

**Question and Answer Module**
Users can type any question about the document and the system will search the content for the relevant context and return an answer. The answers are based on what the document actually contains, not general knowledge, which keeps responses accurate and grounded.

**Interactive Interface**
The frontend is designed to be simple. There are no complex menus — upload a file, see your results, ask questions. The summary, key points, and Q&A panel are all accessible from the same screen.

**Secure Document Handling**
Uploaded files are processed server-side and not stored permanently. Documents are handled in temporary storage during the session and cleared afterward, keeping user content private.

---

## Tech Stack

**Frontend**
- React.js for the UI
- Axios for communicating with the backend API
- Clean, minimal design focused on usability

**Backend**
- Python with Flask or FastAPI for the server and API endpoints
- Handles file uploads, parsing, and routing requests to the AI layer

**AI and NLP**
- OpenAI API (GPT models) or HuggingFace Transformers for summarization and Q&A
- LangChain for managing document context and chaining AI calls where needed

**Document Parsing**
- PyMuPDF or PDFPlumber for extracting text from PDF files
- Plain text files handled directly without additional parsing

**Database**
- MongoDB or PostgreSQL for storing session data and request logs if needed

**Deployment**
- Can be deployed on Render, Vercel (frontend), or AWS depending on your setup

---

## Getting Started

### Prerequisites

- Python 3.8 or above
- pip for installing Python dependencies
- Git
- An API key from OpenAI or HuggingFace (depending on which model you use)

### Installation

Clone the repository:

```bash
git clone https://github.com/your-username/ai-document-analyzer.git
cd ai-document-analyzer
```

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

Set up your environment variables:

```bash
cp .env.example .env
```

Open the `.env` file and add your configuration:

```
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_key (if applicable)
FLASK_SECRET_KEY=your_secret_key
PORT=5000
```

Run the application:

```bash
python app.py
```

The app will be available at `http://localhost:5000`.

If you are using the React frontend separately, open a new terminal and run:

```bash
cd frontend
npm install
npm start
```

The frontend will run at `http://localhost:3000` and communicate with the backend at port 5000.

---

## Project Structure

```
ai-document-analyzer/
│
├── frontend/                  # React UI
│   ├── src/
│   │   ├── pages/             # Upload page, Results page, Q&A view
│   │   ├── components/        # Reusable UI components
│   │   └── services/          # Axios API call functions
│   └── public/
│
├── backend/                   # Python Flask/FastAPI server
│   ├── app.py                 # Main application entry point
│   ├── routes/                # API route definitions
│   ├── controllers/           # Request handling logic
│   └── ai_engine/
│       ├── summarizer.py      # Summarization logic
│       ├── extractor.py       # Key point extraction
│       └── qa_model.py        # Question answering module
│
├── uploads/                   # Temporary file storage during processing
├── models/                    # AI model configurations
├── config/                    # App settings and environment config
├── .env.example
├── requirements.txt
└── README.md
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload a document for processing |
| GET | `/api/summary` | Retrieve the AI-generated summary |
| GET | `/api/keypoints` | Get the extracted key points |
| POST | `/api/ask` | Send a question and receive a document-based answer |
| DELETE | `/api/clear` | Clear the current document from the session |

---

## Screenshots

> *(Add screenshots here — Upload Screen, Summary View, Key Points Panel, Q&A Interface)*

---

## Planned Improvements

These are features that would make sense to add as the project grows:

- Support for Word (.docx) and Excel files in addition to PDF and text
- Multi-language document support for non-English content
- Visual charts or graphs generated from numerical data found in documents
- URL-based document input so users can paste a link instead of uploading a file
- Saved session history so users can return to previously analyzed documents
- Multi-user support with login and personal document libraries

---

## Contributing

If you want to add a feature or fix something:

1. Fork the repository
2. Create a branch for your change: `git checkout -b feature/your-feature-name`
3. Commit with a descriptive message: `git commit -m "Add: description of what you changed"`
4. Push your branch: `git push origin feature/your-feature-name`
5. Open a pull request explaining what you changed and why

Issues and suggestions are welcome through the GitHub Issues tab.

---

## License

This project is licensed under the MIT License. You are free to use, modify, and build on it for personal or commercial purposes. See the `LICENSE` file for the full terms.
