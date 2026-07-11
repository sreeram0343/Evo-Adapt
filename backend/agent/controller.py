import os
import json
import uuid
import time
import datetime
from sqlalchemy.orm import Session

from backend.agent.state import AgentState
from backend.llm.base import LLMProvider
from backend.executor.runner import run_execution
from backend.storage.repositories import TaskRepository, ExperimentRepository
from backend.storage.models import ExperimentModel
from backend.experience.retriever import retrieve_relevant_experiences
from backend.agent.experience_distiller import distill_experience
from backend.experience.repository import LessonRepository

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")

def load_prompt(filename: str) -> str:
    path = os.path.join(PROMPTS_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

class AgentController:
    def __init__(self, db: Session, provider: LLMProvider):
        self.db = db
        self.provider = provider
        self.state = AgentState.IDLE

    def run_task(
        self,
        task_id: str,
        mode: str = "recode",
        model: str = "gpt-4o",
        max_attempts: int = 3
    ) -> ExperimentModel:
        self.state = AgentState.IDLE
        task = TaskRepository.get_task(self.db, task_id)
        if not task:
            raise ValueError(f"Task with ID {task_id} not found")

        # 1. Retrieve Experience lessons
        self.state = AgentState.RETRIEVING_EXPERIENCE
        retrieved_lessons = ""
        retrieved_ids = []
        
        if mode == "recode":
            experiences = retrieve_relevant_experiences(
                db=self.db,
                description=task.description,
                constraints=task.constraints or [],
                tags=task.tags or []
            )
            if experiences:
                retrieved_ids = [exp.experience_id for exp in experiences]
                lessons_list = []
                for idx, exp in enumerate(experiences):
                    lessons_list.append(
                        f"Lesson {idx+1}:\n"
                        f"- Trigger: {exp.trigger}\n"
                        f"- Principle: {exp.principle}"
                    )
                retrieved_lessons = "\n\n".join(lessons_list)

        # 2. Build Context
        self.state = AgentState.BUILDING_CONTEXT
        generator_template = load_prompt("generator_v1.txt")
        constraints_str = "\n".join(task.constraints or [])
        
        user_prompt = generator_template.format(
            signature=task.function_signature,
            description=task.description,
            constraints=constraints_str or "None",
            retrieved_lessons=retrieved_lessons or "None"
        )

        # Create base experiment record
        experiment_id = str(uuid.uuid4())
        exp_data = {
            "experiment_id": experiment_id,
            "task_id": task_id,
            "mode": mode,
            "model": model,
            "prompt_versions": {
                "generator": "generator_v1",
                "diagnosis": "diagnosis_v1",
                "repair": "repair_v1",
                "distillation": "distillation_v1"
            },
            "retrieved_experience_ids": retrieved_ids,
            "final_status": "failed",
            "total_latency": 0.0,
            "total_tokens": 0,
            "estimated_cost": 0.0,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }
        db_exp = ExperimentRepository.create_experiment(self.db, exp_data)

        # 3. Generate initial candidate code
        self.state = AgentState.GENERATING
        start_gen = time.time()
        
        # If in baseline mode, we do not retrieve lessons
        gen_response = self.provider.generate(
            system_prompt="You are an expert Python software engineer.",
            user_prompt=user_prompt
        )
        gen_latency = (time.time() - start_gen) * 1000
        
        # Accumulate metrics
        db_exp.total_latency += gen_latency / 1000.0
        db_exp.total_tokens += gen_response.prompt_tokens + gen_response.completion_tokens
        db_exp.estimated_cost += gen_response.cost_usd

        code = gen_response.content
        # Remove potential markdown formatting tags
        if code.startswith("```python"):
            code = code[9:]
        if code.startswith("```"):
            code = code[3:]
        if code.endswith("```"):
            code = code[:-3]
        code = code.strip()

        attempt_number = 1
        previous_codes = []
        previous_failures = []

        # Start repair loop
        while attempt_number <= max_attempts:
            # 4. Execute Tests
            if attempt_number == 1:
                self.state = AgentState.EXECUTING
            else:
                self.state = AgentState.RE_EXECUTING

            start_exec = time.time()
            exec_result = run_execution(code, task.function_signature, task.tests)
            exec_latency = (time.time() - start_exec) * 1000

            # 5. Evaluate results
            self.state = AgentState.EVALUATING
            
            # Base attempt values
            attempt_data = {
                "experiment_id": experiment_id,
                "attempt_number": attempt_number,
                "generated_code": code,
                "execution_result": exec_result,
                "diagnosis": None,
                "repair_summary": None,
                "latency": (gen_latency if attempt_number == 1 else 0.0) + exec_latency,
                "token_usage": {
                    "input": gen_response.prompt_tokens if attempt_number == 1 else 0,
                    "output": gen_response.completion_tokens if attempt_number == 1 else 0
                }
            }

            if exec_result["status"] == "PASS":
                # Success!
                db_exp.final_status = "passed"
                ExperimentRepository.add_attempt(self.db, attempt_data)
                
                # 5a. Experience distillation (only if in recode mode and loop actually did a repair)
                if mode == "recode" and attempt_number > 1:
                    self.state = AgentState.DISTILLING_EXPERIENCE
                    # Get details of original failure (Attempt 1)
                    attempt_1 = db_exp.attempts[0] if len(db_exp.attempts) > 0 else None
                    
                    if attempt_1:
                        failed_code = attempt_1.generated_code
                        failed_logs = json.dumps(attempt_1.execution_result.get("failed_tests", []))
                        diagnosis = attempt_1.repair_summary or "Assertion failed during unit test run."
                        
                        lesson_data = distill_experience(
                            provider=self.provider,
                            task_id=task_id,
                            task_title=task.title,
                            task_description=task.description,
                            buggy_code=failed_code,
                            test_logs=failed_logs,
                            diagnosis=diagnosis,
                            repaired_code=code
                        )
                        
                        if lesson_data:
                            LessonRepository.create(self.db, lesson_data)
                            if retrieved_ids:
                                LessonRepository.increment_success_reuse(self.db, retrieved_ids)
                
                self.state = AgentState.SAVING
                self.db.commit()
                self.db.refresh(db_exp)
                return db_exp

            # Failure! Keep track of previous failures
            failure_sig = (exec_result.get("failure_type"), str(exec_result.get("failed_tests")))
            previous_failures.append(failure_sig)
            previous_codes.append(code)

            # Check termination criteria (if in baseline mode, we do NOT repair)
            if mode == "baseline" or attempt_number >= max_attempts:
                db_exp.final_status = "failed"
                ExperimentRepository.add_attempt(self.db, attempt_data)
                self.state = AgentState.SAVING
                self.db.commit()
                self.db.refresh(db_exp)
                return db_exp

            # 6. Diagnose failure (only if in recode mode and attempts remain)
            self.state = AgentState.DIAGNOSING
            diagnosis_template = load_prompt("diagnosis_v1.txt")
            
            # compile failed tests reports
            failed_tests_summary = json.dumps(exec_result["failed_tests"])
            
            diag_user_prompt = diagnosis_template.format(
                signature=task.function_signature,
                description=task.description,
                code=code,
                test_logs=failed_tests_summary
            )

            start_diag = time.time()
            diag_response = self.provider.generate(
                system_prompt="Format your output as a single JSON object containing affected_test.",
                user_prompt=diag_user_prompt,
                response_format="json"
            )
            diag_latency = (time.time() - start_diag) * 1000

            db_exp.total_latency += diag_latency / 1000.0
            db_exp.total_tokens += diag_response.prompt_tokens + diag_response.completion_tokens
            db_exp.estimated_cost += diag_response.cost_usd

            try:
                diagnosis_json = json.loads(diag_response.content)
            except ValueError:
                diagnosis_json = {
                    "category": "logic_error",
                    "affected_test": "unknown",
                    "root_cause_summary": "Failed to parse JSON diagnosis.",
                    "repair_strategy": "Review logic for edge cases.",
                    "confidence": 0.5
                }

            attempt_data["diagnosis"] = diagnosis_json
            repair_strategy = diagnosis_json.get("repair_strategy", "Review logic constraints.")

            # 7. Repair solutions
            self.state = AgentState.REPAIRING
            repair_template = load_prompt("repair_v1.txt")
            
            repair_user_prompt = repair_template.format(
                description=task.description,
                signature=task.function_signature,
                code=code,
                repair_strategy=repair_strategy,
                retrieved_lessons=retrieved_lessons or "None"
            )

            start_repair = time.time()
            repair_response = self.provider.generate(
                system_prompt="You are a software repair agent. Return only corrected code.",
                user_prompt=repair_user_prompt
            )
            repair_latency = (time.time() - start_repair) * 1000

            db_exp.total_latency += repair_latency / 1000.0
            db_exp.total_tokens += repair_response.prompt_tokens + repair_response.completion_tokens
            db_exp.estimated_cost += repair_response.cost_usd

            new_code = repair_response.content
            # Remove potential markdown wraps
            if new_code.startswith("```python"):
                new_code = new_code[9:]
            if new_code.startswith("```"):
                new_code = new_code[3:]
            if new_code.endswith("```"):
                new_code = new_code[:-3]
            new_code = new_code.strip()

            # Record attempt progress
            attempt_data["repair_summary"] = repair_strategy
            ExperimentRepository.add_attempt(self.db, attempt_data)
            
            # Check duplicate code or repeated failures check
            if new_code in previous_codes:
                # Loop termination: repeated code generated
                db_exp.final_status = "failed"
                self.state = AgentState.SAVING
                self.db.commit()
                self.db.refresh(db_exp)
                return db_exp

            # Advance loop
            code = new_code
            attempt_number += 1
            gen_latency = repair_latency
            gen_response = repair_response

        # Fallback termination
        db_exp.final_status = "failed"
        self.state = AgentState.SAVING
        self.db.commit()
        self.db.refresh(db_exp)
        return db_exp
