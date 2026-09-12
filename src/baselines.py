"""Baseline models for customer support intent classification.

Implements:
  1. MajorityClassClassifier (Baseline 1 - Trivial heuristic)
  2. TfidfLogisticRegressionClassifier (Baseline 2 - Explainable classical ML)
  3. Standardized evaluation metrics and confusion matrix utilities
"""

from collections import Counter
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score


class MajorityClassClassifier:
    """Trivial heuristic baseline that always predicts the most frequent intent in training data."""

    def __init__(self):
        self.majority_class_: Optional[str] = None
        self.classes_: List[str] = []
        self.class_counts_: Dict[str, int] = {}

    def fit(self, X: Any, y: Union[List[str], pd.Series, np.ndarray]) -> "MajorityClassClassifier":
        """Fits the classifier by determining the majority class from labels."""
        y_list = list(y)
        counts = Counter(y_list)
        self.class_counts_ = dict(counts)
        self.majority_class_ = counts.most_common(1)[0][0]
        self.classes_ = sorted(counts.keys())
        return self

    def predict(self, X: Any) -> np.ndarray:
        """Predicts the majority class for all input instances."""
        if self.majority_class_ is None:
            raise ValueError("MajorityClassClassifier must be fitted before predicting.")
        n_samples = len(X)
        return np.array([self.majority_class_] * n_samples)

    def predict_proba(self, X: Any) -> np.ndarray:
        """Returns dummy probabilities (1.0 for majority class, 0.0 for others)."""
        if self.majority_class_ is None:
            raise ValueError("MajorityClassClassifier must be fitted before predicting.")
        n_samples = len(X)
        n_classes = len(self.classes_)
        maj_idx = self.classes_.index(self.majority_class_)
        probs = np.zeros((n_samples, n_classes), dtype=float)
        probs[:, maj_idx] = 1.0
        return probs


class TfidfLogisticRegressionClassifier:
    """Conventional ML baseline using word/bi-gram TF-IDF paired with regularized Logistic Regression."""

    def __init__(
        self,
        ngram_range: Tuple[int, int] = (1, 2),
        max_features: int = 5000,
        C: float = 1.0,
        random_state: int = 42,
        class_weight: str = "balanced",
    ):
        self.ngram_range = ngram_range
        self.max_features = max_features
        self.C = C
        self.random_state = random_state
        self.class_weight = class_weight

        self.vectorizer = TfidfVectorizer(
            ngram_range=ngram_range,
            max_features=max_features,
            sublinear_tf=True,
            strip_accents="unicode",
            lowercase=True,
        )
        self.model = LogisticRegression(
            C=C,
            max_iter=1000,
            random_state=random_state,
            class_weight=class_weight,
            solver="lbfgs",
        )
        self.classes_: List[str] = []

    def fit(
        self,
        X: Union[List[str], pd.Series],
        y: Union[List[str], pd.Series, np.ndarray],
    ) -> "TfidfLogisticRegressionClassifier":
        """Fits TF-IDF vectorizer and trains the logistic regression classifier."""
        X_vec = self.vectorizer.fit_transform(X)
        self.model.fit(X_vec, y)
        self.classes_ = list(self.model.classes_)
        return self

    def predict(self, X: Union[List[str], pd.Series]) -> np.ndarray:
        """Transforms input text using fitted vectorizer and predicts intent labels."""
        X_vec = self.vectorizer.transform(X)
        return self.model.predict(X_vec)

    def predict_proba(self, X: Union[List[str], pd.Series]) -> np.ndarray:
        """Transforms input text and predicts class probability distributions."""
        X_vec = self.vectorizer.transform(X)
        return self.model.predict_proba(X_vec)

    def get_top_features_per_class(self, top_k: int = 10) -> Dict[str, List[Tuple[str, float]]]:
        """Returns the highest-magnitude positive TF-IDF features for each intent class."""
        feature_names = np.array(self.vectorizer.get_feature_names_out())
        top_features = {}
        for i, class_name in enumerate(self.classes_):
            coefs = self.model.coef_[i]
            top_indices = np.argsort(coefs)[-top_k:][::-1]
            top_features[class_name] = [
                (feature_names[idx], round(float(coefs[idx]), 4)) for idx in top_indices
            ]
        return top_features


def evaluate_intent_classifier(
    y_true: Union[List[str], pd.Series, np.ndarray],
    y_pred: Union[List[str], pd.Series, np.ndarray],
    labels: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Computes comprehensive classification metrics and confusion matrix."""
    y_true_list = list(y_true)
    y_pred_list = list(y_pred)

    if labels is None:
        labels = sorted(list(set(y_true_list) | set(y_pred_list)))

    acc = float(accuracy_score(y_true_list, y_pred_list))
    macro_f1 = float(f1_score(y_true_list, y_pred_list, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(y_true_list, y_pred_list, average="weighted", zero_division=0))

    report_dict = classification_report(
        y_true_list, y_pred_list, labels=labels, output_dict=True, zero_division=0
    )

    cm = confusion_matrix(y_true_list, y_pred_list, labels=labels)
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)

    per_class_metrics = {}
    for label in labels:
        if label in report_dict:
            per_class_metrics[label] = {
                "precision": round(float(report_dict[label]["precision"]), 4),
                "recall": round(float(report_dict[label]["recall"]), 4),
                "f1_score": round(float(report_dict[label]["f1-score"]), 4),
                "support": int(report_dict[label]["support"]),
            }

    return {
        "accuracy": round(acc, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "per_class": per_class_metrics,
        "confusion_matrix": cm_df.to_dict(),
        "confusion_matrix_df": cm_df,
        "labels": labels,
    }
