import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: (e?: any) => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function Button({ title, children, variant = 'primary', loading = false, icon = null, className = '', ...props }: ButtonProps) {
  const baseStyle = "flex flex-row items-center justify-center rounded-xl py-4 px-6 active:opacity-80 shadow-sm transition-all";
  
  const variants = {
    primary: "bg-[var(--color-primary)] text-white hover:bg-[#15532d]",
    secondary: "bg-[var(--color-accent)] text-[var(--color-dark-bg)] hover:bg-[#b09341]",
    outline: "border-2 border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };

  return (
    <button 
      disabled={loading}
      className={cn(baseStyle, variants[variant], className)}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      ) : (
        <>
          {icon && <span className="mr-2 flex items-center justify-center">{icon}</span>}
          <span className="font-nunito font-bold text-lg">{children || title}</span>
        </>
      )}
    </button>
  );
}
