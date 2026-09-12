# Failure Analysis: AI Customer Support Agent

This document analyzes genuine failure modes identified through systematic empirical evaluation of the AI Customer Support Agent on the 200-example Golden Evaluation Set (`evaluation/golden_set.csv`).

Rather than focusing on trivial typos, this analysis investigates five structural, recurring failure patterns across intent classification, retrieval semantic grounding, multi-intent ambiguity, and safety escalation routing.

---

## Summary of Evaluated Failure Modes

| # | Failure Mode Category | Representative Query ID | Root Cause Mechanism | Severity Level |
| :-: | :--- | :---: | :--- | :---: |
| **1** | Word Sense Polysemy / Homonym Misclassification | ID #63 (AppleSupport) | Linear n-gram confusion between battery "charge" vs financial "charge" | Medium (Misrouting) |
| **2** | Pragmatic Sarcasm & Irony Inversion | ID #190 (AmazonHelp) | Lexical polarity inversion ("Thank you for waiting until delivery date") | Medium (Sentiment Masking) |
| **3** | Multi-Facet Bundle Queries (Non-delivery + Refund) | ID #28 (Tesco) | Competing high-weight intent tokens pulling probability distribution | Medium (Sub-optimal Route) |
| **4** | Domain Metaphor & Concept Drift (Rideshare vs Delivery) | ID #24 (Uber_Support) | Rideshare car cancellation confused with delivery fulfillment failure | Low (Domain Boundary Blur) |
| **5** | Regex Fragility in Safety Escalation Guardrails | ID #137 (GloCare) & #140 (Uber) | Keyword pattern mismatch on natural customer phrasing of refund claims | **CRITICAL (Dangerous Auto-Handle)** |

---

## Detailed Failure Mode Investigations

### Failure Mode 1: Word Sense Polysemy & Homonym Ambiguity (Battery "Charge" vs Financial "Charge")

- **Customer Message (ID #63)**:
  > `@AppleSupport this update sucks my phone needs to be charged 3 times a day, please fix. 100% this morning at 7:00 and it’s already at 49%.`
- **Brand**: AppleSupport
- **Expected Behavior**: Classify as `technical_hardware_software_bug` (hardware battery drain caused by OS update).
- **Model Behavior**:
  - Golden Label: Historically tagged under `billing_payment_dispute` due to raw presence of token `"charged"`.
  - Classifier Prediction: `technical_hardware_software_bug` (Confidence: $0.2879$).
  - Escalation Decision: `ESCALATE_HUMAN` (Low Confidence: $0.29 < 0.45$).
- **Why It Failed**:
  Linear bag-of-words and n-gram TF-IDF models treat the word `"charged"` as a strong indicator of billing disputes ($+1.84$ logistic regression coefficient for `billing_payment_dispute`). The model suffers from word sense polysemy: it cannot differentiate between an electrical battery charge and a monetary credit card charge without deeper contextual transformer embeddings.
- **Likely Cause**: Lack of contextualized token representations (e.g. BERT/DeBERTa) that condition token semantics on surrounding modifiers like `"phone"`, `"battery"`, and `"100%"`.
- **Possible Fix**:
  1. Incorporate contextual sentence transformers (e.g. `all-MiniLM-L6-v2`) to generate semantic embeddings before classification.
  2. Implement domain-specific feature masking where `"charged"` preceded by `"phone"`, `"battery"`, or `"device"` is mapped to hardware terms.

---

### Failure Mode 2: Pragmatic Sarcasm & Irony Inversion ("Thank You For Canceling")

- **Customer Message (ID #190)**:
  > `@115821 Bought 2 Christmas sweaters, scheduled to be delivered today. Excited to see them, except I received an email from Amazon the order was cancelled, it couldn't be filled. Thank you Amazon for waiting until the delivery date to tell us!`
- **Brand**: AmazonHelp
- **Expected Behavior**: Recognize acute customer frustration and fulfillment failure (`order_delivery_issue` or `complaint_poor_service`).
- **Model Behavior**:
  - Golden Label: Sarcastic praise instance intended to test sentiment inversion (`feedback_praise_resolution`).
  - Classifier Prediction: `order_delivery_issue` (Confidence: $0.3638$).
  - Escalation Decision: `ESCALATE_HUMAN` (Low Confidence: $0.36 < 0.45$).
- **Why It Failed**:
  The customer opens with positive anticipation ("Excited to see them") and concludes with polite phrasing ("Thank you Amazon"), yet the pragmatic meaning is severe disappointment. The classifier was pulled between `"thank you"` (strongest feature for `feedback_praise_resolution`) and `"cancelled"`, `"delivered"`, `"delivery date"` (strong features for `order_delivery_issue`).
- **Likely Cause**: Sarcasm relies on real-world contradiction between expectations (Christmas sweaters on delivery day) and reality (order canceled without notice). Surface text analysis cannot infer implicit frustration when polite sign-offs are used.
- **Possible Fix**:
  1. Add a sentiment-contrast feature: compute sentiment polarity of the opening clause vs the closing clause.
  2. Use an LLM-assisted zero-shot triage step on queries containing both praise markers (`"thank you"`) and failure markers (`"cancelled"`, `"broke"`, `"delay"`).

---

### Failure Mode 3: Multi-Facet Bundle Queries (Non-Delivery + Promised Refund)

- **Customer Message (ID #28)**:
  > `@Tesco thanks for the non delivery with no explanation. 3-5 day refund, now without shopping or my money. @sainsburys @117249 may be better?`
- **Brand**: Tesco
- **Expected Behavior**: Route primarily to grocery delivery fulfillment (`order_delivery_issue`).
- **Model Behavior**:
  - Golden Label: `order_delivery_issue`
  - Classifier Prediction: `subscription_cancellation_refund` (Confidence: $0.2730$).
  - Historical Retrieval: Cosine similarity $0.1412$ (Below $0.15$ threshold).
  - Escalation Decision: `ESCALATE_HUMAN` (Confidence: $0.27 < 0.45$, Grounding: $0.14 < 0.15$).
- **Why It Failed**:
  The message represents a multi-intent compound query: (1) an unfulfilled grocery delivery, (2) an in-progress refund timeline ("3-5 day refund"), and (3) a brand defection threat ("Sainsbury's may be better"). The tokens `"refund"` and `"money"` disproportionately activated the refund class, overpowering `"delivery"`.
- **Likely Cause**: Single-label classification constraints force mutually exclusive categorization on multi-issue tickets.
- **Possible Fix**:
  1. Transition from single-label multiclass to multi-label classification (sigmoid thresholds per intent).
  2. Implement an intent hierarchy resolver that gives operational primacy to root fulfillment failures over downstream refund tracking.

---

### Failure Mode 4: Domain Metaphor & Concept Drift (Rideshare vs Courier Delivery)

- **Customer Message (ID #24)**:
  > `I can't with @115873. Ordered car. Was outside. Driver drove past me. I had bags. Was walking to him. He canceled. I had to pay $5 + ⬇🌟`
- **Brand**: Uber_Support
- **Expected Behavior**: Recognize failed rideshare passenger pickup (`order_delivery_issue`).
- **Model Behavior**:
  - Golden Label: `order_delivery_issue`
  - Classifier Prediction: `billing_payment_dispute` (Confidence: $0.2207$).
  - Escalation Decision: `ESCALATE_HUMAN` (Low Confidence: $0.22 < 0.45$).
- **Why It Failed**:
  Rideshare customer interactions exist at the intersection of transit, courier service, and app-based automated billing. Because the driver canceled after arriving and the rider was assessed a cancellation fee ("I had to pay $5"), the presence of currency tokens (`"$5"`, `"pay"`) triggered billing classification rather than transport pickup failure.
- **Likely Cause**: Cross-brand taxonomy conflation. In Twitter Customer Support, courier delivery (Amazon, UPS) and passenger transit (Uber, Delta) share structural vocabulary ("ordered", "cancelled", "arrived"), creating fuzzy decision boundaries.
- **Possible Fix**:
  1. Condition the classifier on brand category priors (e.g. `brand_type == 'rideshare'` biases towards transit operational classes).
  2. Distinguish between disputes over ongoing trip fulfillment vs disputed post-trip credit card ledger statements.

---

### Failure Mode 5: Regex Fragility in Safety-Critical Escalation Guardrails (CRITICAL FALSE NEGATIVE)

- **Customer Messages (IDs #137 & #140)**:
  - *Query 137 (GloCare)*: `@GloCare please refund money deducted from my line 09055635732 for no reason`
  - *Query 140 (Uber_Support)*: `Hey @115877 I didn’t get the NUGGETS I ORDERED I want a refund lol`
- **Expected Behavior**: **`ESCALATE_HUMAN`**. Both queries demand monetary refunds and involve billing deductions. Automated bots must never auto-reply to direct financial refund demands.
- **Model Behavior**:
  - **`AUTO_HANDLE`** (Risk Score: $0.50$, Confidence: $0.468$ and $0.518$).
  - Reason: *"High intent confidence and strong historical grounding for routine 'subscription_cancellation_refund' without risk triggers."*
  - Generated Reply: Deterministic holding response offering generic DM guidance while the system internally recorded an auto-handled ticket!
- **Why It Failed**:
  In `src/escalation.py`, the explicit account action rule used the following regex:
  ```python
  (r"\b(refund my money|issue a refund|give me my refund)\b", "Direct financial refund request")
  ```
  Customer #137 typed: `"refund money deducted"`, while Customer #140 typed: `"I want a refund"`. Neither phrasing matched the overly narrow regex pattern! Because their classification confidence ($0.47$ and $0.52$) exceeded the $0.45$ threshold and retrieval similarity ($0.18$ and $0.35$) exceeded $0.15$, the safety engine erroneously categorized them as safe routine inquiries.
- **Likely Cause**:
  Over-reliance on brittle keyword substrings for safety-critical guardrails. In production, customers express financial demands through hundreds of lexical variations.
- **Possible Fix**:
  1. Expand the escalation rule to match any occurrence of the root lemma `refund` or `chargeback` regardless of surrounding phrase structure: `r"\b(refund|chargeback|reimburse|reimbursement)\b"`.
  2. Mandate that the intent `subscription_cancellation_refund` itself is added to `ALWAYS_ESCALATE_INTENTS` alongside `account_access_security`.
