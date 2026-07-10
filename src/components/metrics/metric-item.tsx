import React from 'react';

interface MetricItemProps {
  label: string;
  value: string | number;
  highlightValue?: boolean;
}

export function MetricItem({ label, value, highlightValue = false }: MetricItemProps) {
  return (
    <div className="flex-1 min-w-[100px] px-4 py-2 border-r border-border-custom last:border-r-0 flex flex-col justify-center select-none">
      <span className="font-sans text-[9px] font-bold tracking-wider text-muted-text uppercase mb-0.5">
        {label}
      </span>
      <span className={`font-mono text-xs font-semibold tracking-tight ${highlightValue ? 'text-signal' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}
