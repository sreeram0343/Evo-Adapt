import os
import json
import uuid
import re
from typing import Dict, Any, Optional
from backend.llm.base import LLMProvider
from backend.experience.retriever import STOP_WORDS

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")

def is_lesson_task_specific(lesson: Dict[str, Any], task_title: str) -> bool:
    """
    Validates if a distilled lesson mentions specific keywords from the task title,
    which represents a failure to generalize the experience.
    """
    # Clean task title into unique lowercase words
    title_words = set(re.findall(r"\b\w+\b", task_title.lower()))
    
    # Filter out generic algorithm keywords we allow in generalized principles
    generic_filter = {
        "list", "array", "string", "number", "sum", "solve", "reverse", "valid",
        "parentheses", "node", "linked", "index", "indices"
    }
    filtered_words = title_words - STOP_WORDS - generic_filter
    
    principle = lesson.get("principle", "").lower()
    trigger = lesson.get("trigger", "").lower()
    
    for word in filtered_words:
        if len(word) > 2 and (word in principle or word in trigger):
            return True
    return False

def distill_experience(
    provider: LLMProvider,
    task_id: str,
    task_title: str,
    task_description: str,
    buggy_code: str,
    test_logs: str,
    diagnosis: str,
    repaired_code: str
) -> Optional[Dict[str, Any]]:
    """
    Asks the LLM to analyze the trajectory and distill a reusable engineering lesson.
    Rejects task-specific descriptions.
    """
    path = os.path.join(PROMPTS_DIR, "distillation_v1.txt")
    with open(path, "r", encoding="utf-8") as f:
        template = f.read()

    user_prompt = template.format(
        description=task_description,
        buggy_code=buggy_code,
        test_logs=test_logs,
        diagnosis=diagnosis,
        repaired_code=repaired_code
    )

    response = provider.generate(
        system_prompt=(
            "You are an expert software engineer distilling generalizable experience. "
            "Do not output code-specific variable names or task titles in the output JSON fields."
        ),
        user_prompt=user_prompt,
        response_format="json"
    )

    try:
        lesson = json.loads(response.content)
    except ValueError:
        return None

    # Check for generalization failure
    if is_lesson_task_specific(lesson, task_title):
        # Rejection: the lesson is not abstract/generalizable enough
        return None

    # Format into Experience schema dict
    return {
        "experience_id": f"exp-dist-{str(uuid.uuid4())[:8]}",
        "trigger": lesson.get("trigger", "Algorithm loop processing lookup state"),
        "failure_pattern": f"Assertion failed due to incorrect state indexing or lookup update ordering",
        "principle": lesson.get("principle", ""),
        "tags": lesson.get("tags", []),
        "source_task_id": task_id,
        "confidence": float(lesson.get("confidence", 0.85)),
        "reuse_count": 0,
        "successful_reuse_count": 0
    }
