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
    <div className="bg-slate-200 w-80 p-5 rounded-2xl flex-shrink-0 flex flex-col h-full max-h-full border-none shadow-inner">
      <div className="mb-6 px-1 flex justify-between items-center h-10">
        {isEditingTitle ? (
          <input
            autoFocus
            className="font-black text-slate-800 bg-white px-3 py-2 rounded-xl shadow-sm outline-none w-full mr-2 text-sm"
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          />
        ) : (
          <h3 
            onClick={() => setIsEditingTitle(true)}
            className="text-xs font-black tracking-widest text-slate-600 cursor-pointer hover:bg-white/50 px-3 py-2 -ml-3 rounded-xl flex-1 truncate transition-all uppercase"
          >
            {list.title}
          </h3>
        )}
        <span className="text-slate-500 font-black text-[10px] ml-2 bg-slate-300 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm uppercase">
          {list.tasks.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-4 min-h-[50px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
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
      
      <div className="mt-4">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <textarea
              autoFocus
              className="w-full p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 outline-none text-sm mb-3 text-slate-700 resize-none placeholder:text-slate-400 font-bold border-none shadow-inner"
              rows={3}
              placeholder="What needs to be done?"
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
              <button type="submit" className="flex-1 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-sm active:scale-95 uppercase tracking-wider">
                Add Task
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-700 p-2 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full text-left px-4 py-3.5 text-slate-500 hover:bg-white hover:text-slate-900 rounded-2xl text-[10px] tracking-widest transition-all font-black flex items-center gap-3 group shadow-sm bg-slate-300/30 uppercase"
          >
            <span className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-400/20 text-xl leading-none group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">+</span> 
            Add a card
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
      <div className="flex gap-8 items-start overflow-x-auto h-full px-10 py-10 scrollbar-hide">
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
            <form onSubmit={handleAddList} className="bg-white p-6 rounded-2xl flex flex-col gap-4 shadow-xl border-none animate-in fade-in zoom-in-95 duration-300">
              <input
                autoFocus
                className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500/30 outline-none shadow-inner text-sm text-slate-800 placeholder:text-slate-400 font-bold"
                placeholder="List title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-5 py-3 rounded-xl text-[10px] font-black hover:bg-blue-700 transition shadow-md active:scale-95 uppercase tracking-widest">
                  Create List
                </button>
                <button type="button" onClick={() => setIsAddingList(false)} className="text-slate-400 hover:text-slate-700 p-2 transition">
                   <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingList(true)}
              className="w-full bg-slate-300/40 border-none hover:bg-slate-300 text-slate-600 font-black p-5 rounded-2xl text-left transition-all flex items-center gap-4 group text-[10px] tracking-[0.2em] uppercase shadow-sm"
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-400/30 text-2xl leading-none group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">+</span> 
              New List
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
