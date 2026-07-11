import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.storage.database import Base

class TaskModel(Base):
    __tablename__ = "tasks"

    task_id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    constraints = Column(JSON, nullable=True)  # List of strings
    function_signature = Column(String, nullable=False)
    tests = Column(JSON, nullable=False)  # List of dicts: {"id": str, "input": str, "expected": str}
    tags = Column(JSON, nullable=True)  # List of strings
    difficulty = Column(String, nullable=True)
    max_attempts = Column(Integer, default=3)

    experiments = relationship("ExperimentModel", back_populates="task", cascade="all, delete-orphan")

class ExperimentModel(Base):
    __tablename__ = "experiments"

    experiment_id = Column(String, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("tasks.task_id"), nullable=False)
    mode = Column(String, nullable=False)  # "baseline" or "recode"
    model = Column(String, nullable=False)
    prompt_versions = Column(JSON, nullable=True)  # Dict of versions
    retrieved_experience_ids = Column(JSON, nullable=True)  # List of strings
    final_status = Column(String, nullable=False)  # "passed", "failed", "error", etc.
    total_latency = Column(Float, default=0.0)
    total_tokens = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    task = relationship("TaskModel", back_populates="experiments")
    attempts = relationship("AttemptModel", back_populates="experiment", cascade="all, delete-orphan")

class AttemptModel(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String, ForeignKey("experiments.experiment_id"), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    generated_code = Column(Text, nullable=False)
    execution_result = Column(JSON, nullable=True)  # Structured ExecutionResult
    diagnosis = Column(JSON, nullable=True)  # Structured FailureDiagnosis
    repair_summary = Column(Text, nullable=True)
    latency = Column(Float, default=0.0)
    token_usage = Column(JSON, nullable=True)  # Dict: {"input": int, "output": int}

    experiment = relationship("ExperimentModel", back_populates="attempts")

class ExperienceModel(Base):
    __tablename__ = "experiences"

    experience_id = Column(String, primary_key=True, index=True)
    trigger = Column(Text, nullable=False)
    failure_pattern = Column(Text, nullable=False)
    principle = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)  # List of strings
    source_task_id = Column(String, nullable=False)
    confidence = Column(Float, default=1.0)
    reuse_count = Column(Integer, default=0)
    successful_reuse_count = Column(Integer, default=0)
