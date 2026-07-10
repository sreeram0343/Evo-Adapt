export type AgentStatus =
  | 'idle'
  | 'generating'
  | 'executing'
  | 'failed'
  | 'diagnosing'
  | 'repairing'
  | 'passed'
  | 'error';

export interface TestCase {
  id: string;
  input: string;
  expected: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  signature: string;
  testCases: TestCase[];
}

export interface ExecutionResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WAIT';
  duration?: string;
  error?: string;
}

export interface TraceEvent {
  id: string;
  attemptId: number;
  label: string;
  timestamp: string;
  type: 'info' | 'success' | 'failure' | 'active';
  description?: string;
}

export interface Attempt {
  number: number;
  maxAttempts: number;
  code: string;
  status: string;
  testResults: ExecutionResult[];
  feedback?: {
    type: string;
    expected: string;
    received: string;
    raw?: string;
  };
  events: TraceEvent[];
}

export interface Metrics {
  attempts: string;
  testsPassed: string;
  latency: string;
  tokens: number;
  cost: number;
  status: string;
}

export interface Experiment {
  id: string;
  name: string;
  date: string;
  successRate: string;
  avgLatency: string;
  costReduction: string;
  description: string;
}
