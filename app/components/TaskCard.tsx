"use client"
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  id: string;
  title: string;
  onDelete?: () => void;
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
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="bg-slate-300 h-24 rounded-xl opacity-40 shadow-inner"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative animate-in fade-in slide-in-from-bottom-2 duration-300 border-none"
    >
      <p className="text-sm font-bold text-slate-700 leading-relaxed pr-6">
        {title}
      </p>
      
      {onDelete && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}

      <div className="mt-4 flex items-center justify-between">
         <div className="flex gap-2">
            <div className="w-6 h-1.5 rounded-full bg-blue-100 shadow-inner"></div>
            <div className="w-6 h-1.5 rounded-full bg-slate-100 shadow-inner"></div>
         </div>
         <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Task</div>
      </div>
    </div>
  );
}
