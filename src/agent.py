"""End-to-End AI Customer Support Agent Interface.

Unifies:
  1. Intent classification with calibrated confidence estimation
  2. Grounded historical resolution retrieval
  3. Auditable multi-factor auto-handle vs human escalation routing
  4. Non-hallucinatory grounded reply generation
"""

import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd

from src.baselines import TfidfLogisticRegressionClassifier
from src.escalation import EscalationDecision, EscalationRouter
from src.reply_generator import GroundedReplyGenerator
from src.retrieval import HistoricalRetrievalIndex

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TRAIN_PATH = PROJECT_ROOT / "data" / "processed" / "train_intents.csv"
DEFAULT_CONVERSATIONS_PATH = PROJECT_ROOT / "data" / "processed" / "conversations_sample.jsonl"
DEFAULT_GOLDEN_PATH = PROJECT_ROOT / "evaluation" / "golden_set.csv"


class CustomerSupportAgent:
    """Production-grade AI Support Agent implementing the 4-stage pipeline."""

    def __init__(
        self,
        classifier: Optional[TfidfLogisticRegressionClassifier] = None,
        retrieval_index: Optional[HistoricalRetrievalIndex] = None,
        escalation_router: Optional[EscalationRouter] = None,
        reply_generator: Optional[GroundedReplyGenerator] = None,
        train_path: Path = DEFAULT_TRAIN_PATH,
        conversations_path: Path = DEFAULT_CONVERSATIONS_PATH,
        golden_path: Path = DEFAULT_GOLDEN_PATH,
        confidence_threshold: float = 0.45,
        similarity_threshold: float = 0.15,
        auto_init: bool = True,
    ):
        self.train_path = Path(train_path)
        self.conversations_path = Path(conversations_path)
        self.golden_path = Path(golden_path)

        # 1. Intent classifier component
        self.classifier = classifier or TfidfLogisticRegressionClassifier(
            ngram_range=(1, 2), max_features=5000, C=1.0, class_weight="balanced"
        )
        self._is_classifier_fitted = bool(classifier and len(getattr(classifier, "classes_", [])) > 0)

        # 2. Retrieval index component
        self.retrieval_index = retrieval_index or HistoricalRetrievalIndex(
            conversations_path=self.conversations_path,
            golden_path=self.golden_path,
        )

        # 3. Escalation router component
        self.escalation_router = escalation_router or EscalationRouter(
            confidence_threshold=confidence_threshold,
            similarity_threshold=similarity_threshold,
        )

        # 4. Grounded reply generator component
        self.reply_generator = reply_generator or GroundedReplyGenerator()

        if auto_init:
            self.initialize()

    def initialize(self) -> "CustomerSupportAgent":
        """Fits the classifier on training data and indexes historical dialogues."""
        if not self._is_classifier_fitted and self.train_path.exists():
            train_df = pd.read_csv(self.train_path)
            text_col = "text" if "text" in train_df.columns else "text_cleaned"
            self.classifier.fit(train_df[text_col], train_df["intent"])
            self._is_classifier_fitted = True

        if not self.retrieval_index._is_indexed and self.conversations_path.exists():
            self.retrieval_index.build_index()

        return self

    def extract_brand_mention(self, text: str) -> Optional[str]:
        """Extracts brand mention from customer tweet if present (e.g., @AmazonHelp)."""
        matches = re.findall(r"@([A-Za-z0-9_]+)", text)
        if matches:
            return matches[0]
        return None

    def process(
        self,
        message: str,
        brand: Optional[str] = None,
        top_k: int = 3,
    ) -> Dict[str, Any]:
        """Executes the full 4-stage customer support pipeline.

        Pipeline Stages:
          1. Intent Classification: Predicts intent category + confidence probability.
          2. Retrieval: Finds top-k similar historical support dialogues for evidence grounding.
          3. Escalation Decision: Evaluates confidence, similarity, risks, and compliance flags.
          4. Grounded Reply: Synthesizes action-oriented answer without false commitments.

        Args:
          message: Raw incoming customer message.
          brand: Brand identifier if known (otherwise extracted from @mentions or left generic).
          top_k: Number of historical examples to retrieve.

        Returns:
          Structured response dictionary conforming to agent interface specification.
        """
        clean_text = str(message).strip()

        # Handle empty/whitespace input edge case
        if not clean_text:
            return {
                "intent": "unknown",
                "confidence": 0.0,
                "retrieved_examples": [],
                "reply": "Hello, it appears your message was empty. How may we assist you today?",
                "decision": EscalationDecision.ESCALATE_HUMAN,
                "escalation_reason": "EMPTY_INPUT: Input message contains no textual content",
                "metadata": {
                    "risk_score": 1.0,
                    "top_similarity": 0.0,
                    "triggered_flags": ["EMPTY_INPUT"],
                    "brand": brand,
                },
            }

        # Auto-detect brand if not provided
        detected_brand = brand or self.extract_brand_mention(clean_text)

        # Stage 1: Intent Classification
        if not self._is_classifier_fitted:
            self.initialize()

        probs = self.classifier.predict_proba([clean_text])[0]
        pred_idx = int(np.argmax(probs))
        intent = self.classifier.classes_[pred_idx]
        confidence = float(probs[pred_idx])

        # Stage 2: Historical Retrieval
        retrieved_examples = self.retrieval_index.search(
            query=clean_text,
            top_k=top_k,
            brand=detected_brand,
            min_similarity=0.02,
        )
        top_similarity = (
            float(retrieved_examples[0]["similarity"]) if retrieved_examples else 0.0
        )

        # Stage 3: Escalation and Safety Evaluation
        escalation_eval = self.escalation_router.evaluate(
            query=clean_text,
            intent=intent,
            confidence=confidence,
            top_similarity=top_similarity,
            brand=detected_brand,
        )
        decision = escalation_eval["decision"]
        escalation_reason = escalation_eval["reason"]

        # Stage 4: Grounded Reply Generation
        gen_output = self.reply_generator.generate(
            query=clean_text,
            intent=intent,
            retrieved_examples=retrieved_examples,
            brand=detected_brand,
            escalation_decision=decision,
        )

        return {
            "intent": intent,
            "confidence": round(confidence, 4),
            "retrieved_examples": retrieved_examples,
            "reply": gen_output["reply"],
            "decision": decision,
            "escalation_reason": escalation_reason,
            "metadata": {
                "risk_score": escalation_eval["risk_score"],
                "top_similarity": round(top_similarity, 4),
                "triggered_flags": escalation_eval["triggered_flags"],
                "generation_mode": gen_output.get("mode", "local_grounded_synthesis"),
                "brand": detected_brand,
            },
        }

    def process_batch(
        self,
        messages: Union[List[str], pd.Series],
        brand: Optional[str] = None,
        top_k: int = 3,
    ) -> List[Dict[str, Any]]:
        """Processes a batch of customer messages sequentially."""
        return [self.process(msg, brand=brand, top_k=top_k) for msg in messages]
