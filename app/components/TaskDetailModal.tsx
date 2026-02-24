"use client"
import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  labels: string[] | null;
  order: number;
  listId: string;
}

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const AVAILABLE_LABELS = [
  { name: 'Green', color: 'bg-green-500' },
  { name: 'Yellow', color: 'bg-yellow-500' },
  { name: 'Red', color: 'bg-red-500' },
  { name: 'Blue', color: 'bg-blue-500' },
  { name: 'Purple', color: 'bg-purple-500' },
];

export function TaskDetailModal({ task, isOpen, onClose, onSave, onDelete }: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate || '');
    setSelectedLabels(task.labels || []);
  }, [task]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(task.id, {
      title,
      description,
      dueDate: dueDate || null,
      labels: selectedLabels,
    });
    setIsSaving(false);
    onClose();
  };

  const toggleLabel = (labelName: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelName) 
        ? prev.filter(l => l !== labelName)
        : [...prev, labelName]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div className="flex-1 mr-4">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
             <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-bold text-gray-900 border-none px-0 focus:ring-0 h-auto py-0 mb-1"
             />
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Labels Section */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"/></svg>
              Labels
            </h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LABELS.map((label) => {
                const isSelected = selectedLabels.includes(label.name);
                return (
                  <button
                    key={label.name}
                    onClick={() => toggleLabel(label.name)}
                    className={`${label.color} h-8 px-3 rounded-md text-xs font-bold text-white transition-all flex items-center gap-2 hover:brightness-90 ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400' : 'opacity-60 hover:opacity-100'}`}
                  >
                    {label.name}
                    {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Description Section */}
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Description
                </h4>
                <textarea
                  className="w-full min-h-[150px] p-3 rounded-lg border border-gray-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none text-sm text-gray-900 resize-none bg-gray-50/50"
                  placeholder="Add a more detailed description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </section>
            </div>

            <div className="space-y-6">
              {/* Dates Section */}
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Due Date
                </h4>
                <input
                  type="date"
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none text-sm text-gray-900 bg-gray-50/50"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </section>

              {/* Actions Section */}
              <section className="pt-4 space-y-2">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Actions</h4>
                 <Button 
                    variant="secondary" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                        if(confirm('Are you sure you want to delete this task?')) {
                            onDelete(task.id);
                            onClose();
                        }
                    }}
                 >
                    <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Delete Task
                 </Button>
              </section>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/30 rounded-b-xl">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} isLoading={isSaving} className="px-8">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
