"""Escalation routing and safety policy engine for the AI customer support agent.

Decides between AUTO_HANDLE and ESCALATE_HUMAN using multi-factor risk assessment:
  - Intent classification confidence threshold
  - Historical retrieval grounding similarity
  - Sensitive / high-risk keywords (legal, safety, fraud, harassment)
  - Account security / identity compromise scenarios
  - Account-specific actions requiring human authorization (refunds, cancellations)
"""

import re
from typing import Any, Dict, List, Optional, Tuple


class EscalationDecision:
    AUTO_HANDLE = "AUTO_HANDLE"
    ESCALATE_HUMAN = "ESCALATE_HUMAN"


class EscalationRouter:
    """Evaluates incoming customer queries and pipeline signals to decide routing."""

    # Explicit threshold configurations
    CONFIDENCE_THRESHOLD = 0.45       # Below this, intent prediction is too uncertain
    SIMILARITY_THRESHOLD = 0.15       # Below this, no sufficient historical precedent exists
    HIGH_SIMILARITY_SAFE = 0.40       # Strong grounding evidence boosts auto-handle safety

    # Critical security intents that ALWAYS require human verification
    ALWAYS_ESCALATE_INTENTS = {
        "account_access_security",     # PII / password reset / account takeover risk
    }

    # Severe regulatory, legal, fraud, or customer safety keywords
    CRITICAL_RISK_PATTERNS = [
        (r"\b(lawsuit|lawyer|attorney|legal action|court|sue you)\b", "Legal dispute or threat of litigation"),
        (r"\b(fraud|stolen card|identity theft|unauthorized transaction)\b", "Suspected financial fraud or unauthorized transaction"),
        (r"\b(police|fbi|authorities|crime)\b", "Involvement of law enforcement authorities"),
        (r"\b(suicide|kill myself|harm myself|end my life)\b", "Critical user safety / crisis situation"),
        (r"\b(chargeback|dispute with bank|filing a dispute)\b", "External bank dispute / chargeback threat"),
        (r"\b(speak to a human|real person|human agent|transfer me to|supervisor|manager|representative)\b", "Explicit customer request for human agent"),
    ]

    # Sensitive operational action triggers
    ACCOUNT_ACTION_PATTERNS = [
        (r"\b(cancel my flight|change my booking|rebook flight|change flight)\b", "Live travel rebooking requiring ticketing authority"),
        (r"\b(refund my money|issue a refund|give me my refund)\b", "Direct financial refund request requiring ledger approval"),
    ]

    def __init__(
        self,
        confidence_threshold: float = CONFIDENCE_THRESHOLD,
        similarity_threshold: float = SIMILARITY_THRESHOLD,
    ):
        self.confidence_threshold = confidence_threshold
        self.similarity_threshold = similarity_threshold

    def evaluate(
        self,
        query: str,
        intent: str,
        confidence: float,
        top_similarity: float,
        brand: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Evaluates query and signals to produce an auditable routing decision.

        Args:
            query: Customer query text.
            intent: Predicted intent from classifier.
            confidence: Model probability score (0.0 to 1.0).
            top_similarity: Best cosine similarity score from historical retrieval (0.0 to 1.0).
            brand: Brand handle if known.

        Returns:
            Dictionary with decision, reason, risk_score, and triggered_flags.
        """
        clean_text = str(query).lower()
        triggered_flags: List[str] = []
        risk_score: float = 0.0

        # 1. Critical Legal, Safety, or Human Request Check
        for pattern, description in self.CRITICAL_RISK_PATTERNS:
            if re.search(pattern, clean_text):
                triggered_flags.append(f"CRITICAL_KEYWORD: {description}")
                risk_score = max(risk_score, 0.95)

        # 2. Mandatory Security Intent Check
        if intent in self.ALWAYS_ESCALATE_INTENTS:
            triggered_flags.append("SECURITY_INTENT: Account access or security compromise requires verification")
            risk_score = max(risk_score, 0.90)

        # 3. Explicit Account Action Check
        for pattern, description in self.ACCOUNT_ACTION_PATTERNS:
            if re.search(pattern, clean_text):
                triggered_flags.append(f"ACCOUNT_ACTION_REQUIRED: {description}")
                risk_score = max(risk_score, 0.75)

        # 4. Severe Complaint Check
        if intent == "complaint_poor_service":
            triggered_flags.append("SEVERE_COMPLAINT: High-risk negative customer experience escalation")
            risk_score = max(risk_score, 0.70)

        # 5. Low Intent Confidence Check
        if confidence < self.confidence_threshold:
            triggered_flags.append(
                f"LOW_CONFIDENCE: Classifier confidence ({confidence:.2f}) below threshold ({self.confidence_threshold:.2f})"
            )
            risk_score = max(risk_score, 0.65)

        # 6. Insufficient Historical Retrieval Evidence Check
        if top_similarity < self.similarity_threshold:
            triggered_flags.append(
                f"WEAK_GROUNDING: Top retrieval similarity ({top_similarity:.2f}) below threshold ({self.similarity_threshold:.2f})"
            )
            risk_score = max(risk_score, 0.60)

        # Determine final decision
        if triggered_flags:
            decision = EscalationDecision.ESCALATE_HUMAN
            reason = "; ".join(triggered_flags)
        else:
            decision = EscalationDecision.AUTO_HANDLE
            reason = (
                f"High intent confidence ({confidence:.2f}) and strong historical grounding ({top_similarity:.2f}) "
                f"for routine '{intent}' without risk triggers."
            )
            risk_score = max(0.05, 1.0 - confidence)

        return {
            "decision": decision,
            "reason": reason,
            "risk_score": round(float(risk_score), 4),
            "triggered_flags": triggered_flags,
            "confidence": round(float(confidence), 4),
            "top_similarity": round(float(top_similarity), 4),
        }
