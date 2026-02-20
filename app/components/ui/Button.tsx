"use client"
// app/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = "",
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 rounded-lg cursor-pointer";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm hover:shadow-md",
    secondary: "bg-slate-200 text-slate-700 hover:bg-slate-300 active:scale-95",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 active:scale-95",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-800",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs tracking-wide uppercase",
    md: "h-11 px-6 text-sm",
    lg: "h-13 px-8 text-base",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
