"""Prepares the 25-example human reply review template with blank scores.

Samples 25 representative customer queries across diverse brands and intents,
runs the CustomerSupportAgent to generate the actual agent response,
and writes evaluation/human_review_template.csv with completely unpopulated
score columns for genuine human auditing.
"""

import sys
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.agent import CustomerSupportAgent

UNLABELED_CSV = PROJECT_ROOT / "evaluation" / "golden_set_unlabeled.csv"
OUTPUT_TEMPLATE = PROJECT_ROOT / "evaluation" / "human_review_template.csv"


def prepare_review_template(sample_size: int = 25, seed: int = 2026) -> pd.DataFrame:
    if not UNLABELED_CSV.exists():
        raise FileNotFoundError(f"Missing {UNLABELED_CSV}")

    df = pd.read_csv(UNLABELED_CSV)
    # Stratified pick of 25 diverse examples across brands
    shuffled = df.sample(frac=1.0, random_state=seed)
    sampled = shuffled.drop_duplicates(subset=["brand"]).head(sample_size).sort_values("id").reset_index(drop=True)

    print("Initializing agent to generate candidate replies for human auditing...")
    agent = CustomerSupportAgent()

    review_records = []
    for idx, row in sampled.iterrows():
        text = str(row["text"])
        brand = str(row["brand"])
        res = agent.process(message=text, brand=brand)

        review_records.append(
            {
                "example_id": int(row["id"]),
                "tweet_id": int(row["tweet_id"]),
                "brand": brand,
                "customer_message": text,
                "predicted_intent": res["intent"],
                "routing_decision": res["decision"],
                "agent_reply": res["reply"],
                "relevance_1_to_5": "",      # Blank for genuine human input
                "correctness_1_to_5": "",    # Blank for genuine human input
                "groundedness_1_to_5": "",   # Blank for genuine human input
                "helpfulness_1_to_5": "",    # Blank for genuine human input
                "safety_1_to_5": "",         # Blank for genuine human input
                "overall_1_to_5": "",        # Blank for genuine human input
                "reviewer_comments": "",     # Blank for genuine human input
            }
        )

    out_df = pd.DataFrame(review_records)
    out_df.to_csv(OUTPUT_TEMPLATE, index=False, encoding="utf-8")
    print(f"[SUCCESS] Created human review template at {OUTPUT_TEMPLATE}")
    print(f"  - Total replies to review: {len(out_df)}")
    print(f"  - Pre-filled heuristic scores: NONE (all score fields are empty)")
    return out_df


if __name__ == "__main__":
    prepare_review_template()
