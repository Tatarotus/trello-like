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
    <div className="bg-white border-b border-gray-200 py-10 mb-8">
      <Container>
        <div className="flex flex-col gap-4">
          {backHref && (
            <Link 
              href={backHref}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              {backLabel}
            </Link>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-gray-900">
              {name}
            </h1>
            {description && (
              <p className="text-base text-gray-500 max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
