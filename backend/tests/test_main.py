import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app, get_db
from backend.storage.database import Base

from sqlalchemy.pool import StaticPool

# Setup in-memory database for unit testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_and_get_task():
    # Attempt to fetch non-existent task
    response = client.get("/api/tasks/task-abc")
    assert response.status_code == 404

    # Create task
    task_payload = {
        "task_id": "two-sum",
        "title": "Two Sum",
        "description": "Find indices of elements that sum up to target.",
        "constraints": ["O(n) time complexity"],
        "function_signature": "def two_sum(nums: List[int], target: int) -> List[int]:",
        "tests": [
            {"id": "t1", "input": "[2, 7, 11, 15], 9", "expected": "[0, 1]"}
        ],
        "tags": ["array", "hashmap"],
        "difficulty": "Easy",
        "max_attempts": 3
    }
    
    response = client.post("/api/tasks", json=task_payload)
    assert response.status_code == 201
    assert response.json()["task_id"] == "two-sum"

    # Fetch task and verify fields
    response = client.get("/api/tasks/two-sum")
    assert response.status_code == 200
    assert response.json()["title"] == "Two Sum"
    assert response.json()["max_attempts"] == 3

def test_list_tasks():
    # Insert multiple tasks
    task1 = {
        "task_id": "t1", "title": "T1", "description": "D1", "function_signature": "def t1():", "tests": [{"id": "1", "input": "", "expected": ""}]
    }
    task2 = {
        "task_id": "t2", "title": "T2", "description": "D2", "function_signature": "def t2():", "tests": [{"id": "1", "input": "", "expected": ""}]
    }
    client.post("/api/tasks", json=task1)
    client.post("/api/tasks", json=task2)

    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_run_experiment_placeholder():
    # Register task first
    task = {
        "task_id": "t1", "title": "T1", "description": "D1", "function_signature": "def t1():", "tests": [{"id": "1", "input": "", "expected": ""}]
    }
    client.post("/api/tasks", json=task)

    # Run placeholder experiment
    req_payload = {
        "task_id": "t1",
        "mode": "recode",
        "model": "gpt-4o"
    }
    response = client.post("/api/tasks/run", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["task_id"] == "t1"
    assert data["mode"] == "recode"
    assert len(data["attempts"]) == 2
    assert "def solution" in data["attempts"][0]["generated_code"]
