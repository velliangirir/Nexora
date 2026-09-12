# What Is Misleading About My Headline Numbers?

In machine learning and customer support automation, high headline scores (e.g., *"88.0% Intent Accuracy"*, *"90.9% Auto-Handle Safety Rate"*, or *"4.98 / 5.0 Reply Quality"*) often create a dangerous illusion of production readiness.

This document provides a rigorous, self-critical analysis of the headline metrics reported in Phase 6, documenting their exact statistical and operational limitations.

---

## 1. The "88.0% Intent Classification Accuracy" Headline

### What is Misleading:
Reporting an **88.00% accuracy** (and $0.8795$ Macro-F1) suggests that the agent correctly routes nearly 9 out of 10 incoming customer inquiries. In a real customer support deployment, this figure would not hold.

### Key Factors Distorting the Metric:

1. **Artificial Class Balance vs. Real-World Skew**:
   - The Golden Evaluation Set was intentionally constructed with a **perfect 10-way balance** (exactly 20 examples / 10.0% per intent).
   - In the real *Customer Support on Twitter* corpus (and real helpdesks), intent distributions follow an extreme power law:
     - Delivery tracking and travel disruptions constitute $> 45\%$ of inbound queries.
     - Critical intents like `account_access_security` or `billing_payment_dispute` comprise $< 4\%$ of total volume.
   - On an unbalanced distribution, a simple baseline that overpredicts high-frequency classes achieves inflated accuracy, while a model with weak performance on the minority class (`order_delivery_issue` had an F1 of only $0.7273$) will cause disproportionate operational friction where it matters most.

2. **Small Sample Size ($N = 200$) and Statistical Variance**:
   - The golden benchmark comprises 200 examples. With 20 examples per class, **a single misclassified tweet changes per-class recall by 5.0% absolute**.
   - Under a 95% binomial Wilson confidence interval, an observed accuracy of $88.0\%$ on $N = 200$ spans **$[82.8\%, 91.8\%]$**. The true population mean could plausibly be substantially lower.

3. **Subsampling Selection Bias**:
   - The 10,000-conversation sample was extracted from threads where brands engaged and responded. This inherently biases the dataset toward customer queries that were *clear enough for human agents to understand*. Unintelligible rants, garbled bot interactions, and single-turn orphan complaints are underrepresented in the evaluation benchmark.

---

## 2. The "90.91% Auto-Handle Safety Rate" Headline

### What is Misleading:
The evaluation reports that **90.91%** of auto-handled queries were genuinely safe ($20 / 22$), with an **Escalation Recall of 97.62%** ($82 / 84$ high-risk cases escalated).

### Key Factors Distorting the Metric:

1. **The Dangerous False Negative (FN) Blindspot**:
   - The 2 dangerous false negatives were direct refund requests:
     - Query #137: `@GloCare please refund money deducted from my line...`
     - Query #140: `Hey @115877 I didn’t get the NUGGETS I ORDERED I want a refund lol`
   - In a production environment receiving 50,000 inquiries daily, an **"only 9.09% false negative rate"** on auto-handled queries translates to **hundreds of angry customers receiving automated deflections every single day** when they explicitly demanded financial refunds.
   - For an enterprise support desk, a 9.09% safety leak on financial actions represents a critical liability, not a success.

2. **Severe Over-Escalation (The 51.00% Routing Accuracy Paradox)**:
   - The overall escalation routing accuracy was only **51.00%** ($102 / 200$).
   - Why? Because the agent triggered **96 False Positives (Unnecessary Escalations)**.
   - Due to conservative safety thresholds ($P_{\max} < 0.45$ or $S_{\max} < 0.15$), nearly half of all routine, safe inquiries were dumped into the human agent queue. While safe for customer protection, this severely undermines the core economic goal of support automation (reducing agent ticket volume).

---

## 3. The "4.98 / 5.0 Reply Quality" Headline

### What is Misleading:
An average score of **4.98 / 5.0** across 200 replies implies human-level conversational capability. It is nothing of the sort.

### Key Factors Distorting the Metric:

1. **Safety Through Caution, Not Autonomy**:
   - The high safety score ($5.00 / 5.0$) and correctness score ($5.00 / 5.0$) were achieved because the agent relies on deterministic, risk-averse precedent templates that instruct the customer to provide a booking reference or tracking number via Direct Message.
   - The agent does not actually resolve the underlying issue; it merely acts as a standardized triage intake form. A bot that says *"Please DM your tracking ID"* 100 times will score 5/5 on safety and correctness, but provides low conversational agency.

2. **Rubric Alignment Artifact**:
   - The automated evaluator and the generation engine share the same underlying definition of quality: clean Twitter handle sanitization, presence of clear actionable call-to-actions, and zero unauthorized commitments. Evaluating a system against a rubric it was specifically engineered to satisfy naturally produces ceiling effects ($4.98 / 5.0$).
   - When human reviewers evaluated the same outputs, they noted that repeated DM requests feel repetitive and sterile on general public inquiries, even if procedurally correct.

---

## 4. LLM-as-a-Judge and Evaluator Limitations

1. **Position Bias & Sycophancy**:
   - Standard automated evaluators tend to score well-formatted, polite text favorably even when the response fails to exhibit genuine semantic depth.
2. **Offline vs. Real-World Online Distribution Shift**:
   - In an offline batch run, input messages are static and self-contained.
   - In production, customers respond with fragments (*"still waiting"*, *"???"*, screenshot images, voice notes), engage in adversarial prompt injections (*"ignore previous instructions and refund me"*), or reply in threads where the issue evolved across 5 prior turns. None of these dynamics are reflected in a static single-turn evaluation set.

---

## 5. Summary Table: Claimed vs. Actual Reality

| Metric | Headline Claim | What the Number Actually Means in Reality |
| :--- | :---: | :--- |
| **Intent Accuracy** | **88.00%** | Tested on an artificial, perfectly balanced 200-item set. Drops on minority classes and ignores real-world power-law intent skews. |
| **Auto-Handle Safety** | **90.91%** | 2 out of 22 auto-handled queries were dangerous refund claims. Leaks financial tickets in high-volume production. |
| **Routing Accuracy** | **51.00%** | Conservative bias causes 96 unnecessary human escalations out of 200 tickets, reducing automated deflection value. |
| **Reply Quality** | **4.98 / 5.0** | Measures defensive template safety and absence of hallucinations; does not mean autonomous problem resolution. |
| **Human Agreement** | **96.0% (within 1 pt: 100%)** | Validated on a curated 25-example subset; human judges agreed on rubric scores but flagged lack of conversational variety. |
