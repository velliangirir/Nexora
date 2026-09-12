# Phase 2 Data Analysis Report: Customer Support on Twitter (TWCS)

This report documents the actual empirical findings, dataset schema, conversation structure, and representative sampling strategy derived directly from analyzing `data/raw/twcs.csv` (492.58 MB). All statistics were calculated without fabricating numbers or loading the full dataset into unconstrained memory.

---

## 1. Schema & Field Definitions

The dataset contains **2,811,774** records across **7** columns.

| Column Name | Raw Dtype | Missing Count | % Missing | Semantic Role & Description |
| :--- | :--- | :--- | :--- | :--- |
| `tweet_id` | `int64` | 0 | 0.00% | Unique 64-bit integer identifier for the tweet. Primary key. |
| `author_id` | `str` / `object` | 0 | 0.00% | Identifier of the author. Anonymized integer string for customers (e.g., `'115712'`); official company handle for brands (e.g., `'AppleSupport'`). |
| `inbound` | `bool` | 0 | 0.00% | `True` if tweet was sent by customer to brand; `False` if sent by brand/support agent to customer. |
| `created_at` | `str` | 0 | 0.00% | Timestamp string formatted as `"%a %b %d %H:%M:%S %z %Y"` (e.g., `"Tue Oct 31 22:10:47 +0000 2017"`). |
| `text` | `str` | 0 | 0.00% | Raw tweet text content, including user mentions (`@handle`), URLs, HTML entities, and emojis. |
| `response_tweet_id` | `str` / `float64` | 1,040,629 | 37.01% | Comma-separated list of child tweet IDs that directly replied to this tweet. `NaN` if this tweet is a leaf node in the dialogue tree. |
| `in_response_to_tweet_id` | `float64` | 794,335 | 28.25% | The single parent tweet ID to which this tweet replied. `NaN` if this tweet is the ROOT initiator of a conversation thread. |

---

## 2. Actual Dataset Statistics

These metrics were derived via chunked streaming aggregation across the full dataset:

| Metric Category | Metric | Actual Value | Context / Interpretation |
| :--- | :--- | :--- | :--- |
| **Volume** | Total Rows | **2,811,774** | Complete Twitter customer support corpus |
| **Storage** | File Size | **492.58 MB** (516,508,641 bytes) | Uncompressed raw CSV |
| **Data Quality** | Duplicate `tweet_id`s | **0** | Every tweet has a strictly unique primary key |
| **Data Quality** | Empty `text` fields | **0** | No blank messages |
| **Message Split** | Inbound Messages | **1,537,843** (54.69%) | Customer inquiries / feedback |
| **Message Split** | Outbound Messages | **1,273,931** (45.31%) | Brand support responses / broadcast tweets |
| **Authors** | Total Unique Authors | **702,777** | |
| **Authors** | Unique Brand Accounts | **108** | Verified company support accounts |
| **Authors** | Unique Customer Accounts| **702,669** | Anonymized user accounts |
| **Text Metrics** | Min / Max Length | **1 / 513** characters | Extended tweets (>140 chars) present post-2017 Twitter update |
| **Text Metrics** | Average Text Length | **113.89** characters | Concise, high-signal support requests |
| **Temporal Span**| Earliest Timestamp | **2008-05-08 20:13:59+00:00** | Early Twitter support adoption |
| **Temporal Span**| Latest Timestamp | **2017-12-03 23:14:01+00:00** | Peak modern customer support period |

---

## 3. Brand Distribution (Top 20 Brands)

The 108 brands span diverse verticals (E-Commerce, Consumer Tech, Ride-hailing, Airlines, Telecom, Food & Retail, Gaming):

| Rank | Brand Account Handle | Sector / Domain | Total Outbound Tweets | Share of Brand Tweets |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `AmazonHelp` | E-Commerce / Cloud | 169,840 | 13.33% |
| 2 | `AppleSupport` | Consumer Hardware & OS | 106,860 | 8.39% |
| 3 | `Uber_Support` | Ride-Hailing / Mobility | 56,270 | 4.42% |
| 4 | `SpotifyCares` | Music & Audio Streaming | 43,265 | 3.40% |
| 5 | `Delta` | Aviation / Travel | 42,253 | 3.32% |
| 6 | `Tesco` | Supermarket / Retail | 38,573 | 3.03% |
| 7 | `AmericanAir` | Aviation / Travel | 36,764 | 2.89% |
| 8 | `TMobileHelp` | Telecommunications | 34,317 | 2.69% |
| 9 | `comcastcares` | Cable / Internet Provider | 33,031 | 2.59% |
| 10 | `British_Airways` | Aviation / Travel | 29,361 | 2.30% |
| 11 | `SouthwestAir` | Aviation / Travel | 28,977 | 2.27% |
| 12 | `VirginTrains` | Rail Transit | 27,817 | 2.18% |
| 13 | `Ask_Spectrum` | Cable / ISP | 25,860 | 2.03% |
| 14 | `XboxSupport` | Gaming & Subscriptions | 24,557 | 1.93% |
| 15 | `sprintcare` | Telecommunications | 22,381 | 1.76% |
| 16 | `hulu_support` | Video Streaming | 21,872 | 1.72% |
| 17 | `sainsburys` | Retail / Groceries | 19,466 | 1.53% |
| 18 | `GWRHelp` | Rail Transit | 19,364 | 1.52% |
| 19 | `AskPlayStation` | Gaming / Hardware | 19,098 | 1.50% |
| 20 | `ChipotleTweets` | Fast Casual Dining | 18,749 | 1.47% |

---

## 4. Conversation Structure & Dialogue Graph

Understanding conversation linkage is critical for building an AI support agent that handles multi-turn dialogues:

### 4.1. Linkage Mechanism
Tweets form a **directed conversation tree** linked by two complementary pointer fields:
1. **Backward Parent Pointer (`in_response_to_tweet_id`)**:
   - Points to the immediate parent tweet that triggered this message.
   - If `NaN`, the tweet is the **root** of a conversation.
   - Total root tweets in the dataset: **794,335** (787,346 customer-initiated, 6,989 brand-initiated broadcasts).
2. **Forward Child Pointer (`response_tweet_id`)**:
   - Points to the direct reply tweet(s) triggered by this message.
   - Can contain a single ID (linear dialogue) or comma-separated IDs (branching dialogue, e.g., `"5,7"`).
   - If `NaN`, the tweet is a **leaf node** (the concluding message of a dialogue branch).
   - Total leaf tweets: **1,040,629** (54.6% outbound brand replies, 45.4% terminal customer replies).

### 4.2. Concrete Conversation Example
```
[Turn 1 - Root Inbound]
tweet_id: 8 | author: 115712 | inbound: True | in_response_to: NaN | response: 9,6,10
Text: "@sprintcare is the worst customer service"
      │
      ▼
[Turn 2 - Brand Response]
tweet_id: 6 | author: sprintcare | inbound: False | in_response_to: 8.0 | response: 5,7
Text: "@115712 Can you please send us a private message, so that I can gain further details?"
      │
      ▼
[Turn 3 - Customer Follow-up]
tweet_id: 5 | author: 115712 | inbound: True | in_response_to: 6.0 | response: 4
Text: "@sprintcare I did."
      │
      ▼
[Turn 4 - Brand Resolution / DM Deflection]
tweet_id: 4 | author: sprintcare | inbound: False | in_response_to: 5.0 | response: 3
Text: "@115712 Please send us a Private Message so that we can further assist you..."
```

### 4.3. Conversation Graph Insights
- **Zero completely isolated tweets**: There are **0** records where both parent and child pointers are null. Every message is part of an interaction thread.
- **Thread locality in file**: In `twcs.csv`, messages belonging to the same conversation are clustered within adjacent rows (median row distance = 1.0), enabling fast bounded-memory thread extraction.
- **Terminal message distribution**:
  - ~82.4% of conversations conclude with a brand response (resolution, instruction, or deflection).
  - ~17.6% of conversations conclude with a customer message (customer acknowledging resolution with "thanks", or an unanswered follow-up).

---

## 5. Representative Sampling Strategy

### 5.1. Why Subsample?
Ingesting the full 2.81M rows (~500 MB) during rapid development, testing, and evaluation creates unnecessary friction on evaluator laptops without adding algorithmic value. Per assignment guidance:
> *"The evaluator will not run the code on the full dataset. A representative subsample is expected and encouraged."*

### 5.2. Design Requirements
1. **Unit of Sampling = Complete Conversations**: Randomly selecting independent rows would fragment conversations, leaving prompts without targets or context. We sample entire dialogue threads from root to leaf.
2. **Multi-Brand Diversity**: Capture the top 20 brands and long-tail accounts across all major consumer industries (tech, logistics, retail, travel, telecom).
3. **Turn Length Distribution**: Represent single-response resolutions (2 turns), customer clarification loops (3-4 turns), and extended escalation threads (5+ turns).
4. **Outcome Diversity**: Include both completed brand resolutions and conversations ending on customer messages.
5. **Deterministic & Reproducible**: Powered by a fixed random seed (`seed=42`) and evenly spaced block offsets across the 2.81M rows.

### 5.3. Generated Sample Characteristics

The preprocessing pipeline (`src/preprocessing.py`) produces the official processed sample:

| Metric | Target | Actual Processed Sample |
| :--- | :--- | :--- |
| **Total Conversations** | 10,000 | **10,000** complete threads |
| **Total Tweets** | ~25,000 - 35,000 | **30,396** tweets |
| **Unique Brands** | > 80 | **103** brands (95.4% dataset coverage) |
| **Turn Lengths** | Diverse | 2 turns (58.2%), 3 turns (15.2%), 4 turns (14.1%), 5+ turns (12.5%) |
| **Ending on Customer**| 15% - 20% | **1,764** conversations (17.64%) |
| **Output File Sizes** | < 20 MB | CSV: **10.03 MB**, JSONL: **15.05 MB** |
| **Pipeline Runtime** | < 60s | **~22 seconds** on a standard laptop |

### 5.4. Generated Artifacts under `data/processed/`
1. `twcs_sample.csv`: Flat tabular dataset containing both raw and cleaned text, conversation identifiers, turn indices, and brand metadata.
2. `conversations_sample.jsonl`: Structured JSONL file containing complete multi-turn conversation objects ready for direct ingestion by LLMs, classifiers, and evaluation harnesses.
3. `sample_metadata.json`: Machine-readable metadata verifying sample integrity, brand frequencies, turn distributions, and random seed.

---

## 6. Text Cleaning & Normalization Rules

Analysis revealed several text anomalies that require safe preprocessing:
1. **HTML Entities**: Pervasive raw entities (`&amp;`, `&lt;`, `&gt;`, `&#39;`, `&quot;`) are cleanly unescaped using `html.unescape`.
2. **Whitespace**: Redundant consecutive spaces and tabs (`[ \t]+`) are collapsed to single spaces. Consecutive newlines (`\n{3,}`) are normalized to `\n\n`.
3. **Preservation**:
   - Emojis (e.g., 😊, ✈️, 😡) are **preserved** (vital for customer sentiment and urgency analysis).
   - `@mentions` and URLs are **preserved** in the raw text and cleaned text (crucial for detecting escalation URLs, DM invitations, and brand routing).
   - Agent signatures (e.g., `^KC`, `-John`) are preserved.
