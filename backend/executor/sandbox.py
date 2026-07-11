import re
import sys
import os
import json
import tempfile
import subprocess
import time
from typing import List, Dict, Any
from backend.executor.result_parser import parse_execution_error

def extract_function_name(signature: str) -> str:
    """
    Extracts the Python function name from a signature string.
    Example: 'def two_sum(nums: List[int], target: int) -> List[int]:' -> 'two_sum'
    """
    match = re.search(r"def\s+(\w+)\s*\(", signature)
    return match.group(1) if match else "solution"

def execute_code(code: str, signature: str, tests: List[Dict[str, Any]], timeout_seconds: float = 4.0) -> Dict[str, Any]:
    """
    Executes candidate code against a list of tests in an isolated subprocess.
    """
    func_name = extract_function_name(signature)
    
    # Template script that executes the tests and prints results as JSON
    script_template = f"""
import sys
import json
import time
import ast
import traceback
from typing import List, Dict, Any, Optional, Set, Tuple

# ListNode helpers for list problems
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def list_to_link(lst):
    if not lst: return None
    head = ListNode(lst[0])
    curr = head
    for v in lst[1:]:
        curr.next = ListNode(v)
        curr = curr.next
    return head

def link_to_list(head):
    lst = []
    curr = head
    while curr:
        lst.append(curr.val)
        curr = curr.next
    return lst

# Candidate solution:
{code}

# Test cases:
test_cases = {json.dumps(tests)}

results = {{
    "status": "PASS",
    "passed_count": 0,
    "failed_count": 0,
    "total_count": 0,
    "failed_tests": [],
    "stdout": "",
    "stderr": "",
    "exit_code": 0,
    "duration_ms": 0.0,
    "timeout": False,
    "failure_type": None
}}

start_time = time.perf_counter()
for tc in test_cases:
    results["total_count"] += 1
    tc_id = tc["id"]
    try:
        raw_input = tc["input"]
        # Safely parse input as Python literal tuple
        parsed_input = ast.literal_eval(f"({{raw_input}})")
        if not isinstance(parsed_input, tuple):
            parsed_input = (parsed_input,)
            
        expected = ast.literal_eval(tc["expected"])
        
        # Call function
        if "{func_name}" == "reverse_list":
            # ListNode custom conversion
            list_arg = parsed_input[0]
            link_arg = list_to_link(list_arg)
            res_link = reverse_list(link_arg)
            res = link_to_list(res_link)
        else:
            func = globals().get("{func_name}")
            if not func:
                raise NameError("Function '{func_name}' not defined in generated code")
            res = func(*parsed_input)
            
        if res == expected:
            results["passed_count"] += 1
        else:
            results["failed_count"] += 1
            results["status"] = "FAIL"
            results["failed_tests"].append({{
                "id": tc_id,
                "error": f"AssertionError: Expected {{expected}} but got {{res}}",
                "failure_type": "assertion_error"
            }})
    except Exception as e:
        results["failed_count"] += 1
        results["status"] = "FAIL"
        tb = traceback.format_exc()
        fail_type = "runtime_error"
        if isinstance(e, AssertionError):
            fail_type = "assertion_error"
        elif isinstance(e, NameError):
            fail_type = "name_error"
        elif isinstance(e, TypeError):
            fail_type = "type_error"
            
        results["failed_tests"].append({{
            "id": tc_id,
            "error": f"{{type(e).__name__}}: {{str(e)}}",
            "traceback": tb,
            "failure_type": fail_type
        }})

results["duration_ms"] = (time.perf_counter() - start_time) * 1000
print(json.dumps(results))
"""

    # Write code template to temp file
    fd, temp_path = tempfile.mkstemp(suffix=".py", text=True)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(script_template)
            
        # Run subprocess
        start_time = time.time()
        process = subprocess.Popen(
            [sys.executable, temp_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        try:
            stdout, stderr = process.communicate(timeout=timeout_seconds)
            duration_ms = (time.time() - start_time) * 1000
            exit_code = process.returncode
            timeout = False
        except subprocess.TimeoutExpired:
            process.kill()
            stdout, stderr = process.communicate()
            duration_ms = (time.time() - start_time) * 1000
            exit_code = -9
            timeout = True

        if timeout or exit_code != 0:
            return parse_execution_error(exit_code, stdout, stderr, duration_ms, timeout)
            
        try:
            # Parse the printed json results
            # We strip any trailing prints or whitespace
            json_start = stdout.find('{"status"')
            if json_start != -1:
                json_str = stdout[json_start:].strip()
                res = json.loads(json_str)
                res["stdout"] = stdout[:json_start].strip()
                res["stderr"] = stderr
                return res
            else:
                return parse_execution_error(exit_code, stdout, stderr, duration_ms, False)
        except Exception as e:
            return parse_execution_error(exit_code, stdout, stderr + f"\nJSON Parse Error: {str(e)}", duration_ms, False)
            
    finally:
        # Clean up temporary file
        try:
            os.remove(temp_path)
        except OSError:
            pass
