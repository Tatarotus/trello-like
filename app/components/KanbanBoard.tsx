"use client"
import { useState, useEffect, useRef } from 'react';
import { 
  DndContext, 
  closestCorners, 
  DragEndEvent, 
  DragOverEvent, 
  DragStartEvent, 
  DragOverlay, 
  useDroppable,
  defaultDropAnimationSideEffects,
  DropAnimation,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { createTask, deleteTask, updateListTitle, createList, deleteList, reorderTasks } from '../actions/task-actions';

type Task = { id: string; title: string; order: number; listId: string };
type List = { id: string; title: string; order: number; tasks: Task[] };

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

function BoardColumn({ 
  list, tasks, onAddTask, onDeleteTask, onRenameList, onDeleteList
}: { 
  list: List; 
  tasks: Task[];
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
    // Keep adding mode open for rapid entry
  };

  return (
    <div className="bg-gray-100/50 border border-gray-200/60 rounded-xl w-80 flex-shrink-0 flex flex-col h-full max-h-full shadow-sm">
      <div className="px-3 py-3 flex justify-between items-center border-b border-gray-200/50 group bg-white rounded-t-xl">
        {isEditingTitle ? (
          <input
            autoFocus
            className="font-semibold text-gray-900 bg-white border border-gray-300 px-2 py-1 rounded text-sm w-full outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          />
        ) : (
          <h3 
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-gray-600 flex-1 px-2 py-1 truncate transition-colors"
          >
            {list.title}
          </h3>
        )}
        <div className="flex items-center gap-1">
            <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full flex items-center justify-center shrink-0 min-w-[20px]">
              {tasks.length}
            </span>
            <button 
                onClick={() => onDeleteList(list.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                title="Delete list"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
        </div>
      </div>
      
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} id={task.id} title={task.title}
              onDelete={() => onDeleteTask(task.id, list.id)} 
            />
          ))}
        </SortableContext>
      </div>
      
      <div className="p-2 pt-0">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <textarea
              autoFocus
              className="w-full p-2 rounded-md border border-gray-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none text-sm text-gray-900 resize-none placeholder:text-gray-400 min-h-[60px]"
              placeholder="Enter a title for this card..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="flex gap-2 items-center justify-end">
               <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-xs font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm">
                Add Card
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full text-left px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors flex items-center gap-2 group"
          >
            <span className="p-0.5 rounded bg-gray-200 group-hover:bg-gray-300 transition-colors">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14m-7-7h14"/></svg>
            </span>
            Add a card
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
  
  // Sensors for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement to start drag, prevents accidental drags on clicks
      },
    })
  );

  useEffect(() => {
      setIsMounted(true);
      setLists(initialLists);
  }, [initialLists]);

  const handleAddTask = async (listId: string, title: string) => {
    const tempId = `temp-${Date.now()}`;
    const targetListIndex = lists.findIndex(l => l.id === listId);
    if (targetListIndex === -1) return;
    
    const newOrder = lists[targetListIndex].tasks.length;
    const optimisticTask: Task = { id: tempId, title, listId, order: newOrder };

    setLists(prev => prev.map(list => list.id === listId ? { ...list, tasks: [...list.tasks, optimisticTask] } : list));
    
    const result = await createTask(title, listId, newOrder);
    if (result.success && result.task) {
      setLists(prev => prev.map(list => list.id === listId ? { ...list, tasks: list.tasks.map(task => task.id === tempId ? result.task! : task) } : list));
    } else {
        // Revert on failure
        setLists(prev => prev.map(list => list.id === listId ? { ...list, tasks: list.tasks.filter(t => t.id !== tempId) } : list));
    }
  };

  const handleDeleteTask = async (taskId: string, listId: string) => {
    const oldLists = [...lists];
    setLists(prev => prev.map(list => list.id === listId ? { ...list, tasks: list.tasks.filter(t => t.id !== taskId) } : list));
    const result = await deleteTask(taskId);
    if (!result.success) setLists(oldLists); 
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    setLists(prev => prev.map(list => list.id === listId ? { ...list, title: newTitle } : list));
    await updateListTitle(listId, newTitle);
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
    if (result.success && result.list) {
        setLists(prev => prev.map(l => l.id === tempId ? { ...l, id: result.list!.id } : l));
    } else {
        setLists(prev => prev.filter(l => l.id !== tempId));
    }
  };

  const handleDeleteList = async (listId: string) => {
    const oldLists = [...lists];
    setLists(prev => prev.filter(list => list.id !== listId));
    const result = await deleteList(listId);
    if (!result.success) setLists(oldLists); 
  };

  const findTask = (id: string) => {
    for (const list of lists) {
      const task = list.tasks.find((t) => t.id === id);
      if (task) return task;
    }
    return null;
  };

  const findContainer = (id: string) => {
    if (lists.find((l) => l.id === id)) return id;
    return lists.find((l) => l.tasks.some((t) => t.id === id))?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTask(String(active.id));
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(overId));

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setLists((prev) => {
      const activeItems = prev.find((l) => l.id === activeContainer)?.tasks || [];
      const overItems = prev.find((l) => l.id === overContainer)?.tasks || [];
      const activeIndex = activeItems.findIndex((t) => t.id === active.id);
      const overIndex = overItems.findIndex((t) => t.id === overId);

      let newIndex;
      if (overId in prev.map(l => l.id)) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem = over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return prev.map((l) => {
        if (l.id === activeContainer) {
          return { ...l, tasks: l.tasks.filter((t) => t.id !== active.id) };
        } else if (l.id === overContainer) {
          const newTasks = [...l.tasks];
          // Determine the task to insert
          const taskToMove = activeItems[activeIndex];
          if(taskToMove) {
             // Update its listId immediately for local state consistency
             const updatedTask = { ...taskToMove, listId: overContainer };
             newTasks.splice(newIndex, 0, updatedTask);
          }
          return { ...l, tasks: newTasks };
        }
        return l;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;
    
    if (!overId) {
        setActiveTask(null);
        return;
    }

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (activeContainer && overContainer) {
      const activeListIndex = lists.findIndex((l) => l.id === activeContainer);
      const overListIndex = lists.findIndex((l) => l.id === overContainer);

      if(activeListIndex !== -1 && overListIndex !== -1) {
          const activeIndex = lists[activeListIndex].tasks.findIndex((t) => t.id === activeId);
          const overIndex = lists[overListIndex].tasks.findIndex((t) => t.id === overId);
          
          let newLists = [...lists];

          if (activeContainer === overContainer) {
            // Reordering within the same list
            if (activeIndex !== overIndex) {
              newLists[activeListIndex] = {
                ...newLists[activeListIndex],
                tasks: arrayMove(newLists[activeListIndex].tasks, activeIndex, overIndex)
              };
              setLists(newLists);
              
              // Prepare batch update
              const updatedTasks = newLists[activeListIndex].tasks.map((task, index) => ({
                  id: task.id,
                  order: index,
                  listId: activeContainer
              }));
              await reorderTasks(updatedTasks);
            }
          } else {
            // Moved to a different list (already handled visually by dragOver, just need to sync final order)
            // But we need to make sure the final state is captured correctly as 'dragOver' might have left it in a weird state?
            // Actually dragOver handles the state mutation. dragEnd just needs to persist.
            // Wait, dragOver mutates state optimistically. So 'lists' is already updated?
            // Yes, standard dnd-kit pattern for sortable across containers.
            
            // Just persist the new order of the destination list
            const destList = lists.find(l => l.id === overContainer);
            if(destList) {
                const updatedTasks = destList.tasks.map((task, index) => ({
                    id: task.id,
                    order: index,
                    listId: overContainer
                }));
                 // Also persist source list to close gaps? Not strictly required if backend doesn't care about gaps, 
                 // but good for consistency. For now, just updating destination is critical.
                 // Actually, let's update both just in case.
                 const sourceList = lists.find(l => l.id === activeContainer); // This might be empty now? 
                 // Wait, activeContainer is where it STARTED. 'lists' state has it in 'overContainer' now.
                 // So we just need to update the container where the item ENDED UP.
                 
                 await reorderTasks(updatedTasks);
            }
          }
      }
    }

    setActiveTask(null);
  };

  if (!isMounted) return null;

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 items-start overflow-x-auto h-full px-8 py-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
        {lists.map((list) => (
          <BoardColumn 
            key={list.id} 
            list={list} 
            tasks={list.tasks}
            onAddTask={handleAddTask} 
            onDeleteTask={handleDeleteTask}
            onRenameList={handleRenameList} 
            onDeleteList={handleDeleteList}
          />
        ))}

        <div className="w-80 flex-shrink-0">
          {isAddingList ? (
            <form onSubmit={handleAddList} className="bg-gray-100/50 border border-gray-200 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
              <input
                autoFocus
                className="w-full p-2 rounded-md border border-gray-200 focus:border-gray-500 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder="Enter list title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setIsAddingList(false); }}
              />
              <div className="flex gap-2 items-center">
                <button type="submit" className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                  Add List
                </button>
                <button type="button" onClick={() => setIsAddingList(false)} className="text-gray-500 hover:text-gray-700 px-2 py-1.5 text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingList(true)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 bg-gray-100/40 rounded-xl transition-all flex items-center gap-2 border border-dashed border-gray-300 hover:border-gray-400 group"
            >
              <span className="p-1 rounded bg-gray-200 group-hover:bg-gray-300 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
              </span>
              Add another list
            </button>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <div className="rotate-2 cursor-grabbing">
             <TaskCard id={activeTask.id} title={activeTask.title} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
