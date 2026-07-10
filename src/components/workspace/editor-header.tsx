import React from 'react';
import { StatusIndicator } from '../shared/status-indicator';
import { AgentStatus } from '@/lib/types';

interface EditorHeaderProps {
  attemptNumber: number;
  maxAttempts: number;
  totalAttempts: number;
  status: AgentStatus;
  language: string;
  onSelectAttempt: (idx: number) => void;
}

export function EditorHeader({
  attemptNumber,
  maxAttempts,
  totalAttempts,
  status,
  language,
  onSelectAttempt
}: EditorHeaderProps) {
  return (
    <div className="h-10 px-4 border-b border-border-custom bg-surface flex items-center justify-between select-none">
      {/* Attempt Indicator */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold text-muted-text uppercase tracking-wider">
          Attempt
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalAttempts }).map((_, idx) => {
            const num = idx + 1;
            const isCurrent = num === attemptNumber;
            return (
              <button
                key={num}
                onClick={() => onSelectAttempt(idx)}
                type="button"
                className={`w-5 h-5 flex items-center justify-center font-mono text-[11px] font-bold rounded transition-colors focus:outline-none focus:ring-1 focus:ring-primary-action/40 ${
                  isCurrent
                    ? 'bg-primary-action text-surface'
                    : 'bg-secondary-surface text-muted-text hover:bg-border-custom hover:text-foreground'
                }`}
                title={`Inspect Attempt ${num}`}
              >
                {num}
              </button>
            );
          })}
          <span className="font-mono text-xs text-muted-text/60 ml-0.5">
            of {maxAttempts}
          </span>
        </div>
      </div>

      {/* Execution Status Badge */}
      <div className="flex items-center gap-1.5">
        <span className="font-sans text-[10px] font-semibold text-muted-text uppercase tracking-wider">
          Status:
        </span>
        <StatusIndicator status={status} />
      </div>

      {/* Language Indicator */}
      <div className="flex items-center gap-1">
        <span className="font-mono text-[10px] font-medium text-muted-text uppercase bg-secondary-surface px-1.5 py-0.5 rounded border border-border-custom/50">
          {language}
        </span>
      </div>
    </div>
  );
}
