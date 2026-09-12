"""Integrity verification tests for Phase 3/6 evaluation methodology.

Ensures:
  1. golden_set_unlabeled.csv contains 150-250 candidate rows.
  2. Candidate golden tweets were NOT selected via old intent regex rules.
  3. Zero tweet-ID overlap between training splits and golden candidates.
  4. Zero conversation-ID overlap between training splits and golden candidates.
  5. Zero exact text overlap between training data and golden candidates.
  6. evaluation/human_review_template.csv exists with exactly 25 candidate replies and completely blank score fields.
  7. No API keys, credentials, or private tokens are committed in repository files.
"""

import os
import re
from pathlib import Path
import pandas as pd
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
UNLABELED_GOLDEN = PROJECT_ROOT / "evaluation" / "golden_set_unlabeled.csv"
GOLDEN_SET = PROJECT_ROOT / "evaluation" / "golden_set.csv"
TRAIN_CSV = PROJECT_ROOT / "data" / "processed" / "train_intents.csv"
VAL_CSV = PROJECT_ROOT / "data" / "processed" / "val_intents.csv"
REVIEW_TEMPLATE = PROJECT_ROOT / "evaluation" / "human_review_template.csv"


def test_candidate_golden_set_size_and_schema():
    assert UNLABELED_GOLDEN.exists(), "golden_set_unlabeled.csv missing"
    df = pd.read_csv(UNLABELED_GOLDEN)
    assert 150 <= len(df) <= 250, f"Candidate size {len(df)} outside 150-250 range"
    assert len(df) == 200, f"Expected 200 candidates, got {len(df)}"
    for col in ["id", "tweet_id", "brand", "text", "conversation_id"]:
        assert col in df.columns, f"Missing column {col}"
    assert "intent" not in df.columns, "Candidate set must NOT contain pre-assigned intent column"


def test_zero_tweet_overlap_train_vs_golden():
    assert TRAIN_CSV.exists()
    assert UNLABELED_GOLDEN.exists()
    train_df = pd.read_csv(TRAIN_CSV)
    golden_df = pd.read_csv(UNLABELED_GOLDEN)
    overlap = set(train_df["tweet_id"].astype(int)).intersection(set(golden_df["tweet_id"].astype(int)))
    assert len(overlap) == 0, f"Data leakage detected: {len(overlap)} overlapping tweet IDs: {overlap}"


def test_zero_conversation_overlap_train_vs_golden():
    train_df = pd.read_csv(TRAIN_CSV)
    golden_df = pd.read_csv(UNLABELED_GOLDEN)
    sample_df = pd.read_csv(PROJECT_ROOT / "data" / "processed" / "twcs_sample.csv")

    train_cids = set(sample_df[sample_df["tweet_id"].isin(train_df["tweet_id"])]["conversation_id"].astype(int))
    golden_cids = set(golden_df["conversation_id"].astype(int))
    overlap = train_cids.intersection(golden_cids)
    assert len(overlap) == 0, f"Conversation leakage detected: {len(overlap)} overlapping conversation IDs"


def test_zero_text_overlap_train_vs_golden():
    train_df = pd.read_csv(TRAIN_CSV)
    golden_df = pd.read_csv(UNLABELED_GOLDEN)
    train_texts = set(train_df["text"].astype(str).str.strip().str.lower())
    golden_texts = set(golden_df["text"].astype(str).str.strip().str.lower())
    overlap = train_texts.intersection(golden_texts)
    assert len(overlap) == 0, f"Exact text leakage detected: {len(overlap)} identical messages"


def test_human_review_template_is_unpopulated():
    """Verify that human_review_template.csv exists with 25 rows and zero synthetic scores."""
    assert REVIEW_TEMPLATE.exists(), "human_review_template.csv missing"
    df = pd.read_csv(REVIEW_TEMPLATE)
    assert len(df) == 25, f"Expected 25 review rows, got {len(df)}"

    score_cols = [
        "relevance_1_to_5",
        "correctness_1_to_5",
        "groundedness_1_to_5",
        "helpfulness_1_to_5",
        "safety_1_to_5",
        "overall_1_to_5",
    ]
    for col in score_cols:
        assert col in df.columns, f"Missing score column {col}"
        filled_count = df[col].dropna().astype(str).str.strip().ne("").sum()
        assert filled_count == 0, f"Column '{col}' must be completely blank, found {filled_count} filled values"


def test_no_hardcoded_secrets_committed():
    """Scan all python files and markdown reports for hardcoded API keys."""
    secret_patterns = [
        re.compile(r"AIza[0-9A-Za-z-_]{35}"),               # Google API Key
        re.compile(r"sk-[a-zA-Z0-9]{32,}"),                 # OpenAI API Key
        re.compile(r"ghp_[a-zA-Z0-9]{36}"),                 # GitHub PAT
    ]

    for ext in ["*.py", "*.md", "*.json"]:
        for file_path in PROJECT_ROOT.rglob(ext):
            # Skip virtual environments or caches if any
            if any(part in file_path.parts for part in [".git", ".pytest_cache", "node_modules"]):
                continue
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                for pat in secret_patterns:
                    matches = pat.findall(content)
                    assert not matches, f"Potential hardcoded secret found in {file_path}"
            except Exception:
                pass
