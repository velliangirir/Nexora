"""Command-line interface and interactive runner for the Customer Support Agent.

Usage examples:
  # Single query demo:
  python scripts/run_agent.py --text "My package was marked delivered but never arrived @AmazonHelp"

  # Batch query processing from CSV:
  python scripts/run_agent.py --csv evaluation/golden_set.csv --limit 5

  # JSON format output:
  python scripts/run_agent.py --text "I lost access to my account @AppleSupport" --json
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict

import pandas as pd

# Enforce UTF-8 console output for Windows CLI compatibility
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.agent import CustomerSupportAgent


def print_banner() -> None:
    print("=" * 80)
    print("           HIVER AI CUSTOMER SUPPORT AGENT - PIPELINE EXECUTION            ")
    print("=" * 80)


def print_agent_result(query: str, res: Dict[str, Any], index: int = 1) -> None:
    """Pretty prints structured agent output to terminal."""
    print(f"\n--- [MESSAGE #{index}] ---")
    print(f"Customer Input : {query}")
    print(f"Brand Detected : {res['metadata'].get('brand') or 'Generic'}")
    print("-" * 80)
    print(f"1. INTENT PREDICTION : {res['intent']} (Confidence: {res['confidence']:.2%})")
    print("-" * 80)
    print("2. HISTORICAL RETRIEVAL EVIDENCE:")
    examples = res.get("retrieved_examples", [])
    if not examples:
        print("   (No historical dialogue matched similarity threshold)")
    else:
        for idx, ex in enumerate(examples[:2], 1):
            print(f"   [{idx}] Similarity: {ex['similarity']:.4f} | Brand: @{ex['brand']} | ConvID: {ex['conversation_id']}")
            print(f"       Q: \"{ex['query'][:90]}...\"" if len(ex['query']) > 90 else f"       Q: \"{ex['query']}\"")
            print(f"       A: \"{ex['response'][:90]}...\"" if len(ex['response']) > 90 else f"       A: \"{ex['response']}\"")
    print("-" * 80)
    dec_color = "AUTO_HANDLE" if res["decision"] == "AUTO_HANDLE" else "ESCALATE_TO_HUMAN"
    print(f"3. ESCALATION ROUTING : [{dec_color}] (Risk Score: {res['metadata']['risk_score']:.2f})")
    print(f"   Routing Reason     : {res['escalation_reason']}")
    if res["metadata"].get("triggered_flags"):
        print(f"   Triggered Flags    : {res['metadata']['triggered_flags']}")
    print("-" * 80)
    print(f"4. FINAL AGENT REPLY ({res['metadata'].get('generation_mode')}):")
    print(f"   \"{res['reply']}\"")
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="Run the Hiver AI Customer Support Agent")
    parser.add_argument("--text", type=str, help="Single customer query to process")
    parser.add_argument("--csv", type=str, help="Path to CSV file containing test messages")
    parser.add_argument("--text-col", type=str, default="text_cleaned", help="Column name for message text in CSV")
    parser.add_argument("--brand", type=str, default=None, help="Explicit brand handle to scope assistance")
    parser.add_argument("--limit", type=int, default=5, help="Number of records to process from CSV")
    parser.add_argument("--json", action="store_true", help="Output raw JSON instead of formatted text")
    parser.add_argument("--output", type=str, default=None, help="Path to save output JSON results")

    args = parser.parse_args()

    if not args.text and not args.csv:
        print("Error: Please provide either --text 'customer message' or --csv path/to/file.csv")
        sys.exit(1)

    print("Initializing Customer Support Agent components...")
    agent = CustomerSupportAgent()
    print("Agent ready! Indexing and models loaded.\n")

    if args.text:
        res = agent.process(args.text, brand=args.brand)
        if args.json:
            print(json.dumps(res, indent=2, ensure_ascii=False))
        else:
            print_banner()
            print_agent_result(args.text, res)

        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump([res], f, indent=2, ensure_ascii=False)
            print(f"\nResult saved to: {args.output}")

    elif args.csv:
        csv_path = Path(args.csv)
        if not csv_path.exists():
            print(f"Error: CSV file not found: {csv_path}")
            sys.exit(1)

        df = pd.read_csv(csv_path)
        if args.text_col in df.columns:
            col = args.text_col
        elif "text" in df.columns:
            col = "text"
        elif "text_cleaned" in df.columns:
            col = "text_cleaned"
        else:
            col = df.columns[0]
        rows = df.head(args.limit).to_dict(orient="records")

        results = []
        if not args.json:
            print_banner()

        for idx, row in enumerate(rows, 1):
            text = str(row[col])
            brand_val = args.brand or row.get("brand") or agent.extract_brand_mention(text)
            res = agent.process(text, brand=brand_val)
            results.append({"input": text, **res})

            if not args.json:
                print_agent_result(text, res, index=idx)

        if args.json:
            print(json.dumps(results, indent=2, ensure_ascii=False))

        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"\nBatch processing complete! {len(results)} records saved to: {args.output}")


if __name__ == "__main__":
    main()
