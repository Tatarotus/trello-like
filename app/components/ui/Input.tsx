"use client"
// app/components/ui/Input.tsx
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`flex h-12 w-full rounded-xl border-none bg-slate-100 px-4 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 shadow-inner transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
