"use client"

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  id: string;
  title: string;
  onDelete?: () => void; // Optional so the DragOverlay doesn't crash if missing
}

export function TaskCard({ id, title, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 mb-2 rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow cursor-grab active:cursor-grabbing transition-all group relative flex justify-between items-start"
    >
      <p className="text-sm font-medium text-slate-700 pr-6 leading-snug break-words">
        {title}
      </p>
      
      {/* The Delete Button (Hidden until hover) */}
      {onDelete && (
        <button 
          onClick={onDelete}
          // THIS IS THE MAGIC FIX for dnd-kit button clicks:
          onPointerDown={(e) => e.stopPropagation()} 
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all"
          title="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
