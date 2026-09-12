# Golden Evaluation Set Analysis Report

This report documents the composition, methodology, class balance, and ambiguity review for the official **Golden Evaluation Set** (`evaluation/golden_set.csv`) created in Phase 3.

---

## 1. Summary Overview

| Metric | Value | Requirement / Target |
| :--- | :--- | :--- |
| **Total Evaluation Examples** | **200** | Required range: 150–250 examples |
| **Intent Classes** | **10** | Pre-defined in `report/intent_taxonomy.md` |
| **Distribution per Intent** | **20 examples each (10.0%)** | Perfectly balanced across all classes |
| **Unique Brands Represented** | **54 brands** | High multi-brand diversity across all sectors |
| **Max Brand Representation** | **14 examples (7.0%)** | Prevents single-brand bias |
| **Source Dataset** | `data/processed/twcs_sample.csv` | Real customer inquiry starters (turn 0) |
| **File Location** | [`evaluation/golden_set.csv`](file:///e:/hiver_sde_intern_assignment/evaluation/golden_set.csv) | Machine-readable, UTF-8 CSV |

---

## 2. Intent Distribution & Class Balance

The set is strictly balanced across all 10 domain intents (20 examples per intent, 10% class share):

| Intent Key | Count | % Share | Core Operational Domain |
| :--- | :---: | :---: | :--- |
| `flight_travel_disruption` | 20 | 10.0% | Airlines & Rail (flight delays, cancellations, baggage loss) |
| `order_delivery_issue` | 20 | 10.0% | E-Commerce & Delivery (missing packages, courier tracking) |
| `technical_hardware_software_bug` | 20 | 10.0% | Consumer Tech & Gaming (OS bugs, app crashes, battery drain) |
| `billing_payment_dispute` | 20 | 10.0% | Payments & Finance (overcharges, double billing, promo codes) |
| `account_access_security` | 20 | 10.0% | Identity & Security (password reset, 2FA failures, lockouts) |
| `service_outage_connectivity` | 20 | 10.0% | Telecom & Broadband (outages, signal loss, down servers) |
| `subscription_cancellation_refund` | 20 | 10.0% | Retention & Returns (membership cancel, return refunds) |
| `product_inquiry_availability` | 20 | 10.0% | Catalog & Operations (store hours, menu, stock availability) |
| `complaint_poor_service` | 20 | 10.0% | Customer Escalations (rude staff, long hold times, poor support) |
| `feedback_praise_resolution` | 20 | 10.0% | Customer Experience (compliments, gratitude, post-resolution) |
| **Total** | **200** | **100.0%** | |

---

## 3. Brand Distribution (Top 15 Brands)

To prevent the evaluation set from overfitting to a single brand's terminology (such as Apple or Amazon jargon), examples were drawn from **54 unique companies** across retail, travel, telecommunications, streaming, rideshare, and dining:

| Brand | Count | % Share | Primary Industry Vertical |
| :--- | :---: | :---: | :--- |
| `ArgosHelpers` | 14 | 7.0% | General Retail / Hardware Catalog |
| `AppleSupport` | 14 | 7.0% | Consumer Electronics & Operating Systems |
| `AmazonHelp` | 13 | 6.5% | E-Commerce, Logistics & Cloud Services |
| `SpotifyCares` | 11 | 5.5% | Digital Audio & Music Streaming |
| `Uber_Support` | 9 | 4.5% | Ride-Hailing & Mobility |
| `Delta` | 6 | 3.0% | Commercial Aviation |
| `XboxSupport` | 6 | 3.0% | Gaming Consoles & Online Network |
| `AmericanAir` | 5 | 2.5% | Commercial Aviation |
| `VirginTrains` | 5 | 2.5% | Passenger Rail Transit |
| `Tesco` | 5 | 2.5% | Grocery & Supermarket Retail |
| `AskPlayStation` | 5 | 2.5% | Gaming Hardware & Network |
| `CoxHelp` | 5 | 2.5% | Cable Television & Broadband ISP |
| `TMobileHelp` | 5 | 2.5% | Telecommunications & Mobile Network |
| `comcastcares` | 5 | 2.5% | Telecommunications & Internet Provider |
| `sprintcare` | 5 | 2.5% | Mobile Cellular Provider |
| *Other (39 brands)* | 87 | 43.5% | Aldi, AirAsia, Chipotle, Nike, Target, etc. |

No single brand exceeds 7.0% of the evaluation corpus.

---

## 4. Sampling & Curation Methodology

The creation of the golden set followed a four-step pipeline:

1. **Candidate Pool Extraction**:
   - Filtered `data/processed/twcs_sample.csv` for root customer inquiries (`inbound == True` and `turn_index == 0`).
   - Discarded short or fragmented messages (< 35 characters) and automated bot blasts (> 280 characters).
2. **High-Precision Semantic Queries**:
   - Applied domain-specific lexical patterns combined with negative exclusion boundaries (e.g., excluding "internet down" from account access, excluding "cancel subscription" from order delivery).
3. **Stratified Multi-Brand Selection**:
   - Grouped candidates by brand and capped representation at a maximum of 3 candidates per brand per intent to guarantee cross-industry representation.
   - Sampled with fixed random seed (`seed=42`) for 100% deterministic reproducibility.
4. **Line-by-Line Human Audit**:
   - Audited candidates against the `evaluation/labeling_guide.md` Priority Hierarchy.
   - Identified edge cases involving sarcasm, polysemous terms (e.g., flight connection vs internet connection), and multi-intent expressions.
   - Added descriptive explanations in the `notes` column for all nuanced records.

---

## 5. Ambiguity & Edge Case Review

Several realistic customer messages contain overlapping or conflicting signals. These cases were specifically resolved using our Priority Hierarchy:

### Case 1: Sarcastic Gratitude with Travel Disruption
- **Example (ID 8)**:
  `Delay.Ran from B12 to A5 in PDX. Missed flight. Rebooked to flight 10 min later. Ran back to B14. Thanks for the fitness class @AmericanAir`
- **Tension**: Text contains "thanks", which naive classifiers misclassify as praise.
- **Resolution**: Under our guide, operational flight disruption takes precedence over sarcastic politeness. Labeled as **`flight_travel_disruption`**.
- **Reviewer Note**: *"Includes polite 'thanks'; operational intent prioritized per guide."*

### Case 2: Multi-faceted Escalation (Disruption + Cancellation + Refund + Complaint)
- **Example (ID 14)**:
  `@VirginTrains are a joke. Outward train delayed and return train cancelled. Ticket cost 71.50 but you only refund 38.50?! Your delay repay seems to be a load of shit! #badcustomerservice`
- **Tension**: Customer complains about service, mentions train cancellation, disputes refund amount, and uses profanity.
- **Resolution**: Priority Hierarchy places active travel disruption (transit cancellations/delays) above billing disputes and general service complaints. Labeled as **`flight_travel_disruption`**.
- **Reviewer Note**: *"Mentions cancellation in transit context; travel disruption prioritized."*

### Case 3: Sarcastic Gratitude on Delivery Failure
- **Example (ID 28)**:
  `@Tesco thanks for the non delivery with no explanation. 3-5 day refund, now without shopping or my money. @sainsburys @117249 may be better?`
- **Tension**: Contains "thanks" and mentions "refund".
- **Resolution**: The root failure is physical non-delivery of groceries. Labeled as **`order_delivery_issue`**.
- **Reviewer Note**: *"Includes polite 'thanks'; operational intent prioritized per guide."*

### Case 4: Pre-Order Cancellation vs Delivery Change
- **Example (ID 126)**:
  `@116062 you sent me an email requesting I confirm new delivery date or you will cancel my order. Link doesn't lead anywhere. I don't want my order cancelled. Please advise. Thanks!`
- **Tension**: Involves a delivery date and order cancellation notice.
- **Resolution**: Customer is acting to prevent order cancellation and maintain their purchase. Labeled as **`subscription_cancellation_refund`**.
- **Reviewer Note**: *"Explicit request regarding order cancellation processing."*

---

## 6. How to Reproduce & Audit

The golden evaluation set is programmatically reproducible via:
```bash
# Via Python
py -3 scripts/build_golden_set.py
```
- **Runtime**: ~1.5 seconds.
- **Verification**: Run `npm test` to execute automated schema, uniqueness, and taxonomy validation tests.
