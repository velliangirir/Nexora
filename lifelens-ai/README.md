# Futlens AI – AI-Powered What-If Decision Simulator & Adaptive Decision Support System

> **Tagline**: *"Explore the possibilities. Make better decisions."*

Futlens AI is a full-stack SaaS software product that helps users make complex real-world decisions through multi-scenario What-If simulation, deterministic multi-factor scoring with constraint penalties, explainable AI recommendations, and reality check variance tracking.

---

## 🌟 Key Features

1. **Interactive What-If Simulator**:
   - Real-time sliders for Cost Multiplier, Preparation Time Multiplier, Risk Tolerance, and Effort (Hrs/Week).
   - 0ms instant score recalculation without page reloads.

2. **Multi-Scenario Generation**:
   - Computes **Optimistic**, **Realistic**, and **Conservative** scenario outcomes with explicit key assumptions and risk levels.

3. **Deterministic Mathematical Scoring Engine**:
   - Normalized 0–100 factor scoring with hard & soft constraint penalties (e.g. budget overrun penalties, deadline delay penalties).

4. **Explainable AI Recommendations**:
   - Natural language summary explaining *"Why option X is recommended"*, key positive drivers, risk highlights, trade-off matrix, and reflection questions.

5. **Signature Reality Check Feature**:
   - Allows users to log actual costs, actual duration, and satisfaction after making a decision.
   - Calculates prediction accuracy variance % and adapts future simulation cost baselines accordingly.

6. **Interactive Visualizations**:
   - Radar charts (factor goal alignment), Bar charts (score vs penalties), and Clickable Visual Decision Tree graph nodes.

7. **Pre-Seeded Demo Mode**:
   - Instant 1-click access with sample decisions (e.g., *ECE Career Specialization: Embedded Systems vs VLSI vs IoT vs Software Dev*).

8. **PDF Report Export**:
   - Generates client-side downloadable PDF decision summary reports.

---

## 🏗️ System Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts + Lucide Icons + jsPDF
- **Backend**: Node.js + Express (TypeScript) with JWT Authentication & bcrypt
- **Database**: SQLite (via `better-sqlite3`) with relational schema

---

## 🚀 Quickstart & Running Locally

### Option A: Double-Click Launcher (Windows)
Double-click `run_lifelens.bat` in the project root.

### Option B: Command Line Setup
```bash
# 1. Install dependencies
cd lifelens-ai/backend
npm install

cd ../frontend
npm install

# 2. Run Backend API (Port 5000)
cd ../backend
npx ts-node src/index.ts

# 3. In another terminal, run Frontend (Port 3000)
cd ../frontend
npx vite
```
Open **`http://localhost:3000`** in your browser.

---

## 👤 Pre-Loaded Demo Login Credentials
- **Email**: `demo@lifelens.ai`
- **Password**: `password123`
*(Or click "⚡ Instant Demo Mode" on the navigation bar)*
