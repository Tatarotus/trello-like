"use client"
// app/components/ui/BoardCard.tsx
import Link from "next/link";

interface BoardCardProps {
  id: string;
  name: string;
  count?: number;
  countLabel?: string;
  href: string;
  deleteAction?: (formData: FormData) => void;
  variant?: 'board' | 'workspace';
}

export function BoardCard({ name, count, countLabel, href, deleteAction, variant = 'board' }: BoardCardProps) {
  return (
    <div className="group relative h-full">
      <Link 
        href={href}
        className="flex flex-col p-8 bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full border-none"
      >
        <h3 className="text-2xl font-extrabold text-slate-800 group-hover:text-blue-600 transition pr-10 tracking-tight">
          {name}
        </h3>
        {count !== undefined && (
          <p className="text-slate-500 text-sm mt-3 flex items-center gap-2 font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span>
            {count} {countLabel || (count === 1 ? 'item' : 'items')}
          </p>
        )}
      </Link>
      
      {deleteAction && (
        <form 
          action={deleteAction} 
          className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
        >
          <button 
            type="submit"
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
            aria-label={`Delete ${variant}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </form>
      )}
    </div>
  );
}
