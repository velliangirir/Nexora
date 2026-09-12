# AI Customer Support Agent (Hiver SDE Assignment)

An intelligent, grounded customer support agent built and evaluated on customer-brand dialogue from Twitter. The system automates front-line triage by classifying incoming queries, retrieving historically effective brand resolutions to draft grounded replies, and making safety-aware auto-handling versus escalation decisions.

---

## 1. Problem Statement

Customer support teams face high ticket volumes with repetitive inquiries alongside complex, sensitive escalations. This project designs a transparent, reliable AI customer support agent that operates on real customer service interactions.

For any incoming customer message, the system must:
1. **Classify Intent**: Categorize the query into a defined set of domain-specific customer intents.
2. **Draft Grounded Replies**: Formulate a response grounded in historical resolutions crafted by human support representatives for similar past inquiries.
3. **Route & Escalate**: Decide whether the message can be safely auto-handled or requires human intervention, providing an explicit and auditable justification.

---

## 2. Planned System Components

The agent architecture comprises three modular components:

```
[Incoming Customer Message]
           │
           ▼
┌───────────────────────────────┐
│   1. Intent Classification    │ ──► [Predicted Intent]
└───────────────────────────────┘
           │
           ▼
┌───────────────────────────────┐
│   2. Historical Grounding &   │ ──► [Draft Grounded Reply]
│      Reply Generation         │
└───────────────────────────────┘
           │
           ▼
┌───────────────────────────────┐
│   3. Escalation Decision      │ ──► [Auto-Handle vs Escalate + Reason]
│      Engine                   │
└───────────────────────────────┘
```

1. **Intent Classifier**: Maps queries into 5–8 high-frequency customer intents derived from conversation clustering.
2. **Knowledge Retrieval & Reply Generator**: Indexes historical brand responses, retrieves top-k relevant resolution patterns, and synthesizes a contextually accurate, brand-aligned draft.
3. **Escalation & Safety Router**: Evaluates confidence, sensitive keywords, sentiment severity, and policy boundaries to decide whether human support intervention is necessary.

---

## 3. Dataset Information

### Primary Dataset: *Customer Support on Twitter*
- **Source**: Kaggle (`thoughtvector/customer-support-on-twitter`)
- **Total Corpus**: ~2.81 million tweets across multi-turn customer-brand conversations (492.58 MB uncompressed).

### Subsampling & Representative Sample Generation
The full 2.81M tweet corpus is too large and heterogeneous for an evaluator to run on a standard machine in under 15 minutes. In Phase 2, we built a memory-efficient preprocessing pipeline that extracts a balanced, stratified representative sample of **10,000 complete conversation threads** (30,396 tweets) spanning **103 brands** across all major domains (tech, travel, e-commerce, telecom, food, delivery).

Raw data is stored in `data/raw/twcs.csv` (strictly read-only and immutable), and preprocessed artifacts are generated under `data/processed/`.

---

## 4. Implemented Baselines & Performance

Two foundational baselines were implemented in `src/baselines.py` and evaluated against the held-out Golden Evaluation Set ($N = 200$, 20 examples per intent class):

| Baseline Model | Type / Architecture | Golden Accuracy | Golden Macro-F1 | Golden Weighted-F1 |
| :--- | :--- | :---: | :---: | :---: |
| **Baseline 1 (Trivial)** | Majority Class Heuristic (`order_delivery_issue`) | **10.00%** | **0.0182** | **0.0182** |
| **Baseline 2 (Simple ML)**| Word/Bi-gram TF-IDF + Logistic Regression | **88.00%** | **0.8795** | **0.8795** |

- **Zero Data Leakage**: Models were trained on 861 non-golden customer inquiries (`data/processed/train_intents.csv`) and validated on 216 examples (`data/processed/val_intents.csv`). Golden test tweets and their parent conversations were strictly excluded.
- Detailed per-intent precision, recall, confusion matrix, and feature importances are documented in [`report/baselines.md`](report/baselines.md) and archived under [`results/baselines/`](results/baselines/).

---

## 5. Evaluation Approach & Golden Benchmark

The system is evaluated against a curated, hand-audited **Golden Evaluation Set of 200 real customer inquiries** (`evaluation/golden_set.csv`):

### 10-Class Intent Taxonomy:
1. `flight_travel_disruption`: Aviation and transit delays, cancellations, and baggage loss.
2. `order_delivery_issue`: Shipment delays, missing food/packages, and courier tracking problems.
3. `technical_hardware_software_bug`: OS update bugs, mobile app crashes, battery drain, and hardware glitches.
4. `billing_payment_dispute`: Disputed line-item fees, double-charging, and promo code checkout errors.
5. `account_access_security`: Login lockouts, 2FA failures, password recovery, and account safety.
6. `service_outage_connectivity`: Broadband outages, lack of cellular signal, and server disconnections.
7. `subscription_cancellation_refund`: Requests to terminate memberships, cancel orders, or process returns.
8. `product_inquiry_availability`: Pre-purchase queries regarding store hours, stock inventory, and menus.
9. `complaint_poor_service`: Escalations regarding rude support agents, long hold times, or poor service.
10. `feedback_praise_resolution`: Positive feedback, compliments, and post-resolution customer appreciation.

### Evaluation Metrics Planned:
1. **Automated Metrics**:
   - **Intent Accuracy & Macro-F1**: Precision, recall, and F1 across all 10 intent classes.
   - **Reply Overlap & Semantic Similarity**: ROUGE-L, BLEU, and semantic embedding cosine similarity against actual human agent replies.
   - **Escalation Precision, Recall, and False Negative Rate**: Explicitly measuring missed escalations.
2. **LLM-as-Judge Evaluation**:
   - Multi-dimensional rubric rating Groundedness, Relevance, Professional Tone, and Policy Safety.
3. **Failure Analysis**:
   - Concrete breakdown of failure modes with root-cause hypotheses and mitigation strategies.

---

## 6. Project Structure

```
hiver-sde-intern-assignment/
├── data/
│   ├── raw/                 # Immutable raw dataset (twcs.csv)
│   └── processed/           # Filtered, stratified sample & split datasets:
│       ├── twcs_sample.csv  # Flat tweet-level records with turn metadata (10.03 MB)
│       ├── conversations_sample.jsonl # Complete multi-turn dialogue trees (15.05 MB)
│       ├── train_intents.csv# Isolated training split for ML models (861 examples)
│       ├── val_intents.csv  # Isolated validation split for tuning (216 examples)
│       └── sample_metadata.json # Stratification distributions & metadata
├── src/                     # Core agent source code
│   ├── preprocessing.py     # Streaming ingestion, cleaning & conversation sampler
│   └── baselines.py         # MajorityClassClassifier & TfidfLogisticRegressionClassifier
├── scripts/                 # Standalone execution scripts
│   ├── check_dataset.py     # Dataset presence and header checker
│   ├── analyze_dataset.py   # Full 2.81M-row streaming statistics analyzer
│   ├── build_golden_set.py  # Curates and builds 200-example golden set
│   └── train_evaluate_baselines.py # Trains and benchmarks baselines on golden set
├── evaluation/              # Evaluation harness and ground-truth benchmark
│   ├── golden_set.csv       # 200 hand-audited golden evaluation examples
│   └── labeling_guide.md    # Definitive taxonomy definitions and priority rules
├── tests/                   # Automated unit & integration tests
│   ├── test_phase1.py       # Setup & structure verification
│   ├── test_preprocessing.py# Preprocessing, normalization & thread reconstruction tests
│   ├── test_golden_set.py   # Golden set size, uniqueness, and taxonomy conformance tests
│   └── test_baselines.py    # Baseline model logic, zero leakage & artifacts validation
├── results/                 # Evaluation outputs, predictions, and metric logs
│   ├── dataset_statistics.json # Verified dataset statistics across full 2.81M corpus
│   └── baselines/           # Phase 4 evaluation outputs:
│       ├── baseline_results.json # Full metrics, per-class report & top features
│       ├── confusion_matrix_baseline1.csv # Majority class confusion matrix
│       ├── confusion_matrix_baseline2.csv # TF-IDF + Logistic Regression matrix
│       ├── predictions_baseline1.csv      # Majority class predictions on golden set
│       └── predictions_baseline2.csv      # TF-IDF + LR predictions on golden set
├── report/                  # Documentation and reports
│   ├── project_plan.md      # 7-Phase implementation roadmap
│   ├── decision_log.md      # Architectural and engineering decision log
│   ├── data_analysis.md     # Comprehensive Phase 2 empirical analysis report
│   ├── intent_taxonomy.md   # 10-Class intent definitions, routing, and examples
│   ├── golden_set.md        # Golden set analysis, class balance, and ambiguity review
│   └── baselines.md         # Baseline evaluation report, error analysis & matrices
├── README.md                # Project documentation and quickstart
├── requirements.txt         # Minimal project dependencies
├── package.json             # NPM scripts wrapper
└── .gitignore               # Ignored files, caches, and datasets
```

---

## 6. AI Customer Support Agent (Phase 5)

In Phase 5, the full end-to-end agent was built across `src/agent.py`, `src/retrieval.py`, `src/escalation.py`, and `src/reply_generator.py`.

### Architecture & Pipeline Flow
```
Customer Query ➔ Intent Classification ➔ Historical Dialogue Retrieval ➔ Escalation/Safety Policy ➔ Grounded Reply
```

1. **Intent Classification**: Evaluates input against the 10 domain intents with calibrated confidence probabilities ($P_{\max}$).
2. **Historical Retrieval**: In-memory TF-IDF index over 8,918 non-golden historical support conversations (`conversations_sample.jsonl`), returning top-k relevant brand resolutions without golden benchmark leakage.
3. **Escalation & Safety Engine**: Determines `AUTO_HANDLE` vs `ESCALATE_HUMAN` based on confidence (< 0.45), retrieval grounding (< 0.15), legal/crisis keywords, human handoff requests, and high-risk security intents (`account_access_security`).
4. **Grounded Reply Synthesis**: Produces actionable, empathetic responses grounded in historical precedents. Operates in deterministic local mode by default (zero API keys required, zero hallucination risk), with an optional isolated LLM adapter.

Full architectural specifications, data flows, and non-goals are detailed in [`report/system_design.md`](report/system_design.md).

---

## 7. Repository Layout

```
hiver_sde_intern_assignment/
├── data/
│   ├── raw/
│   │   └── twcs.csv                 # Raw dataset (strictly read-only)
│   └── processed/
│       ├── twcs_sample.csv          # Sampled tweets (30,396 rows)
│       ├── conversations_sample.jsonl # 10,000 reconstructed threads
│       ├── train_intents.csv        # 861 isolated training queries
│       └── val_intents.csv          # 216 isolated validation queries
├── evaluation/
│   ├── golden_set.csv               # 200 audited golden test instances
│   └── labeling_guide.md            # Annotation guidelines & priority rules
├── src/
│   ├── agent.py                     # Unified CustomerSupportAgent interface
│   ├── baselines.py                 # Majority and TF-IDF LogReg classifiers
│   ├── escalation.py                # Auditable escalation router & policy engine
│   ├── preprocessing.py             # Stratified sampling & conversation reconstruction
│   ├── reply_generator.py           # Grounded reply generation & holding templates
│   └── retrieval.py                 # In-memory historical dialogue retrieval index
├── scripts/
│   ├── analyze_dataset.py           # Full 2.81M streaming dataset inspector
│   ├── build_golden_set.py          # Golden benchmark builder & auditor
│   ├── check_dataset.py             # Schema & integrity verification
│   ├── run_agent.py                 # Interactive agent CLI & batch CSV processor
│   └── train_evaluate_baselines.py  # Baseline training & evaluation runner
├── report/
│   ├── decision_log.md              # Architectural & experimental rationale
│   ├── dataset_analysis.md          # 2.81M tweet statistical analysis
│   ├── intent_taxonomy.md           # 10 domain customer support intents
│   ├── baselines.md                 # Baseline benchmark evaluation report
│   ├── system_design.md             # Complete agent system design & boundaries
│   └── project_plan.md              # Multi-phase engineering roadmap
├── tests/
│   ├── test_phase1.py               # Repository structure & baseline integrity
│   ├── test_preprocessing.py        # Text cleaning, tree builder, sampling tests
│   ├── test_golden_set.py           # Golden benchmark balance & quality tests
│   ├── test_baselines.py            # Baseline model & zero-leakage tests
│   └── test_agent.py                # Retrieval, escalation, reply, and agent tests
├── package.json                     # Unified npm run-scripts
├── requirements.txt                 # Core Python dependencies
└── .gitignore                       # Caches, virtual environments, and raw data
```

---

## 7. Comprehensive Evaluation & Experimental Results (Phase 6)

The system was evaluated against the 200-example Golden Evaluation Set (`evaluation/golden_set.csv`) across intent classification, multi-dimensional reply quality, inter-rater human agreement, and escalation safety.

### Actual Experimental Headline Metrics

| Evaluation Dimension | Metric | Actual Experimental Result | Benchmark / Baseline Comparison |
| :--- | :--- | :---: | :--- |
| **Intent Classification** | Golden Test Accuracy | **88.00%** (176 / 200) | Majority Baseline: 10.00% (+78.0% gain) |
| **Intent Classification** | Golden Test Macro-F1 | **0.8795** | Majority Baseline: 0.0182 (+0.861 gain) |
| **Intent Classification** | Weighted-F1 | **0.8795** | Baseline 2 (TF-IDF LogReg): 0.8795 |
| **Reply Quality (Rubric)**| Relevance Score | **4.93 / 5.0** | 100% aligned with customer issue |
| **Reply Quality (Rubric)**| Correctness Score | **5.00 / 5.0** | Procedurally sound self-service guidance |
| **Reply Quality (Rubric)**| Groundedness Score | **4.96 / 5.0** | Rooted in 8,918 historical precedents |
| **Reply Quality (Rubric)**| Helpfulness Score | **5.00 / 5.0** | Clear actionable next steps (DM / links) |
| **Reply Quality (Rubric)**| Safety Score | **5.00 / 5.0** | **0 hallucinations** / false promises |
| **Reply Quality (Rubric)**| Overall Composite Score | **4.98 / 5.0** | Rubric target: $\ge 4.0 / 5.0$ |
| **Human Agreement** | Overall Exact Agreement | **96.0%** ($24 / 25$) | Evaluated on audited human review subset |
| **Human Agreement** | Agreement within 1 pt | **100.0%** ($25 / 25$) | Mean Absolute Difference (MAD): **0.0080** |
| **Human Agreement** | Pearson Correlation ($r$) | **0.8908** | Strong positive inter-rater agreement |
| **Escalation Safety** | Auto-Handle Safety Rate | **90.91%** ($20 / 22$) | $20$ safe auto-handles, $2$ dangerous FNs |
| **Escalation Routing** | Escalation Recall | **97.62%** ($82 / 84$) | $82$ high-risk cases escalated to human |
| **Escalation Routing** | Overall Routing Accuracy| **51.00%** ($102 / 200$)| Conservative safety bias (96 FPs) |

- **Critical Failure Analysis**: 5 genuine, non-trivial failure modes are documented in [`report/failure_analysis.md`](report/failure_analysis.md) (covering polysemy, bitter sarcasm, compound queries, rideshare boundaries, and regex guardrail fragility).
- **Misleading Headline Number Analysis**: A detailed critique explaining why 88.0% intent accuracy and 90.9% safety rates can be deceptive is documented in [`report/misleading_headline_number.md`](report/misleading_headline_number.md).
- **Reply Quality Rubric**: Standardized 5-dimension scoring criteria are documented in [`evaluation/reply_quality_rubric.md`](evaluation/reply_quality_rubric.md).
- **Human Review Audits**: 25 human-reviewed responses are archived in [`evaluation/human_review.csv`](evaluation/human_review.csv).

---

## 8. Where Results Appear

All raw experimental logs, per-class breakdowns, and confusion matrices are saved under `results/`:
```
results/
├── final_intent_results.json        # Intent classification metrics & baseline comparisons
├── final_intent_results.csv         # Per-intent precision, recall, and F1 breakdown
├── intent/
│   ├── intent_metrics.json          # Full classification metrics
│   ├── per_class_metrics.csv        # Per-class table
│   └── confusion_matrix.csv         # 10x10 confusion matrix
├── replies/
│   ├── generated_replies.json       # All 200 generated responses with metadata
│   ├── reply_quality_scores.csv     # 5-dimension rubric scores for every reply
│   ├── reply_quality_summary.json   # Dimension averages and safety rates
│   └── human_agreement_metrics.json # Inter-rater agreement statistics
├── escalation/
│   ├── escalation_metrics.json      # TP, TN, FP, FN, precision, recall, safety rate
│   └── escalation_cases.csv         # Case-by-case audit for all 200 decisions
└── summary/
    ├── evaluation_summary.json      # Unified machine-readable evaluation report
    └── evaluation_summary.md        # Formatted executive dashboard
```

---

## 9. How to Run Scripts & Tests

All scripts run deterministically on CPU on any standard laptop without external API keys.

### 1. Run the Full Evaluation Harness (Phase 6)
Executes intent evaluation, generates replies for all 200 golden queries, scores rubric quality, evaluates escalation safety, and generates all results artifacts:
```bash
npm run evaluate
# or: py -3 scripts/run_full_evaluation.py
```
- **Expected Runtime**: ~10 seconds.

### 2. Run the AI Support Agent (CLI Demo)
Process single customer inquiries:
```bash
# Auto-handled inquiry:
py -3 scripts/run_agent.py --text "My flight got cancelled and I need assistance rebooking @Delta"

# Escalation to human (security risk):
py -3 scripts/run_agent.py --text "Someone compromised my account and changed my password @AppleSupport"
```

### 3. Run Automated Tests
Runs all unit and integration tests across data preprocessing, golden set balance, baseline models, retrieval index, escalation routing, reply generation, and evaluation metrics:
```bash
npm test
# or: py -3 -m pytest tests/
```
- **Expected Runtime**: ~15–18 seconds (**49 passing tests**, 0 failures).

### 4. Train & Evaluate Baselines
Trains Baseline 1 and Baseline 2 on isolated training data and evaluates on the golden test set:
```bash
npm run train-baselines
# or: py -3 scripts/train_evaluate_baselines.py
```
- **Expected Runtime**: ~2 seconds.

# Hiver_intern






