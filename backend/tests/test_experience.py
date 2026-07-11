import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.storage.database import Base
from backend.storage.models import ExperienceModel
from backend.llm.provider import MockProvider
from backend.agent.experience_distiller import distill_experience
from backend.experience.retriever import retrieve_relevant_experiences
from backend.experience.repository import LessonRepository

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_distill_general_lesson_stored():
    provider = MockProvider("mock-model")
    
    lesson = distill_experience(
        provider=provider,
        task_id="two-sum",
        task_title="Two Sum",
        task_description="Find indices of two numbers adding up to target.",
        buggy_code="def two_sum(): pass",
        test_logs="AssertionError",
        diagnosis="Self-lookup",
        repaired_code="def two_sum(): ... # fixed"
    )
    
    assert lesson is not None
    assert "principle" in lesson
    assert "hashmap" in lesson["tags"]
    # Check that task-specific references are absent
    assert "two sum" not in lesson["principle"].lower()

class TaskSpecificProvider(MockProvider):
    def generate(self, system_prompt, user_prompt, response_format="text", temperature=0.0):
        import json
        res = super().generate(system_prompt, user_prompt, response_format, temperature)
        # Force a task-specific response mentioning the title "Two Sum"
        res.content = json.dumps({
            "principle": "For Two Sum, check the complement before inserting into the dictionary.",
            "trigger": "Sequential lookup in Two Sum",
            "tags": ["two-sum", "hashmap"],
            "confidence": 0.9
        })
        return res

def test_distill_task_specific_rejected():
    provider = TaskSpecificProvider("mock-model")
    
    # We pass task_title="Two Sum"
    lesson = distill_experience(
        provider=provider,
        task_id="two-sum",
        task_title="Two Sum",
        task_description="Find two numbers.",
        buggy_code="def two_sum(): pass",
        test_logs="AssertionError",
        diagnosis="Self-lookup",
        repaired_code="def two_sum(): ... # fixed"
    )
    
    # Must return None because it fails generalization and remains task-specific
    assert lesson is None

def test_retrieve_lessons_by_tags_and_keywords(db_session):
    # Register mock experiences
    exp1 = {
        "experience_id": "exp-hashmap",
        "trigger": "lookup state processing in loop",
        "failure_pattern": "Assertion failure due to index updates",
        "principle": "Validate state before inserting keys",
        "tags": ["hashmap", "array"],
        "source_task_id": "t-hash",
        "confidence": 0.85
    }
    exp2 = {
        "experience_id": "exp-linkedlist",
        "trigger": "pointer updates in list reversal",
        "failure_pattern": "cycle detection in link traversal",
        "principle": "Hold trailing references when updating links",
        "tags": ["linked-list"],
        "source_task_id": "t-link",
        "confidence": 0.90
    }
    
    LessonRepository.create(db_session, exp1)
    LessonRepository.create(db_session, exp2)
    
    # 1. Retrieve by tags
    matches = retrieve_relevant_experiences(
        db=db_session,
        description="Write a sequence validator.",
        constraints=[],
        tags=["linked-list"]
    )
    assert len(matches) == 1
    assert matches[0].experience_id == "exp-linkedlist"
    assert matches[0].reuse_count == 1

    # 2. Retrieve by keyword description overlap
    matches_kw = retrieve_relevant_experiences(
        db=db_session,
        description="Find lookup keys matching index in hashmap array.",
        constraints=[],
        tags=[]
    )
    assert len(matches_kw) == 1
    assert matches_kw[0].experience_id == "exp-hashmap"
    assert matches_kw[0].reuse_count == 1
