# AI-Pulse

AI-Pulse is a document onboarding and Q&A app. Upload PDFs, TXT, or Markdown files, then chat with a single document or across all documents. The backend stores documents in MongoDB, generates embeddings for retrieval, and uses Groq LLM for responses.

**Features**
- Upload and manage documents
- Document-specific chat sessions
- General chat across all documents
- Retrieval-augmented responses with Groq
- Markdown-formatted assistant answers rendered in the UI

**Tech Stack**
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Express, MongoDB, LangChain text splitting
- LLM: Groq
- Embeddings: Hugging Face (optional) or local fallback

**Project Structure**
- `src/` frontend React app
- `backend/` Express API and services
- `uploads/` temporary upload storage (server-side)

**Environment Variables**
Create a `.env` file in the project root:
```
PORT=3000
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

**Development**
Install dependencies and run both frontend and backend:
```
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to the backend on `http://localhost:3000`.

**Production Build**
```
npm run build
npm run start
```

**API Endpoints**
- `GET /api/documents` list documents
- `GET /api/documents/:id` get document details
- `POST /api/documents` upload document (multipart form field: `file`)
- `DELETE /api/documents/:id` delete document and its chat
- `GET /api/chat` list chat sessions
- `GET /api/chat/document/:documentId` get document chat
- `POST /api/chat` send message to document chat
- `GET /api/chat/general` get general chat
- `POST /api/chat/general` send message to general chat

**Notes**
- If `HUGGINGFACEHUB_API_TOKEN` is not set, embeddings fall back to a local hash-based method.
- Groq requires `GROQ_API_KEY`. Responses are formatted in Markdown and rendered in the UI.
