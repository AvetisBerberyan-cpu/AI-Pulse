import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SideBar from "./components/SideBar";
import Chat from "./components/Chat";
import DocumentUpload from "./components/DocumentUpload";
import type { UploadedDocument } from "./types/documents";

function App() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        const response = await fetch("/api/documents");
        if (!response.ok) {
          throw new Error("Failed to load documents");
        }
        const data = await response.json();
        const mapped = Array.isArray(data)
          ? data.map((doc: any) => ({
              id: doc._id ?? doc.id,
              name: doc.name ?? doc.originalName ?? "Untitled",
              sizeKb: Math.max(1, Math.round((doc.size ?? 0) / 1024)),
              chunks: Array.isArray(doc.chunks) ? doc.chunks.length : 0,
              uploadedAt: doc.uploadedAt
                ? new Date(doc.uploadedAt).toLocaleString()
                : "Unknown",
            }))
          : [];
        setDocuments(mapped);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, []);

  return (
    <main className="min-h-screen bg-[#02050a] text-slate-100">
      <div className="relative min-h-screen w-full md:grid md:grid-cols-[260px_1fr]">
        {isMobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-40 w-[260px] transform transition-transform md:static md:z-auto md:w-auto md:translate-x-0 ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SideBar
            documents={documents}
            isLoadingDocuments={isLoadingDocuments}
            onNavigate={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        <section className="min-h-screen border-l border-[#0f1f31] md:border-l">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <DocumentUpload
                  documents={documents}
                  onToggleSidebar={() => setIsMobileSidebarOpen(true)}
                  onDocumentUploaded={(doc) =>
                    setDocuments((prev) => [
                      doc,
                      ...prev.filter((item) => item.name !== doc.name),
                    ])
                  }
                  onDocumentDeleted={(documentId) =>
                    setDocuments((prev) =>
                      prev.filter((doc) => doc.id !== documentId),
                    )
                  }
                />
              }
            />
            <Route
              path="/all-documents-chat"
              element={
                <Chat
                  documents={documents}
                  onToggleSidebar={() => setIsMobileSidebarOpen(true)}
                />
              }
            />
            <Route
              path="/document-chat/:documentId"
              element={
                <Chat
                  documents={documents}
                  onToggleSidebar={() => setIsMobileSidebarOpen(true)}
                />
              }
            />
          </Routes>
        </section>
      </div>
    </main>
  );
}

export default App;
