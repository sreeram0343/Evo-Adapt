import re
from typing import Dict, Any, List

def parse_execution_error(exit_code: int, stdout: str, stderr: str, duration_ms: float, timeout: bool) -> Dict[str, Any]:
    """
    Parses a failed python subprocess run (non-zero exit code or timeout)
    and maps it to a structured ExecutionResult.
    """
    status = "ERROR"
    failure_type = "unknown_error"
    error_msg = stderr or stdout or "Unknown execution error"

    if timeout:
        failure_type = "timeout"
        error_msg = "Execution timed out (resource limit exceeded)"
    elif "SyntaxError" in error_msg or "IndentationError" in error_msg:
        failure_type = "syntax_error"
    elif "ImportError" in error_msg or "ModuleNotFoundError" in error_msg:
        failure_type = "import_error"
    elif "AssertionError" in error_msg:
        failure_type = "assertion_error"
        status = "FAIL"
    elif "NameError" in error_msg or "TypeError" in error_msg or "IndexError" in error_msg or "KeyError" in error_msg:
        failure_type = "runtime_error"

    return {
        "status": status,
        "passed_count": 0,
        "failed_count": 0,
        "total_count": 0,
        "failed_tests": [{"id": "compile_error", "error": error_msg}],
        "stdout": stdout,
        "stderr": stderr,
        "exit_code": exit_code,
        "duration_ms": duration_ms,
        "timeout": timeout,
        "failure_type": failure_type
    }
