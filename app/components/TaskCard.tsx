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
        className="bg-slate-100 border-2 border-blue-400/50 h-20 rounded-xl opacity-50"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing relative animate-in fade-in slide-in-from-bottom-1 duration-300"
    >
      <p className="text-sm font-semibold text-slate-700 leading-snug pr-4">
        {title}
      </p>
      
      {onDelete && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}

      <div className="mt-3 flex items-center justify-between">
         <div className="flex gap-1.5">
            <div className="w-5 h-1 rounded-full bg-blue-100"></div>
            <div className="w-5 h-1 rounded-full bg-slate-100"></div>
         </div>
         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Task</div>
      </div>
    </div>
  );
}
