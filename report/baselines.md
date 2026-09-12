# Baseline Intent Classification Report

This report presents the methodology, evaluation, and comparative performance of the initial baselines for intent classification on the Customer Support on Twitter corpus. Models were evaluated against the hand-audited **Golden Evaluation Set of 200 examples** (`evaluation/golden_set.csv`) across the 10-class taxonomy established in Phase 3.

---

## 1. Experimental Methodology & Data Isolation

### 1.1. Strict Data Isolation (Zero Leakage)
To maintain the integrity of the evaluation, data isolation protocols were enforced:
- **Test Set**: `evaluation/golden_set.csv` (200 examples, exactly 20 per intent) was **never seen** during training or hyperparameter selection.
- **Training Split**: Mined from non-golden customer inquiries in `data/processed/twcs_sample.csv`. All 200 golden tweet IDs and their corresponding parent conversation threads were explicitly excluded from the training pool.
- **Validation Split**: An 80/20 stratified train/validation split was created from the non-golden candidate pool (861 training examples, 216 validation examples).
- **Artifacts**: Persisted under `data/processed/train_intents.csv` and `data/processed/val_intents.csv`.

---

## 2. Baseline Models Overview

### Baseline 1: Majority Class Classifier (Trivial Heuristic)
- **Concept**: A simple zero-intelligence benchmark that identifies the most frequent intent in the training split and unconditionally predicts that class for every incoming query.
- **Why Selected**: Establishes the performance floor for any classification system. On a balanced 10-class test benchmark (where every class represents 10.0% of cases), a trivial majority-class predictor is expected to score approximately 10% accuracy and near-zero Macro-F1.
- **Learned Majority Class**: `order_delivery_issue` (120 / 861 training examples).

### Baseline 2: TF-IDF + Logistic Regression (Explainable Classical ML)
- **Concept**: A linear model operating over unigram and bigram TF-IDF representations.
- **Why Selected**:
  - Extremely fast to train (< 1 second) and evaluate (< 50ms) on a laptop.
  - Highly explainable: feature coefficients directly show which words trigger which intent.
  - Non-neural, robust baseline representing standard industrial NLP before introducing LLMs or large transformers.
- **Hyperparameters**:
  - Feature Extractor: `TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True, strip_accents='unicode')`
  - Classifier: `LogisticRegression(C=1.0, max_iter=1000, random_state=42, class_weight='balanced', solver='lbfgs')`

---

## 3. Overall Performance Comparison

Evaluated on the held-out **Golden Evaluation Set** ($N = 200$):

| Metric | Baseline 1 (Majority Class) | Baseline 2 (TF-IDF + Logistic Regression) | Delta (Absolute Improvement) |
| :--- | :---: | :---: | :---: |
| **Accuracy** | **10.00%** (0.1000) | **88.00%** (0.8800) | **+78.00%** |
| **Macro-F1** | **0.0182** | **0.8795** | **+0.8613** |
| **Weighted-F1**| **0.0182** | **0.8795** | **+0.8613** |

---

## 4. Detailed Per-Intent Performance (Baseline 2)

On the balanced 200-example golden set (support = 20 for all classes):

| Intent Class | Precision | Recall | F1-Score | Correct / 20 |
| :--- | :---: | :---: | :---: | :---: |
| `service_outage_connectivity` | 0.9524 | **1.0000** | **0.9756** | 20 / 20 |
| `flight_travel_disruption` | 0.9091 | **1.0000** | **0.9524** | 20 / 20 |
| `account_access_security` | 0.9500 | 0.9500 | **0.9500** | 19 / 20 |
| `product_inquiry_availability` | 0.9500 | 0.9500 | **0.9500** | 19 / 20 |
| `technical_hardware_software_bug` | 0.9048 | 0.9500 | **0.9268** | 19 / 20 |
| `complaint_poor_service` | 0.9000 | 0.9000 | **0.9000** | 18 / 20 |
| `feedback_praise_resolution` | **1.0000** | 0.7000 | **0.8235** | 14 / 20 |
| `billing_payment_dispute` | 0.8000 | 0.8000 | **0.8000** | 16 / 20 |
| `subscription_cancellation_refund`| 0.8333 | 0.7500 | **0.7895** | 15 / 20 |
| `order_delivery_issue` | 0.6667 | 0.8000 | **0.7273** | 16 / 20 |
| **Macro Average** | **0.8866** | **0.8800** | **0.8795** | **176 / 200** |

---

## 5. Confusion Matrix (Baseline 2)

Rows represent ground-truth labels; columns represent predicted labels:

| Actual \ Predicted | ACC | BIL | COM | FEE | FLI | ORD | PRO | SER | SUB | TEC | Recall |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`account_access_security` (ACC)** | **19** | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 95.0% |
| **`billing_payment_dispute` (BIL)** | 0 | **16** | 0 | 0 | 1 | 0 | 0 | 1 | 1 | 1 | 80.0% |
| **`complaint_poor_service` (COM)** | 0 | 0 | **18** | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 90.0% |
| **`feedback_praise_resolution` (FEE)**| 0 | 0 | 0 | **14** | 1 | 3 | 0 | 0 | 1 | 1 | 70.0% |
| **`flight_travel_disruption` (FLI)** | 0 | 0 | 0 | 0 | **20** | 0 | 0 | 0 | 0 | 0 | **100.0%** |
| **`order_delivery_issue` (ORD)** | 0 | 2 | 0 | 0 | 0 | **16** | 1 | 0 | 1 | 0 | 80.0% |
| **`product_inquiry_availability` (PRO)**| 0 | 0 | 0 | 0 | 0 | 1 | **19** | 0 | 0 | 0 | 95.0% |
| **`service_outage_connectivity` (SER)**| 0 | 0 | 0 | 0 | 0 | 0 | 0 | **20** | 0 | 0 | **100.0%** |
| **`subscription_cancellation_refund` (SUB)**| 1 | 2 | 1 | 0 | 0 | 1 | 0 | 0 | **15** | 0 | 75.0% |
| **`technical_hardware_software_bug` (TEC)**| 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | **19** | 95.0% |

Raw matrix data is archived in [`results/baselines/confusion_matrix_baseline2.csv`](file:///e:/hiver_sde_intern_assignment/results/baselines/confusion_matrix_baseline2.csv).

---

## 6. Top Learned Features per Intent (Explainability)

Inspection of the highest positive coefficients in the logistic regression model confirms the model learned high-signal domain vocabulary rather than spurious brand mentions:

| Intent Class | Top Learned Words / N-grams |
| :--- | :--- |
| `flight_travel_disruption` | `delayed` (+3.42), `flight` (+3.19), `baggage` (+2.15), `tarmac` (+1.98), `cancel` (+1.71) |
| `service_outage_connectivity`| `internet` (+3.12), `down` (+2.98), `outage` (+2.85), `service` (+2.11), `wifi` (+1.95) |
| `account_access_security` | `password` (+3.46), `account` (+1.97), `sign` (+1.53), `my password` (+1.51), `locked` (+1.48) |
| `technical_hardware_software_bug` | `update` (+2.89), `ios` (+2.74), `crash` (+2.45), `battery` (+2.18), `buttons` (+1.92) |
| `complaint_poor_service` | `worst` (+3.21), `rude` (+2.54), `con artists` (+2.12), `hold for` (+1.95), `useless` (+1.89) |
| `product_inquiry_availability`| `stock` (+3.05), `hours` (+2.61), `in stock` (+2.42), `open` (+2.10), `store` (+1.98) |
| `billing_payment_dispute` | `charged` (+3.18), `fee` (+2.41), `promo code` (+2.15), `charge` (+2.01), `overcharged` (+1.94) |
| `subscription_cancellation_refund`| `cancel` (+3.15), `refund` (+2.89), `subscription` (+2.42), `return` (+2.01), `order` (+1.85) |

---

## 7. Error Analysis & Baseline Limitations

Although Baseline 2 achieves a strong 88.0% accuracy, qualitative inspection of the 24 misclassifications reveals systematic failure modes of bag-of-words linear models:

1. **Bag-of-Words Polysemy & Lexical Traps (Feedback vs Domain Issue)**:
   - *Example*: *"Thank you for quickly delivering my missing package today @AmazonHelp"*
   - *Ground Truth*: `feedback_praise_resolution`
   - *Predicted*: `order_delivery_issue`
   - *Root Cause*: Heavy linear weights on `package` and `delivering` overpowered `thank you`.
2. **Cancellation Overlap (`subscription_cancellation_refund` vs `billing_payment_dispute`)**:
   - *Example*: *"Cancel my order and refund the charge to my card immediately @AmazonHelp"*
   - *Ground Truth*: `subscription_cancellation_refund`
   - *Predicted*: `billing_payment_dispute`
   - *Root Cause*: High co-occurrence of financial terms (`refund`, `charge`, `card`) causes lexical confusion between subscription cancellation and billing disputes.
3. **Subtle Sarcasm**:
   - Linear models cannot capture syntactic inversion or ironic context (e.g., praise words paired with delay timestamps).

### Motivation for Future Phases
These failure modes highlight why Phase 5 will introduce contextual grounding, retrieval, and LLM reasoning. While TF-IDF captures explicit keywords, contextual models are required to parse customer sentiment, syntactic intent, and multi-sentence context.
