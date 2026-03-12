import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  FileText,
  PanelLeft,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { UploadedDocument } from "../types/documents";

type DocumentUploadProps = {
  documents: UploadedDocument[];
  onDocumentUploaded: (document: UploadedDocument) => void;
  onDocumentDeleted: (documentId: string) => void;
  onToggleSidebar: () => void;
};

function DocumentUpload({
  documents,
  onDocumentUploaded,
  onDocumentDeleted,
  onToggleSidebar,
}: DocumentUploadProps) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setIsUploading(false);
  };

  const uploadSelectedFile = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to upload document";
        try {
          const data = await response.json();
          if (data?.error) errorMessage = data.error;
        } catch {
          // Ignore JSON parsing errors and use fallback message.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      onDocumentUploaded({
        id: data?.id ?? crypto.randomUUID(),
        name: selectedFile.name,
        sizeKb: Math.max(1, Math.round(selectedFile.size / 1024)),
        chunks: 4,
        uploadedAt: "Just now",
      });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete document";
        try {
          const data = await response.json();
          if (data?.error) errorMessage = data.error;
        } catch {
          // Ignore JSON parsing errors and use fallback message.
        }
        throw new Error(errorMessage);
      }

      onDocumentDeleted(documentId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="bg-[#03070f]">
      <header className="flex h-11 items-center gap-2 border-b border-[#0f1f31] px-4 text-xs text-slate-400">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-[#0d2037] hover:text-slate-200 md:hidden"
          aria-label="Open sidebar"
        >
          <PanelLeft size={12} />
        </button>
        <span className="text-slate-300">Dashboard</span>
      </header>

      <div className="p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Upload Documents
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Drop your company handbooks, guides, or policies to enable
            AI-powered Q&A.
          </p>
        </div>

        <label
          htmlFor="document-upload-input"
          className="mb-4 block cursor-pointer rounded-xl border border-dashed border-[#17406a] bg-[#010b16] px-6 py-12 text-center transition hover:border-[#1f5f9d] hover:bg-[#061422]"
        >
          <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a2d50] text-[#4ca1ff]">
            <Upload size={14} />
          </div>
          <div className="text-sm font-medium text-slate-200">
            Drop your documents here
          </div>
          <div className="mt-1 text-xs text-slate-500">
            PDF, TXT, or Markdown up to 10MB
          </div>
          <div className="mt-1 text-xs font-medium text-[#3c8de3]">
            Browse files
          </div>
          <input
            id="document-upload-input"
            type="file"
            accept=".pdf,.txt,.md,.markdown"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>

        {selectedFile && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between rounded-lg border border-[#10253b] bg-[#071021] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0a2d50] text-[#4ca1ff]">
                  <FileText size={12} />
                </div>
                <div className="text-xs">
                  <p className="text-slate-200">{selectedFile.name}</p>
                  <p className="text-slate-500">
                    {Math.max(1, Math.round(selectedFile.size / 1024))} kB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelectedFile}
                className="text-slate-500 transition hover:text-slate-300"
              >
                <X size={14} />
              </button>
            </div>

            <div className="h-2 rounded-full bg-[#0a1422]">
              <div
                className={`h-2 rounded-full bg-[#2a90ff] transition-all ${isUploading ? "w-full" : "w-full"}`}
              />
            </div>

            <button
              type="button"
              onClick={uploadSelectedFile}
              className="mt-2 h-7 w-full rounded-md bg-[#2a90ff] text-xs font-medium text-white transition hover:bg-[#3d9cff]"
            >
              {isUploading ? "Uploading..." : "Upload 1 file"}
            </button>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Your Documents
            </h3>
            {documents.length > 0 && (
              <span className="text-[10px] text-slate-500">
                {documents.length} document{documents.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="rounded-xl border border-[#0f1f31] bg-[#010912] px-4 py-14 text-center">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[#1e2a39] bg-[#101826] text-slate-400">
                <FileText size={14} />
              </div>
              <p className="text-sm font-medium text-slate-300">
                No documents yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Upload a PDF, TXT, or Markdown file to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between rounded-lg border border-[#10253b] bg-[#071021] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0a2d50] text-[#4ca1ff]">
                      <FileText size={13} />
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-200">{document.name}</p>
                      <p className="text-slate-500">
                        <span>{document.uploadedAt}</span>
                        <span className="px-1">•</span>
                        <span>{document.sizeKb} kB</span>
                        <span className="px-1">•</span>
                        <span>{document.chunks} chunks</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <button
                      type="button"
                      onClick={() => navigate(`/document-chat/${document.id}`)}
                      className="transition hover:text-slate-300"
                      aria-label={`Open chat for ${document.name}`}
                    >
                      <MessageSquare size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDocument(document.id)}
                      className="transition hover:text-slate-300"
                      aria-label={`Delete ${document.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default DocumentUpload;
