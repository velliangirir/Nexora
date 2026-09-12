"""Comprehensive dataset analysis script for Customer Support on Twitter (twcs.csv).

Streams the dataset in chunks to compute exact statistics without loading the
entire 492 MB CSV into memory at once. Saves structured summary to results/dataset_statistics.json.
"""

import sys
import json
from pathlib import Path
from collections import Counter
from datetime import datetime
import pandas as pd

# Fix Windows console UTF-8 output if needed
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_PATH = PROJECT_ROOT / "data" / "raw" / "twcs.csv"
RESULTS_DIR = PROJECT_ROOT / "results"
RESULTS_FILE = RESULTS_DIR / "dataset_statistics.json"

def analyze_dataset(chunk_size: int = 250000) -> dict:
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(f"Raw dataset not found at {RAW_DATA_PATH}")

    file_size_bytes = RAW_DATA_PATH.stat().st_size
    file_size_mb = file_size_bytes / (1024 * 1024)

    total_rows = 0
    inbound_count = 0
    outbound_count = 0
    
    null_counts = Counter()
    column_dtypes = {}
    
    unique_authors = set()
    brand_authors = set()
    brand_tweet_counts = Counter()
    
    seen_tweet_ids = set()
    duplicate_tweet_ids = 0
    
    root_tweets_count = 0           # in_response_to_tweet_id is NaN
    root_inbound_count = 0         # root tweet and inbound == True (customer starter)
    root_outbound_count = 0        # root tweet and inbound == False (brand starter)
    
    has_response_count = 0         # response_tweet_id is not NaN
    no_response_count = 0          # response_tweet_id is NaN
    
    min_date = None
    max_date = None
    
    total_text_length = 0
    min_text_length = float('inf')
    max_text_length = 0
    empty_text_count = 0

    print(f"Streaming {RAW_DATA_PATH} in chunks of {chunk_size:,}...")
    
    chunk_idx = 0
    for chunk in pd.read_csv(
        RAW_DATA_PATH,
        chunksize=chunk_size,
        dtype={
            "tweet_id": "int64",
            "author_id": "str",
            "inbound": "bool",
            "created_at": "str",
            "text": "str",
            "response_tweet_id": "str",
            "in_response_to_tweet_id": "float64",
        }
    ):
        chunk_idx += 1
        num_rows = len(chunk)
        total_rows += num_rows
        
        if chunk_idx == 1:
            for col, dtype in chunk.dtypes.items():
                column_dtypes[col] = str(dtype)
                
        # Null counts
        for col in chunk.columns:
            null_counts[col] += int(chunk[col].isna().sum())
            
        # Inbound / Outbound
        inbound_mask = chunk["inbound"] == True
        outbound_mask = ~inbound_mask
        inbound_count += int(inbound_mask.sum())
        outbound_count += int(outbound_mask.sum())
        
        # Authors and brands
        authors = chunk["author_id"].dropna().tolist()
        unique_authors.update(authors)
        
        outbound_df = chunk[outbound_mask]
        outbound_brands = outbound_df["author_id"].tolist()
        brand_authors.update(outbound_brands)
        for b in outbound_brands:
            brand_tweet_counts[b] += 1
            
        # Duplicate tweet IDs
        for tid in chunk["tweet_id"]:
            if tid in seen_tweet_ids:
                duplicate_tweet_ids += 1
            else:
                seen_tweet_ids.add(tid)
                
        # Thread / root analysis
        no_parent_mask = chunk["in_response_to_tweet_id"].isna()
        root_tweets_count += int(no_parent_mask.sum())
        root_inbound_count += int((no_parent_mask & inbound_mask).sum())
        root_outbound_count += int((no_parent_mask & outbound_mask).sum())
        
        has_resp_mask = chunk["response_tweet_id"].notna()
        has_response_count += int(has_resp_mask.sum())
        no_response_count += int((~has_resp_mask).sum())
        
        # Text metrics
        text_lengths = chunk["text"].str.len()
        total_text_length += int(text_lengths.sum())
        min_text_length = min(min_text_length, int(text_lengths.min()))
        max_text_length = max(max_text_length, int(text_lengths.max()))
        empty_text_count += int((text_lengths == 0).sum())
        
        # Dates (inspecting sample per chunk to avoid parsing 2.8M datetimes individually)
        # Format in TWCS: "Tue Oct 31 22:10:47 +0000 2017"
        chunk_dates = pd.to_datetime(chunk["created_at"], format="%a %b %d %H:%M:%S %z %Y", errors="coerce")
        chunk_min = chunk_dates.min()
        chunk_max = chunk_dates.max()
        if min_date is None or chunk_min < min_date:
            min_date = chunk_min
        if max_date is None or chunk_max > max_date:
            max_date = chunk_max
            
        print(f"  Processed chunk {chunk_idx}: {total_rows:,} rows elapsed.")

    avg_text_length = total_text_length / total_rows if total_rows > 0 else 0
    customer_authors_count = len(unique_authors - brand_authors)
    
    top_20_brands = [
        {"brand": brand, "tweet_count": count}
        for brand, count in brand_tweet_counts.most_common(20)
    ]
    
    stats = {
        "file_metadata": {
            "file_path": str(RAW_DATA_PATH),
            "file_size_bytes": file_size_bytes,
            "file_size_mb": round(file_size_mb, 2),
            "total_rows": total_rows,
            "total_columns": len(column_dtypes),
            "columns": list(column_dtypes.keys()),
            "column_dtypes": column_dtypes,
        },
        "data_quality": {
            "null_counts": dict(null_counts),
            "duplicate_tweet_ids": duplicate_tweet_ids,
            "empty_text_count": empty_text_count,
            "min_text_length": min_text_length,
            "max_text_length": max_text_length,
            "avg_text_length": round(avg_text_length, 2),
        },
        "author_distribution": {
            "total_unique_authors": len(unique_authors),
            "unique_brand_accounts": len(brand_authors),
            "unique_customer_accounts": customer_authors_count,
            "top_20_brands": top_20_brands,
        },
        "message_distribution": {
            "inbound_messages": inbound_count,
            "inbound_percentage": round(inbound_count / total_rows * 100, 2),
            "outbound_messages": outbound_count,
            "outbound_percentage": round(outbound_count / total_rows * 100, 2),
        },
        "conversation_structure": {
            "root_tweets_total": root_tweets_count,
            "root_inbound_customer_starters": root_inbound_count,
            "root_outbound_brand_starters": root_outbound_count,
            "tweets_with_responses": has_response_count,
            "tweets_without_responses": no_response_count,
        },
        "temporal_range": {
            "earliest_timestamp": str(min_date),
            "latest_timestamp": str(max_date),
        }
    }
    
    # Save results
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
        
    print(f"\nSaved analysis results to {RESULTS_FILE}")
    print("\n" + "=" * 60)
    print("DATASET ANALYSIS SUMMARY")
    print("=" * 60)
    print(f"Total Rows:               {stats['file_metadata']['total_rows']:,}")
    print(f"File Size:                {stats['file_metadata']['file_size_mb']} MB")
    print(f"Inbound Tweets:           {stats['message_distribution']['inbound_messages']:,} ({stats['message_distribution']['inbound_percentage']}%)")
    print(f"Outbound Tweets:          {stats['message_distribution']['outbound_messages']:,} ({stats['message_distribution']['outbound_percentage']}%)")
    print(f"Unique Authors:           {stats['author_distribution']['total_unique_authors']:,}")
    print(f"  - Brands:               {stats['author_distribution']['unique_brand_accounts']}")
    print(f"  - Customers:            {stats['author_distribution']['unique_customer_accounts']:,}")
    print(f"Root Tweets:              {stats['conversation_structure']['root_tweets_total']:,}")
    print(f"  - Customer Starters:    {stats['conversation_structure']['root_inbound_customer_starters']:,}")
    print(f"  - Brand Starters:       {stats['conversation_structure']['root_outbound_brand_starters']:,}")
    print(f"Tweets with responses:    {stats['conversation_structure']['tweets_with_responses']:,}")
    print(f"Tweets without responses: {stats['conversation_structure']['tweets_without_responses']:,}")
    print(f"Date Range:               {stats['temporal_range']['earliest_timestamp']} to {stats['temporal_range']['latest_timestamp']}")
    print(f"Duplicates:               {stats['data_quality']['duplicate_tweet_ids']}")
    top_5_summary = ", ".join(f"{b['brand']} ({b['tweet_count']:,})" for b in top_20_brands[:5])
    print(f"Top 5 Brands:             {top_5_summary}")
    print("=" * 60)
    
    return stats

if __name__ == "__main__":
    analyze_dataset()
