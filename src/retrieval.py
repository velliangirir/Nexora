"""Historical dialogue retrieval component for grounding customer support replies.

Indexes historical Q&A dialogue pairs from non-golden conversation threads
and retrieves top-k semantically relevant resolutions using TF-IDF cosine similarity.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONVERSATIONS_PATH = PROJECT_ROOT / "data" / "processed" / "conversations_sample.jsonl"
DEFAULT_GOLDEN_PATH = PROJECT_ROOT / "evaluation" / "golden_set.csv"


class HistoricalRetrievalIndex:
    """In-memory retrieval index over historical support conversations."""

    def __init__(
        self,
        conversations_path: Path = DEFAULT_CONVERSATIONS_PATH,
        golden_path: Path = DEFAULT_GOLDEN_PATH,
        ngram_range: tuple = (1, 2),
        max_features: int = 10000,
    ):
        self.conversations_path = Path(conversations_path)
        self.golden_path = Path(golden_path)
        self.ngram_range = ngram_range
        self.max_features = max_features

        self.vectorizer = TfidfVectorizer(
            ngram_range=ngram_range,
            max_features=max_features,
            sublinear_tf=True,
            strip_accents="unicode",
            lowercase=True,
        )

        self.qa_pairs: List[Dict[str, Any]] = []
        self.tfidf_matrix = None
        self._is_indexed = False

    def build_index(self) -> "HistoricalRetrievalIndex":
        """Builds the retrieval index from non-golden conversation threads."""
        if not self.conversations_path.exists():
            raise FileNotFoundError(f"Conversations file missing: {self.conversations_path}")

        golden_conv_ids: Set[int] = set()
        if self.golden_path.exists():
            golden_df = pd.read_csv(self.golden_path)
            golden_tids = set(golden_df["tweet_id"].astype(int))

            # Find matching conversation IDs to exclude
            sample_csv = self.conversations_path.parent / "twcs_sample.csv"
            if sample_csv.exists():
                sample_df = pd.read_csv(sample_csv)
                matching = sample_df[sample_df["tweet_id"].isin(golden_tids)]
                golden_conv_ids = set(matching["conversation_id"].astype(int))

        pairs: List[Dict[str, Any]] = []
        with open(self.conversations_path, "r", encoding="utf-8") as f:
            for line in f:
                line_str = line.strip()
                if not line_str:
                    continue
                conv = json.loads(line_str)
                cid = int(conv.get("conversation_id", 0))

                # Zero leakage: strictly exclude golden conversation threads
                if cid in golden_conv_ids:
                    continue

                turns = conv.get("turns", [])
                if len(turns) >= 2 and turns[0].get("inbound") and not turns[1].get("inbound"):
                    query_text = str(turns[0].get("text_cleaned", "")).strip()
                    reply_text = str(turns[1].get("text_cleaned", "")).strip()
                    brand = str(conv.get("brand", "unknown"))

                    if len(query_text) >= 15 and len(reply_text) >= 15:
                        pairs.append(
                            {
                                "query": query_text,
                                "response": reply_text,
                                "brand": brand,
                                "conversation_id": cid,
                                "customer_tweet_id": int(turns[0].get("tweet_id", 0)),
                                "agent_tweet_id": int(turns[1].get("tweet_id", 0)),
                            }
                        )

        if not pairs:
            raise ValueError("No valid historical dialogue pairs found for indexing.")

        self.qa_pairs = pairs
        queries = [p["query"] for p in self.qa_pairs]
        self.tfidf_matrix = self.vectorizer.fit_transform(queries)
        self._is_indexed = True
        return self

    def search(
        self,
        query: str,
        top_k: int = 3,
        brand: Optional[str] = None,
        min_similarity: float = 0.05,
    ) -> List[Dict[str, Any]]:
        """Retrieves top-k historical resolutions most semantically similar to the input query."""
        if not self._is_indexed or self.tfidf_matrix is None:
            self.build_index()

        clean_q = str(query).strip()
        if not clean_q:
            return []

        q_vec = self.vectorizer.transform([clean_q])
        scores = cosine_similarity(q_vec, self.tfidf_matrix)[0]

        # Apply brand filter if specified and enough brand candidates exist
        indices = np.argsort(scores)[::-1]

        results: List[Dict[str, Any]] = []
        for idx in indices:
            score = float(scores[idx])
            if score < min_similarity:
                break

            item = self.qa_pairs[idx]
            if brand and item["brand"].lower() != brand.lower():
                continue

            results.append(
                {
                    "query": item["query"],
                    "response": item["response"],
                    "brand": item["brand"],
                    "similarity": round(score, 4),
                    "conversation_id": item["conversation_id"],
                }
            )

            if len(results) >= top_k:
                break

        # Fallback: if brand filter yielded zero matches, return top cross-brand matches
        if not results and brand is not None:
            return self.search(query, top_k=top_k, brand=None, min_similarity=min_similarity)

        return results
