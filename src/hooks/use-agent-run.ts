'use client';

import { useState, useEffect, useRef } from 'react';
import { mockAttempts, mockMetrics } from '@/lib/mock-data';
import { Attempt, AgentStatus, Metrics, TraceEvent } from '@/lib/types';
import { SIMULATION_STEPS } from '@/lib/mock-agent';
import { ApiClient, mapAttempt } from '@/lib/api-client';

export function useAgentRun() {
  const [selectedAttemptIdx, setSelectedAttemptIdx] = useState<number>(1); // default to Attempt 2 (index 1)
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stepIdx, setStepIdx] = useState<number>(-1);

  // Dynamic API states
  const [apiMode, setApiMode] = useState<boolean>(false);
  const [apiAttempts, setApiAttempts] = useState<Attempt[]>([]);
  const [apiEvents, setApiEvents] = useState<TraceEvent[]>([]);
  const [apiStatus, setApiStatus] = useState<AgentStatus>('idle');
  const [apiMetrics, setApiMetrics] = useState<Metrics>({
    attempts: '00 / 03',
    testsPassed: '00 / 05',
    latency: '00:00',
    tokens: 0,
    cost: 0.0,
    status: 'IDLE'
  });

  const pollRef = useRef<any>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Playback timer effect for simulated (mock) mode
  useEffect(() => {
    if (apiMode || !isRunning || stepIdx === -1) return;

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
  }, [isRunning, stepIdx, apiMode]);

  const runAgent = async (taskId: string, maxAttempts: number = 3) => {
    if (isRunning) return;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!apiMode) {
      // 1. Simulated Mode Run
      setIsRunning(true);
      setStepIdx(0);
      setSelectedAttemptIdx(0);
    } else {
      // 2. Live API Mode Run
      setIsRunning(true);
      setSelectedAttemptIdx(0);
      setApiAttempts([]);
      setApiEvents([
        {
          id: 'evt-init',
          attemptId: 1,
          label: 'Initiating code generation',
          timestamp: new Date().toLocaleTimeString(),
          type: 'active',
          description: 'Sending task parameters to ReCode API server.'
        }
      ]);
      setApiStatus('generating');
      setApiMetrics({
        attempts: `01 / 0${maxAttempts}`,
        testsPassed: '00 / 05',
        latency: '00:01',
        tokens: 0,
        cost: 0.0,
        status: 'GENERATING'
      });

      try {
        const exp = await ApiClient.runExperiment(taskId, 'recode', 'mock-model');
        const expId = exp.experiment_id;

        // Poll experiment progress
        pollRef.current = setInterval(async () => {
          try {
            const currentExp = await ApiClient.getExperiment(expId);
            const traces = await ApiClient.getExperimentTrace(expId);

            const mappedAttempts = (currentExp.attempts || []).map((a: any) =>
              mapAttempt(a, maxAttempts)
            );

            setApiAttempts(mappedAttempts);
            setApiEvents(traces);
            
            const bStatus = currentExp.final_status;
            const currentStatus: AgentStatus = bStatus === 'passed' ? 'passed' : (bStatus === 'failed' ? 'failed' : 'executing');
            setApiStatus(currentStatus);
            setSelectedAttemptIdx(mappedAttempts.length - 1);

            setApiMetrics({
              attempts: `0${mappedAttempts.length} / 0${maxAttempts}`,
              testsPassed: bStatus === 'passed' ? '05 / 05' : '03 / 05',
              latency: `${Math.round(currentExp.total_latency)}s`,
              tokens: currentExp.total_tokens,
              cost: currentExp.estimated_cost,
              status: bStatus.toUpperCase()
            });

            if (bStatus === 'passed' || bStatus === 'failed' || bStatus === 'error') {
              setIsRunning(false);
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
            }
          } catch (err) {
            console.error('Error polling agent run:', err);
            setIsRunning(false);
            setApiStatus('error');
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }, 1500);

      } catch (err) {
        console.error('Failed to start agent run:', err);
        setIsRunning(false);
        setApiStatus('error');
      }
    }
  };

  const handleSelectAttempt = (index: number) => {
    const currentAttemptsLength = isSimulating ? activeAttempts.length : (apiMode ? apiAttempts.length : mockAttempts.length);
    if (index >= 0 && index < currentAttemptsLength) {
      setSelectedAttemptIdx(index);
    }
  };

  // Derive simulation states
  const isSimulating = stepIdx >= 0 && !apiMode;
  const currentStepData = isSimulating ? SIMULATION_STEPS[stepIdx] : null;

  // Dynamically assemble active attempts list based on current simulation step
  let activeAttempts: Attempt[] = mockAttempts;
  if (apiMode) {
    activeAttempts = apiAttempts;
  } else if (isSimulating && currentStepData) {
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

  const currentAttempt = activeAttempts[selectedAttemptIdx] || activeAttempts[activeAttempts.length - 1] || {
    number: 1,
    maxAttempts: 3,
    code: '',
    status: 'idle',
    testResults: [],
    events: []
  };

  const allEvents = apiMode
    ? apiEvents
    : (isSimulating && currentStepData
        ? currentStepData.events
        : activeAttempts.flatMap((att) => att.events));

  const currentStatus: AgentStatus = apiMode
    ? apiStatus
    : (isSimulating && currentStepData
        ? currentStepData.status
        : (currentAttempt.status === 'passed' ? 'passed' : 'failed'));

  const activeMetrics: Metrics = apiMode
    ? apiMetrics
    : (isSimulating && currentStepData
        ? currentStepData.metrics
        : {
            ...mockMetrics,
            attempts: `0${activeAttempts.length} / 03`,
            testsPassed: currentAttempt.status === 'passed' ? '05 / 05' : '03 / 05',
            status: currentAttempt.status === 'passed' ? 'PASSED' : 'FAILED'
          });

  return {
    attempts: activeAttempts,
    currentAttempt,
    selectedAttemptIdx,
    setSelectedAttemptIdx: handleSelectAttempt,
    isRunning,
    runAgent,
    events: allEvents,
    status: currentStatus,
    metrics: activeMetrics,
    apiMode,
    setApiMode
  };
}
