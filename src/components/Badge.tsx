import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
  verdict: 'HALAL' | 'HARAM' | 'MASHBOOH' | string;
  size?: 'md' | 'lg';
}

export function Badge({ verdict, size = 'md' }: BadgeProps) {
  const config: Record<string, { color: string; text: string }> = {
    HALAL: { color: 'bg-green-600', text: 'HALAL' },
    HARAM: { color: 'bg-red-600', text: 'HARAM' },
    MASHBOOH: { color: 'bg-amber-600', text: 'MASHBOOH' },
    'HALAL COMPLIANT': { color: 'bg-green-600', text: 'HALAL COMPLIANT' },
    'NON-COMPLIANT': { color: 'bg-red-600', text: 'NON-COMPLIANT' },
    'REQUIRES REVIEW': { color: 'bg-amber-600', text: 'REQUIRES REVIEW' }
  };

  const current = config[verdict] || config.MASHBOOH;
  const sizeClasses = size === 'lg' ? 'px-5 py-2 rounded-full text-xs font-bold shadow-sm' : 'px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase shadow-[0_1px_2px_rgba(0,0,0,0.1)]';

  return (
    <div className={cn('inline-flex items-center text-white', current.color, sizeClasses)}>
      <span>{current.text}</span>
    </div>
  );
}
