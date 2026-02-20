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
import { updateTaskPosition, createTask, deleteTask } from '../actions/task-actions';
type Task = { id: string; title: string; order: number; listId: string };
type List = { id: string; title: string; order: number; tasks: Task[] };

// 1. New Component: A dedicated Droppable Column to fix the "Empty List" bug
function BoardColumn({ 
  list, 
  onAddTask,
  onDeleteTask
}: { 
  list: List; 
  onAddTask: (listId: string, title: string) => void;
  onDeleteTask: (taskId: string, listId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: list.id });
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setIsAdding(false);
      return;
    }
    
    // Send it to the parent board to handle the state/database
    onAddTask(list.id, newTaskTitle);
    
    // Clear the input but keep the form open for rapid data entry
    setNewTaskTitle(""); 
  };

  return (
    <div className="bg-slate-200/50 w-80 p-3 rounded-xl flex-shrink-0 flex flex-col">
      <h3 className="font-semibold text-slate-700 mb-3 px-2 flex justify-between">
        {list.title}
        <span className="text-slate-400 font-normal text-sm">{list.tasks.length}</span>
      </h3>
      
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 min-h-[50px]">
        <SortableContext items={list.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {list.tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              id={task.id} 
              title={task.title}
              onDelete={() => onDeleteTask(task.id, list.id)} // <-- Pass it to the card
      />
          ))}
        </SortableContext>
      </div>
      
      {/* The Add Card Inline Form */}
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
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              Add card
            </button>
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="text-slate-500 hover:text-slate-800 p-1 text-lg"
            >
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

export default function KanbanBoard({ initialLists }: { initialLists: List[] }) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  //add task to list
  const handleAddTask = async (listId: string, title: string) => {
    // 1. Create a temporary ID for instant UI updates
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

    // 2. Optimistic Update: instantly add to the screen (DEEP COPY FIX)
    setLists(prevLists => {
      return prevLists.map(list => {
        if (list.id === listId) {
          // Create a brand new array for the tasks instead of mutating with .push()
          return { ...list, tasks: [...list.tasks, optimisticTask] };
        }
        return list;
      });
    });

    // 3. Background Database Save
    const result = await createTask(title, listId, newOrder);

    if (result.success && result.task) {
      // 4. Swap the temporary ID for the real database ID
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
      // 5. Rollback if SQLite fails
      console.error("Failed to save task");
      setLists(initialLists);
    }
  };

  const handleDeleteTask = async (taskId: string, listId: string) => {
    // 1. Optimistic Update: Remove it from the UI instantly
    setLists(prevLists => {
      return prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            tasks: list.tasks.filter(task => task.id !== taskId) // Filter out the deleted task
          };
        }
        return list;
      });
    });

    // 2. Background Database Update
    const result = await deleteTask(taskId);

    // 3. Rollback if it fails
    if (!result.success) {
      console.error("Failed to delete task from database");
      setLists(initialLists); // Resync with the server state if SQLite fails
    }
  };

  // Triggered when dragging starts: saves the active task for the DragOverlay
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

  // Triggered WHILE dragging over a different container: prevents the disappearing bug
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find source and destination lists
    let sourceListIndex = lists.findIndex(l => l.tasks.some(t => t.id === activeId));
    let destListIndex = lists.findIndex(l => l.id === overId || l.tasks.some(t => t.id === overId));

    if (sourceListIndex === -1 || destListIndex === -1 || sourceListIndex === destListIndex) return;

    // Move the item to the new list immediately during hover
    setLists((prev) => {
      const newLists = [...prev.map(l => ({ ...l, tasks: [...l.tasks] }))];
      const taskIndex = newLists[sourceListIndex].tasks.findIndex(t => t.id === activeId);
      const [movedTask] = newLists[sourceListIndex].tasks.splice(taskIndex, 1);
      
      movedTask.listId = newLists[destListIndex].id;
      newLists[destListIndex].tasks.push(movedTask);
      return newLists;
    });
  };

  // Triggered when dropped: finalizing the database update
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null); // Remove the overlay ghost
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    let destListIndex = lists.findIndex(l => l.id === over.id || l.tasks.some(t => t.id === over.id));
    
    if (destListIndex === -1) return;
    
    const destinationListId = lists[destListIndex].id;
    const newOrder = lists[destListIndex].tasks.length;

    // Background Database Update via Drizzle
    const result = await updateTaskPosition(activeId, destinationListId, newOrder);

    if (!result.success) {
      console.error("Database failed to update, rolling back UI.");
      setLists(initialLists); 
    }
  };

  if (!isMounted) {
    return null; // Or you could return a loading spinner / skeleton board here
  }

  return (
    <DndContext 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 items-start overflow-x-auto pb-4">
        {lists.map((list) => (
          <BoardColumn 
            key={list.id} 
            list={list} 
            onAddTask={handleAddTask} 
            onDeleteTask={handleDeleteTask}
          />
        ))}
      </div>

      {/* 2. DragOverlay fixes the visual glitch of cards disappearing mid-drag */}
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
