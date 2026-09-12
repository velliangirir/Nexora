"""Dataset verification and inspection script for Phase 1.

Checks for the presence of the Customer Support on Twitter dataset (twcs.csv)
in data/raw/ and prints summary metadata if available, without modifying raw data.
"""

from pathlib import Path
import sys

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
DATA_FILE = DATA_DIR / "twcs.csv"

def inspect_dataset() -> bool:
    print("=" * 60)
    print("Hiver AI Customer Support Agent - Dataset Checker")
    print("=" * 60)
    print(f"Target location: {DATA_FILE}")

    if not DATA_FILE.exists():
        print("\n[STATUS]: DATASET NOT FOUND LOCALLY")
        print("\nTo obtain the dataset:")
        print("1. Download 'Customer Support on Twitter' from Kaggle:")
        print("   https://www.kaggle.com/datasets/thoughtvector/customer-support-on-twitter")
        print("2. Extract the archive if zipped.")
        print(f"3. Place 'twcs.csv' at:")
        print(f"   {DATA_FILE}")
        print("=" * 60)
        return False

    file_size_mb = DATA_FILE.stat().st_size / (1024 * 1024)
    print("\n[STATUS]: DATASET FOUND LOCALLY")
    print(f"File size: {file_size_mb:.2f} MB")

    try:
        import pandas as pd
        # Read only top 5 rows to inspect schema without loading full file
        df_sample = pd.read_csv(DATA_FILE, nrows=5)
        print(f"\nColumns ({len(df_sample.columns)}): {list(df_sample.columns)}")
        print("\nSample Row 1:")
        for col, val in df_sample.iloc[0].items():
            print(f"  - {col}: {val}")
    except ImportError:
        print("\nNote: 'pandas' not yet installed. Install via 'pip install -r requirements.txt'")
        with open(DATA_FILE, "r", encoding="utf-8", errors="replace") as f:
            header = f.readline().strip()
            print(f"Header: {header}")

    print("\n" + "=" * 60)
    return True

if __name__ == "__main__":
    found = inspect_dataset()
    sys.exit(0 if found else 1)
