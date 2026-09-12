"""Unit tests for Phase 3 batch annotation workflow and server."""

import json
from pathlib import Path
import pandas as pd
import pytest

from evaluation import annotate_golden
from evaluation.annotate_golden import AnnotationStore, BatchAnnotationServerHandler, INTENTS

PROJECT_ROOT = Path(__file__).resolve().parent.parent
UNLABELED_PATH = PROJECT_ROOT / "evaluation" / "golden_set_unlabeled.csv"
GOLDEN_PATH = PROJECT_ROOT / "evaluation" / "golden_set.csv"


@pytest.fixture
def temp_store(tmp_path, monkeypatch):
    """Fixture that isolates AnnotationStore to a temporary golden CSV copy."""
    temp_golden = tmp_path / "golden_set_test.csv"
    # Copy current golden_set.csv to temporary location
    if GOLDEN_PATH.exists():
        temp_golden.write_bytes(GOLDEN_PATH.read_bytes())
    monkeypatch.setattr(annotate_golden, "GOLDEN_CSV", temp_golden)

    store = AnnotationStore()
    return store, temp_golden


def test_intents_taxonomy_has_11_intents():
    """Verify that INTENTS definition contains exactly the 11 official labels."""
    assert len(INTENTS) == 11
    keys = [item[3] for item in INTENTS]
    assert keys == ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "U"]
    expected_codes = [
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
    ]
    actual_codes = [item[0] for item in INTENTS]
    assert actual_codes == expected_codes


def test_batch_retrieval_and_sizes(temp_store):
    """Verify batch retrieval with different batch sizes: 10, 20, 25, 50."""
    store, _ = temp_store

    for size in [10, 20, 25, 50]:
        batch = store.get_batch(offset=0, limit=size)
        assert batch["total"] == 200
        assert batch["offset"] == 0
        assert batch["limit"] == size
        assert len(batch["items"]) == size

        # Check required fields in each item
        for item in batch["items"]:
            assert "id" in item
            assert "tweet_id" in item
            assert "brand" in item
            assert "text" in item
            assert "conversation_id" in item
            assert "intent" in item
            assert "turns" in item
            assert "notes" in item


def test_batch_pagination_offset(temp_store):
    """Verify offset pagination between consecutive batches."""
    store, _ = temp_store
    batch1 = store.get_batch(offset=0, limit=20)
    batch2 = store.get_batch(offset=20, limit=20)

    ids1 = [x["id"] for x in batch1["items"]]
    ids2 = [x["id"] for x in batch2["items"]]

    assert ids1 == list(range(1, 21))
    assert ids2 == list(range(21, 41))
    assert set(ids1).isdisjoint(set(ids2))


def test_save_batch_persists_labels(temp_store):
    """Verify saving a batch of labels updates golden CSV correctly and non-destructively."""
    store, temp_golden = temp_store

    # Label items 22 and 23 in batch
    batch_to_save = [
        {"id": 22, "intent": "service_outage_connectivity", "notes": "ISP queue full error"},
        {"id": 23, "intent": "product_inquiry_availability", "notes": "asking for extra cheese"},
    ]
    res = store.save_batch(batch_to_save)
    assert res["saved_count"] == 2

    # Verify reload
    reloaded_df = pd.read_csv(temp_golden)
    assert len(reloaded_df) == 200

    row22 = reloaded_df[reloaded_df["id"] == 22].iloc[0]
    row23 = reloaded_df[reloaded_df["id"] == 23].iloc[0]
    assert row22["intent"] == "service_outage_connectivity"
    assert row22["notes"] == "ISP queue full error"
    assert row23["intent"] == "product_inquiry_availability"
    assert row23["notes"] == "asking for extra cheese"

    # Verify previously annotated items (e.g., id=1) remain intact
    row1 = reloaded_df[reloaded_df["id"] == 1].iloc[0]
    assert row1["intent"] == "feedback_praise_resolution"


def test_unannotated_item_remains_incomplete(temp_store):
    """Verify that unselected items in a batch are not silently assigned labels."""
    store, temp_golden = temp_store

    # Attempt to save an item with empty intent
    store.save_batch([{"id": 50, "intent": "", "notes": ""}])

    reloaded_df = pd.read_csv(temp_golden)
    row50 = reloaded_df[reloaded_df["id"] == 50].iloc[0]
    # Should remain NaN or empty string
    assert pd.isna(row50["intent"]) or str(row50["intent"]).strip() == ""


def test_first_unannotated_offset(temp_store):
    """Verify calculation of first unannotated batch offset."""
    store, _ = temp_store
    # With 21 annotated items (ids 1..21), first unannotated is id 22 (index 21)
    # For batch_size 20: (21 // 20) * 20 = 20
    offset20 = store.get_first_unannotated_offset(batch_size=20)
    assert offset20 == 20

    # For batch_size 10: (21 // 10) * 10 = 20
    offset10 = store.get_first_unannotated_offset(batch_size=10)
    assert offset10 == 20

    # For batch_size 50: (21 // 50) * 50 = 0
    offset50 = store.get_first_unannotated_offset(batch_size=50)
    assert offset50 == 0


def test_web_ui_html_structure():
    """Verify that HTML template contains required elements: batch size selector, buttons, navigation."""
    from evaluation.annotate_golden import HTML_PAGE

    # Batch-size selector
    assert '<select id="batchSizeSelect"' in HTML_PAGE
    assert '<option value="10">10</option>' in HTML_PAGE
    assert '<option value="20" selected>20</option>' in HTML_PAGE
    assert '<option value="25">25</option>' in HTML_PAGE
    assert '<option value="50">50</option>' in HTML_PAGE

    # Navigation buttons
    assert "Previous Batch" in HTML_PAGE
    assert "Next Batch" in HTML_PAGE
    assert "Save Batch" in HTML_PAGE

    # Status badges and progress
    assert "Human annotated:" in HTML_PAGE
    assert "Batch" in HTML_PAGE
    assert "Incomplete" in HTML_PAGE
