"use client"
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  labels: string[] | null;
  order: number;
  listId: string;
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const LABEL_COLORS: Record<string, string> = {
  'Green': 'bg-green-500',
  'Yellow': 'bg-yellow-500',
  'Red': 'bg-red-500',
  'Blue': 'bg-blue-500',
  'Purple': 'bg-purple-500',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 opacity-50 min-h-[80px]"
      >
        <div className="opacity-0">
          {task.title}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="group bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer relative"
      onClick={onClick}
    >
      <div className="p-3 pr-8">
        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.map((label) => (
              <div 
                key={label} 
                className={`${LABEL_COLORS[label] || 'bg-gray-400'} h-1.5 w-8 rounded-full`}
              />
            ))}
          </div>
        )}
        
        <p className="text-sm font-medium text-gray-800 break-words line-clamp-3">
          {task.title}
        </p>

        {/* Info Icons */}
        <div className="flex items-center gap-3 mt-2 text-gray-400">
          {task.description && (
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          )}
          {task.dueDate && (
             <div className="flex items-center gap-1 text-[10px] font-bold uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </div>
          )}
        </div>
      </div>
      
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-gray-500 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="15" x2="16" y2="15"/></svg>
      </div>
    </div>
  );
}
