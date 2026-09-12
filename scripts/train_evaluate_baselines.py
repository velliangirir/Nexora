"""Training and evaluation pipeline for Phase 4 baselines.

Extracts isolated non-golden training/validation splits, trains Baseline 1 (Majority Class)
and Baseline 2 (TF-IDF + Logistic Regression), evaluates them on the held-out
Golden Evaluation Set, and saves structured results under results/baselines/.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

import pandas as pd
from sklearn.model_selection import train_test_split

# Handle Windows console encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from baselines import (
    MajorityClassClassifier,
    TfidfLogisticRegressionClassifier,
    evaluate_intent_classifier,
)

SAMPLE_CSV = PROJECT_ROOT / "data" / "processed" / "twcs_sample.csv"
GOLDEN_CSV = PROJECT_ROOT / "evaluation" / "golden_set.csv"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
RESULTS_DIR = PROJECT_ROOT / "results" / "baselines"

TRAIN_CSV = PROCESSED_DIR / "train_intents.csv"
VAL_CSV = PROCESSED_DIR / "val_intents.csv"


def prepare_training_validation_splits(
    random_seed: int = 42,
    max_per_class: int = 150,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Extracts labeled non-golden training and validation sets.

    Strictly excludes all tweet IDs and conversation IDs present in the golden set
    to guarantee absolute zero data leakage.
    """
    if not SAMPLE_CSV.exists():
        raise FileNotFoundError(f"Processed sample missing at {SAMPLE_CSV}")

    exclude_tids: Set[int] = set()
    unlabeled_csv = PROJECT_ROOT / "evaluation" / "golden_set_unlabeled.csv"
    if unlabeled_csv.exists():
        un_df = pd.read_csv(unlabeled_csv)
        exclude_tids.update(set(un_df["tweet_id"].astype(int)))
    if GOLDEN_CSV.exists():
        golden_df = pd.read_csv(GOLDEN_CSV)
        exclude_tids.update(set(golden_df["tweet_id"].astype(int)))

    sample_df = pd.read_csv(SAMPLE_CSV)
    # Find all conversation IDs and texts associated with any excluded tweet
    exclude_conv_ids: Set[int] = set(
        sample_df[sample_df["tweet_id"].isin(exclude_tids)]["conversation_id"].astype(int)
    )
    exclude_texts: Set[str] = set(
        sample_df[sample_df["tweet_id"].isin(exclude_tids)]["text_cleaned"].astype(str)
    )

    # Strictly filter out golden tweets, parent conversations, and exact text duplicates
    clean_sample = sample_df[
        (~sample_df["tweet_id"].isin(exclude_tids))
        & (~sample_df["conversation_id"].isin(exclude_conv_ids))
        & (~sample_df["text_cleaned"].isin(exclude_texts))
    ].copy()

    # Consider only inbound customer tweets
    inbound = clean_sample[clean_sample["inbound"] == True].copy()

    intent_patterns = [
        (
            "flight_travel_disruption",
            (
                inbound["brand"].isin(["Delta", "AmericanAir", "British_Airways", "SouthwestAir", "VirginTrains", "GWRHelp", "AirAsiaSupport"])
                & inbound["text_cleaned"].str.contains(r"\b(flight|delay|delayed|tarmac|baggage|luggage|cancel|canceled|rebook|boarding|gate|airport|diverted|runway)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(thank you|thanks for helping)\b", case=False, regex=True)
            ),
        ),
        (
            "order_delivery_issue",
            (
                inbound["brand"].isin(["AmazonHelp", "Tesco", "sainsburys", "marksandspencer", "DoorDash_Help", "Postmates_Help", "Uber_Support", "UPSHelp", "ArgosHelpers", "AskeBay"])
                & inbound["text_cleaned"].str.contains(r"\b(delivery|driver|parcel|package|shipped|tracking|not delivered|missing.*item|delivered to wrong|courier|dispatch)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(cancel.*subscription|refund.*card)\b", case=False, regex=True)
            ),
        ),
        (
            "technical_hardware_software_bug",
            (
                inbound["brand"].isin(["AppleSupport", "SpotifyCares", "XboxSupport", "MicrosoftHelps", "NikeSupport", "AskPlayStation"])
                & inbound["text_cleaned"].str.contains(r"\b(ios|update|battery|crash|crashing|freezing|update broke|glitch|bug|headphone|sound|reboot|buttons|screen)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(password|account.*locked|refund)\b", case=False, regex=True)
            ),
        ),
        (
            "billing_payment_dispute",
            (
                inbound["text_cleaned"].str.contains(r"\b(charged|overcharged|cancellation fee|promo code|double charge|undercharged|fare|pricing|unauthorized charge|extra fee)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(cancel my subscription|return.*item|flight.*delayed)\b", case=False, regex=True)
                & ~inbound["brand"].isin(["Delta", "British_Airways"])
            ),
        ),
        (
            "account_access_security",
            (
                inbound["text_cleaned"].str.contains(r"\b(password|locked out|2fa|verification code|reset.*password|hacked|apple id|activate.*phone|activation|cant log in|sign in)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(internet down|wifi|battery)\b", case=False, regex=True)
            ),
        ),
        (
            "service_outage_connectivity",
            (
                inbound["brand"].isin(["Ask_Spectrum", "comcastcares", "CoxHelp", "sprintcare", "TMobileHelp", "O2", "ATT"])
                & inbound["text_cleaned"].str.contains(r"\b(internet.*down|outage|no signal|cell service|broadband|wifi.*down|no internet|router|signal down|offline)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(password|bill|phone.*shipped)\b", case=False, regex=True)
            ),
        ),
        (
            "subscription_cancellation_refund",
            (
                inbound["text_cleaned"].str.contains(r"\b(cancel.*subscription|cancel my order|want a refund|process my refund|cancel.*premium|return.*item|get a refund|refund.*money)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(flight.*delayed|internet down|cancellation fee)\b", case=False, regex=True)
            ),
        ),
        (
            "product_inquiry_availability",
            (
                inbound["text_cleaned"].str.contains(r"\b(in stock|out of stock|store hours|closing time|open today|what time.*close|available in store|release date|when will.*be back|sell.*product|do you sell|do you have.*in stock)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(crash|wifi|refund|password|my order|received my order|delivery note|service.*in.*working)\b", case=False, regex=True)
            ),
        ),
        (
            "complaint_poor_service",
            (
                inbound["text_cleaned"].str.contains(r"\b(worst customer service|rude executive|rude agent|on hold for|con artists|liars|horrible customer service|useless.*service|disgusting service)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(delayed flight|package|wifi|crash)\b", case=False, regex=True)
            ),
        ),
        (
            "feedback_praise_resolution",
            (
                inbound["text_cleaned"].str.contains(r"\b(thank you|thanks for|loving.*priority|you guys are the best|great customer service|appreciate.*help|kudos|shoutout)\b", case=False, regex=True)
                & ~inbound["text_cleaned"].str.contains(r"\b(worst|terrible|awful|delay|delayed|problem|broken|down|cancel|charge|rude)\b", case=False, regex=True)
            ),
        ),
    ]

    mined_examples = []
    used_tids: Set[int] = set()

    for intent, mask in intent_patterns:
        pool = inbound[mask & (~inbound["tweet_id"].isin(used_tids))].copy()
        pool = pool.drop_duplicates(subset=["text_cleaned"])
        sample_n = min(len(pool), max_per_class)
        sampled = pool.sample(n=sample_n, random_state=random_seed)
        for _, r in sampled.iterrows():
            used_tids.add(int(r["tweet_id"]))
            mined_examples.append(
                {
                    "tweet_id": int(r["tweet_id"]),
                    "brand": r["brand"],
                    "text": r["text_cleaned"],
                    "intent": intent,
                }
            )

    full_pool_df = pd.DataFrame(mined_examples)

    # Stratified 80/20 train/validation split
    train_df, val_df = train_test_split(
        full_pool_df,
        test_size=0.20,
        random_state=random_seed,
        stratify=full_pool_df["intent"],
    )

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    train_df.to_csv(TRAIN_CSV, index=False, encoding="utf-8")
    val_df.to_csv(VAL_CSV, index=False, encoding="utf-8")

    print(f"[Dataset] Created isolated training/validation splits from non-golden corpus:")
    print(f"  - Training Set:   {len(train_df)} examples -> {TRAIN_CSV}")
    print(f"  - Validation Set: {len(val_df)} examples -> {VAL_CSV}")
    print(f"  - Golden Set:     {len(golden_df)} examples (strictly held-out test benchmark)")
    return train_df, val_df


def run_baseline_experiments() -> Dict[str, Any]:
    print("=" * 60)
    print("PHASE 4: BASELINE INTENT CLASSIFICATION EXPERIMENTS")
    print("=" * 60)

    # 1. Prepare / verify train & validation splits
    train_df, val_df = prepare_training_validation_splits(random_seed=42)
    golden_df = pd.read_csv(GOLDEN_CSV)

    taxonomy_classes = sorted(list(golden_df["intent"].unique()))
    X_train, y_train = train_df["text"], train_df["intent"]
    X_val, y_val = val_df["text"], val_df["intent"]
    X_golden, y_golden = golden_df["text"], golden_df["intent"]

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # =========================================================================
    # BASELINE 1: Majority Class Classifier (Trivial Heuristic)
    # =========================================================================
    print("\n--- Training Baseline 1 (Majority Class Classifier) ---")
    b1_model = MajorityClassClassifier()
    b1_model.fit(X_train, y_train)
    print(f"  Learned Majority Class: '{b1_model.majority_class_}' (count: {b1_model.class_counts_[b1_model.majority_class_]})")

    # Evaluate on Validation & Golden Set
    b1_val_eval = evaluate_intent_classifier(y_val, b1_model.predict(X_val), labels=taxonomy_classes)
    b1_golden_eval = evaluate_intent_classifier(y_golden, b1_model.predict(X_golden), labels=taxonomy_classes)

    print(f"  [Validation] Accuracy: {b1_val_eval['accuracy']:.4f} | Macro-F1: {b1_val_eval['macro_f1']:.4f}")
    print(f"  [Golden Set] Accuracy: {b1_golden_eval['accuracy']:.4f} | Macro-F1: {b1_golden_eval['macro_f1']:.4f}")

    # =========================================================================
    # BASELINE 2: TF-IDF + Logistic Regression (Explainable Classical ML)
    # =========================================================================
    print("\n--- Training Baseline 2 (TF-IDF + Logistic Regression) ---")
    b2_model = TfidfLogisticRegressionClassifier(
        ngram_range=(1, 2),
        max_features=5000,
        C=1.0,
        random_state=42,
        class_weight="balanced",
    )
    b2_model.fit(X_train, y_train)

    b2_val_eval = evaluate_intent_classifier(y_val, b2_model.predict(X_val), labels=taxonomy_classes)
    b2_golden_eval = evaluate_intent_classifier(y_golden, b2_model.predict(X_golden), labels=taxonomy_classes)

    print(f"  [Validation] Accuracy: {b2_val_eval['accuracy']:.4f} | Macro-F1: {b2_val_eval['macro_f1']:.4f}")
    print(f"  [Golden Set] Accuracy: {b2_golden_eval['accuracy']:.4f} | Macro-F1: {b2_golden_eval['macro_f1']:.4f}")

    # Save predictions
    golden_df_b1 = golden_df.copy()
    golden_df_b1["predicted_intent"] = b1_model.predict(X_golden)
    golden_df_b1.to_csv(RESULTS_DIR / "predictions_baseline1.csv", index=False, encoding="utf-8")

    golden_df_b2 = golden_df.copy()
    golden_df_b2["predicted_intent"] = b2_model.predict(X_golden)
    golden_df_b2.to_csv(RESULTS_DIR / "predictions_baseline2.csv", index=False, encoding="utf-8")

    # Save confusion matrices
    b1_golden_eval["confusion_matrix_df"].to_csv(
        RESULTS_DIR / "confusion_matrix_baseline1.csv", encoding="utf-8"
    )
    b2_golden_eval["confusion_matrix_df"].to_csv(
        RESULTS_DIR / "confusion_matrix_baseline2.csv", encoding="utf-8"
    )

    # Save aggregated JSON summary
    experiment_results = {
        "metadata": {
            "training_samples": len(train_df),
            "validation_samples": len(val_df),
            "golden_test_samples": len(golden_df),
            "classes_count": len(taxonomy_classes),
            "taxonomy": taxonomy_classes,
        },
        "baseline_1_majority_class": {
            "name": "MajorityClassClassifier",
            "majority_class": b1_model.majority_class_,
            "validation_metrics": {
                "accuracy": b1_val_eval["accuracy"],
                "macro_f1": b1_val_eval["macro_f1"],
                "weighted_f1": b1_val_eval["weighted_f1"],
            },
            "golden_test_metrics": {
                "accuracy": b1_golden_eval["accuracy"],
                "macro_f1": b1_golden_eval["macro_f1"],
                "weighted_f1": b1_golden_eval["weighted_f1"],
                "per_class": b1_golden_eval["per_class"],
            },
        },
        "baseline_2_tfidf_logistic_regression": {
            "name": "TfidfLogisticRegressionClassifier",
            "hyperparameters": {
                "ngram_range": [1, 2],
                "max_features": 5000,
                "C": 1.0,
                "class_weight": "balanced",
                "random_state": 42,
            },
            "validation_metrics": {
                "accuracy": b2_val_eval["accuracy"],
                "macro_f1": b2_val_eval["macro_f1"],
                "weighted_f1": b2_val_eval["weighted_f1"],
            },
            "golden_test_metrics": {
                "accuracy": b2_golden_eval["accuracy"],
                "macro_f1": b2_golden_eval["macro_f1"],
                "weighted_f1": b2_golden_eval["weighted_f1"],
                "per_class": b2_golden_eval["per_class"],
            },
            "top_features_per_class": b2_model.get_top_features_per_class(top_k=5),
        },
    }

    results_json_path = RESULTS_DIR / "baseline_results.json"
    with open(results_json_path, "w", encoding="utf-8") as f:
        json.dump(experiment_results, f, indent=2)

    print("\n" + "=" * 60)
    print("GOLDEN SET EVALUATION COMPARISON SUMMARY")
    print("=" * 60)
    print(f"{'Metric':<20} | {'Baseline 1 (Majority)':<22} | {'Baseline 2 (TF-IDF + LR)':<22}")
    print("-" * 70)
    print(f"{'Accuracy':<20} | {b1_golden_eval['accuracy']:<22.4f} | {b2_golden_eval['accuracy']:<22.4f}")
    print(f"{'Macro F1':<20} | {b1_golden_eval['macro_f1']:<22.4f} | {b2_golden_eval['macro_f1']:<22.4f}")
    print(f"{'Weighted F1':<20} | {b1_golden_eval['weighted_f1']:<22.4f} | {b2_golden_eval['weighted_f1']:<22.4f}")
    print("=" * 60)
    print(f"Results successfully saved to {RESULTS_DIR}")
    return experiment_results


if __name__ == "__main__":
    run_baseline_experiments()
