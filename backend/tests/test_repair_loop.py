import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.storage.database import Base
from backend.storage.repositories import TaskRepository, ExperimentRepository
from backend.llm.provider import MockProvider
from backend.agent.controller import AgentController
from backend.agent.state import AgentState

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def test_db():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Register a mock Two Sum task
        task_data = {
            "task_id": "two-sum",
            "title": "Two Sum",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            "constraints": ["O(n) time complexity"],
            "function_signature": "def two_sum(nums: List[int], target: int) -> List[int]:",
            "tests": [
                {"id": "01", "input": "[2,7,11,15], 9", "expected": "[0,1]"},
                {"id": "02", "input": "[3,2,4], 6", "expected": "[1,2]"},
                {"id": "03", "input": "[3,3], 6", "expected": "[0,1]"},
                {"id": "04", "input": "[1,5,3,7,8], 10", "expected": "[2,3]"},
                {"id": "05", "input": "[0,4,3,0], 0", "expected": "[0,3]"}
            ],
            "tags": ["array", "hashmap"],
            "difficulty": "Easy",
            "max_attempts": 3
        }
        TaskRepository.create_task(db, task_data)
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_recode_repair_loop_success(test_db):
    # Recode mode uses repair loop
    provider = MockProvider("mock-model")
    controller = AgentController(test_db, provider)
    
    experiment = controller.run_task(task_id="two-sum", mode="recode", max_attempts=3)
    
    assert experiment.final_status == "passed"
    assert len(experiment.attempts) == 2  # Attempt 1 failed, Attempt 2 passed
    assert experiment.attempts[0].attempt_number == 1
    assert experiment.attempts[0].execution_result["status"] == "FAIL"
    assert experiment.attempts[0].diagnosis is not None
    assert experiment.attempts[0].diagnosis["category"] == "logic_error"
    
    assert experiment.attempts[1].attempt_number == 2
    assert experiment.attempts[1].execution_result["status"] == "PASS"

def test_baseline_no_repair(test_db):
    # Baseline mode generated code once, runs tests, and terminates immediately
    provider = MockProvider("mock-model")
    controller = AgentController(test_db, provider)
    
    experiment = controller.run_task(task_id="two-sum", mode="baseline")
    
    assert experiment.final_status == "failed"
    assert len(experiment.attempts) == 1
    assert experiment.attempts[0].execution_result["status"] == "FAIL"

class DuplicateCodeProvider(MockProvider):
    # Provider that always returns the same buggy code
    def generate(self, system_prompt, user_prompt, response_format="text", temperature=0.0):
        res = super().generate(system_prompt, user_prompt, response_format, temperature)
        # Force same code response
        if "repair" in user_prompt.lower() or "buggy" in user_prompt.lower():
            res.content = (
                "def two_sum(nums: List[int], target: int) -> List[int]:\n"
                "    # Inefficient lookup that fails on duplicate values\n"
                "    for i in range(len(nums)):\n"
                "        complement = target - nums[i]\n"
                "        if complement in nums:\n"
                "            return [i, nums.index(complement)]\n"
                "    return []"
            )
        return res

def test_duplicate_code_detection(test_db):
    provider = DuplicateCodeProvider("mock-model")
    controller = AgentController(test_db, provider)
    
    experiment = controller.run_task(task_id="two-sum", mode="recode", max_attempts=3)
    
    # Terminates early before attempt 2 executes since attempt 2 code is a duplicate of attempt 1 code
    assert experiment.final_status == "failed"
    assert len(experiment.attempts) == 1
