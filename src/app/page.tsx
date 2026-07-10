'use client';

import React, { useState } from 'react';
import { TopNav } from '@/components/navigation/top-nav';
import { TaskPanel } from '@/components/task/task-panel';
import { CodeWorkspace } from '@/components/workspace/code-workspace';
import { AgentActivity } from '@/components/activity/agent-activity';
import { MetricsStrip } from '@/components/metrics/metrics-strip';
import { ExperimentsView } from '@/components/shared/experiments-view';
import { BenchmarkView } from '@/components/shared/benchmark-view';
import { mockTasks } from '@/lib/mock-data';
import { useAgentRun } from '@/hooks/use-agent-run';
import { Task } from '@/lib/types';

export default function Home() {
  const [activeNavTab, setActiveNavTab] = useState<string>('workspace');
  const [selectedTask, setSelectedTask] = useState<Task>(mockTasks[0]);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  
  // Mobile sub-tab selector
  const [mobileTab, setMobileTab] = useState<'task' | 'code' | 'activity' | 'results'>('code');

  const {
    currentAttempt,
    attempts,
    selectedAttemptIdx,
    setSelectedAttemptIdx,
    isRunning,
    runAgent,
    events,
    status,
    metrics
  } = useAgentRun();

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleNewExperiment = () => {
    setActiveNavTab('experiments');
  };

  return (
    <div className="flex flex-col h-screen min-h-screen bg-background overflow-hidden">
      {/* Global Top Nav */}
      <TopNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        onNewExperiment={handleNewExperiment}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        {activeNavTab === 'workspace' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Mobile/Tablet sub-tab selection bar */}
            <div className="lg:hidden h-9 border-b border-border-custom bg-surface flex items-stretch select-none">
              {(['task', 'code', 'activity', 'results'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  type="button"
                  className={`flex-1 font-sans text-[10px] font-bold tracking-wider uppercase flex items-center justify-center border-b-2 transition-all focus:outline-none ${
                    mobileTab === tab
                      ? 'border-signal text-foreground bg-secondary-surface/20'
                      : 'border-transparent text-muted-text hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Desktop layout: shows three columns */}
              {/* Mobile layout: shows only the active sub-tab */}
              
              {/* Task Panel (22%) */}
              <div className={`${mobileTab === 'task' ? 'flex' : 'hidden'} lg:flex lg:w-[22%] shrink-0 min-h-0`}>
                <TaskPanel
                  tasks={mockTasks}
                  selectedTask={selectedTask}
                  onSelectTask={handleSelectTask}
                  maxAttempts={maxAttempts}
                  onChangeMaxAttempts={setMaxAttempts}
                  onRunAgent={runAgent}
                  isRunning={isRunning}
                />
              </div>

              {/* Code Workspace (50%) */}
              <div className={`${(mobileTab === 'code' || mobileTab === 'results') ? 'flex' : 'hidden'} lg:flex flex-1 min-h-0`}>
                <CodeWorkspace
                  attempt={currentAttempt}
                  status={status}
                  totalAttempts={attempts.length}
                  onSelectAttempt={setSelectedAttemptIdx}
                />
              </div>

              {/* Agent Activity Timeline (28%) */}
              <div className={`${mobileTab === 'activity' ? 'flex' : 'hidden'} lg:flex lg:w-[28%] shrink-0 min-h-0`}>
                <AgentActivity events={events} />
              </div>
            </div>

            {/* bottom metrics strip */}
            <MetricsStrip metrics={metrics} />
          </div>
        )}

        {activeNavTab === 'experiments' && <ExperimentsView />}

        {activeNavTab === 'benchmark' && <BenchmarkView />}
      </div>
    </div>
  );
}
