import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <h2 className={`font-sans text-[10px] font-semibold tracking-wider text-muted-text uppercase select-none ${className}`}>
      {children}
    </h2>
  );
}
