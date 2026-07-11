from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid
import datetime
from datetime import timedelta

from backend.config import settings
from backend.storage.database import engine, Base, get_db
from backend.storage.repositories import TaskRepository, ExperimentRepository, ExperienceRepository
from backend.api.schemas import (
    TaskCreate,
    TaskResponse,
    ExperimentResponse,
    ExperimentRunRequest,
    ExperienceSchema,
    MetricsSummaryResponse,
    TraceEventResponse
)
from backend.agent.controller import AgentController
from backend.llm.provider import MockProvider, OpenAIProvider, GeminiProvider

# Auto-create SQLite database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ReCode API",
    description="Backend API for ReCode Experience-Guided Code Repair Agent",
    version="0.1.0"
)

# Configure CORS for local Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def read_health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}

@app.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = TaskRepository.get_task(db, task.task_id)
    if db_task:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task ID already exists"
        )
    task_dict = task.model_dump()
    db_task = TaskRepository.create_task(db, task_dict)
    return db_task

@app.get("/api/tasks", response_model=List[TaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    return TaskRepository.list_tasks(db)

@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    db_task = TaskRepository.get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

def get_llm_provider(model: str):
    if model in ("mock", "mock-model"):
        return MockProvider()
    elif model.startswith("gpt"):
        if not settings.OPENAI_API_KEY:
            print("[Warning] OPENAI_API_KEY not found. Falling back to MockProvider.")
            return MockProvider(model_name=model)
        return OpenAIProvider(model_name=model)
    elif model.startswith("gemini"):
        if not settings.GEMINI_API_KEY:
            print("[Warning] GEMINI_API_KEY not found. Falling back to MockProvider.")
            return MockProvider(model_name=model)
        return GeminiProvider(model_name=model)
    return MockProvider(model_name=model)

@app.post("/api/tasks/run", response_model=ExperimentResponse)
def run_experiment(req: ExperimentRunRequest, db: Session = Depends(get_db)):
    db_task = TaskRepository.get_task(db, req.task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    provider = get_llm_provider(req.model)
    controller = AgentController(db, provider)
    try:
        max_att = req.max_attempts or db_task.max_attempts
        db_exp = controller.run_task(
            task_id=req.task_id,
            mode=req.mode,
            model=req.model,
            max_attempts=max_att
        )
        return db_exp
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent repair loop execution failed: {str(e)}"
        )


@app.get("/api/experiments/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    db_exp = ExperimentRepository.get_experiment(db, experiment_id)
    if not db_exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return db_exp

@app.get("/api/experiments/{experiment_id}/trace", response_model=List[TraceEventResponse])
def get_experiment_trace(experiment_id: str, db: Session = Depends(get_db)):
    db_exp = ExperimentRepository.get_experiment(db, experiment_id)
    if not db_exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    events = []
    base_time = db_exp.created_at or datetime.datetime.now(datetime.timezone.utc)
    event_idx = 1
    
    sorted_attempts = sorted(db_exp.attempts, key=lambda a: a.attempt_number)
    
    for att in sorted_attempts:
        att_num = att.attempt_number
        
        # 1. Generation Event
        t_gen = base_time + timedelta(seconds=(event_idx - 1) * 10)
        if att_num == 1:
            events.append({
                "id": f"evt-{event_idx}",
                "attemptId": att_num,
                "label": "Generated solution",
                "timestamp": t_gen.strftime("%H:%M:%S"),
                "type": "success",
                "description": "Synthesized initial solution using heuristic."
            })
        else:
            events.append({
                "id": f"evt-{event_idx}",
                "attemptId": att_num,
                "label": "Patch generated",
                "timestamp": t_gen.strftime("%H:%M:%S"),
                "type": "success",
                "description": att.repair_summary or "Applied repair patch."
            })
        event_idx += 1
        
        # 2. Execution Event
        t_exec = base_time + timedelta(seconds=(event_idx - 1) * 10)
        events.append({
            "id": f"evt-{event_idx}",
            "attemptId": att_num,
            "label": "Tests executing",
            "timestamp": t_exec.strftime("%H:%M:%S"),
            "type": "active",
            "description": "Running python tests in isolated process sandbox."
        })
        event_idx += 1
        
        t_exec_done = base_time + timedelta(seconds=(event_idx - 1) * 10)
        events.append({
            "id": f"evt-{event_idx}",
            "attemptId": att_num,
            "label": "Tests executed",
            "timestamp": t_exec_done.strftime("%H:%M:%S"),
            "type": "info"
        })
        event_idx += 1
        
        # 3. Test Outcome Event
        t_outcome = base_time + timedelta(seconds=(event_idx - 1) * 10)
        res = att.execution_result or {}
        status = res.get("status", "FAIL")
        
        if status == "PASS":
            events.append({
                "id": f"evt-{event_idx}",
                "attemptId": att_num,
                "label": "All tests passed",
                "timestamp": t_outcome.strftime("%H:%M:%S"),
                "type": "success",
                "description": "Self-repair successfully resolved all test cases."
            })
        elif status == "FAIL":
            passed = res.get("passed_count", 0)
            total = res.get("total_count", 0)
            events.append({
                "id": f"evt-{event_idx}",
                "attemptId": att_num,
                "label": f"{total - passed} of {total} tests failed",
                "timestamp": t_outcome.strftime("%H:%M:%S"),
                "type": "failure",
                "description": f"Failed assertion or error during evaluation."
            })
        else:
            events.append({
                "id": f"evt-{event_idx}",
                "attemptId": att_num,
                "label": "Execution error",
                "timestamp": t_outcome.strftime("%H:%M:%S"),
                "type": "failure",
                "description": res.get("failure_type", "Compilation/runtime error.")
            })
        event_idx += 1
        
        # 4. Diagnosis Events (only if diagnosis exists)
        if att.diagnosis:
            t_diag = base_time + timedelta(seconds=(event_idx - 1) * 10)
            events.append({
                "id": f"evt-{event_idx}",
                "attemptId": att_num,
                "label": "Failure classified",
                "timestamp": t_diag.strftime("%H:%M:%S"),
                "type": "active",
                "description": att.diagnosis.get("root_cause_summary")
            })
            event_idx += 1
            
            t_strategy = base_time + timedelta(seconds=(event_idx - 1) * 10)
            events.append({
                "id": f"evt-{event_idx}",
                "attemptId": att_num,
                "label": "Repair strategy generated",
                "timestamp": t_strategy.strftime("%H:%M:%S"),
                "type": "info",
                "description": att.diagnosis.get("repair_strategy")
            })
            event_idx += 1
            
    return events


@app.get("/api/experiments", response_model=List[ExperimentResponse])
def list_experiments(db: Session = Depends(get_db)):
    return ExperimentRepository.list_experiments(db)

@app.get("/api/experiences", response_model=List[ExperienceSchema])
def list_experiences(db: Session = Depends(get_db)):
    return ExperienceRepository.list_experiences(db)

@app.get("/api/metrics/summary", response_model=MetricsSummaryResponse)
def get_metrics_summary(db: Session = Depends(get_db)):
    experiments = ExperimentRepository.list_experiments(db)
    experiences = ExperienceRepository.list_experiences(db)
    
    total = len(experiments)
    passed_count = sum(1 for e in experiments if e.final_status == "passed")
    baseline_passed = sum(1 for e in experiments if e.mode == "baseline" and e.final_status == "passed")
    baseline_total = sum(1 for e in experiments if e.mode == "baseline")
    recode_passed = sum(1 for e in experiments if e.mode == "recode" and e.final_status == "passed")
    recode_total = sum(1 for e in experiments if e.mode == "recode")
    
    baseline_rate = (baseline_passed / baseline_total) if baseline_total > 0 else 0.0
    recode_rate = (recode_passed / recode_total) if recode_total > 0 else 0.0
    
    tokens = sum(e.total_tokens for e in experiments)
    cost = sum(e.estimated_cost for e in experiments)
    
    # Calculate avg attempts for recode mode
    recode_attempts_count = 0
    recode_experiments_with_attempts = 0
    for e in experiments:
        if e.mode == "recode":
            recode_attempts_count += len(e.attempts)
            recode_experiments_with_attempts += 1
    avg_attempts = (recode_attempts_count / recode_experiments_with_attempts) if recode_experiments_with_attempts > 0 else 0.0

    return {
        "total_experiments": total,
        "baseline_success_rate": baseline_rate,
        "recode_success_rate": recode_rate,
        "total_tokens_consumed": tokens,
        "total_cost_usd": cost,
        "recode_avg_attempts": avg_attempts,
        "experience_reuse_frequency": len(experiences)
    }
