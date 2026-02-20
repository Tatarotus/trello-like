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
    <div className="bg-white border-b border-slate-200 py-10 mb-8 shadow-sm">
      <Container>
        <div className="flex flex-col gap-4">
          {backHref && (
            <Link 
              href={backHref}
              className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-all w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
              {backLabel}
            </Link>
          )}
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              {name}
            </h1>
            {description && (
              <p className="text-lg text-slate-500 max-w-2xl font-medium">
                {description}
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
