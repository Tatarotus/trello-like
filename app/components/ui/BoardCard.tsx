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
        className="flex flex-col p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 h-full"
      >
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition pr-8 truncate">
          {name}
        </h3>
        {count !== undefined && (
          <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            {count} {countLabel || (count === 1 ? 'item' : 'items')}
          </p>
        )}
      </Link>
      
      {deleteAction && (
        <form 
          action={deleteAction} 
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        >
          <button 
            type="submit"
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-100 cursor-pointer"
            aria-label={`Delete ${variant}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </form>
      )}
    </div>
  );
}
