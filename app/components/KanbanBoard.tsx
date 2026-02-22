"use client"
import { useState, useEffect } from 'react';
import { 
  DndContext, closestCorners, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay, useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { updateTaskPosition, createTask, deleteTask, updateListTitle, createList, deleteList } from '../actions/task-actions';

type Task = { id: string; title: string; order: number; listId: string };
type List = { id: string; title: string; order: number; tasks: Task[] };

function BoardColumn({ 
  list, onAddTask, onDeleteTask, onRenameList, onDeleteList
}: { 
  list: List; 
  onAddTask: (listId: string, title: string) => void;
  onDeleteTask: (taskId: string, listId: string) => void;
  onRenameList: (listId: string, newTitle: string) => void;
  onDeleteList: (listId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: list.id });
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);

  const handleRenameSubmit = () => {
    setIsEditingTitle(false);
    const trimmedTitle = listTitle.trim();
    if (trimmedTitle === "") onDeleteList(list.id);
    else if (trimmedTitle !== list.title) onRenameList(list.id, trimmedTitle);
    else setListTitle(list.title); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setIsAdding(false);
      return;
    }
    onAddTask(list.id, newTaskTitle);
    setNewTaskTitle(""); 
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg w-80 flex-shrink-0 flex flex-col h-full max-h-full">
      <div className="px-3 py-3 flex justify-between items-center border-b border-transparent group">
        {isEditingTitle ? (
          <input
            autoFocus
            className="font-semibold text-gray-900 bg-white border border-gray-300 px-2 py-1 rounded text-sm w-full outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          />
        ) : (
          <h3 
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-gray-600 flex-1 px-2 py-1 truncate"
          >
            {list.title}
          </h3>
        )}
        <span className="ml-2 bg-gray-100 text-gray-600 border border-gray-200 text-xs font-medium px-2 py-0.5 rounded-full flex items-center justify-center shrink-0">
          {list.tasks.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 p-3 min-h-[50px] overflow-y-auto">
        <SortableContext items={list.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {list.tasks.map((task) => (
            <TaskCard 
              key={task.id} id={task.id} title={task.title}
              onDelete={() => onDeleteTask(task.id, list.id)} 
            />
          ))}
        </SortableContext>
      </div>
      
      <div className="p-3 pt-0">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              autoFocus
              className="w-full p-2 rounded-md border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none text-sm text-gray-900 resize-none placeholder:text-gray-400"
              rows={2}
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="flex gap-2 items-center">
              <button type="submit" className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                Add
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700 px-2 py-1.5 text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full text-left px-2 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
            Add item
          </button>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ initialLists, boardId }: { initialLists: List[], boardId: string }) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  useEffect(() => setIsMounted(true), []);

  const handleAddTask = async (listId: string, title: string) => {
    const tempId = `temp-${Date.now()}`;
    const targetListIndex = lists.findIndex(l => l.id === listId);
    if (targetListIndex === -1) return;
    const newOrder = lists[targetListIndex].tasks.length;
    const optimisticTask: Task = { id: tempId, title, listId, order: newOrder };

    setLists(prev => prev.map(list => list.id === listId ? { ...list, tasks: [...list.tasks, optimisticTask] } : list));
    const result = await createTask(title, listId, newOrder);
    if (result.success && result.task) {
      setLists(prev => prev.map(list => list.id === listId ? { ...list, tasks: list.tasks.map(task => task.id === tempId ? result.task : task) } : list));
    } else setLists(initialLists);
  };

  const handleDeleteTask = async (taskId: string, listId: string) => {
    setLists(prev => prev.map(list => list.id === listId ? { ...list, tasks: list.tasks.filter(t => t.id !== taskId) } : list));
    const result = await deleteTask(taskId);
    if (!result.success) setLists(initialLists); 
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    setLists(prev => prev.map(list => list.id === listId ? { ...list, title: newTitle } : list));
    const result = await updateListTitle(listId, newTitle);
    if (!result.success) setLists(initialLists); 
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) { setIsAddingList(false); return; }
    const tempId = `temp-list-${Date.now()}`;
    const newOrder = lists.length;
    const optimisticList: List = { id: tempId, title: newListTitle, order: newOrder, tasks: [] };
    
    setLists(prev => [...prev, optimisticList]);
    setNewListTitle("");
    setIsAddingList(false);

    const result = await createList(newListTitle, newOrder, boardId);
    if (result.success && result.list) setLists(prev => prev.map(l => l.id === tempId ? { ...l, id: result.list.id } : l));
    else setLists(initialLists);
  };

  const handleDeleteList = async (listId: string) => {
    setLists(prev => prev.filter(list => list.id !== listId));
    const result = await deleteList(listId);
    if (!result.success) setLists(initialLists); 
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    for (const list of lists) {
      const task = list.tasks.find((t) => t.id === activeId);
      if (task) { setActiveTask(task); return; }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    let sourceListIndex = lists.findIndex(l => l.tasks.some(t => t.id === activeId));
    let destListIndex = lists.findIndex(l => l.id === overId || l.tasks.some(t => t.id === overId));

    if (sourceListIndex === -1 || destListIndex === -1 || sourceListIndex === destListIndex) return;

    setLists((prev) => {
      const newLists = [...prev.map(l => ({ ...l, tasks: [...l.tasks] }))];
      const taskIndex = newLists[sourceListIndex].tasks.findIndex(t => t.id === activeId);
      const [movedTask] = newLists[sourceListIndex].tasks.splice(taskIndex, 1);
      movedTask.listId = newLists[destListIndex].id;
      newLists[destListIndex].tasks.push(movedTask);
      return newLists;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null); 
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    let destListIndex = lists.findIndex(l => l.id === over.id || l.tasks.some(t => t.id === over.id));
    if (destListIndex === -1) return;
    
    const destinationListId = lists[destListIndex].id;
    const newOrder = lists[destListIndex].tasks.length;
    const result = await updateTaskPosition(activeId, destinationListId, newOrder);
    if (!result.success) setLists(initialLists); 
  };

  if (!isMounted) return null;

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 items-start overflow-x-auto h-full px-8 py-10 scrollbar-hide">
        {lists.map((list) => (
          <BoardColumn 
            key={list.id} list={list} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask}
            onRenameList={handleRenameList} onDeleteList={handleDeleteList}
          />
        ))}

        <div className="w-80 flex-shrink-0">
          {isAddingList ? (
            <form onSubmit={handleAddList} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
              <input
                autoFocus
                className="w-full p-2 rounded-md border border-gray-200 focus:border-gray-400 outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Column name"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setIsAddingList(false); }}
              />
              <div className="flex gap-2 items-center">
                <button type="submit" className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                  Save
                </button>
                <button type="button" onClick={() => setIsAddingList(false)} className="text-gray-500 hover:text-gray-700 px-2 py-1.5 text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingList(true)}
              className="w-full text-left px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-dashed border-gray-300 hover:border-gray-400"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
              Add column
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-2 scale-105 transition-transform cursor-grabbing border border-gray-300 rounded-md">
            <TaskCard id={activeTask.id} title={activeTask.title} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
