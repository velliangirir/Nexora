"""Data preprocessing and representative sampling pipeline for Customer Support on Twitter.

Provides efficient, streaming ingestion of data/raw/twcs.csv, safe text cleaning,
conversation thread reconstruction, and reproducible stratified sampling.

Outputs:
  - data/processed/twcs_sample.csv: Flat tabular dataset of sampled tweets
  - data/processed/conversations_sample.jsonl: Multi-turn dialogue structures
  - data/processed/sample_metadata.json: Summary metadata and distributions
"""

import argparse
import html
import json
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

# UTF-8 fix for Windows console output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

DEFAULT_RAW_PATH = Path(__file__).resolve().parent.parent / "data" / "raw" / "twcs.csv"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"


def clean_text(raw_text: str) -> str:
    """Safely cleans and normalizes tweet text without altering semantic meaning.

    Performs:
      1. HTML entity unescaping (e.g. &amp; -> &, &lt; -> <, &#39; -> ')
      2. Normalization of consecutive whitespace while preserving line breaks
      3. Stripping of redundant leading/trailing whitespace
    """
    if not isinstance(raw_text, str) or not raw_text:
        return ""
    
    # 1. Unescape HTML entities
    text = html.unescape(raw_text)
    
    # 2. Normalize horizontal whitespace (spaces, tabs)
    text = re.sub(r"[ \t]+", " ", text)
    
    # 3. Collapse multiple consecutive newlines to at most two
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    return text.strip()


def parse_timestamp(ts_str: str) -> str:
    """Parses a Twitter timestamp string to ISO-8601 format.

    Raw format: "Tue Oct 31 22:10:47 +0000 2017"
    Output format: "2017-10-31T22:10:47+00:00"
    """
    if not isinstance(ts_str, str) or not ts_str:
        return ""
    try:
        dt = datetime.strptime(ts_str.strip(), "%a %b %d %H:%M:%S %z %Y")
        return dt.isoformat()
    except (ValueError, TypeError):
        return ts_str.strip()


def reconstruct_conversations_from_df(
    df: pd.DataFrame,
    brand_set: Optional[set] = None,
) -> List[Dict[str, Any]]:
    """Reconstructs conversation threads from a DataFrame of tweets.

    Traces forward links from root tweets (in_response_to_tweet_id is NaN)
    through response_tweet_id chains.

    Args:
        df: DataFrame containing twcs columns.
        brand_set: Optional set of known brand handles.

    Returns:
        List of conversation dictionaries.
    """
    tweet_dict = df.set_index("tweet_id").to_dict("index")
    conversations: List[Dict[str, Any]] = []

    for tid, row in tweet_dict.items():
        # A conversation thread starts at a root tweet (no parent)
        if pd.isna(row.get("in_response_to_tweet_id")):
            root_text = str(row.get("text", ""))
            turns: List[Dict[str, Any]] = [
                {
                    "turn_index": 0,
                    "tweet_id": int(tid),
                    "author_id": str(row.get("author_id", "")),
                    "inbound": bool(row.get("inbound", False)),
                    "created_at": str(row.get("created_at", "")),
                    "created_at_iso": parse_timestamp(str(row.get("created_at", ""))),
                    "text": root_text,
                    "text_cleaned": clean_text(root_text),
                }
            ]

            curr = row
            while pd.notna(curr.get("response_tweet_id")):
                resps_raw = str(curr.get("response_tweet_id", "")).split(",")
                next_id = None
                for r in resps_raw:
                    r_clean = r.strip()
                    if r_clean.isdigit():
                        candidate_id = int(r_clean)
                        if candidate_id in tweet_dict:
                            next_id = candidate_id
                            break
                if next_id is not None:
                    curr = tweet_dict[next_id]
                    turn_text = str(curr.get("text", ""))
                    turns.append(
                        {
                            "turn_index": len(turns),
                            "tweet_id": next_id,
                            "author_id": str(curr.get("author_id", "")),
                            "inbound": bool(curr.get("inbound", False)),
                            "created_at": str(curr.get("created_at", "")),
                            "created_at_iso": parse_timestamp(str(curr.get("created_at", ""))),
                            "text": turn_text,
                            "text_cleaned": clean_text(turn_text),
                        }
                    )
                else:
                    break

            # Identify target brand
            target_brand = "unknown"
            for t in turns:
                if not t["inbound"]:
                    target_brand = t["author_id"]
                    break

            if target_brand == "unknown" and brand_set:
                # Try to find @brand mention in root text
                mentions = re.findall(r"@(\w+)", root_text)
                for m in mentions:
                    if m in brand_set:
                        target_brand = m
                        break

            ends_with_inbound = turns[-1]["inbound"] if turns else False
            has_response = len(turns) > 1

            conversations.append(
                {
                    "conversation_id": int(tid),
                    "brand": target_brand,
                    "num_turns": len(turns),
                    "has_response": has_response,
                    "ends_with_inbound": ends_with_inbound,
                    "root_inbound": turns[0]["inbound"] if turns else False,
                    "created_at": turns[0]["created_at"] if turns else "",
                    "created_at_iso": turns[0]["created_at_iso"] if turns else "",
                    "turns": turns,
                }
            )

    return conversations


def extract_representative_sample(
    raw_path: Path = DEFAULT_RAW_PATH,
    output_dir: Path = DEFAULT_OUTPUT_DIR,
    target_conversations: int = 10000,
    random_seed: int = 42,
    block_size_rows: int = 8000,
    num_blocks: int = 5,
) -> Tuple[pd.DataFrame, List[Dict[str, Any]], Dict[str, Any]]:
    """Extracts a balanced, reproducible representative sample from raw CSV.

    Uses evenly spaced file offsets to capture temporal and brand breadth,
    reconstructs full conversation threads, and stratifies across brands
    and conversation lengths.

    Never modifies raw CSV.
    """
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw dataset not found at {raw_path}")

    rng = np.random.default_rng(random_seed)
    
    # 1. Discover total rows and brand set efficiently
    total_rows = 2811774  # Known exact count verified in Phase 2
    offsets = [
        int(i * (total_rows - block_size_rows) / max(1, num_blocks - 1))
        for i in range(num_blocks)
    ]

    print(f"[Sampling] Ingesting {num_blocks} balanced blocks of {block_size_rows:,} rows across {raw_path.name}...")
    
    raw_chunks: List[pd.DataFrame] = []
    brand_set: set = set()

    for idx, offset in enumerate(offsets):
        skip = range(1, offset + 1) if offset > 0 else None
        chunk = pd.read_csv(
            raw_path,
            skiprows=skip,
            nrows=block_size_rows,
            dtype={
                "tweet_id": "int64",
                "author_id": "str",
                "inbound": "bool",
                "created_at": "str",
                "text": "str",
                "response_tweet_id": "str",
                "in_response_to_tweet_id": "float64",
            },
        )
        raw_chunks.append(chunk)
        outbound_brands = chunk[~chunk["inbound"]]["author_id"].dropna().unique()
        brand_set.update(outbound_brands)
        print(f"  Block {idx + 1}/{num_blocks} (offset {offset:,}): loaded {len(chunk):,} rows, {len(outbound_brands)} brands.")

    combined_df = pd.concat(raw_chunks, ignore_index=True)
    # Deduplicate in case overlapping offsets
    combined_df = combined_df.drop_duplicates(subset=["tweet_id"])
    print(f"[Reconstruction] Reconstructing conversation threads from {len(combined_df):,} tweets...")

    all_conversations = reconstruct_conversations_from_df(combined_df, brand_set=brand_set)
    print(f"[Reconstruction] Found {len(all_conversations):,} complete conversation threads.")

    # 2. Stratified Subsampling
    # Target distribution:
    # - Stratify by brand and turn-length categories (short: 2, medium: 3-4, long: 5+)
    # - Ensure inclusion of conversations ending in customer turns (unanswered / resolution feedback)
    if len(all_conversations) > target_conversations:
        # Group conversations by (brand, length_bucket)
        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for conv in all_conversations:
            b = conv["brand"]
            turns = conv["num_turns"]
            if turns <= 2:
                bucket = "short"
            elif turns <= 4:
                bucket = "medium"
            else:
                bucket = "long"
            key = f"{b}_{bucket}"
            grouped.setdefault(key, []).append(conv)

        # Sample proportionally across groups
        selected_conversations: List[Dict[str, Any]] = []
        keys = sorted(grouped.keys())
        # Shuffle within each group deterministically
        for k in keys:
            rng.shuffle(grouped[k])

        # Round-robin allocation until target is met
        idx = 0
        while len(selected_conversations) < target_conversations:
            added_in_round = False
            for k in keys:
                if grouped[k]:
                    selected_conversations.append(grouped[k].pop())
                    added_in_round = True
                    if len(selected_conversations) >= target_conversations:
                        break
            if not added_in_round:
                break
    else:
        selected_conversations = all_conversations

    # 3. Create flat DataFrame of sampled tweets with conversation metadata
    sample_rows = []
    for conv in selected_conversations:
        cid = conv["conversation_id"]
        brand = conv["brand"]
        for t in conv["turns"]:
            sample_rows.append(
                {
                    "tweet_id": t["tweet_id"],
                    "conversation_id": cid,
                    "turn_index": t["turn_index"],
                    "author_id": t["author_id"],
                    "inbound": t["inbound"],
                    "created_at": t["created_at"],
                    "created_at_iso": t["created_at_iso"],
                    "text": t["text"],
                    "text_cleaned": t["text_cleaned"],
                    "brand": brand,
                    "conversation_length": conv["num_turns"],
                    "has_response": conv["has_response"],
                    "ends_with_inbound": conv["ends_with_inbound"],
                }
            )

    sample_df = pd.DataFrame(sample_rows)

    # 4. Compute sample summary statistics
    brands_counter = Counter(c["brand"] for c in selected_conversations)
    lengths_counter = Counter(c["num_turns"] for c in selected_conversations)
    ends_inbound_count = sum(1 for c in selected_conversations if c["ends_with_inbound"])

    metadata = {
        "sampling_strategy": "multi_block_stratified_threads",
        "random_seed": random_seed,
        "total_conversations": len(selected_conversations),
        "total_tweets": len(sample_df),
        "unique_brands_count": len(brands_counter),
        "top_10_brands": [
            {"brand": b, "conversation_count": count}
            for b, count in brands_counter.most_common(10)
        ],
        "turn_length_distribution": dict(lengths_counter),
        "conversations_ending_with_inbound": ends_inbound_count,
        "conversations_ending_with_inbound_pct": round(
            ends_inbound_count / max(1, len(selected_conversations)) * 100, 2
        ),
        "output_files": {
            "csv": str(output_dir / "twcs_sample.csv"),
            "jsonl": str(output_dir / "conversations_sample.jsonl"),
            "metadata": str(output_dir / "sample_metadata.json"),
        },
    }

    # 5. Save outputs
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save CSV
    csv_path = output_dir / "twcs_sample.csv"
    sample_df.to_csv(csv_path, index=False, encoding="utf-8")
    
    # Save JSONL
    jsonl_path = output_dir / "conversations_sample.jsonl"
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for conv in selected_conversations:
            f.write(json.dumps(conv, ensure_ascii=False) + "\n")
            
    # Save Metadata
    meta_path = output_dir / "sample_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[SUCCESS] Sample generated successfully under {output_dir}")
    print(f"  - Total conversations: {metadata['total_conversations']:,}")
    print(f"  - Total tweets:        {metadata['total_tweets']:,}")
    print(f"  - Unique brands:       {metadata['unique_brands_count']}")
    print(f"  - CSV file size:       {csv_path.stat().st_size / (1024*1024):.2f} MB")
    print(f"  - JSONL file size:     {jsonl_path.stat().st_size / (1024*1024):.2f} MB")

    return sample_df, selected_conversations, metadata


def main():
    parser = argparse.ArgumentParser(description="TWCS Preprocessing & Sampling Pipeline")
    parser.add_argument("--raw", type=Path, default=DEFAULT_RAW_PATH, help="Path to raw twcs.csv")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Output directory")
    parser.add_argument("--samples", type=int, default=10000, help="Target number of conversations")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--block-size", type=int, default=8000, help="Rows per block")
    parser.add_argument("--num-blocks", type=int, default=5, help="Number of balanced blocks across file")

    args = parser.parse_args()
    extract_representative_sample(
        raw_path=args.raw,
        output_dir=args.output_dir,
        target_conversations=args.samples,
        random_seed=args.seed,
        block_size_rows=args.block_size,
        num_blocks=args.num_blocks,
    )


if __name__ == "__main__":
    main()
