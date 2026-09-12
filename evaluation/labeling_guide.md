# Golden Evaluation Set Labeling Guide

This guide provides definitive instructions and protocols for labeling and reviewing the **Golden Evaluation Set** for the AI Customer Support Agent.

---

## 1. Objectives & Principles

The Golden Evaluation Set serves as the ground truth benchmark for evaluating:
1. **Intent Classification Accuracy & Macro-F1**
2. **Retrieval Grounding & Reply Generation Quality**
3. **Escalation vs Auto-Handle Decision Precision & Safety**

### Golden Rules
1. **Customer Intent Over Tone**: Categorize messages based on the customer's *underlying practical request or operational need*, rather than superficial politeness or profanity.
2. **Single Primary Intent**: Assign exactly one ground-truth label per message using the Priority Hierarchy (Section 3).
3. **Evidence-Based Labeling**: Only infer an intent if supported by textual evidence in the message. Do not make assumptions beyond the text.
4. **Honest Review**: All golden labels must be explicitly audited and validated. Any borderline or ambiguous cases must be documented in `notes`.

---

## 2. Intent Taxonomy Quick Reference

| Intent Key | Inclusions | Exclusions | Typical Action |
| :--- | :--- | :--- | :--- |
| `flight_travel_disruption` | Flight/rail delays, cancellations, rebooking, baggage issues, gate changes, missed connections. | Routine praise with no transit delay; general airline app software bugs. | Route to airport desk / rebooking |
| `order_delivery_issue` | Missing parcel, delayed food/grocery, incorrect item delivered, damaged courier packaging. | Refund requests on subscriptions; general store opening hours. | Courier dispatch / replacement |
| `technical_hardware_software_bug` | App crashes, iOS update freezes, device battery drain, Bluetooth audio drops, unresponsive buttons. | Account lockout / forgotten password; ISP broadband network outages. | Knowledge base / tech tier-2 |
| `billing_payment_dispute` | Double charges, disputed ride fares, incorrect invoice, checkout promo code failure. | Ongoing flight delay claims; requests to cancel active subscription plans. | Dispute audit / fee reversal |
| `account_access_security` | Forgotten password, 2FA code lockouts, hacked/compromised account, SIM activation. | ISP router offline; device battery dying; general billing fee disputes. | Identity verification / reset |
| `service_outage_connectivity` | Home broadband down, regional cellular outage, fiber cut, router no signal, ISP offline. | Personal app crash on single phone; account password reset. | NOC / regional outage lookup |
| `subscription_cancellation_refund` | Requesting subscription termination, returns for cash refund, membership renewal cancellation. | Disputing a specific flight delay or baggage loss (transit compensation). | Churn retention / returns desk |
| `product_inquiry_availability` | Physical store opening hours, catalog inventory, menu options, release dates, pricing lookups. | Active delivery missing in transit; software bug in running app. | Automated catalog FAQ |
| `complaint_poor_service` | Rude staff behavior, extreme phone hold times, agent incompetence, executive complaints. | Complaints that point to a specific actionable root defect (e.g., lost bag). | Senior supervisor escalation |
| `feedback_praise_resolution` | Genuine gratitude, compliments, shoutouts to helpful staff, praise for service. | Sarcastic praise (e.g., "Thanks for losing my bags! /s" ➔ travel disruption). | Positive CSAT logging |
| `uncertain` | Incomprehensible text, foreign language, fragmented context with zero distinguishable intent. | Any query where a primary operational intent can be reasonably inferred. | Human manual review queue |

---

## 3. Ambiguity Resolution & Priority Hierarchy

Customer messages on Twitter are frequently multi-faceted (e.g., a customer complaining about a rude agent while asking for a refund on a delayed flight). When an example appears to span multiple categories, apply this strict priority hierarchy:

```
Priority 1: Account Security & Identity (Compromise / Lockout)
  └─ Safety first. If account compromise or 2FA failure is mentioned, label as `account_access_security`.

Priority 2: Active Travel Disruption (Aviation / Rail)
  └─ If an ongoing transit disruption is occurring (even if passenger is angry or mentions luggage), label as `flight_travel_disruption`.

Priority 3: Physical Shipment / Courier / Delivery Disruption
  └─ If a courier, driver, or delivery order is late, missing, or damaged, label as `order_delivery_issue`.

Priority 4: Regional Service / Telecom / Broadband Outage
  └─ If network infrastructure is down, label as `service_outage_connectivity`.

Priority 5: Device / Software Bug
  └─ If an app crashes or device battery/OS is malfunctioning, label as `technical_hardware_software_bug`.

Priority 6: Financial Billing Dispute
  └─ If an incorrect fee, double charge, or broken promo code is disputed, label as `billing_payment_dispute`.

Priority 7: Subscription Termination / Return Refund
  └─ If requesting to cancel a plan or return a purchase, label as `subscription_cancellation_refund`.

Priority 8: Product Catalog / Store Inquiries
  └─ If asking about stock, store hours, or menu items, label as `product_inquiry_availability`.

Priority 9: General Service Complaint (No specific technical/operational request)
  └─ If the message is an angry rant about unhelpful staff, long waits, or general incompetence without a narrower action item, label as `complaint_poor_service`.

Priority 10: Feedback / Praise / Gratitude
  └─ Genuine compliments or thank-yous. (Watch out for sarcasm!).
```

---

## 4. Edge Cases & Special Rules

### A. Sarcastic Praise
- *Example*: *"Oh brilliant, another 2 hour delay on Delta! You guys are just fantastic at your jobs! /s"*
- *Rule*: Do **NOT** label as `feedback_praise_resolution`. The true customer issue is a flight delay. Label as `flight_travel_disruption`.

### B. Angry Complaints with a Specific Underlying Defect
- *Example*: *"Your driver is an incompetent idiot who left my food in the rain! Worst company ever!"*
- *Rule*: Even though the tone is angry, the root cause is a physical food delivery failure. Label as `order_delivery_issue`.
- *Example*: *"Your phone support agent called me stupid and hung up! Absolute scum!"*
- *Rule*: The complaint is strictly about customer service behavior. Label as `complaint_poor_service`.

### C. Cancellation vs Billing Dispute
- *Example*: *"I was charged a $5 fee for a ride I didn't take"* ➔ `billing_payment_dispute` (disputing a specific line item).
- *Example*: *"Cancel my Spotify subscription immediately, do not charge me next month"* ➔ `subscription_cancellation_refund` (terminating relationship).

### D. App Crash vs Device Outage
- *Example*: *"The Hulu app crashes whenever I press play"* ➔ `technical_hardware_software_bug`.
- *Example*: *"The entire Hulu website says 500 server error for everyone"* ➔ `service_outage_connectivity`.

---

## 5. Human Annotation Instructions

1. Start the local annotation interface:
   ```bash
   py -3 evaluation/annotate_golden.py
   ```
2. Open `http://localhost:8765` in your browser.
3. Review each customer query and context turns.
4. Select the appropriate intent using keyboard shortcuts (1–9, 0, or U).
5. Add optional notes explaining edge-case decisions if applicable.
6. Click **Save & Next** (or press Enter). The annotation is immediately written to `evaluation/golden_set.csv`.
7. Once all 200 items are annotated, the golden set is ready for final uncorrupted evaluation.

