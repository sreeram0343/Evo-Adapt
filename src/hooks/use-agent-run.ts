'use client';

import { useState } from 'react';
import { mockAttempts, mockMetrics } from '@/lib/mock-data';
import { Attempt, AgentStatus, Metrics } from '@/lib/types';

export function useAgentRun() {
  const [attempts, setAttempts] = useState<Attempt[]>(mockAttempts);
  const [selectedAttemptIdx, setSelectedAttemptIdx] = useState<number>(1); // default to Attempt 2 (index 1)
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const currentAttempt = attempts[selectedAttemptIdx] || attempts[attempts.length - 1];

  const handleSelectAttempt = (index: number) => {
    if (index >= 0 && index < attempts.length) {
      setSelectedAttemptIdx(index);
    }
  };

  const runAgent = () => {
    // Static placeholder for Milestone 1
    console.log('Run Agent triggered (simulation disabled for Milestone 1)');
  };

  // Compile all events across attempts for the timeline view
  const allEvents = attempts.flatMap((att) => att.events);

  // Compute status for editor view
  // If static, Attempt 1 is 'failed' and Attempt 2 is 'passed'
  const currentStatus: AgentStatus = currentAttempt.status === 'passed' ? 'passed' : 'failed';

  // Compute dynamic metrics
  const activeMetrics: Metrics = {
    ...mockMetrics,
    attempts: `0${attempts.length} / 03`,
    testsPassed: currentAttempt.status === 'passed' ? '05 / 05' : '03 / 05',
    status: currentAttempt.status === 'passed' ? 'PASSED' : 'FAILED'
  };

  return {
    attempts,
    currentAttempt,
    selectedAttemptIdx,
    setSelectedAttemptIdx: handleSelectAttempt,
    isRunning,
    runAgent,
    events: allEvents,
    status: currentStatus,
    metrics: activeMetrics
  };
}
