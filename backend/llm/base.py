from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Dict, Any

class LLMResponse(BaseModel):
    content: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float
    cost_usd: float
    model_name: str

class LLMProvider(ABC):
    @abstractmethod
    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "text",
        temperature: float = 0.0
    ) -> LLMResponse:
        """
        Executes a call to the LLM and tracks latency, tokens, and pricing.
        response_format can be 'text' or 'json'.
        """
        pass
