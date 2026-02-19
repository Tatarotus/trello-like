"use client"

import { useState } from 'react';
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
import { updateTaskPosition } from '../actions/task-actions'; // Ensure path is correct

type Task = { id: string; title: string; order: number; listId: string };
type List = { id: string; title: string; order: number; tasks: Task[] };

// 1. New Component: A dedicated Droppable Column to fix the "Empty List" bug
function BoardColumn({ list }: { list: List }) {
  const { setNodeRef } = useDroppable({ id: list.id });

  return (
    <div className="bg-slate-200/50 w-80 p-3 rounded-xl flex-shrink-0 flex flex-col">
      <h3 className="font-semibold text-slate-700 mb-3 px-2 flex justify-between">
        {list.title}
        <span className="text-slate-400 font-normal text-sm">{list.tasks.length}</span>
      </h3>
      
      {/* setNodeRef makes the entire background a valid drop target, even if empty */}
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 min-h-[150px]">
        <SortableContext items={list.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {list.tasks.map((task) => (
            <TaskCard key={task.id} id={task.id} title={task.title} />
          ))}
        </SortableContext>
      </div>
      
      <button className="w-full mt-3 text-left px-2 py-2 text-slate-500 hover:bg-slate-300/50 hover:text-slate-700 rounded text-sm transition font-medium">
        + Add a card
      </button>
    </div>
  );
}

export default function KanbanBoard({ initialLists }: { initialLists: List[] }) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

  return (
    <DndContext 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 items-start overflow-x-auto pb-4">
        {lists.map((list) => (
          <BoardColumn key={list.id} list={list} />
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
