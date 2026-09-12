"""Unit tests for Phase 4 baseline models, data isolation, and experiment artifacts."""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src.baselines import (
    MajorityClassClassifier,
    TfidfLogisticRegressionClassifier,
    evaluate_intent_classifier,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
GOLDEN_CSV = PROJECT_ROOT / "evaluation" / "golden_set.csv"
TRAIN_CSV = PROJECT_ROOT / "data" / "processed" / "train_intents.csv"
VAL_CSV = PROJECT_ROOT / "data" / "processed" / "val_intents.csv"
RESULTS_DIR = PROJECT_ROOT / "results" / "baselines"


def test_majority_class_classifier_behavior():
    """Verify MajorityClassClassifier fits and predicts the dominant label."""
    X = ["query 1", "query 2", "query 3", "query 4"]
    y = ["delivery", "delivery", "flight", "billing"]

    clf = MajorityClassClassifier()
    clf.fit(X, y)

    assert clf.majority_class_ == "delivery"
    assert clf.classes_ == ["billing", "delivery", "flight"]

    preds = clf.predict(["any new query", "another query"])
    assert list(preds) == ["delivery", "delivery"]

    probs = clf.predict_proba(["sample query"])
    assert probs.shape == (1, 3)
    assert probs[0][1] == 1.0  # index 1 is "delivery"


def test_tfidf_logistic_regression_classifier():
    """Verify TfidfLogisticRegressionClassifier fits, predicts, and extracts top features."""
    X = [
        "flight delayed by 3 hours",
        "flight canceled at gate",
        "package delivery missing",
        "driver did not deliver parcel",
        "password reset not working",
        "account locked cannot login",
    ]
    y = ["flight", "flight", "delivery", "delivery", "account", "account"]

    clf = TfidfLogisticRegressionClassifier(ngram_range=(1, 2), max_features=100)
    clf.fit(X, y)

    preds = clf.predict(["delayed flight at airport", "where is my package"])
    assert preds[0] == "flight"
    assert preds[1] == "delivery"

    probs = clf.predict_proba(["flight delay"])
    assert probs.shape == (1, 3)
    assert np.isclose(probs.sum(axis=1)[0], 1.0)

    features = clf.get_top_features_per_class(top_k=2)
    assert "flight" in features
    assert len(features["flight"]) == 2


def test_zero_data_leakage_between_train_and_golden():
    """Verify that training and validation sets share zero tweet IDs with the golden test set."""
    assert GOLDEN_CSV.exists()
    assert TRAIN_CSV.exists()
    assert VAL_CSV.exists()

    golden_df = pd.read_csv(GOLDEN_CSV)
    train_df = pd.read_csv(TRAIN_CSV)
    val_df = pd.read_csv(VAL_CSV)

    golden_tids = set(golden_df["tweet_id"].astype(int))
    train_tids = set(train_df["tweet_id"].astype(int))
    val_tids = set(val_df["tweet_id"].astype(int))

    train_leakage = train_tids.intersection(golden_tids)
    val_leakage = val_tids.intersection(golden_tids)

    assert len(train_leakage) == 0, f"DATA LEAKAGE: {len(train_leakage)} golden tweets found in train set!"
    assert len(val_leakage) == 0, f"DATA LEAKAGE: {len(val_leakage)} golden tweets found in val set!"


def test_baseline_results_artifacts_exist():
    """Verify that all required Phase 4 result artifacts are saved and valid."""
    results_json = RESULTS_DIR / "baseline_results.json"
    cm1_csv = RESULTS_DIR / "confusion_matrix_baseline1.csv"
    cm2_csv = RESULTS_DIR / "confusion_matrix_baseline2.csv"
    pred1_csv = RESULTS_DIR / "predictions_baseline1.csv"
    pred2_csv = RESULTS_DIR / "predictions_baseline2.csv"

    for f in [results_json, cm1_csv, cm2_csv, pred1_csv, pred2_csv]:
        assert f.exists(), f"Result file missing: {f}"

    with open(results_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "baseline_1_majority_class" in data
    assert "baseline_2_tfidf_logistic_regression" in data

    b1_metrics = data["baseline_1_majority_class"]["golden_test_metrics"]
    b2_metrics = data["baseline_2_tfidf_logistic_regression"]["golden_test_metrics"]

    assert b1_metrics["accuracy"] == 0.1000
    assert b2_metrics["accuracy"] >= 0.8500
    assert b2_metrics["macro_f1"] >= 0.8500

    # Verify prediction files have 200 rows
    assert len(pd.read_csv(pred1_csv)) == 200
    assert len(pd.read_csv(pred2_csv)) == 200
