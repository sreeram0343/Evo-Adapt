import { Task, Attempt, TraceEvent, Metrics, Experiment } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper to map backend Task schema to frontend Task interface
function mapTask(t: any): Task {
  return {
    id: t.task_id,
    title: t.title,
    description: t.description,
    signature: t.function_signature,
    testCases: (t.tests || []).map((tc: any) => ({
      id: tc.id,
      input: tc.input,
      expected: tc.expected
    }))
  };
}

// Helper to map backend Attempt schema to frontend Attempt interface
export function mapAttempt(a: any, maxAttempts: number = 3): Attempt {
  const execution = a.execution_result || {};
  
  // Compile mock results list to match testResults array
  const testResults: any[] = [];
  
  // We reconstruct test results. If passed, status is PASS, if failed, status is FAIL.
  const failedCount = execution.failed_count || 0;
  const passedCount = execution.passed_count || 0;
  const totalCount = execution.total_count || 0;

  // Let's create dummy passes for tests
  for (let i = 0; i < passedCount; i++) {
    testResults.push({ testName: `test_case_${String(i + 1).padStart(2, '0')}`, status: 'PASS', duration: '5ms' });
  }
  // Add failed tests
  const failedTests = execution.failed_tests || [];
  failedTests.forEach((f: any, idx: number) => {
    testResults.push({
      testName: f.id === 'compile_error' ? 'compiler' : `test_case_${String(passedCount + idx + 1).padStart(2, '0')}`,
      status: 'FAIL',
      error: f.error
    });
  });

  // If no tests executed yet, show waits
  if (totalCount === 0) {
    testResults.push({ testName: 'test_case_01', status: 'WAIT' });
  }

  return {
    number: a.attempt_number,
    maxAttempts: maxAttempts,
    code: a.generated_code,
    status: a.execution_result?.status?.toLowerCase() || 'idle',
    testResults,
    feedback: a.diagnosis ? {
      type: a.diagnosis.category,
      expected: '',
      received: '',
      raw: `${a.diagnosis.root_cause_summary}\n\nRepair Strategy: ${a.diagnosis.repair_strategy}`
    } : undefined,
    events: [] // Populated dynamically via the timeline endpoint
  };
}

export const ApiClient = {
  async listTasks(): Promise<Task[]> {
    const res = await fetch(`${API_BASE_URL}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    return data.map(mapTask);
  },

  async getTask(taskId: string): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    const data = await res.json();
    return mapTask(data);
  },

  async runExperiment(taskId: string, mode: string, model: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/tasks/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, mode, model })
    });
    if (!res.ok) throw new Error('Failed to start run');
    return res.json();
  },

  async getExperiment(experimentId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/experiments/${experimentId}`);
    if (!res.ok) throw new Error('Failed to fetch run progress');
    return res.json();
  },

  async getExperimentTrace(experimentId: string): Promise<TraceEvent[]> {
    const res = await fetch(`${API_BASE_URL}/experiments/${experimentId}/trace`);
    if (!res.ok) throw new Error('Failed to fetch run traces');
    return res.json();
  },

  async getMetricsSummary(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/metrics/summary`);
    if (!res.ok) throw new Error('Failed to fetch metrics summary');
    return res.json();
  },

  async listExperiences(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/experiences`);
    if (!res.ok) throw new Error('Failed to fetch lessons list');
    return res.json();
  }
};
