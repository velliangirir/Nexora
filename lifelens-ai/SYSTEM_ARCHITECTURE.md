# SYSTEM_ARCHITECTURE.md — Futlens AI

## Architectural Overview

Futlens AI is built following clean 3-tier software architecture principles:

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                    │
│   Landing Page • Dashboard • What-If Sliders • Charts • PDF │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST HTTP JSON API
┌──────────────────────────────▼──────────────────────────────┐
│                    EXPRESS BACKEND SERVER                   │
│   Auth Routes • Decision CRUD • Scoring Engine • AI Engine  │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLite SQL Driver
┌──────────────────────────────▼──────────────────────────────┐
│                    RELATIONAL SQLITE DATABASE               │
│   Users • Decisions • Options • Factors • RealityChecks     │
└─────────────────────────────────────────────────────────────┘
```

### Core Components Mechanics:

1. **Scoring Engine (`scoringEngine.ts`)**:
   - Computes $S_{\text{base}} = \sum (w_i' \cdot s_i)$.
   - Evaluates constraint penalties:
     $$\text{Penalty}_{\text{budget}} = \min\left(45, \frac{\text{Cost} - \text{Limit}}{\text{Limit}} \times 50\right)$$
   - Computes Optimistic ($+15\%$), Realistic ($0\%$), and Conservative ($-22\%$) scenarios.

2. **Explainable AI Engine (`aiEngine.ts`)**:
   - Synthesizes positive drivers, risk points, trade-off matrix, missed factors, and reflection questions without relying on opaque black-box magic.

3. **Adaptive Learning Mechanics**:
   - Queries historical `reality_checks` for user bias ratio (e.g. $+12\%$ actual cost overrun) and pre-adjusts simulation baseline inputs.
