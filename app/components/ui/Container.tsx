// app/components/ui/Container.tsx
import { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <div className={`max-w-7xl mx-auto px-6 py-8 ${className}`}>
      {children}
    </div>
  );
}
