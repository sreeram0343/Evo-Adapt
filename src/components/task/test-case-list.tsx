import React from 'react';
import { TestCase } from '@/lib/types';

interface TestCaseListProps {
  testCases: TestCase[];
}

export function TestCaseList({ testCases }: TestCaseListProps) {
  return (
    <div className="flex flex-col border border-border-custom rounded bg-surface divide-y divide-border-custom select-text">
      {testCases.map((tc) => (
        <div key={tc.id} className="flex items-center gap-3 px-3 py-1.5 font-mono text-[11px] leading-relaxed">
          <span className="text-muted-text font-bold select-none">{tc.id}</span>
          <span className="text-foreground/90 overflow-x-auto whitespace-nowrap scrollbar-none">
            {tc.input}
          </span>
        </div>
      ))}
    </div>
  );
}
