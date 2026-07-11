import pytest
from backend.executor.runner import run_execution

@pytest.fixture
def target_signature():
    return "def solve(x: int, y: int) -> int:"

@pytest.fixture
def target_tests():
    return [
        {"id": "t1", "input": "2, 3", "expected": "5"},
        {"id": "t2", "input": "10, 20", "expected": "30"}
    ]

def test_passing_code(target_signature, target_tests):
    code = "def solve(x, y):\n    return x + y\n"
    res = run_execution(code, target_signature, target_tests)
    
    assert res["status"] == "PASS"
    assert res["passed_count"] == 2
    assert res["total_count"] == 2
    assert res["exit_code"] == 0
    assert not res["timeout"]

def test_assertion_failure(target_signature, target_tests):
    # Fails t2 since 10 + 20 != 35
    code = "def solve(x, y):\n    if x == 10:\n        return 35\n    return x + y\n"
    res = run_execution(code, target_signature, target_tests)
    
    assert res["status"] == "FAIL"
    assert res["passed_count"] == 1
    assert res["failed_count"] == 1
    assert res["failed_tests"][0]["id"] == "t2"
    assert "AssertionError" in res["failed_tests"][0]["error"]

def test_syntax_error(target_signature, target_tests):
    # Missing colon or bad indent
    code = "def solve(x, y)\n    return x + y\n"
    res = run_execution(code, target_signature, target_tests)
    
    assert res["status"] == "ERROR"
    assert res["failure_type"] == "syntax_error"
    assert len(res["failed_tests"]) == 1

def test_runtime_exception(target_signature, target_tests):
    # Division by zero on t2 (y=20), passes on t1 (y=3)
    code = "def solve(x, y):\n    if y == 20:\n        return x // (y - 20)\n    return x + y\n"
    res = run_execution(code, target_signature, target_tests)
    
    assert res["status"] == "FAIL"
    assert res["failed_count"] == 1
    assert "ZeroDivisionError" in res["failed_tests"][0]["error"]

def test_infinite_loop_timeout(target_signature, target_tests):
    # Infinite while loop
    code = "def solve(x, y):\n    while True:\n        pass\n"
    res = run_execution(code, target_signature, target_tests, timeout_seconds=1.0)
    
    assert res["status"] == "ERROR"
    assert res["timeout"] is True
    assert res["failure_type"] == "timeout"
