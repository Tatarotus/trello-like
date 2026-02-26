"use client"
import { useState } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { Input } from "./Input";
import { updateBoard, deleteBoard } from "@/app/actions/board-actions";
import { useRouter } from "next/navigation";

interface BoardHeaderProps {
  boardId: string;
  boardName: string;
  boardSlug: string;
  workspaceName: string;
  workspaceSlug: string;
}

export function BoardHeader({ boardId, boardName, boardSlug, workspaceName, workspaceSlug }: BoardHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newName, setNewName] = useState(boardName);
  const [newSlug, setNewSlug] = useState(boardSlug);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setIsSaving(true);
    const result = await updateBoard(boardId, { 
      name: newName, 
      slug: newSlug 
    });
    
    if (result.success && result.board) {
      setIsSettingsOpen(false);
      // Gentle redirect to the new URL if the slug changed
      if (result.board.slug !== boardSlug) {
        router.push(`/${workspaceSlug}/${result.board.slug}`);
      } else {
        router.refresh();
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this board? This action cannot be undone.")) return;
    setIsDeleting(true);
    const result = await deleteBoard(boardId);
    if (result.success) {
      router.push(`/${workspaceSlug}`);
    }
    setIsDeleting(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-2.5">
        <Link 
          href={`/${workspaceSlug}`} 
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          {workspaceName}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-sm font-semibold text-gray-900">{boardName}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          title="Board Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>

        <div className="h-4 w-[1px] bg-gray-200 mx-2 hidden sm:block"></div>
        <div className="flex -space-x-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-medium text-gray-700">S</div>
          <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] font-medium text-gray-600">G</div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Board Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Board Name</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Board Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Board Slug</label>
                <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="board-slug" />
                <p className="text-[10px] text-gray-400">Used in URLs (alphanumeric and hyphens only)</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button 
                  variant="danger" 
                  fullWidth 
                  onClick={handleDelete} 
                  isLoading={isDeleting}
                >
                  Delete Board
                </Button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/30">
              <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate} isLoading={isSaving} className="px-8 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
