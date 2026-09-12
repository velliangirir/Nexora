# Customer Support Intent Taxonomy

This document defines the 10-class intent taxonomy established in Phase 3 for the AI Customer Support Agent. The taxonomy was derived through empirical analysis of customer support interactions across the primary dataset (*Customer Support on Twitter*). It reflects the multi-brand operational reality of modern omnichannel support, avoiding generic categories while steering clear of narrow single-industry taxonomies (such as Banking77).

---

## Taxonomy Overview

The taxonomy comprises **10 mutually exclusive, actionable intents**:

| # | Intent Key | Category | Operational Routing Target |
| :-: | :--- | :--- | :--- |
| 1 | `flight_travel_disruption` | Travel / Aviation | Airport Operations / Rebooking Desk |
| 2 | `order_delivery_issue` | Logistics / E-Commerce | Courier & Dispatch Coordination |
| 3 | `technical_hardware_software_bug` | Tech Support | Tier-2 Technical Support / Knowledge Base |
| 4 | `billing_payment_dispute` | Finance / Accounts | Billing Operations / Fraud & Dispute Team |
| 5 | `account_access_security` | Identity / Security | User Authentication / Security Operations |
| 6 | `service_outage_connectivity` | Network Operations | Network Operations Center (NOC) / Status Page |
| 7 | `subscription_cancellation_refund` | Retention / Returns | Retention Specialist / Returns Processing |
| 8 | `product_inquiry_availability` | General Information | Product Catalog / Automated FAQ Deflection |
| 9 | `complaint_poor_service` | Escalation / Quality | Senior Support Supervisor / Customer Advocacy |
| 10 | `feedback_praise_resolution` | Customer Experience | Automated CSAT / Agent Recognition |

---

## Detailed Intent Specifications

### 1. `flight_travel_disruption`
- **Definition**: Customer reports flight delays, cancellations, missed connections, extended tarmac delays, gate/terminal changes, or missing/delayed checked baggage.
- **Why it matters**: Extremely time-sensitive. Customers are actively in transit or stranded; automated triage must prioritize and route directly to flight operations or rebooking specialists.
- **Prototypical Examples**:
  - *"Flight 214 has been delayed 3 hours on the tarmac with no explanation @Delta"*
  - *"Baggage never showed up on the carousel at Heathrow after our connection @British_Airways"*
  - *"Can I rebook without fees since my connecting flight was canceled due to weather? @AmericanAir"*
- **Negative Examples**:
  - *"Uber driver canceled my ride while I was walking to the car"* ➔ `order_delivery_issue`
  - *"I want a refund for the hotel I booked"* ➔ `subscription_cancellation_refund`
  - *"Great flight to Atlanta today, thanks crew!"* ➔ `feedback_praise_resolution`

---

### 2. `order_delivery_issue`
- **Definition**: Customer reports delivery delays, package tracking failures, missing/stolen packages, courier driver misbehavior, damaged parcels, or missing items from retail or food deliveries.
- **Why it matters**: High ticket volume in e-commerce and logistics. Enables immediate driver contact, courier status checks, or reshipment dispatch.
- **Prototypical Examples**:
  - *"Tracking says delivered on porch but there is no package anywhere @AmazonHelp"*
  - *"Delivery driver hammered on my door and woke up sleeping toddlers @AmazonHelp"*
  - *"Ordered groceries and half of the items are missing from the bags @Tesco"*
- **Negative Examples**:
  - *"Can I return this unopened shirt?"* ➔ `subscription_cancellation_refund`
  - *"My iPhone arrived with a cracked screen that doesn't turn on"* ➔ `technical_hardware_software_bug`
  - *"Driver was rude and yelled at me"* (no delivery failure, purely interpersonal complaint) ➔ `complaint_poor_service`

---

### 3. `technical_hardware_software_bug`
- **Definition**: Customer reports device malfunction, operating system update glitches (e.g., iOS battery drain), mobile application crashes, audio/headphone button errors, or software feature bugs.
- **Why it matters**: Resolvable via automated deflection with step-by-step diagnostic articles, firmware update notes, or escalating to tier-2 engineers for bug tracking.
- **Prototypical Examples**:
  - *"iOS 11.0.3 battery is draining 30% in 15 minutes on my iPhone 6s @AppleSupport"*
  - *"Spotify app crashes instantly when I tap on any playlist @SpotifyCares"*
  - *"Headphone buttons no longer pause music after the latest update @AppleSupport"*
- **Negative Examples**:
  - *"My internet is down at home"* ➔ `service_outage_connectivity`
  - *"Forgot my Apple ID password"* ➔ `account_access_security`
  - *"The game server is down for maintenance"* ➔ `service_outage_connectivity`

---

### 4. `billing_payment_dispute`
- **Definition**: Customer disputes unexpected charges, duplicate transactions, cancellation fee penalties, surge pricing irregularities, invoice discrepancies, or promo code rejections.
- **Why it matters**: Direct financial risk and customer churn driver. Requires verification against billing records, potential fee waivers, or payment ledger corrections.
- **Prototypical Examples**:
  - *"I was charged a $5 cancellation fee when the driver drove away @Uber_Support"*
  - *"My bank statement shows I was charged twice for order #4029 @AmazonHelp"*
  - *"Restaurant promo code says invalid even though it expires in December @AmazonHelp"*
- **Negative Examples**:
  - *"I would like to cancel my subscription and get my money back"* ➔ `subscription_cancellation_refund`
  - *"The item in your store is too expensive"* ➔ `product_inquiry_availability`
  - *"You con artists stole my money!"* (vague emotional accusation with no specific charge details) ➔ `complaint_poor_service`

---

### 5. `account_access_security`
- **Definition**: Customer cannot log in, has forgotten passwords, fails two-factor authentication (2FA), experiences account lockout, reports account hacking, or encounters profile activation failures.
- **Why it matters**: High security sensitivity involving PII. Requires strict verification protocols and human agent supervision to prevent unauthorized account takeovers.
- **Prototypical Examples**:
  - *"Locked out of my Apple ID and the recovery email never arrives @AppleSupport"*
  - *"Been trying all day to activate my new device and getting activation error @sprintcare"*
  - *"I think my account was hacked because my email was changed without my consent @SpotifyCares"*
- **Negative Examples**:
  - *"App crashes on the login screen"* ➔ `technical_hardware_software_bug`
  - *"My wifi connection won't authenticate"* ➔ `service_outage_connectivity`
  - *"Cancel my account permanently"* ➔ `subscription_cancellation_refund`

---

### 6. `service_outage_connectivity`
- **Definition**: Customer experiences regional or local loss of broadband internet, cellular voice/data network, cable TV service, or online server connectivity.
- **Why it matters**: Severe impact across hundreds of customers simultaneously. Requires automated matching against known zip-code outages to deflect inbound floods.
- **Prototypical Examples**:
  - *"Is there an internet outage in zip code 75024? Router light is blinking red @Ask_Spectrum"*
  - *"Zero mobile data or cellular bars in downtown Chicago since 2 PM @TMobileHelp"*
  - *"Broadband down for the third time this week @comcastcares"*
- **Negative Examples**:
  - *"App closes every time I open it"* ➔ `technical_hardware_software_bug`
  - *"My flight was canceled"* ➔ `flight_travel_disruption`
  - *"Your phone customer support line is constantly busy"* ➔ `complaint_poor_service`

---

### 7. `subscription_cancellation_refund`
- **Definition**: Customer explicitly requests to terminate an active recurring membership or subscription, return purchased merchandise, or receive refund confirmation for a canceled order.
- **Why it matters**: Retention opportunity. Can trigger automated retention offers, self-service cancellation links, or generate return RMA shipping labels.
- **Prototypical Examples**:
  - *"How do I cancel my Spotify Premium subscription? @SpotifyCares"*
  - *"I returned my parcel last week, when will my refund be processed? @AmazonHelp"*
  - *"I want to cancel my pre-order before it ships out @AmazonHelp"*
- **Negative Examples**:
  - *"You charged me twice for my monthly bill"* ➔ `billing_payment_dispute`
  - *"Flight was canceled by the airline"* ➔ `flight_travel_disruption`
  - *"Cancel my Uber ride right now"* ➔ `order_delivery_issue`

---

### 8. `product_inquiry_availability`
- **Definition**: Customer inquires about product stock, physical store opening/closing hours, restaurant menu options, feature release dates, or product specifications.
- **Why it matters**: Pre-purchase discovery. Ideal for instant auto-handling via catalog retrieval or store locator deflection.
- **Prototypical Examples**:
  - *"Do you have the iPhone X in stock at the Regent Street store today? @AppleSupport"*
  - *"What time does your Cheetham Hill branch close this evening? @Tesco"*
  - *"Will the spicy queso dip be coming back to the menu this winter? @ChipotleTweets"*
- **Negative Examples**:
  - *"My ordered product is damaged"* ➔ `order_delivery_issue`
  - *"The update made my device stop working"* ➔ `technical_hardware_software_bug`
  - *"I bought this and hate it, I want my money back"* ➔ `subscription_cancellation_refund`

---

### 9. `complaint_poor_service`
- **Definition**: Customer expresses severe frustration, outrage, or indignation regarding unhelpful support agents, prolonged hold times, broken promises, or overall negative brand experience without a narrower specific troubleshooting request.
- **Why it matters**: High risk of public reputational damage and churn. Requires rapid escalation to senior supervisors and brand reputation managers.
- **Prototypical Examples**:
  - *"Your customer service executive was shockingly rude and hung up on me @AmazonHelp"*
  - *"On hold for 90 minutes and transferred 4 times, worst customer service ever @sprintcare"*
  - *"Rotten bunch of con artists and liars! Taking my business elsewhere @sprintcare"*
- **Negative Examples**:
  - *"Flight 102 was delayed by 2 hours"* ➔ `flight_travel_disruption`
  - *"Package is 1 day late"* ➔ `order_delivery_issue`
  - *"Your app has a bug in iOS 11"* ➔ `technical_hardware_software_bug`

---

### 10. `feedback_praise_resolution`
- **Definition**: Customer shares positive remarks, expresses gratitude for helpful assistance, praises brand features, or sends appreciative compliments following an interaction.
- **Why it matters**: Identifies brand advocates, records positive CSAT scores, and provides opportunities for automated social engagement without wasting human agent time.
- **Prototypical Examples**:
  - *"Loving Sky Priority today! Thank you Delta! 💙✈️ @Delta"*
  - *"Huge thanks to Sarah on phone support for resolving my billing issue in 5 minutes! @AppleSupport"*
  - *"You guys are the absolute best, appreciate the fast turnaround 🤗 @Tesco"*
- **Negative Examples**:
  - *"Oh fantastic, another 3 hour delay, you guys are just the best /s"* (sarcastic complaint) ➔ `flight_travel_disruption`
  - *"Thanks, but how do I reset the password now?"* (follow-up inquiry) ➔ `account_access_security`

---

## Disambiguation Decision Tree

When a customer message touches multiple areas, use the following priority order:

```
1. Safety / Account Compromise?
   └── YES ➔ account_access_security
   └── NO
2. Active In-Transit Flight/Train Disruption?
   └── YES ➔ flight_travel_disruption
   └── NO
3. Physical Delivery / Driver / Shipment Issue?
   └── YES ➔ order_delivery_issue
   └── NO
4. Broad Network / Broadband / Cable Outage?
   └── YES ➔ service_outage_connectivity
   └── NO
5. Device Malfunction / Software Bug?
   └── YES ➔ technical_hardware_software_bug
   └── NO
6. Disputed Charge / Payment Failure?
   └── YES ➔ billing_payment_dispute
   └── NO
7. Subscription Termination / Refund Request?
   └── YES ➔ subscription_cancellation_refund
   └── NO
8. Pre-sale Product / Store / Availability Question?
   └── YES ➔ product_inquiry_availability
   └── NO
9. Severe Frustration / Agent Rudeness?
   └── YES ➔ complaint_poor_service
   └── NO
10. Gratitude / Positive Feedback?
   └── YES ➔ feedback_praise_resolution
```
