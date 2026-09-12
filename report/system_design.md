# System Design: AI Customer Support Agent

This document outlines the architecture, component design, data flow, engineering rationale, safety guarantees, and known operational boundaries of the AI Customer Support Agent developed in Phase 5.

---

## 1. System Architecture

The AI Customer Support Agent implements a sequential, defense-in-depth pipeline designed for high throughput, sub-100ms response latencies, zero hallucination risk, and auditable routing decisions.

```
                    Incoming Customer Message
                                │
                                ▼
            ┌───────────────────────────────────────┐
            │   Stage 1: Intent Classification      │
            │   (TF-IDF + Regularized LogReg)       │
            └───────────────────┬───────────────────┘
                                │ Intent & Confidence (P_max)
                                ▼
            ┌───────────────────────────────────────┐
            │   Stage 2: Historical Retrieval       │
            │   (TF-IDF Cosine Similarity on Q&A)   │
            └───────────────────┬───────────────────┘
                                │ Top-k Dialogue Pairs & Top Similarity (S_max)
                                ▼
            ┌───────────────────────────────────────┐
            │   Stage 3: Escalation & Safety Router │
            │   (Confidence, Similarity, Risk Rules)│
            └───────────────────┬───────────────────┘
                                │ Routing Decision: AUTO_HANDLE vs ESCALATE_HUMAN
                                ▼
            ┌───────────────────────────────────────┐
            │   Stage 4: Grounded Reply Generation  │
            │   (Evidence Synthesis / Holding Temp) │
            └───────────────────┬───────────────────┘
                                │
                                ▼
                    Structured Agent Output
  { intent, confidence, retrieved_examples, reply, decision, reason }
```

---

## 2. Core Components

### 2.1. Intent Classification Engine (`src/baselines.py`, `src/agent.py`)
- **Selected Implementation**: Sublinear Word & Bi-gram TF-IDF (1–2 n-grams, 5,000 max features, unicode normalization) paired with L2-regularized multi-class Logistic Regression (`C=1.0`, balanced class weights).
- **Outputs**:
  - `predicted_intent`: Categorical label mapped to the 10-class domain taxonomy.
  - `confidence`: Softmax probability of the winning class ($P_{\max} \in [0.0, 1.0]$).
- **Selection Rationale**:
  - Evaluated in Phase 4 on the 200-example golden benchmark, delivering **88.0% Accuracy** and **0.8795 Macro-F1**, outperforming the majority baseline by +78.0% absolute.
  - Sub-millisecond inference time per tweet with zero GPU requirements and zero token costs.
  - Transparent feature attributions via linear model coefficients.

### 2.2. Historical Retrieval Index (`src/retrieval.py`)
- **Selected Implementation**: In-memory TF-IDF vector space with cosine similarity ranking.
- **Index Corpus**: 8,918 non-golden historical support dialogue turns extracted from `conversations_sample.jsonl`.
- **Outputs**:
  - `retrieved_examples`: Top-$k$ (default 3) historical customer inquiries, corresponding brand replies, brand handles, and conversation IDs.
  - `top_similarity`: Highest cosine similarity score ($S_{\max} \in [0.0, 1.0]$).
- **Selection Rationale**:
  - Fast, explainable word overlap matching directly relevant to domain terms (e.g., flight cancellation codes, tracking issues, error messages).
  - Strict zero-leakage enforcement: Any conversation thread containing an inquiry from `evaluation/golden_set.csv` is explicitly excluded during index construction.
  - Brand-scoped retrieval with automatic cross-brand fallback when brand-specific density is low.

### 2.3. Escalation & Safety Policy Router (`src/escalation.py`)
- **Selected Implementation**: Multi-signal rule-and-threshold policy engine.
- **Outputs**:
  - `decision`: `AUTO_HANDLE` or `ESCALATE_HUMAN`.
  - `reason`: Auditable semicolon-delimited explanation of all triggered conditions.
  - `risk_score`: Continuous metric ($[0.0, 1.0]$) reflecting cumulative risk severity.
  - `triggered_flags`: List of specific rule violations.
- **Decision Signals**:
  1. *Classifier Confidence*: Triggers escalation if $P_{\max} < 0.45$.
  2. *Retrieval Grounding*: Triggers escalation if $S_{\max} < 0.15$ (insufficient historical evidence).
  3. *High-Risk Keywords*: Regex patterns for legal threats (`lawsuit`, `attorney`, `sue`), law enforcement (`police`, `fbi`), financial fraud (`stolen card`, `unauthorized transaction`), and crisis situations (`self-harm`).
  4. *Customer Demand*: Explicit requests for human assistance (`speak to a human`, `supervisor`, `representative`).
  5. *Mandatory Security Intents*: `account_access_security` is unconditionally routed to human specialists.
  6. *Irreversible Account Actions*: Direct requests for flight cancellations, rebooking, or cash refunds requiring transactional ledger authority.
  7. *Severe Service Complaints*: `complaint_poor_service` flags for supervisor review.

### 2.4. Grounded Reply Generator (`src/reply_generator.py`)
- **Selected Implementation**: Dual-mode generation system:
  1. *Local Deterministic Synthesis (Default)*: Template and precedent-grounded generator that extracts action guidance from retrieved precedents (e.g., DM requests, tracking steps, update recommendations) while sanitizing raw customer Twitter handles and agent initials.
  2. *Isolated LLM Adapter (Optional)*: Plug-and-play adapter that interfaces with external LLM APIs (Gemini / OpenAI) via environment variables (`GEMINI_API_KEY`, `OPENAI_API_KEY`) when supplied, with graceful automatic fallback to local deterministic mode.
- **Hallucination Safeguards**:
  - Strict prohibition against inventing flight times, gate numbers, refund promises, or claiming an action was already performed.
  - In `ESCALATE_HUMAN` scenarios, generates an empathetic holding message informing the customer of the transfer to a human specialist and requesting private verification details.

---

## 3. Data Flow & Execution Sequence

```
1. Customer Message:
   "My package was marked delivered but never arrived @AmazonHelp"

2. Intent Classification:
   Intent: order_delivery_issue
   Confidence: 0.8650

3. Historical Retrieval:
   Retrieved top-1: "My order was supposed to be delivered... tracking shows delivered"
   Response: "@customer We want to help! Please send us a DM with your tracking ID..."
   Top Similarity: 0.4120

4. Escalation Evaluation:
   Confidence (0.865) >= 0.45 [PASS]
   Top Similarity (0.412) >= 0.15 [PASS]
   Security Intent: False [PASS]
   Critical Keywords: None [PASS]
   Account Actions: None [PASS]
   --> Decision: AUTO_HANDLE
   --> Risk Score: 0.135

5. Grounded Reply Generation:
   Action: Direct Message tracking prompt
   Cleaned Output: "Hello, we apologize for the delivery delay. To help AmazonHelp look into your shipment status, please send us a Direct Message with your tracking number and delivery address."
```

---

## 4. Why Each Component Was Selected

| Component | Selected Approach | Alternative Rejected | Rationale |
| :--- | :--- | :--- | :--- |
| **Intent Classifier** | TF-IDF + Logistic Regression | Fine-tuned DeBERTa / RoBERTa | Logistic regression runs in < 2ms on CPU, reaches 88.0% F1, and requires no GPU memory or torch dependencies. |
| **Retrieval Engine** | TF-IDF Cosine Similarity | Dense Vector DB (Chroma, Pinecone) | TF-IDF vectorizer builds in 1.2s over 8,900 conversations with zero external services, zero port bindings, and zero cloud costs. |
| **Escalation Logic** | Multi-factor Rule & Threshold Engine | Black-box LLM Judge | Routing decisions must be deterministic, transparent, and auditable for compliance. Rules can be modified immediately without retraining. |
| **Reply Generator** | Local Grounded Synthesis + LLM Hook | Unconstrained LLM Chat | Free-form LLMs frequently hallucinate refund approvals, fake policies, and inaccurate timelines. Constrained generation eliminates liability. |

---

## 5. What Was Deliberately NOT Built

To ensure repository stability, evaluability, and defensibility, the following elements were deliberately excluded:

1. **Heavy Orchestration Frameworks (LangChain, CrewAI, LlamaIndex)**:
   - *Reason*: These frameworks introduce excessive abstraction layers, fragile dependency trees, and opaque prompt injection. A clean Python architecture ensures every line of code is inspectable and testable.
2. **Autonomous Transactional Tool Execution (Direct Account Mutations)**:
   - *Reason*: An automated agent should never possess unchecked permission to cancel tickets, debit accounts, or issue refunds on live APIs. Such intents are strictly diverted to human representatives.
3. **Heavy Cloud Vector Databases (Milvus, Pinecone, Qdrant)**:
   - *Reason*: Running an external database daemon is unnecessary for a representative support corpus and introduces environment setup friction for evaluators.
4. **Unbounded Autoregressive Text Generation**:
   - *Reason*: Open-ended language models without grounding guards invent fictional policies and fake commitments.

---

## 6. Known Limitations & Operational Boundaries

1. **Vocabulary Mismatch in Retrieval**:
   - TF-IDF relies on exact term overlap and n-grams. Paraphrases containing zero overlapping words (e.g., "my parcel went missing" vs "shipment undelivered") may receive lower similarity scores, occasionally triggering cautious escalation.
2. **Single-Turn Scoping**:
   - The current agent optimizes each inbound message as an atomic interaction. Multi-turn dialogue state tracking (e.g., remembering a tracking number provided two turns earlier) is deferred to full CRM integration.
3. **English-Only Specialization**:
   - The twcs corpus and preprocessing rules are tuned for English support interactions. Multilingual queries receive lower confidence scores and route safely to human escalation.
4. **Conservative Escalation Bias**:
   - The system is intentionally tuned to prefer false escalations (sending a safe query to a human) over false auto-handles (hallucinating an answer to an angry customer).
