import React from 'react';
import { cn } from '../lib/utils';
import { getVerdictPresentation } from '../utils/verdictPresentation';

interface BadgeProps {
  verdict: 'HALAL' | 'HARAM' | 'MASHBOOH' | string;
  size?: 'md' | 'lg';
}

export function Badge({ verdict, size = 'md' }: BadgeProps) {
  const current = getVerdictPresentation(verdict);
  const sizeClasses = size === 'lg'
    ? 'min-w-[7rem] px-5 py-2 rounded-full text-sm font-bold shadow-sm justify-center'
    : 'min-w-[4.75rem] px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase shadow-[0_1px_2px_rgba(0,0,0,0.1)] justify-center';

  return (
    <div
      className={cn('inline-flex max-w-full items-center whitespace-nowrap text-white', current.badgeClass, sizeClasses)}
      title={current.secondaryLabel}
    >
      <span>{current.primaryLabel}</span>
    </div>
  );
}
