'use client';

import React, { useState, useEffect } from 'react';
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
import { ApiClient } from '@/lib/api-client';

export default function Home() {
  const [activeNavTab, setActiveNavTab] = useState<string>('workspace');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(mockTasks[0]);
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
    metrics,
    apiMode,
    setApiMode
  } = useAgentRun();

  // Dynamically load tasks on mount or when API Mode is toggled
  useEffect(() => {
    async function loadTasks() {
      if (apiMode) {
        try {
          const apiTasks = await ApiClient.listTasks();
          if (apiTasks && apiTasks.length > 0) {
            setTasks(apiTasks);
            setSelectedTask(apiTasks[0]);
          }
        } catch (e) {
          console.error("Failed to load tasks from API, falling back to mocks:", e);
          setTasks(mockTasks);
          setSelectedTask(mockTasks[0]);
        }
      } else {
        setTasks(mockTasks);
        setSelectedTask(mockTasks[0]);
      }
    }
    loadTasks();
  }, [apiMode]);

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
        apiMode={apiMode}
        onToggleApiMode={setApiMode}
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
                  tasks={tasks}
                  selectedTask={selectedTask || mockTasks[0]}
                  onSelectTask={handleSelectTask}
                  maxAttempts={maxAttempts}
                  onChangeMaxAttempts={setMaxAttempts}
                  onRunAgent={() => selectedTask && runAgent(selectedTask.id, maxAttempts)}
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
