'use client';

import { useState, useEffect } from 'react';
import { mockAttempts, mockMetrics } from '@/lib/mock-data';
import { Attempt, AgentStatus, Metrics } from '@/lib/types';
import { SIMULATION_STEPS } from '@/lib/mock-agent';

export function useAgentRun() {
  const [selectedAttemptIdx, setSelectedAttemptIdx] = useState<number>(1); // default to Attempt 2 (index 1)
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stepIdx, setStepIdx] = useState<number>(-1);

  // Playback timer effect
  useEffect(() => {
    if (!isRunning || stepIdx === -1) return;

    const timer = setTimeout(() => {
      if (stepIdx < SIMULATION_STEPS.length - 1) {
        const nextStep = stepIdx + 1;
        setStepIdx(nextStep);
        
        // Auto-select corresponding attempt tab
        const nextStepData = SIMULATION_STEPS[nextStep];
        setSelectedAttemptIdx(nextStepData.attemptNumber - 1);
      } else {
        setIsRunning(false);
      }
    }, 2000); // 2 seconds per simulation phase

    return () => clearTimeout(timer);
  }, [isRunning, stepIdx]);

  const runAgent = () => {
    setIsRunning(true);
    setStepIdx(0);
    setSelectedAttemptIdx(0);
  };

  const handleSelectAttempt = (index: number) => {
    const currentAttemptsLength = isSimulating ? activeAttempts.length : mockAttempts.length;
    if (index >= 0 && index < currentAttemptsLength) {
      setSelectedAttemptIdx(index);
    }
  };

  // Derive simulation states
  const isSimulating = stepIdx >= 0;
  const currentStepData = isSimulating ? SIMULATION_STEPS[stepIdx] : null;

  // Dynamically assemble active attempts list based on current simulation step
  let activeAttempts: Attempt[] = mockAttempts;
  if (isSimulating && currentStepData) {
    if (currentStepData.attemptNumber === 1) {
      activeAttempts = [
        {
          number: 1,
          maxAttempts: 3,
          code: currentStepData.code,
          status: currentStepData.status,
          testResults: currentStepData.testResults,
          feedback: currentStepData.feedback,
          events: currentStepData.events
        }
      ];
    } else {
      // Step 3 (index 3) is the final phase of Attempt 1 (diagnosed/failed)
      const attempt1Final = SIMULATION_STEPS[3];
      activeAttempts = [
        {
          number: 1,
          maxAttempts: 3,
          code: attempt1Final.code,
          status: 'failed',
          testResults: attempt1Final.testResults,
          feedback: attempt1Final.feedback,
          events: attempt1Final.events
        },
        {
          number: 2,
          maxAttempts: 3,
          code: currentStepData.code,
          status: currentStepData.status,
          testResults: currentStepData.testResults,
          feedback: currentStepData.feedback,
          events: currentStepData.events.filter((e) => e.attemptId === 2)
        }
      ];
    }
  }

  const currentAttempt = activeAttempts[selectedAttemptIdx] || activeAttempts[activeAttempts.length - 1];

  const allEvents = isSimulating && currentStepData
    ? currentStepData.events
    : activeAttempts.flatMap((att) => att.events);

  const currentStatus: AgentStatus = isSimulating && currentStepData
    ? currentStepData.status
    : (currentAttempt.status === 'passed' ? 'passed' : 'failed');

  const activeMetrics: Metrics = isSimulating && currentStepData
    ? currentStepData.metrics
    : {
        ...mockMetrics,
        attempts: `0${activeAttempts.length} / 03`,
        testsPassed: currentAttempt.status === 'passed' ? '05 / 05' : '03 / 05',
        status: currentAttempt.status === 'passed' ? 'PASSED' : 'FAILED'
      };

  return {
    attempts: activeAttempts,
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
