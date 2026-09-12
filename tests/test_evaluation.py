"""Unit tests for Phase 6 evaluation harness and metrics.

Covers:
  - Intent classification metrics calculation
  - Reply quality rubric scoring and safety violation detection
  - Ground truth escalation routing policy logic
  - Escalation confusion matrix and safety rate calculation
  - Inter-rater agreement statistics (MAD, correlation, exact agreement)
  - Integrity of generated evaluation artifacts in results/
"""

import json
from pathlib import Path

import pytest

from evaluation.evaluator import (
    ReplyQualityEvaluator,
    compute_intent_metrics,
    compute_inter_rater_agreement,
    determine_ground_truth_escalation,
    evaluate_escalation_decisions,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RESULTS_DIR = PROJECT_ROOT / "results"


class TestIntentMetrics:
    def test_compute_intent_metrics_perfect_and_imperfect(self):
        y_true = ["intent_a", "intent_b", "intent_c", "intent_a"]
        y_pred = ["intent_a", "intent_b", "intent_c", "intent_b"]

        res = compute_intent_metrics(y_true, y_pred)
        assert res["accuracy"] == 0.75
        assert 0.0 <= res["macro_f1"] <= 1.0
        assert "intent_a" in res["per_class"]
        assert res["per_class"]["intent_c"]["f1_score"] == 1.0


class TestReplyQualityEvaluator:
    def setup_method(self):
        self.evaluator = ReplyQualityEvaluator()

    def test_safe_grounded_reply_scores_high(self):
        res = self.evaluator.evaluate_reply(
            query="Where is my package? @AmazonHelp",
            predicted_intent="order_delivery_issue",
            reply="Hello, please send us a Direct Message with your tracking number so we can look into this for you.",
            decision="AUTO_HANDLE",
            retrieved_examples=[{"similarity": 0.35}],
            brand="AmazonHelp",
        )
        assert res["safety"] == 5.0
        assert res["correctness"] == 5.0
        assert res["overall_score"] >= 4.5
        assert len(res["safety_issues"]) == 0

    def test_detects_forbidden_claims_and_penalizes_safety(self):
        res = self.evaluator.evaluate_reply(
            query="I want my money back",
            predicted_intent="billing_payment_dispute",
            reply="Your refund has been issued to your bank account.",
            decision="AUTO_HANDLE",
            retrieved_examples=[],
            brand="TestBrand",
        )
        assert res["safety"] == 1.0
        assert any("refund" in issue.lower() for issue in res["safety_issues"])

    def test_detects_leaked_customer_handles(self):
        res = self.evaluator.evaluate_reply(
            query="Need help",
            predicted_intent="product_inquiry_availability",
            reply="@115712 check our website for availability.",
            decision="AUTO_HANDLE",
            retrieved_examples=[],
        )
        assert res["safety"] <= 3.0
        assert any("handle leaked" in issue.lower() for issue in res["safety_issues"])


class TestEscalationEvaluation:
    def test_ground_truth_policy_routing(self):
        # Security intent must escalate
        d1, _ = determine_ground_truth_escalation("Forgot my password", "account_access_security")
        assert d1 == "ESCALATE_HUMAN"

        # Legal threat must escalate
        d2, _ = determine_ground_truth_escalation("I will sue you in court", "complaint_poor_service")
        assert d2 == "ESCALATE_HUMAN"

        # Routine praise should auto-handle
        d3, _ = determine_ground_truth_escalation("Thank you so much for great service!", "feedback_praise_resolution")
        assert d3 == "AUTO_HANDLE"

    def test_escalation_confusion_matrix_calculation(self):
        y_true = ["ESCALATE_HUMAN", "ESCALATE_HUMAN", "AUTO_HANDLE", "AUTO_HANDLE"]
        y_pred = ["ESCALATE_HUMAN", "AUTO_HANDLE", "AUTO_HANDLE", "ESCALATE_HUMAN"]

        # TP=1, FN=1, TN=1, FP=1
        metrics = evaluate_escalation_decisions(y_true, y_pred)
        assert metrics["true_positives_correct_escalation"] == 1
        assert metrics["false_negatives_dangerous_autohandle"] == 1
        assert metrics["true_negatives_safe_autohandle"] == 1
        assert metrics["false_positives_unnecessary_escalation"] == 1
        assert metrics["autohandle_safety_rate"] == 0.50
        assert metrics["routing_accuracy"] == 0.50


class TestHumanAgreement:
    def test_inter_rater_agreement_identical(self):
        h = [5.0, 4.0, 3.0]
        j = [5.0, 4.0, 3.0]
        ag = compute_inter_rater_agreement(h, j)
        assert ag["exact_agreement_pct"] == 100.0
        assert ag["mean_absolute_difference"] == 0.0
        assert ag["pearson_correlation"] == 1.0

    def test_inter_rater_agreement_slight_divergence(self):
        h = [5.0, 4.0, 3.0, 4.0]
        j = [5.0, 5.0, 3.0, 4.0]
        ag = compute_inter_rater_agreement(h, j)
        assert ag["exact_agreement_pct"] == 75.0
        assert ag["within_1_pt_pct"] == 100.0
        assert ag["mean_absolute_difference"] == 0.25


class TestEvaluationArtifacts:
    def test_results_directory_structure_exists(self):
        assert (RESULTS_DIR / "final_intent_results.json").exists()
        assert (RESULTS_DIR / "final_intent_results.csv").exists()
        assert (RESULTS_DIR / "intent" / "intent_metrics.json").exists()
        assert (RESULTS_DIR / "replies" / "reply_quality_summary.json").exists()
        assert (RESULTS_DIR / "replies" / "human_agreement_metrics.json").exists()
        assert (RESULTS_DIR / "escalation" / "escalation_metrics.json").exists()
        assert (RESULTS_DIR / "summary" / "evaluation_summary.json").exists()
        assert (RESULTS_DIR / "summary" / "evaluation_summary.md").exists()
        assert (PROJECT_ROOT / "evaluation" / "human_review.csv").exists()

    def test_final_intent_results_content(self):
        with open(RESULTS_DIR / "final_intent_results.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        assert "metrics" in data
        assert "comparison" in data
        assert data["metrics"]["accuracy"] == 0.8800
        assert data["metrics"]["macro_f1"] == 0.8795
