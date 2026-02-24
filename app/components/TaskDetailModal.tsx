"use client"
import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { createTask, getSubTasks, updateTask, deleteTask } from '../actions/task-actions';
import { aiSuggestTags, aiMakeTaskPerfect, aiRewriteTask, aiWriteStatusUpdate, createBatchSubtasks } from '../actions/ai-actions';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  labels: string[] | null;
  completed?: boolean;
  order: number;
  listId: string;
  parentId?: string | null;
}

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onSubtasksChange?: (parentId: string, subtasks: Task[]) => void;
}

const AVAILABLE_LABELS = [
  { name: 'Green', color: 'bg-green-500' },
  { name: 'Yellow', color: 'bg-yellow-500' },
  { name: 'Red', color: 'bg-red-500' },
  { name: 'Blue', color: 'bg-blue-500' },
  { name: 'Purple', color: 'bg-purple-500' },
];

const LABEL_COLOR_MAP: Record<string, string> = {
  'Green': 'bg-green-500',
  'Yellow': 'bg-yellow-500',
  'Red': 'bg-red-500',
  'Blue': 'bg-blue-500',
  'Purple': 'bg-purple-500',
};

export function TaskDetailModal({ task: initialTask, isOpen, onClose, onSave, onDelete, onSubtasksChange }: TaskDetailModalProps) {
  const [taskStack, setTaskStack] = useState<Task[]>([initialTask]);
  const currentTask = taskStack[taskStack.length - 1];

  const [title, setTitle] = useState(currentTask.title);
  const [description, setDescription] = useState(currentTask.description || '');
  const [dueDate, setDueDate] = useState(currentTask.dueDate || '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(currentTask.labels || []);
  const [completed, setCompleted] = useState(currentTask.completed || false);
  const [isSaving, setIsSaving] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  
  // AI Draft States
  const [proposedSubtaskTitles, setProposedSubtaskTitles] = useState<string[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStatusUpdate, setAiStatusUpdate] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const fetchSubtasks = useCallback(async (taskId: string) => {
    const result = await getSubTasks(taskId);
    if (result.success && result.tasks) {
      setSubtasks(result.tasks as Task[]);
    }
  }, []);

  useEffect(() => {
    setTitle(currentTask.title);
    setDescription(currentTask.description || '');
    setDueDate(currentTask.dueDate || '');
    setSelectedLabels(currentTask.labels || []);
    setCompleted(currentTask.completed || false);
    setAiStatusUpdate(null);
    setProposedSubtaskTitles([]);
    setIsAiPanelOpen(false);
    setAiError(null);
    fetchSubtasks(currentTask.id);
  }, [currentTask, fetchSubtasks]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const updates = { title, description, dueDate: dueDate || null, labels: selectedLabels, completed };
    
    // 1. Persist main task updates
    await onSave(currentTask.id, updates);
    
    // 2. Persist any proposed AI subtasks
    if (proposedSubtaskTitles.length > 0) {
        const res = await createBatchSubtasks(currentTask.id, currentTask.listId, proposedSubtaskTitles);
        if (res.success && res.subtasks) {
            const updatedSubtasks = [...subtasks, ...res.subtasks as Task[]];
            setSubtasks(updatedSubtasks);
            onSubtasksChange?.(currentTask.id, updatedSubtasks);
            setProposedSubtaskTitles([]);
        }
    }

    // Update stack state
    setTaskStack(prev => prev.map(t => t.id === currentTask.id ? { ...t, ...updates } : t));
    setIsSaving(false);
  };

  const handleToggleCompleted = async (e: React.MouseEvent) => {
      e.stopPropagation();
      const newCompletedState = !completed;
      setCompleted(newCompletedState);
      // We don't save immediately now, just like AI edits
  };

  const handleToggleSubtaskCompleted = async (stId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const st = subtasks.find(s => s.id === stId);
      if (!st) return;
      const newCompleted = !st.completed;
      const newSubtasks = subtasks.map(s => s.id === stId ? { ...s, completed: newCompleted } : s);
      setSubtasks(newSubtasks);
      onSubtasksChange?.(currentTask.id, newSubtasks);
      await updateTask(stId, { completed: newCompleted });
  };

  const handleDeleteSubtask = async (stId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('Delete this sub-task?')) return;
      const newSubtasks = subtasks.filter(s => s.id !== stId);
      setSubtasks(newSubtasks);
      onSubtasksChange?.(currentTask.id, newSubtasks);
      await deleteTask(stId);
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const result = await createTask(newSubtaskTitle, currentTask.listId, subtasks.length, currentTask.id);
    if (result.success && result.task) {
      const newSubtasks = [...subtasks, result.task as Task];
      setSubtasks(newSubtasks);
      onSubtasksChange?.(currentTask.id, newSubtasks);
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  // AI Handlers - DRAFT ONLY
  const handleStatusUpdate = async () => {
    setIsAiThinking(true);
    setAiError(null);
    try {
        const result = await aiWriteStatusUpdate(currentTask.id);
        if (result.success && result.update) {
          setAiStatusUpdate(result.update);
          setIsAiPanelOpen(true);
        } else {
            setAiError(result.error || "Failed to generate status update.");
        }
    } catch (err) {
        setAiError("AI error.");
    }
    setIsAiThinking(false);
  };

  const handleMakePerfect = async () => {
    setIsAiThinking(true);
    setAiError(null);
    try {
        const result = await aiMakeTaskPerfect(currentTask.id);
        if (result.success && result.data) {
          const d = result.data;
          setTitle(d.title);
          setDescription(d.description || '');
          if (d.labels) {
              const lowerExisting = selectedLabels.map(l => l.toLowerCase());
              const newLabels = d.labels.filter((l: string) => !lowerExisting.includes(l.toLowerCase()));
              setSelectedLabels([...selectedLabels, ...newLabels]);
          }
          if (d.suggestedDueDate && !dueDate) setDueDate(d.suggestedDueDate);
          if (d.subtasks) setProposedSubtaskTitles(d.subtasks);

          if (!currentTask.dueDate) {
              const statusRes = await aiWriteStatusUpdate(currentTask.id);
              if (statusRes.success && statusRes.update) {
                  setAiStatusUpdate(statusRes.update);
                  setIsAiPanelOpen(true);
              }
          }
        } else {
            setAiError(result.error || "Failed to optimize task.");
        }
    } catch (err) {
        setAiError("AI error.");
    }
    setIsAiThinking(false);
  };

  const handleRewrite = async (tone: 'professional' | 'concise' | 'friendly') => {
    setIsAiThinking(true);
    setAiError(null);
    try {
        const result = await aiRewriteTask(currentTask.id, tone);
        if (result.success && result.data) {
          setTitle(result.data.title);
          setDescription(result.data.description);
        } else {
            setAiError(result.error || "Rewrite failed.");
        }
    } catch (err) {
        setAiError("AI error.");
    }
    setIsAiThinking(false);
  };

  const handleAiSuggestTags = async () => {
      setIsAiThinking(true);
      setAiError(null);
      try {
          const res = await aiSuggestTags(currentTask.id);
          if (res.success && res.tags) {
              const lowerExisting = selectedLabels.map(l => l.toLowerCase());
              const newTags = res.tags.filter((t: string) => !lowerExisting.includes(t.toLowerCase()));
              setSelectedLabels([...selectedLabels, ...newTags]);
          } else {
              setAiError(res.error || "Tag suggestion failed.");
          }
      } catch (err) {
          setAiError("AI error.");
      }
      setIsAiThinking(false);
  };

  const drillDown = (task: Task) => setTaskStack(prev => [...prev, task]);
  const goBack = () => taskStack.length > 1 && setTaskStack(prev => prev.slice(0, -1));
  const toggleLabel = (labelName: string) => {
    const newLabels = selectedLabels.includes(labelName) ? selectedLabels.filter(l => l !== labelName) : [...selectedLabels, labelName];
    setSelectedLabels(newLabels);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 transition-all ${isAiPanelOpen ? 'w-full max-w-5xl h-[90vh]' : 'w-full max-w-2xl max-h-[90vh]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
          {/* Navigation Breadcrumbs */}
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-2 flex items-center justify-between overflow-x-auto whitespace-nowrap">
             <div className="flex items-center gap-2">
                {taskStack.length > 1 && (
                    <button onClick={goBack} className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                )}
                {taskStack.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-2">
                        {i > 0 && <span className="text-gray-300">/</span>}
                        <button onClick={() => setTaskStack(prev => prev.slice(0, i + 1))} className={`text-xs font-medium px-2 py-1 rounded transition-colors cursor-pointer ${i === taskStack.length - 1 ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>
                            {t.title}
                        </button>
                    </div>
                ))}
             </div>
             {isAiThinking && (
                 <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 animate-pulse uppercase tracking-widest">
                   <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   ✦ AI Processing
                 </div>
             )}
          </div>

          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div className="flex-1 mr-4 flex items-start gap-4">
               <button onClick={handleToggleCompleted} className={`mt-6 w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer ${completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400 bg-white'}`}>
                  {completed && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
               </button>
               <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className={`text-xl font-bold text-gray-900 border-none px-0 focus:ring-0 h-auto py-0 mb-1 ${completed ? 'line-through text-gray-400' : ''}`}/>
               </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={handleMakePerfect} disabled={isAiThinking} className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">✨ Make This Task Perfect</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleRewrite('professional')} disabled={isAiThinking} className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">Professional</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleRewrite('concise')} disabled={isAiThinking} className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">Concise</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleRewrite('friendly')} disabled={isAiThinking} className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">Friendly</Button>
                    <Button size="sm" variant="secondary" onClick={handleStatusUpdate} disabled={isAiThinking} className="bg-green-50 text-green-700 border-green-100 hover:bg-green-100">📝 Write Status Update</Button>
                </div>
                {aiError && <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">⚠️ {aiError}</p>}
            </div>

            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"/></svg>Labels</h4>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LABELS.map((label) => {
                  const isSelected = selectedLabels.includes(label.name);
                  return (
                    <button key={label.name} onClick={() => toggleLabel(label.name)} className={`${label.color} h-8 px-3 rounded-md text-xs font-bold text-white transition-all flex items-center gap-2 hover:brightness-90 cursor-pointer ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400' : 'opacity-60 hover:opacity-100'}`}>
                      {label.name}
                      {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </button>
                  );
                })}
                {selectedLabels.filter(l => !LABEL_COLOR_MAP[l]).map((label) => (
                  <div key={label} className="bg-gray-100 text-gray-700 h-8 px-3 rounded-md text-xs font-bold flex items-center gap-2 border border-gray-200">
                    {label}
                    <button onClick={() => toggleLabel(label)} className="hover:text-red-500 cursor-pointer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={handleAiSuggestTags} disabled={isAiThinking} className="h-8 px-3 text-blue-600 hover:bg-blue-50">✦ AI Suggest Tags</Button>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Description</h4>
                  <textarea className="w-full min-h-[120px] p-3 rounded-lg border border-gray-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none text-sm text-gray-900 resize-none bg-gray-50/50" placeholder="Add a more detailed description..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </section>

                <section>
                   <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h12"/></svg>Sub-tasks</h4>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{subtasks.length + proposedSubtaskTitles.length}</span>
                   </div>
                   <div className="space-y-1">
                      {/* Existing subtasks */}
                      {subtasks.map((st) => (
                          <div key={st.id} onClick={() => drillDown(st)} className="group flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
                              <button onClick={(e) => handleToggleSubtaskCompleted(st.id, e)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${st.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400 bg-white'}`}>{st.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}</button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">{st.labels && st.labels.length > 0 && st.labels.map(l => (<div key={l} className={`${LABEL_COLOR_MAP[l] || 'bg-gray-300'} h-1 w-6 rounded-full`} />))}</div>
                                <span className={`text-sm block truncate ${st.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>{st.title}</span>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {st.dueDate && <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{new Date(st.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                                  <button onClick={(e) => handleDeleteSubtask(st.id, e)} className="p-1 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                                  <svg className="text-gray-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                              </div>
                          </div>
                      ))}
                      
                      {/* Proposed AI subtasks (Draft) */}
                      {proposedSubtaskTitles.map((title, i) => (
                          <div key={`proposed-${i}`} className="flex items-center gap-3 p-2 rounded-lg border border-blue-50 bg-blue-50/30 animate-in fade-in slide-in-from-left-1">
                              <div className="w-5 h-5 rounded border border-blue-200 bg-white flex items-center justify-center text-blue-400"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg></div>
                              <span className="text-sm text-blue-700 font-medium flex-1 italic">{title} (Proposed)</span>
                              <button onClick={() => setProposedSubtaskTitles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-blue-300 hover:text-red-500 cursor-pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                          </div>
                      ))}

                      {isAddingSubtask ? (
                          <form onSubmit={handleAddSubtask} className="mt-2 flex flex-col gap-2 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                               <input autoFocus className="w-full p-2 rounded border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-900/5" placeholder="What needs to be done?" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setIsAddingSubtask(false)} />
                               <div className="flex justify-end gap-2"><Button size="sm" variant="ghost" type="button" onClick={() => setIsAddingSubtask(false)}>Cancel</Button><Button size="sm" type="submit">Add Sub-task</Button></div>
                          </form>
                      ) : (
                          <button onClick={() => setIsAddingSubtask(true)} className="mt-2 w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all text-sm font-medium cursor-pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>Add a sub-task</button>
                      )}
                   </div>
                </section>
              </div>

              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Due Date</h4>
                  <input type="date" className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none text-sm text-gray-900 bg-gray-50/50" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </section>
                <section className="pt-4 space-y-2">
                   <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Actions</h4>
                   <Button variant="danger" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { if(confirm('Are you sure?')) { onDelete(currentTask.id); if (taskStack.length > 1) goBack(); } }}><svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>Delete Task</Button>
                </section>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/30 rounded-b-xl shrink-0">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} isLoading={isSaving} className="px-8 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md">Save changes</Button>
          </div>
        </div>

        {/* AI Status Update Panel */}
        {isAiPanelOpen && (
          <div className="w-80 flex flex-col bg-gray-50 border-l border-gray-100 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <h4 className="text-sm font-bold text-green-900 flex items-center gap-2">✦ AI Status Update</h4>
              <button onClick={() => setIsAiPanelOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {aiStatusUpdate || "Generating update..."}
                </div>
                {aiStatusUpdate && (
                    <button 
                        onClick={() => { navigator.clipboard.writeText(aiStatusUpdate); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }}
                        className={`mt-4 w-full py-2 text-white text-xs font-medium rounded-lg transition-all ${isCopied ? 'bg-green-600' : 'bg-gray-900 hover:bg-gray-800'}`}
                    >
                        {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
