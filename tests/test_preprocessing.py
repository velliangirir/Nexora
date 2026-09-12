"""Unit tests for Phase 2 data preprocessing and sampling pipeline."""

from pathlib import Path
import json
import pandas as pd
import pytest

from src.preprocessing import (
    clean_text,
    parse_timestamp,
    reconstruct_conversations_from_df,
    extract_representative_sample,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def test_clean_text_html_entities():
    """Verify that clean_text unescapes HTML entities properly."""
    raw = "Problems with orders &amp; shipments &lt;urgent&gt; &#39;please&#39; &quot;help&quot;"
    expected = "Problems with orders & shipments <urgent> 'please' \"help\""
    assert clean_text(raw) == expected


def test_clean_text_whitespace_and_newlines():
    """Verify that multiple spaces are collapsed and extreme newlines normalized."""
    raw = "   Hello    @AmazonHelp \t\t where is my package? \n\n\n\nThanks!   "
    expected = "Hello @AmazonHelp where is my package? \n\nThanks!"
    assert clean_text(raw) == expected


def test_clean_text_empty_and_none():
    """Verify that empty or non-string inputs are handled safely."""
    assert clean_text("") == ""
    assert clean_text(None) == ""


def test_parse_timestamp_valid():
    """Verify correct ISO-8601 formatting for Twitter timestamp format."""
    raw = "Tue Oct 31 22:10:47 +0000 2017"
    iso = parse_timestamp(raw)
    assert iso == "2017-10-31T22:10:47+00:00"


def test_parse_timestamp_invalid():
    """Verify fallback for invalid or empty timestamp strings."""
    assert parse_timestamp("invalid-date") == "invalid-date"
    assert parse_timestamp("") == ""


def test_reconstruct_conversations_synthetic():
    """Verify multi-turn thread reconstruction on synthetic conversation pairs."""
    data = [
        # Conversation 1: 2 turns (customer -> AppleSupport)
        {
            "tweet_id": 101,
            "author_id": "cust_1",
            "inbound": True,
            "created_at": "Tue Oct 31 20:00:00 +0000 2017",
            "text": "My iPhone battery died quickly @AppleSupport",
            "response_tweet_id": "102",
            "in_response_to_tweet_id": None,
        },
        {
            "tweet_id": 102,
            "author_id": "AppleSupport",
            "inbound": False,
            "created_at": "Tue Oct 31 20:05:00 +0000 2017",
            "text": "@cust_1 We are happy to help. Send us a DM.",
            "response_tweet_id": None,
            "in_response_to_tweet_id": 101.0,
        },
        # Conversation 2: 3 turns (customer -> AmazonHelp -> customer follow-up)
        {
            "tweet_id": 201,
            "author_id": "cust_2",
            "inbound": True,
            "created_at": "Tue Oct 31 21:00:00 +0000 2017",
            "text": "@AmazonHelp Where is order #123?",
            "response_tweet_id": "202",
            "in_response_to_tweet_id": None,
        },
        {
            "tweet_id": 202,
            "author_id": "AmazonHelp",
            "inbound": False,
            "created_at": "Tue Oct 31 21:10:00 +0000 2017",
            "text": "@cust_2 Please check your tracking link.",
            "response_tweet_id": "203",
            "in_response_to_tweet_id": 201.0,
        },
        {
            "tweet_id": 203,
            "author_id": "cust_2",
            "inbound": True,
            "created_at": "Tue Oct 31 21:15:00 +0000 2017",
            "text": "@AmazonHelp Link says delayed. Thanks.",
            "response_tweet_id": None,
            "in_response_to_tweet_id": 202.0,
        },
    ]

    df = pd.DataFrame(data)
    conversations = reconstruct_conversations_from_df(df, brand_set={"AppleSupport", "AmazonHelp"})

    assert len(conversations) == 2

    # Verify conversation 1
    c1 = next(c for c in conversations if c["conversation_id"] == 101)
    assert c1["brand"] == "AppleSupport"
    assert c1["num_turns"] == 2
    assert c1["has_response"] is True
    assert c1["ends_with_inbound"] is False

    # Verify conversation 2
    c2 = next(c for c in conversations if c["conversation_id"] == 201)
    assert c2["brand"] == "AmazonHelp"
    assert c2["num_turns"] == 3
    assert c2["has_response"] is True
    assert c2["ends_with_inbound"] is True  # Ends on customer follow-up


def test_sample_files_exist_and_valid():
    """Verify that processed sample files exist and contain valid structures."""
    processed_dir = PROJECT_ROOT / "data" / "processed"
    csv_path = processed_dir / "twcs_sample.csv"
    jsonl_path = processed_dir / "conversations_sample.jsonl"
    meta_path = processed_dir / "sample_metadata.json"

    assert csv_path.exists(), f"Sample CSV missing at {csv_path}"
    assert jsonl_path.exists(), f"Sample JSONL missing at {jsonl_path}"
    assert meta_path.exists(), f"Sample metadata missing at {meta_path}"

    # Verify metadata JSON
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert meta["total_conversations"] == 10000
    assert meta["total_tweets"] > 25000
    assert meta["unique_brands_count"] >= 90
    assert meta["random_seed"] == 42

    # Verify CSV schema
    df = pd.read_csv(csv_path, nrows=50)
    required_cols = [
        "tweet_id",
        "conversation_id",
        "turn_index",
        "author_id",
        "inbound",
        "created_at",
        "created_at_iso",
        "text",
        "text_cleaned",
        "brand",
        "conversation_length",
        "has_response",
        "ends_with_inbound",
    ]
    for col in required_cols:
        assert col in df.columns, f"Column {col} missing in twcs_sample.csv"

    # Verify JSONL structure
    with open(jsonl_path, "r", encoding="utf-8") as f:
        first_line = f.readline()
        conv = json.loads(first_line)
        assert "conversation_id" in conv
        assert "brand" in conv
        assert "num_turns" in conv
        assert "turns" in conv
        assert len(conv["turns"]) == conv["num_turns"]


def test_raw_dataset_immutable():
    """Verify that raw twcs.csv has not been modified or truncated."""
    raw_path = PROJECT_ROOT / "data" / "raw" / "twcs.csv"
    assert raw_path.exists()
    assert raw_path.stat().st_size == 516508641, "Raw dataset size changed! Raw data must remain immutable."
