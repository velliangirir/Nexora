"""Samples a representative, regex-free 200-example candidate evaluation set for human annotation.

Criteria:
  - Exclusively inbound customer root messages (turn_index == 0)
  - Broad brand diversity (stratified across industries, capped at max 4 per brand)
  - Realistic text length (35 to 280 characters)
  - Deduplicated texts
  - Fixed reproducible seed
  - ZERO intent regular expressions or automated pseudo-labeling
"""

import sys
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SAMPLE_CSV = PROJECT_ROOT / "data" / "processed" / "twcs_sample.csv"
OUTPUT_CSV = PROJECT_ROOT / "evaluation" / "golden_set_unlabeled.csv"


def sample_unlabeled_golden_set(
    target_count: int = 200,
    random_seed: int = 2026,
    max_per_brand: int = 4,
    min_len: int = 35,
    max_len: int = 280,
) -> pd.DataFrame:
    if not SAMPLE_CSV.exists():
        raise FileNotFoundError(f"Missing sample at {SAMPLE_CSV}")

    df = pd.read_csv(SAMPLE_CSV)

    # 1. Filter root inbound customer queries
    roots = df[(df["inbound"] == True) & (df["turn_index"] == 0)].copy()

    # 2. Quality filters: text length and deduplication
    roots["text_len"] = roots["text_cleaned"].astype(str).str.len()
    candidates = roots[(roots["text_len"] >= min_len) & (roots["text_len"] <= max_len)].copy()
    candidates = candidates.drop_duplicates(subset=["text_cleaned"]).copy()

    # 3. Stratified brand sampling without any keyword or regex filtering
    brand_samples = []
    shuffled = candidates.sample(frac=1.0, random_state=random_seed)

    for brand, group in shuffled.groupby("brand", sort=False):
        brand_samples.append(group.head(max_per_brand))

    pool = pd.concat(brand_samples).sample(frac=1.0, random_state=random_seed)

    if len(pool) < target_count:
        remaining = candidates[~candidates["tweet_id"].isin(pool["tweet_id"])]
        additional = remaining.sample(n=target_count - len(pool), random_state=random_seed)
        final_df = pd.concat([pool, additional])
    else:
        final_df = pool.head(target_count)

    final_df = final_df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)

    # 4. Construct clean unlabeled schema
    unlabeled_records = []
    for idx, row in final_df.iterrows():
        unlabeled_records.append(
            {
                "id": idx + 1,
                "tweet_id": int(row["tweet_id"]),
                "brand": str(row["brand"]),
                "text": str(row["text_cleaned"]),
                "conversation_id": int(row["conversation_id"]),
                "source_row_id": int(row.get("Unnamed: 0", row.name)),
            }
        )

    out_df = pd.DataFrame(unlabeled_records)
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")

    print(f"[SUCCESS] Generated {len(out_df)} unlabeled candidate examples.")
    print(f"  - Brands represented: {out_df['brand'].nunique()}")
    print(f"  - Max examples per brand: {out_df['brand'].value_counts().max()}")
    print(f"  - Output file: {OUTPUT_CSV}")
    return out_df


if __name__ == "__main__":
    sample_unlabeled_golden_set()
