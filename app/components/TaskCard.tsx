"use client"

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  id: string;
  title: string;
}

export function TaskCard({ id, title }: TaskCardProps) {
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
    opacity: isDragging ? 0.5 : 1, // Visual cue when dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 mb-2 rounded-lg border border-gray-200 shadow-sm 
                 hover:border-blue-400 cursor-grab active:cursor-grabbing 
                 transition-colors group relative"
    >
      <p className="text-sm font-medium text-gray-700">{title}</p>
      
      {/* Hidden button that shows on hover - very 'Trello' */}
      <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600">
        ✎
      </button>
    </div>
  );
}
