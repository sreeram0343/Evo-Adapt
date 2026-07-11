import os
import json
import pytest
from backend.llm.provider import MockProvider, MODEL_PRICING
from backend.llm.base import LLMResponse

def test_mock_provider_code_generation():
    provider = MockProvider("mock-model")
    
    # Prompt matching code generation
    user_prompt = "signature: def two_sum(nums: List[int], target: int) -> List[int]:\ndescription: Find two numbers."
    response = provider.generate(
        system_prompt="You are a developer.",
        user_prompt=user_prompt
    )
    
    assert isinstance(response, LLMResponse)
    assert response.model_name == "mock-model"
    assert "def two_sum" in response.content
    assert response.prompt_tokens > 0
    assert response.completion_tokens > 0
    assert response.latency_ms > 0
    assert response.cost_usd == 0.0

def test_mock_provider_diagnosis_json():
    provider = MockProvider("mock-model")
    
    # Prompt matching failure diagnosis
    user_prompt = "BUGGY CODE\nfailures test_case_03"
    response = provider.generate(
        system_prompt="Format your output as a single JSON object with affected_test.",
        user_prompt=user_prompt,
        response_format="json"
    )
    
    assert isinstance(response, LLMResponse)
    data = json.loads(response.content)
    assert data["category"] == "logic_error"
    assert data["affected_test"] == "test_case_03"
    assert "repair_strategy" in data

def test_mock_provider_distillation():
    provider = MockProvider("mock-model")
    
    user_prompt = "distill generalizable experience"
    response = provider.generate(
        system_prompt="Distill general lesson.",
        user_prompt=user_prompt,
        response_format="json"
    )
    
    data = json.loads(response.content)
    assert "principle" in data
    assert "trigger" in data
    assert "hashmap" in data["tags"]

def test_prompt_templates_exist():
    # Verify our prompt text files are in the right folder and readable
    prompts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")
    
    expected_files = ["generator_v1.txt", "diagnosis_v1.txt", "repair_v1.txt", "distillation_v1.txt"]
    for filename in expected_files:
        path = os.path.join(prompts_dir, filename)
        assert os.path.exists(path)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            assert len(content) > 0
            assert "{" in content  # contains templating brackets
