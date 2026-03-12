import { NavLink } from "react-router-dom";
import { Zap, House, Library, MessageSquare } from "lucide-react";
import type { UploadedDocument } from "../types/documents";

type SideBarProps = {
  documents: UploadedDocument[];
  isLoadingDocuments?: boolean;
  onNavigate?: () => void;
};

function SideBar({ documents, isLoadingDocuments, onNavigate }: SideBarProps) {
  return (
    <aside className="h-full border-r border-[#0f1f31] bg-[#040912] p-4">
      <div className="mb-6 flex items-center gap-3 border-b border-[#0f1f31] pb-4 ">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b63d7] text-xs font-semibold text-white">
          <Zap />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-100">AI-Pulse</h1>
          <p className="text-xs text-slate-500">Onboarder</p>
        </div>
      </div>

      <nav className="space-y-1">
        <NavLink
          to="/dashboard"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex gap-2 block rounded-md px-3 py-2 text-sm transition ${
              isActive
                ? "bg-[#0d2037] text-slate-100"
                : "text-slate-400 hover:bg-[#0b1626] hover:text-slate-200"
            }`
          }
        >
          <House />
          Dashboard
        </NavLink>
        <NavLink
          to="/all-documents-chat"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex  gap-2 block rounded-md px-3 py-2 text-sm transition ${
              isActive
                ? "bg-[#0d2037] text-slate-100"
                : "text-slate-400 hover:bg-[#0b1626] hover:text-slate-200"
            }`
          }
        >
          <Library />
          All Documents Chat
        </NavLink>
      </nav>

      <div className="mt-8 border-t border-[#0f1f31] pt-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          Documents
        </p>
        {isLoadingDocuments ? (
          <div className="mt-4 rounded-md border border-dashed border-[#14263a] bg-[#071021] px-3 py-4 text-center text-xs text-slate-500">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col gap-2 justify-center items-center mt-4  p-4 text-center">
            <MessageSquare />
            <p className=" text-[11px] text-slate-500">
              Upload documents to start chatting
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            {documents.map((document) => (
              <NavLink
                key={document.id}
                to={`/document-chat/${document.id}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                    isActive
                      ? "bg-[#0d2037] text-slate-100"
                      : "text-slate-400 hover:bg-[#0b1626] hover:text-slate-200"
                  }`
                }
              >
                <span className="truncate">{document.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default SideBar;
