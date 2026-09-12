"""Unit tests for Phase 5 AI Customer Support Agent components.

Covers:
  - Historical dialogue retrieval (indexing, brand filtering, zero golden set leakage)
  - Escalation routing (confidence thresholds, keyword risks, security intents, auto-handle)
  - Grounded reply generation (holding templates, local synthesis, mocked LLM isolation)
  - End-to-end CustomerSupportAgent interface conformance
"""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from src.agent import CustomerSupportAgent
from src.escalation import EscalationDecision, EscalationRouter
from src.reply_generator import GroundedReplyGenerator
from src.retrieval import HistoricalRetrievalIndex


# ==============================================================================
# Fixtures
# ==============================================================================

@pytest.fixture
def mock_conversations_file(tmp_path):
    """Creates a temporary JSONL conversation file for isolated retrieval testing."""
    convs = [
        {
            "conversation_id": 101,
            "brand": "AmazonHelp",
            "turns": [
                {"inbound": True, "tweet_id": 1001, "text_cleaned": "Where is my package? It was supposed to arrive yesterday."},
                {"inbound": False, "tweet_id": 1002, "text_cleaned": "Please send us a DM with your tracking ID so we can investigate."},
            ],
        },
        {
            "conversation_id": 102,
            "brand": "AppleSupport",
            "turns": [
                {"inbound": True, "tweet_id": 1003, "text_cleaned": "My iPhone screen keeps freezing after updating iOS."},
                {"inbound": False, "tweet_id": 1004, "text_cleaned": "We are here to help. Have you tried a force restart?"},
            ],
        },
        {
            "conversation_id": 999,  # Golden leak candidate
            "brand": "AmazonHelp",
            "turns": [
                {"inbound": True, "tweet_id": 9991, "text_cleaned": "This is a golden query that must be excluded."},
                {"inbound": False, "tweet_id": 9992, "text_cleaned": "Golden response that must not be in retrieval index."},
            ],
        },
    ]

    filepath = tmp_path / "test_conversations.jsonl"
    with open(filepath, "w", encoding="utf-8") as f:
        for c in convs:
            f.write(json.dumps(c) + "\n")

    golden_path = tmp_path / "test_golden.csv"
    golden_path.write_text("id,tweet_id,brand,text,intent,source_row_id,notes\n1,9991,AmazonHelp,Golden,test,0,notes\n", encoding="utf-8")

    sample_csv = tmp_path / "twcs_sample.csv"
    sample_csv.write_text("tweet_id,author_id,inbound,created_at,text,response_tweet_id,in_response_to_tweet_id,conversation_id\n9991,cust,True,date,text,,0,999\n", encoding="utf-8")

    return filepath, golden_path


# ==============================================================================
# Task 2: Retrieval Tests
# ==============================================================================

class TestRetrievalIndex:
    def test_build_index_and_search(self, mock_conversations_file):
        conv_path, golden_path = mock_conversations_file
        index = HistoricalRetrievalIndex(conversations_path=conv_path, golden_path=golden_path)
        index.build_index()

        assert index._is_indexed
        # Conversation 999 must be strictly excluded due to golden set overlap
        indexed_conv_ids = [p["conversation_id"] for p in index.qa_pairs]
        assert 101 in indexed_conv_ids
        assert 102 in indexed_conv_ids
        assert 999 not in indexed_conv_ids

        # Test search query
        results = index.search("Where is my package and delivery tracking?", top_k=1)
        assert len(results) == 1
        assert results[0]["conversation_id"] == 101
        assert results[0]["similarity"] > 0.05
        assert "tracking" in results[0]["response"].lower() or "package" in results[0]["query"].lower()

    def test_search_brand_filter_and_fallback(self, mock_conversations_file):
        conv_path, golden_path = mock_conversations_file
        index = HistoricalRetrievalIndex(conversations_path=conv_path, golden_path=golden_path)
        index.build_index()

        # Query matching iPhone with AppleSupport brand
        results = index.search("iPhone screen freezing", top_k=1, brand="AppleSupport")
        assert len(results) == 1
        assert results[0]["brand"] == "AppleSupport"

        # Query with non-matching brand falls back gracefully to cross-brand top match
        fallback_results = index.search("iPhone screen freezing", top_k=1, brand="NonExistentBrand")
        assert len(fallback_results) == 1
        assert fallback_results[0]["brand"] == "AppleSupport"

    def test_empty_query_returns_empty_list(self, mock_conversations_file):
        conv_path, golden_path = mock_conversations_file
        index = HistoricalRetrievalIndex(conversations_path=conv_path, golden_path=golden_path)
        index.build_index()

        assert index.search("") == []
        assert index.search("   ") == []


# ==============================================================================
# Task 4: Escalation Tests
# ==============================================================================

class TestEscalationRouter:
    def setup_method(self):
        self.router = EscalationRouter(confidence_threshold=0.45, similarity_threshold=0.15)

    def test_auto_handle_routine_safe_query(self):
        res = self.router.evaluate(
            query="When will the new update roll out for iOS?",
            intent="product_inquiry_availability",
            confidence=0.85,
            top_similarity=0.35,
            brand="AppleSupport",
        )
        assert res["decision"] == EscalationDecision.AUTO_HANDLE
        assert res["risk_score"] < 0.30
        assert len(res["triggered_flags"]) == 0

    def test_escalate_on_critical_legal_keyword(self):
        res = self.router.evaluate(
            query="I will hire a lawyer and sue you in court for this",
            intent="complaint_poor_service",
            confidence=0.90,
            top_similarity=0.40,
        )
        assert res["decision"] == EscalationDecision.ESCALATE_HUMAN
        assert any("Legal dispute" in flag for flag in res["triggered_flags"])
        assert res["risk_score"] >= 0.90

    def test_escalate_on_human_agent_request(self):
        res = self.router.evaluate(
            query="Let me speak to a human representative immediately",
            intent="complaint_poor_service",
            confidence=0.80,
            top_similarity=0.30,
        )
        assert res["decision"] == EscalationDecision.ESCALATE_HUMAN
        assert any("Explicit customer request for human" in flag for flag in res["triggered_flags"])

    def test_escalate_on_security_intent(self):
        res = self.router.evaluate(
            query="I forgot my password and my account is locked out",
            intent="account_access_security",
            confidence=0.92,
            top_similarity=0.45,
        )
        assert res["decision"] == EscalationDecision.ESCALATE_HUMAN
        assert any("SECURITY_INTENT" in flag for flag in res["triggered_flags"])

    def test_escalate_on_low_confidence(self):
        res = self.router.evaluate(
            query="Hmm I am not sure what is going on here",
            intent="technical_hardware_software_bug",
            confidence=0.25,  # Below 0.45
            top_similarity=0.30,
        )
        assert res["decision"] == EscalationDecision.ESCALATE_HUMAN
        assert any("LOW_CONFIDENCE" in flag for flag in res["triggered_flags"])

    def test_escalate_on_weak_retrieval_grounding(self):
        res = self.router.evaluate(
            query="My delivery hasn't arrived yet",
            intent="order_delivery_issue",
            confidence=0.80,
            top_similarity=0.08,  # Below 0.15
        )
        assert res["decision"] == EscalationDecision.ESCALATE_HUMAN
        assert any("WEAK_GROUNDING" in flag for flag in res["triggered_flags"])


# ==============================================================================
# Task 3: Reply Generation Tests
# ==============================================================================

class TestReplyGenerator:
    def setup_method(self):
        self.generator = GroundedReplyGenerator(use_llm_if_available=False)

    def test_escalation_reply_does_not_promise_outcomes(self):
        res = self.generator.generate(
            query="Refund my $500 immediately!",
            intent="billing_payment_dispute",
            retrieved_examples=[],
            brand="AmazonHelp",
            escalation_decision=EscalationDecision.ESCALATE_HUMAN,
        )
        assert res["mode"] == "escalation_holding_template"
        assert "escalated this ticket to a human support representative" in res["reply"]
        # Must not fabricate promises
        assert "refunded" not in res["reply"].lower()
        assert "guarantee" not in res["reply"].lower()

    def test_local_grounded_reply_cleans_agent_mentions(self):
        examples = [
            {
                "conversation_id": 404,
                "query": "Where is my package?",
                "response": "@115712 We are checking this for you! Please DM us. ^KC",
                "similarity": 0.45,
                "brand": "AmazonHelp",
            }
        ]
        res = self.generator.generate(
            query="Where is my delivery?",
            intent="order_delivery_issue",
            retrieved_examples=examples,
            brand="AmazonHelp",
            escalation_decision=EscalationDecision.AUTO_HANDLE,
        )
        assert res["mode"] == "local_grounded_synthesis"
        # Must not copy raw Twitter handles or agent signatures
        assert "@115712" not in res["reply"]
        assert "^KC" not in res["reply"]
        assert "AmazonHelp" in res["reply"]

    def test_mocked_llm_generation_adapter(self):
        generator = GroundedReplyGenerator(use_llm_if_available=True)
        generator.gemini_key = "mock_key_not_real"

        with patch.object(generator, "_generate_with_llm", return_value="Mocked LLM grounded response."):
            res = generator.generate(
                query="Need assistance",
                intent="product_inquiry_availability",
                retrieved_examples=[{"conversation_id": 1, "query": "q", "response": "r", "similarity": 0.5}],
                brand="TestBrand",
                escalation_decision=EscalationDecision.AUTO_HANDLE,
            )
            assert res["mode"] == "llm_grounded"
            assert res["reply"] == "Mocked LLM grounded response."


# ==============================================================================
# Task 5: End-to-End Agent Interface Tests
# ==============================================================================

class TestCustomerSupportAgent:
    @pytest.fixture(scope="module")
    def live_agent(self):
        """Initializes agent once for module testing."""
        return CustomerSupportAgent()

    def test_agent_structured_output_keys(self, live_agent):
        res = live_agent.process("My flight was delayed, can you help rebook? @Delta")

        assert "intent" in res
        assert "confidence" in res
        assert "retrieved_examples" in res
        assert "reply" in res
        assert "decision" in res
        assert "escalation_reason" in res
        assert "metadata" in res

        assert isinstance(res["confidence"], float)
        assert 0.0 <= res["confidence"] <= 1.0
        assert res["decision"] in [EscalationDecision.AUTO_HANDLE, EscalationDecision.ESCALATE_HUMAN]
        assert isinstance(res["retrieved_examples"], list)
        assert len(res["reply"]) > 10

    def test_agent_empty_input_handling(self, live_agent):
        res = live_agent.process("   ")
        assert res["decision"] == EscalationDecision.ESCALATE_HUMAN
        assert "EMPTY_INPUT" in res["escalation_reason"]
        assert res["confidence"] == 0.0

    def test_agent_batch_processing(self, live_agent):
        queries = [
            "My package arrived damaged @AmazonHelp",
            "I want to speak with a supervisor immediately",
        ]
        results = live_agent.process_batch(queries)
        assert len(results) == 2
        assert results[0]["intent"] == "order_delivery_issue"
        assert results[1]["decision"] == EscalationDecision.ESCALATE_HUMAN
