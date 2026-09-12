"""Unit tests for Phase 1 project setup and structure verification."""

from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent

def test_directory_structure_exists():
    """Verify that all required project directories exist."""
    required_dirs = [
        PROJECT_ROOT / "data" / "raw",
        PROJECT_ROOT / "data" / "processed",
        PROJECT_ROOT / "src",
        PROJECT_ROOT / "scripts",
        PROJECT_ROOT / "evaluation",
        PROJECT_ROOT / "tests",
        PROJECT_ROOT / "results",
        PROJECT_ROOT / "report",
    ]
    for directory in required_dirs:
        assert directory.exists(), f"Required directory missing: {directory}"
        assert directory.is_dir(), f"Expected directory but found file: {directory}"

def test_required_root_files_exist():
    """Verify that essential configuration and documentation files exist."""
    required_files = [
        PROJECT_ROOT / "README.md",
        PROJECT_ROOT / "requirements.txt",
        PROJECT_ROOT / ".gitignore",
        PROJECT_ROOT / "report" / "decision_log.md",
        PROJECT_ROOT / "report" / "project_plan.md",
        PROJECT_ROOT / "scripts" / "check_dataset.py",
        PROJECT_ROOT / "package.json",
    ]
    for file_path in required_files:
        assert file_path.exists(), f"Required file missing: {file_path}"
        assert file_path.is_file(), f"Expected file but found directory: {file_path}"
        assert file_path.stat().st_size > 0, f"File is empty: {file_path}"

def test_decision_log_contents():
    """Verify that the decision log exists and documents real Phase 1 decisions."""
    decision_log = PROJECT_ROOT / "report" / "decision_log.md"
    content = decision_log.read_text(encoding="utf-8")
    assert "Decision 1" in content
    assert "Decision" in content
    assert "Trade-offs" in content

def test_project_plan_structure():
    """Verify that the project plan outlines the expected 7 phases."""
    project_plan = PROJECT_ROOT / "report" / "project_plan.md"
    content = project_plan.read_text(encoding="utf-8")
    assert "Phase 1" in content
    assert "Phase 2" in content
    assert "Phase 3" in content
    assert "Phase 4" in content
    assert "Phase 5" in content
    assert "Phase 6" in content
    assert "Phase 7" in content

def test_gitignore_ignores_raw_data():
    """Verify that .gitignore excludes raw large dataset files from git."""
    gitignore = PROJECT_ROOT / ".gitignore"
    content = gitignore.read_text(encoding="utf-8")
    assert "data/raw/*.csv" in content
    assert "__pycache__" in content
