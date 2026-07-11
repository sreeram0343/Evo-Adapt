import ast
from typing import List, Dict, Any
from backend.executor.sandbox import execute_code
from backend.executor.result_parser import parse_execution_error

def validate_python_code(code: str) -> bool:
    """
    Parses code with the AST module to verify it contains valid Python syntax.
    """
    try:
        ast.parse(code)
        return True
    except SyntaxError:
        return False

def run_execution(code: str, signature: str, tests: List[Dict[str, Any]], timeout_seconds: float = 4.0) -> Dict[str, Any]:
    """
    Validates python syntax and runs tests inside the sandbox.
    """
    # 1. Bypassing compilation if AST parse fails
    try:
        ast.parse(code)
    except SyntaxError as e:
        # Construct syntax error message similar to traceback
        error_msg = f"SyntaxError: {str(e)} at line {e.lineno}, offset {e.offset}"
        return parse_execution_error(
            exit_code=1,
            stdout="",
            stderr=error_msg,
            duration_ms=1.0,
            timeout=False
        )

    # 2. Run in isolated subprocess
    return execute_code(code, signature, tests, timeout_seconds)
