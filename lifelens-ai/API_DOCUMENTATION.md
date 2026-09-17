# API_DOCUMENTATION.md — Futlens AI REST Specification

## Authentication Endpoints
- `POST /api/auth/register`: Create user account
- `POST /api/auth/login`: Authenticate user & return JWT token
- `GET /api/auth/profile`: Fetch current user details

## Decisions Endpoints
- `GET /api/decisions`: List user's decisions
- `GET /api/decisions/:id`: Fetch decision with options, factors, constraints, & baseline scores
- `POST /api/decisions`: Create new multi-step decision
- `DELETE /api/decisions/:id`: Delete decision

## Simulation Endpoints
- `POST /api/simulations`: Execute real-time What-If slider calculation (returns evaluations & Explainable AI report)

## Reality Check Endpoints
- `POST /api/reality-checks`: Record actual cost, actual time, satisfaction score, & notes
- `GET /api/reality-checks/:decisionId`: Fetch recorded reality check

## Analytics & AI Endpoints
- `GET /api/analytics`: Fetch dashboard KPIs, category donut, prediction accuracy trend, & risk distribution
- `POST /api/ai/analyze`: Request explainable AI report
