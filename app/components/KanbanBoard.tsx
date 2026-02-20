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
      // 3. YOUR IDEA: If the name is empty, delete the whole list!
      onDeleteList(list.id);
    } else if (trimmedTitle !== list.title) {
      onRenameList(list.id, trimmedTitle);
    } else {
      setListTitle(list.title); // Revert if they didn't change anything
    }

    if (listTitle.trim() !== list.title && listTitle.trim() !== "") {
      onRenameList(list.id, listTitle);
    } else {
      setListTitle(list.title); // Revert if empty
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
    <div className="bg-slate-200/50 w-80 p-3 rounded-xl flex-shrink-0 flex flex-col">
      <div className="mb-3 px-2 flex justify-between items-center h-8">
        {isEditingTitle ? (
          <input
            autoFocus
            className="font-semibold text-slate-700 bg-white px-2 py-1 rounded border-2 border-blue-500 outline-none w-full mr-2"
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          />
        ) : (
          <h3 
            onClick={() => setIsEditingTitle(true)}
            className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-300/50 px-2 py-1 -ml-2 rounded flex-1 truncate transition"
          >
            {list.title}
          </h3>
        )}
        <span className="text-slate-400 font-normal text-sm ml-2">
          {list.tasks.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 min-h-[50px]">
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
      
      {isAdding ? (
        <form onSubmit={handleSubmit} className="mt-2">
          <textarea
            autoFocus
            className="w-full p-2 rounded-lg border-none shadow-sm resize-none focus:ring-2 focus:ring-blue-500 text-sm mb-2 text-slate-700"
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
            <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition">
              Add card
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-800 p-1 text-lg">
              ×
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full mt-2 text-left px-2 py-2 text-slate-500 hover:bg-slate-300/50 hover:text-slate-700 rounded text-sm transition font-medium flex items-center gap-1"
        >
          <span>+</span> Add a card
        </button>
      )}
    </div>
  );
}

// 2. Main KanbanBoard Component (Handles the global data and database syncing)
export default function KanbanBoard({ initialLists }: { initialLists: List[] }) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Moved these up to the parent!
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

  // The missing List rename handler!
  const handleRenameList = async (listId: string, newTitle: string) => {
    setLists(prev => prev.map(list => 
      list.id === listId ? { ...list, title: newTitle } : list
    ));

    const result = await updateListTitle(listId, newTitle);
    if (!result.success) setLists(initialLists); 
  };

  // The missing List add handler!
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

    const result = await createList(newListTitle, newOrder);

    if (result.success && result.list) {
      setLists(prev => prev.map(l => l.id === tempId ? { ...l, id: result.list.id } : l));
    } else {
      setLists(initialLists);
    }
  };

  const handleDeleteList = async (listId: string) => {
    // Optimistic UI: instantly remove the list from the screen
    setLists(prevLists => prevLists.filter(list => list.id !== listId));

    // Background Database update
    const result = await deleteList(listId);
    if (!result.success) {
      console.error("Failed to delete list");
      setLists(initialLists); // Rollback if SQLite fails
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
      <div className="flex gap-4 items-start overflow-x-auto pb-4 h-full">
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
            <form onSubmit={handleAddList} className="bg-slate-200/50 p-3 rounded-xl flex flex-col gap-2">
              <input
                autoFocus
                className="w-full p-2 rounded-lg border-2 border-blue-500 outline-none shadow-sm text-sm text-slate-700"
                placeholder="Enter list title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition">
                  Add list
                </button>
                <button type="button" onClick={() => setIsAddingList(false)} className="text-slate-500 hover:text-slate-800 p-1 text-lg">
                  ×
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingList(true)}
              className="w-full bg-white/50 border border-slate-300/50 hover:bg-slate-200/50 text-slate-600 font-medium p-3 rounded-xl text-left transition flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Add another list
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-2 scale-105 transition-transform cursor-grabbing shadow-xl">
            <TaskCard id={activeTask.id} title={activeTask.title} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
