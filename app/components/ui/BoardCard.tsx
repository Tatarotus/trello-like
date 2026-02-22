"use client"
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
        className="flex flex-col p-5 bg-white border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors h-full"
      >
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition pr-8">
          {name}
        </h3>
        {count !== undefined && (
          <p className="text-gray-500 text-sm mt-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            {count} {countLabel || (count === 1 ? 'item' : 'items')}
          </p>
        )}
      </Link>
      
      {deleteAction && (
        <form 
          action={deleteAction} 
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <button 
            type="submit"
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
            aria-label={`Delete ${variant}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </form>
      )}
    </div>
  );
}
