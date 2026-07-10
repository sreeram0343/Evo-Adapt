import { AgentStatus } from './types';

export interface AgentStep {
  status: AgentStatus;
  attemptNumber: number;
  code: string;
  testResults: Array<{ testName: string; status: 'PASS' | 'FAIL' | 'WAIT'; duration?: string; error?: string }>;
  feedback?: {
    type: string;
    expected: string;
    received: string;
    raw?: string;
  };
  events: Array<{
    id: string;
    attemptId: number;
    label: string;
    timestamp: string;
    type: 'info' | 'success' | 'failure' | 'active';
    description?: string;
  }>;
  metrics: {
    attempts: string;
    testsPassed: string;
    latency: string;
    tokens: number;
    cost: number;
    status: string;
  };
}

export const SIMULATION_STEPS: AgentStep[] = [
  {
    status: 'generating',
    attemptNumber: 1,
    code: ``,
    testResults: [
      { testName: 'test_case_01', status: 'WAIT' },
      { testName: 'test_case_02', status: 'WAIT' },
      { testName: 'test_case_03', status: 'WAIT' },
      { testName: 'test_case_04', status: 'WAIT' },
      { testName: 'test_case_05', status: 'WAIT' }
    ],
    feedback: undefined,
    events: [
      {
        id: 'evt-1',
        attemptId: 1,
        label: 'Initiating code generation',
        timestamp: '10:30:02',
        type: 'active',
        description: 'Analyzing problem statement and drafting template solution.'
      }
    ],
    metrics: {
      attempts: '01 / 03',
      testsPassed: '00 / 05',
      latency: '00:05',
      tokens: 450,
      cost: 0.0008,
      status: 'GENERATING'
    }
  },
  {
    status: 'executing',
    attemptNumber: 1,
    code: `def two_sum(nums: List[int], target: int) -> List[int]:
    # Inefficient lookup that fails on duplicate values
    for i in range(len(nums)):
        complement = target - nums[i]
        if complement in nums:
            return [i, nums.index(complement)]
    return []`,
    testResults: [
      { testName: 'test_case_01', status: 'WAIT' },
      { testName: 'test_case_02', status: 'WAIT' },
      { testName: 'test_case_03', status: 'WAIT' },
      { testName: 'test_case_04', status: 'WAIT' },
      { testName: 'test_case_05', status: 'WAIT' }
    ],
    feedback: undefined,
    events: [
      {
        id: 'evt-1',
        attemptId: 1,
        label: 'Generated solution',
        timestamp: '10:30:15',
        type: 'success',
        description: 'Synthesized initial solution using hash index heuristic.'
      },
      {
        id: 'evt-2',
        attemptId: 1,
        label: 'Tests executing',
        timestamp: '10:30:18',
        type: 'active',
        description: 'Running python test cases in sandboxed environment.'
      }
    ],
    metrics: {
      attempts: '01 / 03',
      testsPassed: '00 / 05',
      latency: '00:18',
      tokens: 880,
      cost: 0.0015,
      status: 'EXECUTING'
    }
  },
  {
    status: 'failed',
    attemptNumber: 1,
    code: `def two_sum(nums: List[int], target: int) -> List[int]:
    # Inefficient lookup that fails on duplicate values
    for i in range(len(nums)):
        complement = target - nums[i]
        if complement in nums:
            return [i, nums.index(complement)]
    return []`,
    testResults: [
      { testName: 'test_case_01', status: 'PASS', duration: '12ms' },
      { testName: 'test_case_02', status: 'PASS', duration: '8ms' },
      { testName: 'test_case_03', status: 'FAIL', duration: '9ms', error: 'AssertionError: Expected [0,1], Received [0,0]' },
      { testName: 'test_case_04', status: 'PASS', duration: '11ms' },
      { testName: 'test_case_05', status: 'FAIL', duration: '7ms', error: 'AssertionError: Expected [0,3], Received [0,0]' }
    ],
    feedback: {
      type: 'AssertionError',
      expected: '[0, 1]',
      received: '[0, 0]',
      raw: 'AssertionError: Expected [0, 1]\nReceived [0, 0]'
    },
    events: [
      {
        id: 'evt-1',
        attemptId: 1,
        label: 'Generated solution',
        timestamp: '10:30:15',
        type: 'success'
      },
      {
        id: 'evt-2',
        attemptId: 1,
        label: 'Tests executed',
        timestamp: '10:30:18',
        type: 'info'
      },
      {
        id: 'evt-3',
        attemptId: 1,
        label: '2 of 5 tests failed',
        timestamp: '10:30:18',
        type: 'failure',
        description: 'Assertion failed on target sum complement match.'
      }
    ],
    metrics: {
      attempts: '01 / 03',
      testsPassed: '03 / 05',
      latency: '00:20',
      tokens: 880,
      cost: 0.0015,
      status: 'FAILED'
    }
  },
  {
    status: 'diagnosing',
    attemptNumber: 1,
    code: `def two_sum(nums: List[int], target: int) -> List[int]:
    # Inefficient lookup that fails on duplicate values
    for i in range(len(nums)):
        complement = target - nums[i]
        if complement in nums:
            return [i, nums.index(complement)]
    return []`,
    testResults: [
      { testName: 'test_case_01', status: 'PASS', duration: '12ms' },
      { testName: 'test_case_02', status: 'PASS', duration: '8ms' },
      { testName: 'test_case_03', status: 'FAIL', duration: '9ms', error: 'AssertionError: Expected [0,1], Received [0,0]' },
      { testName: 'test_case_04', status: 'PASS', duration: '11ms' },
      { testName: 'test_case_05', status: 'FAIL', duration: '7ms', error: 'AssertionError: Expected [0,3], Received [0,0]' }
    ],
    feedback: {
      type: 'AssertionError',
      expected: '[0, 1]',
      received: '[0, 0]',
      raw: 'AssertionError: Expected [0, 1]\nReceived [0, 0]'
    },
    events: [
      {
        id: 'evt-1',
        attemptId: 1,
        label: 'Generated solution',
        timestamp: '10:30:15',
        type: 'success'
      },
      {
        id: 'evt-2',
        attemptId: 1,
        label: 'Tests executed',
        timestamp: '10:30:18',
        type: 'info'
      },
      {
        id: 'evt-3',
        attemptId: 1,
        label: '2 of 5 tests failed',
        timestamp: '10:30:18',
        type: 'failure'
      },
      {
        id: 'evt-4',
        attemptId: 1,
        label: 'Failure classified',
        timestamp: '10:30:20',
        type: 'active',
        description: 'Boundary condition issue: complement lookup selects current element.'
      }
    ],
    metrics: {
      attempts: '01 / 03',
      testsPassed: '03 / 05',
      latency: '00:25',
      tokens: 1024,
      cost: 0.0018,
      status: 'DIAGNOSING'
    }
  },
  {
    status: 'repairing',
    attemptNumber: 2,
    code: `def two_sum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    testResults: [
      { testName: 'test_case_01', status: 'WAIT' },
      { testName: 'test_case_02', status: 'WAIT' },
      { testName: 'test_case_03', status: 'WAIT' },
      { testName: 'test_case_04', status: 'WAIT' },
      { testName: 'test_case_05', status: 'WAIT' }
    ],
    feedback: undefined,
    events: [
      {
        id: 'evt-1',
        attemptId: 1,
        label: 'Generated solution',
        timestamp: '10:30:15',
        type: 'success'
      },
      {
        id: 'evt-2',
        attemptId: 1,
        label: 'Tests executed',
        timestamp: '10:30:18',
        type: 'info'
      },
      {
        id: 'evt-3',
        attemptId: 1,
        label: '2 of 5 tests failed',
        timestamp: '10:30:18',
        type: 'failure'
      },
      {
        id: 'evt-4',
        attemptId: 1,
        label: 'Failure classified',
        timestamp: '10:30:20',
        type: 'info',
        description: 'Boundary condition issue'
      },
      {
        id: 'evt-5',
        attemptId: 1,
        label: 'Repair strategy generated',
        timestamp: '10:30:23',
        type: 'info',
        description: 'Update complement lookup logic using dictionary hash caching.'
      },
      {
        id: 'evt-6',
        attemptId: 2,
        label: 'Patch generated',
        timestamp: '10:30:24',
        type: 'active',
        description: 'Applied complement lookup logic. Launching repair retest.'
      }
    ],
    metrics: {
      attempts: '02 / 03',
      testsPassed: '03 / 05',
      latency: '00:35',
      tokens: 1180,
      cost: 0.0020,
      status: 'REPAIRING'
    }
  },
  {
    status: 'passed',
    attemptNumber: 2,
    code: `def two_sum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    testResults: [
      { testName: 'test_case_01', status: 'PASS', duration: '4ms' },
      { testName: 'test_case_02', status: 'PASS', duration: '3ms' },
      { testName: 'test_case_03', status: 'PASS', duration: '3ms' },
      { testName: 'test_case_04', status: 'PASS', duration: '5ms' },
      { testName: 'test_case_05', status: 'PASS', duration: '4ms' }
    ],
    feedback: undefined,
    events: [
      {
        id: 'evt-1',
        attemptId: 1,
        label: 'Generated solution',
        timestamp: '10:30:15',
        type: 'success'
      },
      {
        id: 'evt-2',
        attemptId: 1,
        label: 'Tests executed',
        timestamp: '10:30:18',
        type: 'info'
      },
      {
        id: 'evt-3',
        attemptId: 1,
        label: '2 of 5 tests failed',
        timestamp: '10:30:18',
        type: 'failure'
      },
      {
        id: 'evt-4',
        attemptId: 1,
        label: 'Failure classified',
        timestamp: '10:30:20',
        type: 'info',
        description: 'Boundary condition issue'
      },
      {
        id: 'evt-5',
        attemptId: 1,
        label: 'Repair strategy generated',
        timestamp: '10:30:23',
        type: 'info',
        description: 'Update complement lookup logic'
      },
      {
        id: 'evt-6',
        attemptId: 2,
        label: 'Patch generated',
        timestamp: '10:30:24',
        type: 'success'
      },
      {
        id: 'evt-7',
        attemptId: 2,
        label: 'Tests running',
        timestamp: '10:30:26',
        type: 'info'
      },
      {
        id: 'evt-8',
        attemptId: 2,
        label: 'All tests passed',
        timestamp: '10:30:27',
        type: 'success',
        description: 'Self-repair successfully resolved all test cases.'
      }
    ],
    metrics: {
      attempts: '02 / 03',
      testsPassed: '05 / 05',
      latency: '00:43',
      tokens: 1256,
      cost: 0.0021,
      status: 'PASSED'
    }
  }
];
