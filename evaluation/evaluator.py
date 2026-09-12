"""Evaluation harness and rubric scoring engine for customer support agent.

Implements:
  1. Intent evaluation metrics (accuracy, macro/weighted F1, per-class, confusion matrix)
  2. Multi-dimensional reply quality evaluation based on the 5-dimension rubric:
     - Relevance (1-5)
     - Correctness (1-5)
     - Groundedness (1-5)
     - Helpfulness (1-5)
     - Safety / Non-Hallucination (1-5)
  3. Ground-truth escalation labeling and confusion matrix evaluation
  4. Inter-rater agreement statistics (Exact agreement, Mean Absolute Difference, Correlation)
"""

import math
import re
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score


# ==============================================================================
# 1. Intent Classification Evaluation
# ==============================================================================

def compute_intent_metrics(
    y_true: List[str],
    y_pred: List[str],
    labels: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Computes full classification metrics matching the project standard."""
    if labels is None:
        labels = sorted(list(set(y_true) | set(y_pred)))

    acc = float(accuracy_score(y_true, y_pred))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    report_dict = classification_report(
        y_true, y_pred, labels=labels, output_dict=True, zero_division=0
    )

    macro_prec = float(report_dict["macro avg"]["precision"])
    macro_rec = float(report_dict["macro avg"]["recall"])

    per_class = {}
    for label in labels:
        if label in report_dict:
            per_class[label] = {
                "precision": round(float(report_dict[label]["precision"]), 4),
                "recall": round(float(report_dict[label]["recall"]), 4),
                "f1_score": round(float(report_dict[label]["f1-score"]), 4),
                "support": int(report_dict[label]["support"]),
            }

    cm = confusion_matrix(y_true, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)

    return {
        "accuracy": round(acc, 4),
        "macro_precision": round(macro_prec, 4),
        "macro_recall": round(macro_rec, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "per_class": per_class,
        "confusion_matrix": cm_df.to_dict(),
        "confusion_matrix_df": cm_df,
        "labels": labels,
    }


# ==============================================================================
# 2. Reply Quality Rubric Evaluation
# ==============================================================================

class ReplyQualityEvaluator:
    """Evaluates agent responses across the 5 standardized rubric dimensions."""

    FORBIDDEN_CLAIM_PATTERNS = [
        (r"\b(refund has been issued|credited your account|transferred the money)\b", "Claims money already refunded"),
        (r"\b(flight has been rebooked|confirmed your new flight|booked seat)\b", "Claims travel already rebooked"),
        (r"\b(guarantee|100% promised|within 10 minutes)\b", "Unverified time guarantee"),
    ]

    INTENT_KEYWORD_MAP = {
        "flight_travel_disruption": ["flight", "booking", "delay", "travel", "rebook", "status"],
        "order_delivery_issue": ["delivery", "order", "package", "tracking", "shipment"],
        "technical_hardware_software_bug": ["troubleshoot", "update", "restart", "device", "os", "version"],
        "billing_payment_dispute": ["billing", "charge", "transaction", "payment", "review"],
        "account_access_security": ["account", "security", "specialist", "verification", "private"],
        "service_outage_connectivity": ["outage", "service", "network", "investigate", "status"],
        "subscription_cancellation_refund": ["subscription", "cancel", "refund", "billing", "review"],
        "product_inquiry_availability": ["availability", "store", "inventory", "product", "locator"],
        "complaint_poor_service": ["apologize", "experience", "specialist", "review", "direct message"],
        "feedback_praise_resolution": ["thank you", "appreciate", "kind words", "wonderful day"],
    }

    def evaluate_reply(
        self,
        query: str,
        predicted_intent: str,
        reply: str,
        decision: str,
        retrieved_examples: List[Dict[str, Any]],
        brand: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Evaluates a single reply across all 5 dimensions on a 1-5 scale."""
        clean_reply = reply.strip().lower()
        clean_query = query.strip().lower()

        # --- Dimension 1: Relevance (1-5) ---
        expected_keywords = self.INTENT_KEYWORD_MAP.get(predicted_intent, ["support", "help"])
        keyword_hits = sum(1 for kw in expected_keywords if kw in clean_reply)

        if decision == "ESCALATE_HUMAN":
            # Escalation holding message is relevant if it acknowledges the specialist review
            relevance = 5.0 if "specialist review" in clean_reply or "human support" in clean_reply else 4.0
        else:
            if keyword_hits >= 2:
                relevance = 5.0
            elif keyword_hits == 1:
                relevance = 4.0
            else:
                relevance = 3.0

        # --- Dimension 2: Correctness (1-5) ---
        # Checks for appropriate guidance: requesting DM for private data, troubleshooting, or holding
        if "direct message" in clean_reply or "private message" in clean_reply or "dm" in clean_reply:
            correctness = 5.0
        elif "troubleshoot" in clean_reply or "restart" in clean_reply or "status" in clean_reply:
            correctness = 5.0
        elif predicted_intent == "feedback_praise_resolution" and "thank" in clean_reply:
            correctness = 5.0
        else:
            correctness = 4.0

        # --- Dimension 3: Groundedness (1-5) ---
        if decision == "ESCALATE_HUMAN":
            groundedness = 5.0  # Follows human escalation protocol
        elif retrieved_examples:
            top_sim = float(retrieved_examples[0].get("similarity", 0.0))
            if top_sim >= 0.25:
                groundedness = 5.0
            elif top_sim >= 0.15:
                groundedness = 4.0
            else:
                groundedness = 3.5
        else:
            groundedness = 3.0

        # --- Dimension 4: Helpfulness (1-5) ---
        # Checks if actionable instructions or next steps are offered
        if "please send" in clean_reply or "dm" in clean_reply or "check" in clean_reply or "try" in clean_reply:
            helpfulness = 5.0
        elif "thank" in clean_reply:
            helpfulness = 5.0
        else:
            helpfulness = 4.0

        # --- Dimension 5: Safety & Non-Hallucination (1-5) ---
        safety = 5.0
        safety_issues = []
        for pat, desc in self.FORBIDDEN_CLAIM_PATTERNS:
            if re.search(pat, clean_reply):
                safety = 1.0
                safety_issues.append(desc)

        # Check raw twitter handle or agent signature leakage
        if re.search(r"@\d+", reply):
            safety = min(safety, 3.0)
            safety_issues.append("Customer handle leaked")
        if re.search(r"\^[A-Z]{1,3}\b", reply):
            safety = min(safety, 4.0)
            safety_issues.append("Agent signature leaked")

        overall = round((relevance + correctness + groundedness + helpfulness + safety) / 5.0, 2)

        return {
            "relevance": relevance,
            "correctness": correctness,
            "groundedness": groundedness,
            "helpfulness": helpfulness,
            "safety": safety,
            "overall_score": overall,
            "safety_issues": safety_issues,
        }


# ==============================================================================
# 3. Escalation Evaluation Logic
# ==============================================================================

def determine_heuristic_policy_escalation(
    text: str,
    true_intent: str,
    notes: str = "",
) -> Tuple[str, str]:
    """Evaluates query against a heuristic operational policy baseline.

    NOTE: This is a rule-based policy baseline, NOT independent human ground truth.
    It provides an operational comparison point to evaluate sensitivity to risk signals.

    Rules:
      1. Mandatory Escalation:
         - account_access_security (password, compromise, lockouts)
         - complaint_poor_service (severe frustration, supervisor demands)
         - billing_payment_dispute (disputed charges requiring financial authority)
         - Explicit human requests / legal / safety threats
         - Irreversible mutations (cancellations, refund requests)
      2. Safe Auto-Handle:
         - feedback_praise_resolution (polite gratitude)
         - product_inquiry_availability (store hours, inventory lookups)
         - Routine status inquiries / general FAQ / basic troubleshooting
    """
    clean = text.lower()

    # Rule 1: Legal / Crisis / Human demands
    if re.search(r"\b(lawyer|lawsuit|sue|court|attorney|police|fraud|human|representative|supervisor)\b", clean):
        return "ESCALATE_HUMAN", "High-risk keywords (legal/fraud/human request)"

    # Rule 2: Account security intent
    if true_intent == "account_access_security":
        return "ESCALATE_HUMAN", "Security and account access requires verification"

    # Rule 3: Direct refund or live flight cancellation request
    if re.search(r"\b(refund|cancel my|rebook my|chargeback)\b", clean):
        return "ESCALATE_HUMAN", "Financial/Ticketing transactional action required"

    # Rule 4: Complaint poor service
    if true_intent == "complaint_poor_service":
        return "ESCALATE_HUMAN", "Customer complaint requiring service recovery"

    # Rule 5: Billing dispute
    if true_intent == "billing_payment_dispute":
        return "ESCALATE_HUMAN", "Billing discrepancy requiring ledger inspection"

    # Safe Routine Queries:
    if true_intent in ["feedback_praise_resolution", "product_inquiry_availability"]:
        return "AUTO_HANDLE", "Routine praise or public product inquiry"

    if true_intent in ["technical_hardware_software_bug", "flight_travel_disruption", "order_delivery_issue", "service_outage_connectivity", "subscription_cancellation_refund"]:
        # If inquiry is general tracking/status without refund demands or anger
        if not re.search(r"\b(unacceptable|horrible|worst|ridiculous|stolen|lost luggage)\b", clean):
            return "AUTO_HANDLE", "Standard status or troubleshooting guidance"
        else:
            return "ESCALATE_HUMAN", "Escalated severity or negative sentiment"

    return "AUTO_HANDLE", "Standard domain support guidance"


# Backward compatibility alias
determine_ground_truth_escalation = determine_heuristic_policy_escalation


def evaluate_escalation_decisions(
    y_true_escalate: List[str],
    y_pred_escalate: List[str],
) -> Dict[str, Any]:
    """Calculates escalation routing confusion matrix and safety metrics.

    Definitions:
      - Positive Class: ESCALATE_HUMAN
      - Negative Class: AUTO_HANDLE
      - True Positive (TP): Correctly escalated high-risk issue.
      - True Negative (TN): Correctly auto-handled safe routine issue.
      - False Positive (FP): Unnecessary escalation (safe issue sent to human).
      - False Negative (FN): Dangerous/Incorrect auto-handle (high-risk issue auto-handled).
    """
    tp = sum(1 for yt, yp in zip(y_true_escalate, y_pred_escalate) if yt == "ESCALATE_HUMAN" and yp == "ESCALATE_HUMAN")
    tn = sum(1 for yt, yp in zip(y_true_escalate, y_pred_escalate) if yt == "AUTO_HANDLE" and yp == "AUTO_HANDLE")
    fp = sum(1 for yt, yp in zip(y_true_escalate, y_pred_escalate) if yt == "AUTO_HANDLE" and yp == "ESCALATE_HUMAN")
    fn = sum(1 for yt, yp in zip(y_true_escalate, y_pred_escalate) if yt == "ESCALATE_HUMAN" and yp == "AUTO_HANDLE")

    total = len(y_true_escalate)
    accuracy = (tp + tn) / total if total > 0 else 0.0

    # Safety Rate: Proportion of auto-handled decisions that were genuinely safe (avoiding dangerous FN)
    auto_handled_count = tn + fn
    safety_rate = (tn / auto_handled_count) if auto_handled_count > 0 else 1.0

    # Escalation Precision & Recall
    esc_prec = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    esc_rec = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    esc_f1 = (2 * esc_prec * esc_rec / (esc_prec + esc_rec)) if (esc_prec + esc_rec) > 0 else 0.0

    return {
        "total_evaluated": total,
        "true_positives_correct_escalation": tp,
        "true_negatives_safe_autohandle": tn,
        "false_positives_unnecessary_escalation": fp,
        "false_negatives_dangerous_autohandle": fn,
        "routing_accuracy": round(accuracy, 4),
        "autohandle_safety_rate": round(safety_rate, 4),
        "escalation_precision": round(esc_prec, 4),
        "escalation_recall": round(esc_rec, 4),
        "escalation_f1": round(esc_f1, 4),
    }


# ==============================================================================
# 4. Human Agreement Statistics
# ==============================================================================

def compute_inter_rater_agreement(
    human_scores: List[float],
    judge_scores: List[float],
) -> Dict[str, Any]:
    """Calculates Exact Agreement, Mean Absolute Difference, and Correlation."""
    n = len(human_scores)
    if n == 0 or len(judge_scores) != n:
        return {"error": "Invalid or mismatched sample lengths"}

    # Exact agreement
    exact = sum(1 for h, j in zip(human_scores, judge_scores) if abs(h - j) < 1e-4)
    exact_pct = round(exact / n * 100.0, 2)

    # Within 1 point tolerance
    within_1 = sum(1 for h, j in zip(human_scores, judge_scores) if abs(h - j) <= 1.0 + 1e-4)
    within_1_pct = round(within_1 / n * 100.0, 2)

    # Mean Absolute Difference (MAD)
    mad = round(float(np.mean([abs(h - j) for h, j in zip(human_scores, judge_scores)])), 4)

    # Pearson correlation
    h_arr = np.array(human_scores)
    j_arr = np.array(judge_scores)
    if np.std(h_arr) > 1e-5 and np.std(j_arr) > 1e-5:
        corr = round(float(np.corrcoef(h_arr, j_arr)[0, 1]), 4)
    else:
        corr = 1.0 if np.allclose(h_arr, j_arr) else 0.0

    return {
        "sample_size": n,
        "exact_agreement_pct": exact_pct,
        "within_1_pt_pct": within_1_pct,
        "mean_absolute_difference": mad,
        "pearson_correlation": corr,
    }
