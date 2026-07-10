'use client';

import React from 'react';
import { SectionLabel } from '../shared/section-label';
import { ProblemSelector } from './problem-selector';
import { TestCaseList } from './test-case-list';
import { RunControls } from './run-controls';
import { Task } from '@/lib/types';

interface TaskPanelProps {
  tasks: Task[];
  selectedTask: Task;
  onSelectTask: (task: Task) => void;
  maxAttempts: number;
  onChangeMaxAttempts: (val: number) => void;
  onRunAgent: () => void;
  isRunning: boolean;
}

export function TaskPanel({
  tasks,
  selectedTask,
  onSelectTask,
  maxAttempts,
  onChangeMaxAttempts,
  onRunAgent,
  isRunning
}: TaskPanelProps) {
  return (
    <aside className="w-full lg:w-[22%] shrink-0 border-b lg:border-b-0 lg:border-r border-border-custom bg-sidebar flex flex-col p-4 overflow-y-auto select-none">
      <SectionLabel className="mb-4">Task</SectionLabel>

      {/* Selector Section */}
      <div className="mb-5">
        <ProblemSelector
          tasks={tasks}
          selectedTask={selectedTask}
          onSelectTask={onSelectTask}
        />
      </div>

      {/* Description Section */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
        <div>
          <SectionLabel className="mb-2">Problem Statement</SectionLabel>
          <p className="font-sans text-xs leading-relaxed text-muted-text select-text">
            {selectedTask.description}
          </p>
        </div>

        {/* Function Signature */}
        <div>
          <SectionLabel className="mb-2">Function Signature</SectionLabel>
          <pre className="font-mono text-[11px] font-semibold text-foreground bg-surface border border-border-custom rounded p-2 overflow-x-auto whitespace-pre-wrap select-text">
            {selectedTask.signature}
          </pre>
        </div>

        {/* Test Cases */}
        <div>
          <SectionLabel className="mb-2">Test Cases</SectionLabel>
          <TestCaseList testCases={selectedTask.testCases} />
        </div>
      </div>

      {/* Settings & Trigger */}
      <div className="pt-4 border-t border-border-custom mt-5">
        <RunControls
          maxAttempts={maxAttempts}
          onChangeMaxAttempts={onChangeMaxAttempts}
          onRunAgent={onRunAgent}
          isRunning={isRunning}
        />
      </div>
    </aside>
  );
}
