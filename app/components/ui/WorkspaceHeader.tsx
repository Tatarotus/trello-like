"use client"
import { useState } from "react";
import Link from "next/link";
import { Container } from "./Container";
import { Button } from "./Button";
import { Input } from "./Input";
import { updateWorkspace, deleteWorkspace } from "@/app/actions/workspace-actions";
import { useRouter } from "next/navigation";

interface WorkspaceHeaderProps {
  id: string;
  name: string;
  slug: string | null;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function WorkspaceHeader({ id, name, slug, description, backHref, backLabel = "Back" }: WorkspaceHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newDescription, setNewDescription] = useState(description || "");
  const [newSlug, setNewSlug] = useState(slug || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setIsSaving(true);
    const result = await updateWorkspace(id, { 
      name: newName, 
      description: newDescription, 
      slug: newSlug 
    });
    if (result.success) {
      setIsSettingsOpen(false);
      router.refresh();
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this workspace? All boards and tasks will be permanently removed.")) return;
    setIsDeleting(true);
    const result = await deleteWorkspace(id);
    if (result.success) {
      router.push("/");
    }
    setIsDeleting(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 py-10 mb-8 relative">
      <Container>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-4">
              {backHref && (
                <Link 
                  href={backHref}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  {backLabel}
                </Link>
              )}
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-gray-900">
                  {name}
                </h1>
                {description && (
                  <p className="text-base text-gray-500 max-w-2xl">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Workspace Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
      </Container>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Workspace Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Workspace Name</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Workspace Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Workspace Slug</label>
                <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="workspace-slug" />
                <p className="text-[10px] text-gray-400">Used in URLs (alphanumeric and hyphens only)</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Description</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none text-sm text-gray-900 resize-none bg-gray-50/50" 
                  placeholder="Describe your workspace..." 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)} 
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button 
                  variant="danger" 
                  fullWidth 
                  onClick={handleDelete} 
                  isLoading={isDeleting}
                >
                  Delete Workspace
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
    </div>
  );
}
