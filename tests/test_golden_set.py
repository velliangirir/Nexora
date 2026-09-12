"""Unit tests for Phase 3 Golden Evaluation Set verification."""

from pathlib import Path
import pandas as pd
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
UNLABELED_GOLDEN_PATH = PROJECT_ROOT / "evaluation" / "golden_set_unlabeled.csv"
GOLDEN_SET_PATH = PROJECT_ROOT / "evaluation" / "golden_set.csv"

# The 10 official taxonomy keys defined in report/intent_taxonomy.md + uncertain option
EXPECTED_TAXONOMY = {
    "flight_travel_disruption",
    "order_delivery_issue",
    "technical_hardware_software_bug",
    "billing_payment_dispute",
    "account_access_security",
    "service_outage_connectivity",
    "subscription_cancellation_refund",
    "product_inquiry_availability",
    "complaint_poor_service",
    "feedback_praise_resolution",
    "uncertain",
}

REQUIRED_COLUMNS = [
    "id",
    "tweet_id",
    "brand",
    "text",
    "conversation_id",
    "source_row_id",
]


def test_unlabeled_golden_set_exists_and_valid():
    """Verify that evaluation/golden_set_unlabeled.csv exists with exactly 200 candidates."""
    assert UNLABELED_GOLDEN_PATH.exists(), f"Unlabeled golden candidates missing at {UNLABELED_GOLDEN_PATH}"
    df = pd.read_csv(UNLABELED_GOLDEN_PATH)
    assert len(df) == 200, f"Expected 200 candidate examples, found {len(df)}"
    for col in REQUIRED_COLUMNS:
        assert col in df.columns, f"Required column '{col}' missing in unlabeled golden set"
    assert df["id"].is_unique, "Duplicate 'id' found in unlabeled golden set"
    assert df["tweet_id"].is_unique, "Duplicate 'tweet_id' found in unlabeled golden set"
    assert df["text"].isna().sum() == 0, "Null texts found in unlabeled golden set"


def test_golden_set_file_exists():
    """Verify that evaluation/golden_set.csv exists."""
    assert GOLDEN_SET_PATH.exists(), f"Golden set missing at {GOLDEN_SET_PATH}"
    assert GOLDEN_SET_PATH.is_file()
    assert GOLDEN_SET_PATH.stat().st_size > 0, "Golden set CSV is empty"


def test_golden_set_size_in_range():
    """Verify that dataset size is between 150 and 250 examples."""
    df = pd.read_csv(GOLDEN_SET_PATH)
    total_examples = len(df)
    assert 150 <= total_examples <= 250, (
        f"Golden set size {total_examples} is outside the required 150-250 range."
    )
    assert total_examples == 200, f"Expected 200 curated examples, found {total_examples}"


def test_annotated_labels_conform_to_taxonomy():
    """Verify that any populated intent labels belong to the valid taxonomy."""
    df = pd.read_csv(GOLDEN_SET_PATH)
    labeled = df[df["intent"].fillna("").astype(str).str.strip() != ""]
    if len(labeled) > 0:
        unique_labels = set(labeled["intent"].unique())
        unknown_labels = unique_labels - EXPECTED_TAXONOMY
        assert not unknown_labels, f"Unknown intent labels found: {unknown_labels}"

