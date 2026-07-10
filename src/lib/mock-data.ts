import { Task, Attempt, Metrics, Experiment } from './types';

export const mockTasks: Task[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    signature: 'def two_sum(nums: List[int], target: int) -> List[int]:',
    testCases: [
      { id: '01', input: '[2,7,11,15], 9', expected: '[0,1]' },
      { id: '02', input: '[3,2,4], 6', expected: '[1,2]' },
      { id: '03', input: '[3,3], 6', expected: '[0,1]' },
      { id: '04', input: '[1,5,3,7,8], 10', expected: '[2,3]' },
      { id: '05', input: '[0,4,3,0], 0', expected: '[0,3]' }
    ]
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    signature: 'def is_valid(s: str) -> bool:',
    testCases: [
      { id: '01', input: '"()"', expected: 'True' },
      { id: '02', input: '"()[]{}"', expected: 'True' },
      { id: '03', input: '"(]"', expected: 'False' },
      { id: '04', input: '"([)]"', expected: 'False' },
      { id: '05', input: '"{[]}"', expected: 'True' }
    ]
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    signature: 'def reverse_list(head: Optional[ListNode]) -> Optional[ListNode]:',
    testCases: [
      { id: '01', input: '[1,2,3,4,5]', expected: '[5,4,3,2,1]' },
      { id: '02', input: '[1,2]', expected: '[2,1]' },
      { id: '03', input: '[]', expected: '[]' }
    ]
  }
];

export const mockAttempts: Attempt[] = [
  {
    number: 1,
    maxAttempts: 3,
    code: `def two_sum(nums: List[int], target: int) -> List[int]:
    # Inefficient lookup that fails on duplicate values
    for i in range(len(nums)):
        complement = target - nums[i]
        if complement in nums:
            return [i, nums.index(complement)]
    return []`,
    status: 'failed',
    testResults: [
      { testName: 'test_case_01', status: 'PASS', duration: '12ms' },
      { testName: 'test_case_02', status: 'PASS', duration: '8ms' },
      { testName: 'test_case_03', status: 'FAIL', duration: '9ms', error: 'AssertionError: Expected [0, 1] but got [0, 0]' },
      { testName: 'test_case_04', status: 'PASS', duration: '11ms' },
      { testName: 'test_case_05', status: 'FAIL', duration: '7ms', error: 'AssertionError: Expected [0, 3] but got [0, 0]' }
    ],
    feedback: {
      type: 'AssertionError',
      expected: '[0, 1]',
      received: '[0, 0]',
      raw: 'AssertionError: Expected [0, 1] for nums=[3, 3], target=6, but received [0, 0] because of self-lookup.'
    },
    events: [
      {
        id: 'evt-1-1',
        attemptId: 1,
        label: 'Generated solution',
        timestamp: '10:30:15',
        type: 'success',
        description: 'Synthesized initial solution using hash index heuristic.'
      },
      {
        id: 'evt-1-2',
        attemptId: 1,
        label: 'Tests executed',
        timestamp: '10:30:18',
        type: 'info'
      },
      {
        id: 'evt-1-3',
        attemptId: 1,
        label: '2 of 5 tests failed',
        timestamp: '10:30:18',
        type: 'failure',
        description: 'Failed on duplicate items due to self-indexing.'
      },
      {
        id: 'evt-1-4',
        attemptId: 1,
        label: 'Failure classified',
        timestamp: '10:30:20',
        type: 'active',
        description: 'Boundary condition issue: complement lookup returns same index.'
      },
      {
        id: 'evt-1-5',
        attemptId: 1,
        label: 'Repair strategy generated',
        timestamp: '10:30:23',
        type: 'info',
        description: 'Update lookup to ignore current index.'
      }
    ]
  },
  {
    number: 2,
    maxAttempts: 3,
    code: `def two_sum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    status: 'passed',
    testResults: [
      { testName: 'test_case_01', status: 'PASS', duration: '4ms' },
      { testName: 'test_case_02', status: 'PASS', duration: '3ms' },
      { testName: 'test_case_03', status: 'PASS', duration: '3ms' },
      { testName: 'test_case_04', status: 'PASS', duration: '5ms' },
      { testName: 'test_case_05', status: 'PASS', duration: '4ms' }
    ],
    events: [
      {
        id: 'evt-2-1',
        attemptId: 2,
        label: 'Patch generated',
        timestamp: '10:30:24',
        type: 'success',
        description: 'Applied complement cache strategy.'
      },
      {
        id: 'evt-2-2',
        attemptId: 2,
        label: 'Tests running',
        timestamp: '10:30:26',
        type: 'active'
      },
      {
        id: 'evt-2-3',
        attemptId: 2,
        label: 'All tests passed',
        timestamp: '10:30:27',
        type: 'success',
        description: 'All 5 test cases successfully passed. Repair complete.'
      }
    ]
  }
];

export const mockMetrics: Metrics = {
  attempts: '02 / 03',
  testsPassed: '02 / 05',
  latency: '01:23',
  tokens: 1256,
  cost: 0.0021,
  status: 'RUNNING'
};

export const mockExperiments: Experiment[] = [
  {
    id: 'exp-1',
    name: 'LLaMA-3-Repair-Base',
    date: '2026-07-09',
    successRate: '78.4%',
    avgLatency: '1m 12s',
    costReduction: '+12%',
    description: 'Baseline run using vanilla LLaMA-3 with standard feedback templates.'
  },
  {
    id: 'exp-2',
    name: 'GPT-4o-Execution-Guided',
    date: '2026-07-10',
    successRate: '94.2%',
    avgLatency: '43s',
    costReduction: '+42%',
    description: 'Execution trace and traceback details added directly to context window for self-repair.'
  },
  {
    id: 'exp-3',
    name: 'Claude-3.5-Sonnet-Iterative',
    date: '2026-07-10',
    successRate: '96.8%',
    avgLatency: '38s',
    costReduction: '+55%',
    description: 'Multi-turn self-repair agent loop with compact symbolic test definitions.'
  }
];
