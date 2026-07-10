'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Task } from '@/lib/types';

interface ProblemSelectorProps {
  tasks: Task[];
  selectedTask: Task;
  onSelectTask: (task: Task) => void;
}

export function ProblemSelector({ tasks, selectedTask, onSelectTask }: ProblemSelectorProps) {
  return (
    <div className="relative w-full">
      <label htmlFor="problem-select" className="sr-only">Select Problem</label>
      <select
        id="problem-select"
        value={selectedTask.id}
        onChange={(e) => {
          const task = tasks.find((t) => t.id === e.target.value);
          if (task) onSelectTask(task);
        }}
        className="w-full h-8 px-2.5 pr-8 appearance-none bg-surface border border-border-custom rounded font-sans text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary-action/40 cursor-pointer select-none"
      >
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-muted-text">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}
