// app/components/ui/WorkspaceHeader.tsx
import Link from "next/link";
import { Container } from "./Container";

interface WorkspaceHeaderProps {
  name: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function WorkspaceHeader({ name, description, backHref, backLabel = "Back" }: WorkspaceHeaderProps) {
  return (
    <div className="bg-white py-12 mb-10 shadow-sm shadow-slate-200">
      <Container>
        <div className="flex flex-col gap-6">
          {backHref && (
            <Link 
              href={backHref}
              className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
              {backLabel}
            </Link>
          )}
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 sm:text-6xl">
              {name}
            </h1>
            {description && (
              <p className="text-xl text-slate-500 max-w-2xl font-bold tracking-tight">
                {description}
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
