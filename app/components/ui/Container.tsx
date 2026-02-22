import { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <div className={`max-w-6xl mx-auto px-8 py-10 ${className}`}>
      {children}
    </div>
  );
}
