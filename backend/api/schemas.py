from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Test Case Schemas
class TestCaseSchema(BaseModel):
    id: str
    input: str
    expected: str

    model_config = {
        "from_attributes": True
    }

# Task Schemas
class TaskCreate(BaseModel):
    task_id: str
    title: str
    description: str
    constraints: Optional[List[str]] = None
    function_signature: str
    tests: List[TestCaseSchema]
    tags: Optional[List[str]] = None
    difficulty: Optional[str] = None
    max_attempts: Optional[int] = 3

class TaskResponse(BaseModel):
    task_id: str
    title: str
    description: str
    constraints: Optional[List[str]] = None
    function_signature: str
    tests: List[TestCaseSchema]
    tags: Optional[List[str]] = None
    difficulty: Optional[str] = None
    max_attempts: int

    model_config = {
        "from_attributes": True
    }

# Execution & Diagnosis Schemas
class ExecutionResultSchema(BaseModel):
    status: str  # "PASS", "FAIL", "ERROR"
    passed_count: int
    failed_count: int
    total_count: int
    failed_tests: Optional[List[Dict[str, Any]]] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    exit_code: int
    duration_ms: float
    timeout: bool
    failure_type: Optional[str] = None

class FailureDiagnosisSchema(BaseModel):
    category: str
    affected_test: str
    root_cause_summary: str
    repair_strategy: str
    confidence: float

# Attempt Schemas
class AttemptResponse(BaseModel):
    attempt_number: int
    generated_code: str
    execution_result: Optional[ExecutionResultSchema] = None
    diagnosis: Optional[FailureDiagnosisSchema] = None
    repair_summary: Optional[str] = None
    latency: float
    token_usage: Optional[Dict[str, int]] = None

    model_config = {
        "from_attributes": True
    }

# Experiment Schemas
class ExperimentRunRequest(BaseModel):
    task_id: str
    mode: str = "recode"  # "baseline" or "recode"
    model: str = "gpt-4o"
    max_attempts: Optional[int] = None

class ExperimentResponse(BaseModel):
    experiment_id: str
    task_id: str
    mode: str
    model: str
    prompt_versions: Optional[Dict[str, str]] = None
    retrieved_experience_ids: Optional[List[str]] = None
    attempts: List[AttemptResponse] = []
    final_status: str
    total_latency: float
    total_tokens: int
    estimated_cost: float
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# Experience / Lesson Schemas
class ExperienceSchema(BaseModel):
    experience_id: str
    trigger: str
    failure_pattern: str
    principle: str
    tags: Optional[List[str]] = None
    source_task_id: str
    confidence: float
    reuse_count: int
    successful_reuse_count: int

    model_config = {
        "from_attributes": True
    }

# Metrics Schemas
class MetricsSummaryResponse(BaseModel):
    total_experiments: int
    baseline_success_rate: float
    recode_success_rate: float
    total_tokens_consumed: int
    total_cost_usd: float
    recode_avg_attempts: float
    experience_reuse_frequency: int

class TraceEventResponse(BaseModel):
    id: str
    attemptId: int
    label: str
    timestamp: str
    type: str
    description: Optional[str] = None

