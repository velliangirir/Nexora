# Project Plan: AI Customer Support Agent (Hiver SDE Assignment)

## Objective
Build a lightweight, production-quality AI customer support agent evaluated on a representative subset of the *Customer Support on Twitter* dataset. The agent must:
1. Classify incoming customer messages into defined intents.
2. Draft a reply grounded in historical brand resolutions.
3. Decide whether to auto-handle or escalate to a human with a clear rationale.
4. Provide a golden evaluation set (150–250 examples), an automated + LLM-as-judge evaluation harness, two baselines, a failure analysis, and a decision log.

---

## Phases Breakdown

### Phase 1 — Project Setup and Dataset Inspection (Current)
- Initialize project directory structure (`data/`, `src/`, `scripts/`, `evaluation/`, `tests/`, `results/`, `report/`).
- Verify local environment and locate the *Customer Support on Twitter* dataset (`twcs.csv`).
- Document dataset download requirements, schema, and raw data constraints.
- Create initial `README.md`, `requirements.txt`, `report/decision_log.md`, and `report/project_plan.md`.
- Establish basic verification tests for environment readiness.

### Phase 2 — Data Preprocessing and Representative Sampling
- Reconstruct complete multi-turn conversation threads from `twcs.csv` using `tweet_id`, `in_response_to_tweet_id`, and `response_tweet_id`.
- Select a high-volume, representative target brand (e.g., AppleSupport, AmazonHelp, or Delta) with rich support interactions.
- Filter out noise, bot echoes, and incomplete singletons.
- Extract a clean, stratified, representative subsample (e.g., 5,000–10,000 conversation pairs) for fast experimentation and evaluation.
- Save processed data into `data/processed/` with strict determinism (fixed random seeds).

### Phase 3 — Intent Definition and Golden Evaluation Set
- Analyze customer query clusters in the processed sample to define 5–8 high-impact customer intents (e.g., order/shipping status, account access/auth, technical trouble/bugs, billing/refunds, general inquiry/feedback).
- Construct a hand-labelled golden evaluation set of 150–250 examples.
- For each example, label:
  - Ground truth intent
  - Ground truth brand reply reference
  - Ground truth escalation decision (Auto-handle vs Human Escalation) and reason
- Document the sampling strategy, distribution, and annotation guidelines in `evaluation/golden_set_notes.md`.

### Phase 4 — Baselines
- Implement **Baseline 1 (Trivial)**:
  - Classification: Majority-class intent prediction.
  - Reply: Generic static template response.
  - Escalation: Heuristic rule (e.g., always auto-handle or always escalate).
- Implement **Baseline 2 (Simple)**:
  - Classification: TF-IDF + Logistic Regression / Naive Bayes (or keyword rule engine).
  - Reply: Nearest-neighbor retrieval using BM25 or TF-IDF over historical brand responses.
  - Escalation: Keyword/sentiment-based heuristic (e.g., sentiment trigger words like "lawyer", "angry", "broken").
- Evaluate both baselines on the golden set to establish benchmark numbers.

### Phase 5 — AI Support Agent
- Implement the core agent pipeline in `src/`:
  1. **Intent Classifier**: Semantic intent classifier (few-shot prompting / lightweight embedding classifier).
  2. **Historical Knowledge Retriever & Reply Generator**: Retrieve relevant historical brand resolutions from the processed vector/index store and generate a grounded, brand-appropriate response.
  3. **Escalation & Safety Router**: Determine auto-handle vs. escalate to human based on confidence, issue sensitivity, policy risk, and customer frustration, returning a structured decision with an explicit explanation.
- Build clean, modular interfaces for running single predictions and batch evaluation.

### Phase 6 — Evaluation and Failure Analysis
- Implement automated metrics:
  - Intent classification: Accuracy, macro F1, per-class precision/recall.
  - Reply generation: Overlap metrics (BLEU, ROUGE) and semantic similarity.
  - Escalation: Precision, recall, and false-negative rate (critical: missed escalations).
- Implement LLM-as-judge rubric:
  - Criteria: Groundedness, relevance, tone, safety, escalation correctness.
  - Compute human-judge agreement on the golden set (correlation / Cohen's kappa).
- Conduct deep failure analysis:
  - Identify at least 5 distinct real failure modes with concrete examples, hypotheses, and mitigation strategies.

### Phase 7 — Report, README, Reproducibility, and Final Cleanup
- Write the final comprehensive report (under 6 pages):
  - Problem framing and scope ("what good means" and non-goals).
  - Results versus trivial and simple baselines.
  - Detailed failure analysis (5+ concrete modes).
  - Mandatory section: *"What's misleading about my headline number?"*
  - *"What we would do next with one more week."*
- Complete the 10–15 item decision log in `report/decision_log.md`.
- Polish `README.md` with clear instructions allowing an evaluator to reproduce headline results in under 15 minutes.
- Final code cleanup and end-to-end integration test.
