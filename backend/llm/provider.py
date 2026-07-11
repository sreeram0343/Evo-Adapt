import time
import json
import httpx
from typing import Dict, Any, Optional
from backend.llm.base import LLMProvider, LLMResponse
from backend.config import settings

# Centralized pricing mapping per 1,000,000 tokens
MODEL_PRICING = {
    "gpt-4o": {"input": 5.00, "output": 15.00},
    "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
    "gemini-1.5-pro": {"input": 1.25, "output": 3.75},
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
    "mock-model": {"input": 0.0, "output": 0.0}
}

class MockProvider(LLMProvider):
    def __init__(self, model_name: str = "mock-model"):
        self.model_name = model_name

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
        temperature: float = 0.0
    ) -> LLMResponse:
        start_time = time.time()
        time.sleep(0.1)  # Simulate small network lag

        content = ""
        # 1. Check if this is an initial code generation request
        if "signature" in user_prompt and "BUGGY CODE" not in user_prompt and "repaired" not in user_prompt:
            if "two_sum" in user_prompt:
                content = (
                    "def two_sum(nums: List[int], target: int) -> List[int]:\n"
                    "    # Inefficient lookup that fails on duplicate values\n"
                    "    for i in range(len(nums)):\n"
                    "        complement = target - nums[i]\n"
                    "        if complement in nums:\n"
                    "            return [i, nums.index(complement)]\n"
                    "    return []"
                )
            else:
                content = "def solution():\n    pass"

        # 2. Check if this is a diagnosis request
        elif "failures" in user_prompt or "BUGGY CODE" in user_prompt and "affected_test" in system_prompt:
            content = json.dumps({
                "category": "logic_error",
                "affected_test": "test_case_03",
                "root_cause_summary": "Current element is inserted into lookup state before complement validation.",
                "repair_strategy": "Check the complement in the lookup table 'seen' before mutating the table with the current element.",
                "confidence": 0.95
            })

        # 3. Check if this is a repair request
        elif "buggy" in user_prompt.lower() or "repair" in user_prompt.lower() or "Strategy" in user_prompt:
            if "two_sum" in user_prompt or "seen" in user_prompt or "repaired" in user_prompt or "complement" in user_prompt:
                content = (
                    "def two_sum(nums: List[int], target: int) -> List[int]:\n"
                    "    seen = {}\n"
                    "    for i, num in enumerate(nums):\n"
                    "        complement = target - num\n"
                    "        if complement in seen:\n"
                    "            return [seen[complement], i]\n"
                    "            seen[num] = i\n"
                    "    return []"
                )
            else:
                content = "def solution():\n    # repaired\n    pass"

        # 4. Check if this is a distillation request
        elif "distill" in user_prompt.lower() or "generalizable" in user_prompt.lower():
            content = json.dumps({
                "principle": "When mutable lookup state represents only previously processed elements, validate against the existing state before inserting the current element.",
                "trigger": "Sequential algorithm using mutable lookup state",
                "tags": ["hashmap", "state-ordering"],
                "confidence": 0.85
            })
        else:
            content = "Mock response content."

        # Structured response formats cleanup if requested
        if response_format == "json":
            try:
                # verify it is valid JSON
                json.loads(content)
            except ValueError:
                # default fallback
                content = json.dumps({"output": content})

        # Calculate mock token usage
        prompt_tokens = len(system_prompt.split()) + len(user_prompt.split()) + 50
        completion_tokens = len(content.split()) + 20
        latency_ms = (time.time() - start_time) * 1000

        return LLMResponse(
            content=content,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            cost_usd=0.0,
            model_name=self.model_name
        )

class OpenAIProvider(LLMProvider):
    def __init__(self, model_name: str = "gpt-4o", api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key or settings.OPENAI_API_KEY

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
        temperature: float = 0.0
    ) -> LLMResponse:
        if not self.api_key:
            raise ValueError("OpenAI API key is missing. Set OPENAI_API_KEY environment variable.")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature
        }

        if response_format == "json":
            payload["response_format"] = {"type": "json_object"}

        start_time = time.time()
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            )

        latency_ms = (time.time() - start_time) * 1000

        if response.status_code != 200:
            raise RuntimeError(f"OpenAI API call failed: {response.text}")

        res_json = response.json()
        content = res_json["choices"][0]["message"]["content"]
        
        usage = res_json.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)

        # Estimate cost
        pricing = MODEL_PRICING.get(self.model_name, {"input": 5.0, "output": 15.0})
        cost_usd = ((prompt_tokens * pricing["input"]) + (completion_tokens * pricing["output"])) / 1000000.0

        return LLMResponse(
            content=content,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            cost_usd=cost_usd,
            model_name=self.model_name
        )

class GeminiProvider(LLMProvider):
    def __init__(self, model_name: str = "gemini-1.5-flash", api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key or settings.GEMINI_API_KEY

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
        temperature: float = 0.0
    ) -> LLMResponse:
        if not self.api_key:
            raise ValueError("Gemini API key is missing. Set GEMINI_API_KEY environment variable.")

        # Using Gemini API OpenAI-compatible or standard API endpoint.
        # Since Gemini has an OpenAI compatibility endpoint, we can invoke it directly.
        # Endpoint: https://generativetoolkit.googleapis.com/v1beta/chat/completions or standard model path.
        # For simplicity, we make standard direct Gemini Developer API calls.
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

        headers = {
            "Content-Type": "application/json"
        }

        # Format prompt according to Gemini API payload requirements
        contents = [
            {
                "role": "user",
                "parts": [{"text": f"System Instruction:\n{system_prompt}\n\nUser Input:\n{user_prompt}"}]
            }
        ]

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature
            }
        }

        if response_format == "json":
            payload["generationConfig"]["responseMimeType"] = "application/json"

        start_time = time.time()
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, headers=headers, json=payload)

        latency_ms = (time.time() - start_time) * 1000

        if response.status_code != 200:
            raise RuntimeError(f"Gemini API call failed: {response.text}")

        res_json = response.json()
        try:
            content = res_json["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            raise RuntimeError(f"Unexpected Gemini API response structure: {res_json}")

        # Compute estimation of tokens (Gemini prompt content split or API values)
        usage_metadata = res_json.get("usageMetadata", {})
        prompt_tokens = usage_metadata.get("promptTokenCount", len(system_prompt.split()) + len(user_prompt.split()) + 50)
        completion_tokens = usage_metadata.get("candidatesTokenCount", len(content.split()) + 20)

        # Estimate cost
        pricing = MODEL_PRICING.get(self.model_name, {"input": 0.075, "output": 0.30})
        cost_usd = ((prompt_tokens * pricing["input"]) + (completion_tokens * pricing["output"])) / 1000000.0

        return LLMResponse(
            content=content,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            cost_usd=cost_usd,
            model_name=self.model_name
        )
