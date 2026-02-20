"use client"
import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCorners, 
  DragEndEvent, 
  DragOverEvent, 
  DragStartEvent, 
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { updateTaskPosition, createTask, deleteTask, updateListTitle, createList, deleteList } from '../actions/task-actions';

type Task = { id: string; title: string; order: number; listId: string };
type List = { id: string; title: string; order: number; tasks: Task[] };

// 1. BoardColumn Component (Only handles its own local UI state)
function BoardColumn({ 
  list, 
  onAddTask,
  onDeleteTask,
  onRenameList,
  onDeleteList
}: { 
  list: List; 
  onAddTask: (listId: string, title: string) => void;
  onDeleteTask: (taskId: string, listId: string) => void;
  onRenameList: (listId: string, newTitle: string) => void;
  onDeleteList: (listId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: list.id });
  
  // Local state for adding tasks
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Local state for editing the column title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);

  const handleRenameSubmit = () => {
    setIsEditingTitle(false);
    const trimmedTitle = listTitle.trim();

    if (trimmedTitle === "") {
      onDeleteList(list.id);
    } else if (trimmedTitle !== list.title) {
      onRenameList(list.id, trimmedTitle);
    } else {
      setListTitle(list.title); 
    }
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
    <div className="bg-slate-200/60 w-80 p-3 rounded-2xl flex-shrink-0 flex flex-col h-full max-h-full border border-slate-200/50 shadow-sm">
      <div className="mb-4 px-2.5 pt-1.5 flex justify-between items-center group/title h-9">
        {isEditingTitle ? (
          <input
            autoFocus
            className="font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border-2 border-blue-500 outline-none w-full mr-2 shadow-sm text-sm"
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          />
        ) : (
          <h3 
            onClick={() => setIsEditingTitle(true)}
            className="font-bold text-slate-700 cursor-pointer hover:bg-white/50 px-2 py-1 -ml-2 rounded-lg flex-1 truncate transition-all text-sm uppercase tracking-wide"
          >
            {list.title}
          </h3>
        )}
        <span className="text-slate-400 font-bold text-xs ml-2 bg-slate-300/40 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
          {list.tasks.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2.5 min-h-[50px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
        <SortableContext items={list.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {list.tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              id={task.id} 
              title={task.title}
              onDelete={() => onDeleteTask(task.id, list.id)} 
            />
          ))}
        </SortableContext>
      </div>
      
      <div className="mt-3">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <textarea
              autoFocus
              className="w-full p-2.5 rounded-lg border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-2 text-slate-700 resize-none placeholder:text-slate-400"
              rows={2}
              placeholder="Enter a title for this card..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex gap-2 items-center">
              <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm active:scale-95">
                Add Card
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-700 p-1 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full text-left px-3 py-2.5 text-slate-500 hover:bg-white/60 hover:text-slate-900 rounded-xl text-xs transition-all font-bold flex items-center gap-2 group shadow-sm bg-transparent border border-transparent hover:border-slate-200"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-slate-300/40 text-lg leading-none group-hover:bg-blue-500 group-hover:text-white transition-colors">+</span> 
            ADD A CARD
          </button>
        )}
      </div>
    </div>
  );
}

// 2. Main KanbanBoard Component (Handles the global data and database syncing)
export default function KanbanBoard({ initialLists, boardId }: { initialLists: List[], boardId: string }) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddTask = async (listId: string, title: string) => {
    const tempId = `temp-${Date.now()}`;
    const targetListIndex = lists.findIndex(l => l.id === listId);
    if (targetListIndex === -1) return;

    const newOrder = lists[targetListIndex].tasks.length;
    
    const optimisticTask: Task = {
      id: tempId,
      title: title,
      listId: listId,
      order: newOrder
    };

    setLists(prevLists => {
      return prevLists.map(list => {
        if (list.id === listId) {
          return { ...list, tasks: [...list.tasks, optimisticTask] };
        }
        return list;
      });
    });

    const result = await createTask(title, listId, newOrder);

    if (result.success && result.task) {
      setLists(prevLists => {
        return prevLists.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              tasks: list.tasks.map(task => 
                task.id === tempId ? result.task : task
              )
            };
          }
          return list;
        });
      });
    } else {
      console.error("Failed to save task");
      setLists(initialLists);
    }
  };

  const handleDeleteTask = async (taskId: string, listId: string) => {
    setLists(prevLists => {
      return prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            tasks: list.tasks.filter(task => task.id !== taskId)
          };
        }
        return list;
      });
    });

    const result = await deleteTask(taskId);

    if (!result.success) {
      console.error("Failed to delete task from database");
      setLists(initialLists); 
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    setLists(prev => prev.map(list => 
      list.id === listId ? { ...list, title: newTitle } : list
    ));

    const result = await updateListTitle(listId, newTitle);
    if (!result.success) setLists(initialLists); 
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) {
      setIsAddingList(false);
      return;
    }

    const tempId = `temp-list-${Date.now()}`;
    const newOrder = lists.length;

    const optimisticList: List = { id: tempId, title: newListTitle, order: newOrder, tasks: [] };
    setLists(prev => [...prev, optimisticList]);
    setNewListTitle("");
    setIsAddingList(false);

    const result = await createList(newListTitle, newOrder, boardId);

    if (result.success && result.list) {
      setLists(prev => prev.map(l => l.id === tempId ? { ...l, id: result.list.id } : l));
    } else {
      setLists(initialLists);
    }
  };

  const handleDeleteList = async (listId: string) => {
    setLists(prevLists => prevLists.filter(list => list.id !== listId));

    const result = await deleteList(listId);
    if (!result.success) {
      console.error("Failed to delete list");
      setLists(initialLists); 
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    
    for (const list of lists) {
      const task = list.tasks.find((t) => t.id === activeId);
      if (task) {
        setActiveTask(task);
        return;
      }
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

    if (!result.success) {
      console.error("Database failed to update, rolling back UI.");
      setLists(initialLists); 
    }
  };

  if (!isMounted) return null;

  return (
    <DndContext 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 items-start overflow-x-auto h-full px-8 py-8 scrollbar-hide">
        {lists.map((list) => (
          <BoardColumn 
            key={list.id} 
            list={list} 
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onRenameList={handleRenameList} 
            onDeleteList={handleDeleteList}
          />
        ))}

        <div className="w-80 flex-shrink-0">
          {isAddingList ? (
            <form onSubmit={handleAddList} className="bg-white p-4 rounded-2xl flex flex-col gap-3 shadow-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <input
                autoFocus
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-sm text-slate-700 placeholder:text-slate-400 font-medium"
                placeholder="Enter list title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm active:scale-95 uppercase tracking-wider">
                  Create List
                </button>
                <button type="button" onClick={() => setIsAddingList(false)} className="text-slate-400 hover:text-slate-700 p-2 transition">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingList(true)}
              className="w-full bg-slate-200/50 border border-dashed border-slate-300/80 hover:bg-slate-200 hover:border-slate-400 text-slate-600 font-bold p-4 rounded-2xl text-left transition-all flex items-center gap-3 group text-xs tracking-widest uppercase"
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-300/50 text-xl leading-none group-hover:bg-blue-500 group-hover:text-white transition-all">+</span> 
              Add another list
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-2 scale-105 transition-all cursor-grabbing shadow-2xl">
            <TaskCard id={activeTask.id} title={activeTask.title} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
