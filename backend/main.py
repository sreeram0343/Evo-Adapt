from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid

from backend.config import settings
from backend.storage.database import engine, Base, get_db
from backend.storage.repositories import TaskRepository, ExperimentRepository, ExperienceRepository
from backend.api.schemas import (
    TaskCreate,
    TaskResponse,
    ExperimentResponse,
    ExperimentRunRequest,
    ExperienceSchema,
    MetricsSummaryResponse
)

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

@app.post("/api/tasks/run", response_model=ExperimentResponse)
def run_experiment(req: ExperimentRunRequest, db: Session = Depends(get_db)):
    db_task = TaskRepository.get_task(db, req.task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Placeholder implementation for Milestone 2 (No LLM calls or execution)
    exp_id = str(uuid.uuid4())
    import datetime
    exp_data = {
        "experiment_id": exp_id,
        "task_id": req.task_id,
        "mode": req.mode,
        "model": req.model,
        "prompt_versions": {"generator": "generator_v1"},
        "retrieved_experience_ids": [],
        "final_status": "passed",
        "total_latency": 0.5,
        "total_tokens": 100,
        "estimated_cost": 0.0002,
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    }
    
    db_exp = ExperimentRepository.create_experiment(db, exp_data)
    
    # Add an initial default attempt representing milestone mock response
    attempt_data = {
        "experiment_id": exp_id,
        "attempt_number": 1,
        "generated_code": "def placeholder(): pass",
        "execution_result": {
            "status": "PASS",
            "passed_count": 1,
            "failed_count": 0,
            "total_count": 1,
            "exit_code": 0,
            "duration_ms": 10.0,
            "timeout": False
        },
        "diagnosis": None,
        "repair_summary": None,
        "latency": 0.5,
        "token_usage": {"input": 50, "output": 50}
    }
    ExperimentRepository.add_attempt(db, attempt_data)
    
    # Reload experiment with relationships
    db.refresh(db_exp)
    return db_exp

@app.get("/api/experiments/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    db_exp = ExperimentRepository.get_experiment(db, experiment_id)
    if not db_exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return db_exp

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
