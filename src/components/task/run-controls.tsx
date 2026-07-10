'use client';

import React from 'react';
import { Play, Terminal } from 'lucide-react';

interface RunControlsProps {
  maxAttempts: number;
  onChangeMaxAttempts: (val: number) => void;
  onRunAgent: () => void;
  isRunning: boolean;
}

export function RunControls({
  maxAttempts,
  onChangeMaxAttempts,
  onRunAgent,
  isRunning
}: RunControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Settings Row */}
      <div className="flex items-center justify-between">
        <label htmlFor="max-attempts" className="font-sans text-xs font-medium text-muted-text uppercase select-none">
          Max Attempts
        </label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeMaxAttempts(Math.max(1, maxAttempts - 1))}
            disabled={isRunning}
            type="button"
            className="w-6 h-6 flex items-center justify-center border border-border-custom rounded hover:bg-secondary-surface text-xs disabled:opacity-50 select-none"
            aria-label="Decrease maximum attempts"
          >
            -
          </button>
          <input
            id="max-attempts"
            type="text"
            readOnly
            value={maxAttempts}
            className="w-8 text-center font-mono text-xs font-semibold text-foreground bg-transparent focus:outline-none"
          />
          <button
            onClick={() => onChangeMaxAttempts(Math.min(10, maxAttempts + 1))}
            disabled={isRunning}
            type="button"
            className="w-6 h-6 flex items-center justify-center border border-border-custom rounded hover:bg-secondary-surface text-xs disabled:opacity-50 select-none"
            aria-label="Increase maximum attempts"
          >
            +
          </button>
        </div>
      </div>

      {/* Primary Trigger */}
      <button
        onClick={onRunAgent}
        disabled={isRunning}
        type="button"
        className="w-full h-9 flex items-center justify-center gap-2 bg-primary-action text-surface font-sans text-xs font-semibold rounded hover:bg-primary-action/90 active:bg-primary-action transition-colors focus:outline-none focus:ring-1 focus:ring-primary-action/40 disabled:opacity-50"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>{isRunning ? 'Running Repair...' : 'Run Agent'}</span>
      </button>
    </div>
  );
}
