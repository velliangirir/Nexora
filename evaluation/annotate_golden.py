"""Interactive local human annotation tool for the 200-example Golden Evaluation Set.

Features:
  - Batch Annotation Mode (10, 20, 25, 50 examples per page)
  - Keyboard-driven triage (1-9, 0, U, Arrow keys / J-K navigation)
  - Zero dependencies (Python standard library http.server)
  - Immediate persistence to evaluation/golden_set.csv
  - Non-destructive: preserves existing human annotations
  - Preserves interactive CLI mode (--cli)
"""

import argparse
import html
import http.server
import json
import os
import socketserver
import sys
import urllib.parse
import webbrowser
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
UNLABELED_CSV = PROJECT_ROOT / "evaluation" / "golden_set_unlabeled.csv"
GOLDEN_CSV = PROJECT_ROOT / "evaluation" / "golden_set.csv"
CONVERSATIONS_JSONL = PROJECT_ROOT / "data" / "processed" / "conversations_sample.jsonl"

DEFAULT_PORT = 8765

INTENTS = [
    ("flight_travel_disruption", "Flight / Travel Disruption", "Delays, cancellations, rebooking, baggage issues, transit changes", "1"),
    ("order_delivery_issue", "Order & Delivery Issue", "Missing shipments, delivery delays, incorrect items, courier problems", "2"),
    ("technical_hardware_software_bug", "Technical Bug / Hardware", "App crashes, OS update glitches, device battery, screen, freezes", "3"),
    ("billing_payment_dispute", "Billing & Payment Dispute", "Double charges, disputed fees, checkout errors, fare discrepancy", "4"),
    ("account_access_security", "Account Access & Security", "Password resets, 2FA lockouts, compromised accounts, activation", "5"),
    ("service_outage_connectivity", "Service Outage & Network", "ISP internet down, network outages, cellular dropped calls", "6"),
    ("subscription_cancellation_refund", "Subscription Cancel & Refund", "Service termination, explicit refund requests, membership cancel", "7"),
    ("product_inquiry_availability", "Product Inquiry & Stock", "Store hours, stock availability, menu questions, release dates", "8"),
    ("complaint_poor_service", "Complaint / Poor Service", "Rude staff, extreme hold times, unhelpful agents, service recovery", "9"),
    ("feedback_praise_resolution", "Feedback & Praise", "Genuine compliments, gratitude, positive resolution shoutouts", "0"),
    ("uncertain", "Uncertain / Ambiguous", "Incomprehensible, insufficient context, or ambiguous query", "U"),
]


class AnnotationStore:
    def __init__(self):
        if not UNLABELED_CSV.exists():
            raise FileNotFoundError(f"Unlabeled dataset missing at {UNLABELED_CSV}")

        self.unlabeled_df = pd.read_csv(UNLABELED_CSV)
        self.annotations: Dict[int, Dict[str, Any]] = {}
        self.load_existing_annotations()

        # Load conversation contexts
        self._conv_cache: Dict[int, List[Dict[str, Any]]] = {}
        self._load_conversations()

    def _load_conversations(self):
        if CONVERSATIONS_JSONL.exists():
            target_cids = set(self.unlabeled_df["conversation_id"].astype(int))
            with open(CONVERSATIONS_JSONL, "r", encoding="utf-8") as f:
                for line in f:
                    line_str = line.strip()
                    if not line_str:
                        continue
                    try:
                        data = json.loads(line_str)
                        cid = int(data.get("conversation_id", 0))
                        if cid in target_cids:
                            self._conv_cache[cid] = data.get("turns", [])
                    except Exception:
                        pass

    def load_existing_annotations(self):
        if GOLDEN_CSV.exists():
            try:
                df = pd.read_csv(GOLDEN_CSV)
                for _, row in df.iterrows():
                    intent_val = str(row.get("intent", "")).strip() if pd.notna(row.get("intent")) else ""
                    if intent_val:
                        eid = int(row["id"])
                        self.annotations[eid] = {
                            "id": eid,
                            "tweet_id": int(row["tweet_id"]),
                            "brand": str(row["brand"]),
                            "text": str(row["text"]),
                            "intent": intent_val,
                            "notes": str(row.get("notes", "")).strip() if pd.notna(row.get("notes")) else "",
                            "conversation_id": int(row["conversation_id"]),
                            "source_row_id": int(row.get("source_row_id", 0)),
                        }
            except Exception as e:
                print(f"Warning: Could not read existing annotations: {e}")

    def save_batch(self, batch_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Saves a batch of human annotations directly into golden_set.csv."""
        saved_count = 0
        for item in batch_items:
            eid = int(item["id"])
            intent = str(item.get("intent", "")).strip()
            notes = str(item.get("notes", "")).strip()

            if intent:
                row_match = self.unlabeled_df[self.unlabeled_df["id"] == eid]
                if not row_match.empty:
                    u_row = row_match.iloc[0]
                    self.annotations[eid] = {
                        "id": eid,
                        "tweet_id": int(u_row["tweet_id"]),
                        "brand": str(u_row["brand"]),
                        "text": str(u_row["text"]),
                        "intent": intent,
                        "notes": notes,
                        "conversation_id": int(u_row["conversation_id"]),
                        "source_row_id": int(u_row.get("source_row_id", 0)),
                    }
                    saved_count += 1
            elif eid in self.annotations and not intent:
                # If explicitly cleared
                del self.annotations[eid]

        # Write entire updated golden_set.csv
        out_rows = []
        for _, u_row in self.unlabeled_df.iterrows():
            eid = int(u_row["id"])
            if eid in self.annotations:
                out_rows.append(self.annotations[eid])
            else:
                out_rows.append(
                    {
                        "id": eid,
                        "tweet_id": int(u_row["tweet_id"]),
                        "brand": str(u_row["brand"]),
                        "text": str(u_row["text"]),
                        "intent": "",
                        "notes": "",
                        "conversation_id": int(u_row["conversation_id"]),
                        "source_row_id": int(u_row.get("source_row_id", 0)),
                    }
                )

        df_out = pd.DataFrame(out_rows)
        # Flush to golden_set.csv immediately
        df_out.to_csv(GOLDEN_CSV, index=False, encoding="utf-8")
        return {"saved_count": saved_count, "progress": self.get_progress()}

    def get_progress(self) -> Dict[str, Any]:
        total = len(self.unlabeled_df)
        completed = len([eid for eid in self.annotations if self.annotations[eid].get("intent")])
        return {"total": total, "completed": completed, "remaining": total - completed}

    def get_batch(self, offset: int = 0, limit: int = 20) -> Dict[str, Any]:
        total = len(self.unlabeled_df)
        safe_offset = max(0, min(offset, total - 1)) if total > 0 else 0
        sliced = self.unlabeled_df.iloc[safe_offset : safe_offset + limit]

        items = []
        for _, row in sliced.iterrows():
            eid = int(row["id"])
            existing = self.annotations.get(eid, {})
            cid = int(row["conversation_id"])
            turns = self._conv_cache.get(cid, [])

            items.append(
                {
                    "id": eid,
                    "tweet_id": int(row["tweet_id"]),
                    "brand": str(row["brand"]),
                    "text": str(row["text"]),
                    "conversation_id": cid,
                    "intent": existing.get("intent", ""),
                    "notes": existing.get("notes", ""),
                    "turns": turns,
                }
            )

        return {
            "total": total,
            "offset": safe_offset,
            "limit": limit,
            "items": items,
            "progress": self.get_progress(),
        }

    def get_example(self, example_id: int) -> Optional[Dict[str, Any]]:
        matches = self.unlabeled_df[self.unlabeled_df["id"] == example_id]
        if matches.empty:
            return None
        row = matches.iloc[0]
        existing = self.annotations.get(example_id, {})
        cid = int(row["conversation_id"])
        turns = self._conv_cache.get(cid, [])

        return {
            "id": int(row["id"]),
            "tweet_id": int(row["tweet_id"]),
            "brand": str(row["brand"]),
            "text": str(row["text"]),
            "conversation_id": cid,
            "intent": existing.get("intent", ""),
            "notes": existing.get("notes", ""),
            "turns": turns,
        }

    def get_first_unannotated_offset(self, batch_size: int = 20) -> int:
        for idx, eid in enumerate(self.unlabeled_df["id"]):
            if eid not in self.annotations or not self.annotations[eid].get("intent"):
                # Round down to start of batch
                return (idx // batch_size) * batch_size
        return 0


HTML_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hiver Support Annotation Console — Golden Evaluation Set</title>
  <style>
    :root {
      --bg: #f8fafc;
      --panel-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-sub: #334155;
      --border: #cbd5e1;
      --border-light: #e2e8f0;
      --accent: #1e40af;
      --accent-hover: #1d4ed8;
      --focus-ring: #2563eb;
      --success-bg: #ecfdf5;
      --success-text: #065f46;
      --success-border: #a7f3d0;
      --warning-bg: #fffbeb;
      --warning-text: #92400e;
      --warning-border: #fde68a;
      --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: var(--bg); color: var(--text-main); font-family: var(--font-sans); padding: 8px 14px; min-height: 100vh; display: flex; justify-content: center; }
    .console-container { width: 100%; max-width: 1360px; display: flex; flex-direction: column; gap: 5px; }

    /* Top Compact Header */
    header.console-header {
      background: var(--panel-bg);
      border: 1px solid var(--border-light);
      border-radius: 4px;
      padding: 6px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .header-titles { display: flex; align-items: baseline; gap: 10px; }
    .app-title { font-size: 14px; font-weight: 700; color: var(--text-main); letter-spacing: -0.01em; }
    .app-subtitle { font-size: 11px; color: var(--text-muted); font-weight: 500; }
    .header-stats { display: flex; align-items: center; gap: 14px; }
    .header-batch-pill {
      background: #f1f5f9;
      border: 1px solid var(--border);
      color: var(--text-sub);
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    .progress-cluster { display: flex; align-items: center; gap: 8px; font-size: 11.5px; }
    .progress-text { font-weight: 600; color: var(--text-sub); font-size: 11.5px; }
    .progress-track { width: 100px; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; width: 0%; background: var(--accent); transition: width 0.25s ease; }

    /* Sticky Compact Toolbar */
    .console-toolbar {
      background: var(--panel-bg);
      border: 1px solid var(--border-light);
      border-radius: 4px;
      padding: 5px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .toolbar-left { display: flex; align-items: center; gap: 6px; }
    .toolbar-right { display: flex; align-items: center; gap: 12px; }
    .btn-tool {
      background: #ffffff;
      border: 1px solid var(--border);
      color: var(--text-main);
      border-radius: 3px;
      padding: 3px 10px;
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.1s, border-color 0.1s;
    }
    .btn-tool:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
    .btn-tool:disabled { opacity: 0.45; cursor: not-allowed; }
    .batch-range-text { font-weight: 600; color: var(--text-main); font-size: 11.5px; font-family: var(--font-mono); padding: 0 4px; }
    .btn-save {
      background: #047857;
      color: #ffffff;
      border: 1px solid #059669;
      border-radius: 3px;
      padding: 3px 12px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-save:hover { background: #065f46; }
    .save-indicator { font-size: 11px; color: #047857; font-weight: 600; }
    .toggle-compact {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      color: var(--text-sub);
      cursor: pointer;
      user-select: none;
    }
    .toggle-compact input { cursor: pointer; }
    .batch-select-wrap { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-sub); font-weight: 500; }
    .batch-select-wrap select {
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-main);
      background: #ffffff;
      cursor: pointer;
      outline: none;
    }

    /* Annotation Items List */
    .annotation-feed { display: flex; flex-direction: column; gap: 4px; min-height: 350px; }

    /* Full 3-Column Research Workstation Row */
    .research-row {
      background: var(--panel-bg);
      border: 1px solid var(--border-light);
      border-radius: 4px;
      display: grid;
      grid-template-columns: 160px 1fr 400px;
      position: relative;
      transition: border-color 0.12s, box-shadow 0.12s;
    }
    .research-row.annotated { border-left: 4px solid #10b981; }
    .research-row.unannotated { border-left: 4px solid #f59e0b; }
    .research-row.focused {
      border-color: var(--focus-ring);
      box-shadow: 0 0 0 1px var(--focus-ring);
    }

    .col-meta {
      border-right: 1px solid var(--border-light);
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      background: #fafbfc;
    }
    .ex-num { font-size: 12.5px; font-weight: 700; color: var(--text-main); }
    .brand-tag {
      background: #f1f5f9;
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 1px 5px;
      font-size: 10.5px;
      font-family: var(--font-mono);
      color: #0369a1;
      font-weight: 600;
      display: inline-block;
      align-self: flex-start;
    }
    .tweet-meta { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
    .status-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 3px;
      display: inline-block;
      text-align: center;
      margin-top: 1px;
      align-self: flex-start;
    }
    .status-badge.done { background: var(--success-bg); color: var(--success-text); border: 1px solid var(--success-border); }
    .status-badge.pending { background: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border); }
    .btn-row-action {
      background: none;
      border: none;
      padding: 0;
      color: var(--accent);
      font-size: 10px;
      cursor: pointer;
      text-decoration: underline;
      align-self: flex-start;
      margin-top: 2px;
    }

    .col-content {
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .customer-prompt-label { font-size: 9.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .message-box {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 6px 10px;
      font-size: 12.5px;
      line-height: 1.35;
      color: var(--text-main);
      max-height: 64px;
      overflow-y: auto;
      word-break: break-word;
    }
    .context-wrap { font-size: 10.5px; }
    .btn-toggle-context {
      background: none;
      border: none;
      padding: 0;
      color: #0369a1;
      font-size: 10.5px;
      cursor: pointer;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .btn-toggle-context:hover { text-decoration: underline; }
    .context-box {
      margin-top: 4px;
      background: #f8fafc;
      border: 1px solid var(--border-light);
      border-radius: 3px;
      padding: 5px 8px;
      font-size: 11px;
      line-height: 1.35;
      max-height: 90px;
      overflow-y: auto;
    }
    .turn-line { padding: 2px 0; border-bottom: 1px solid var(--border-light); }
    .turn-author { font-weight: 600; color: #1e40af; font-family: var(--font-mono); font-size: 10px; }
    .context-single-note { color: var(--text-muted); font-size: 10px; }

    .col-controls {
      border-left: 1px solid var(--border-light);
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #fafbfc;
    }
    .controls-label { font-size: 9.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .intents-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
    .btn-choice {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 10px;
      line-height: 1.2;
      min-height: 22px;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--text-main);
      transition: background 0.1s, border-color 0.1s;
    }
    .btn-choice:hover { background: #f1f5f9; border-color: #94a3b8; }
    .btn-choice.selected {
      background: var(--accent) !important;
      border-color: #1e3a8a !important;
      color: #ffffff !important;
      font-weight: 600;
    }
    .btn-choice.btn-uncertain {
      grid-column: 1 / -1;
      border-style: dashed;
      border-color: #d97706;
      background: #fffdfa;
      color: #92400e;
      min-height: 22px;
      padding: 2px 6px;
    }
    .btn-choice.btn-uncertain:hover { background: #fef3c7; }
    .btn-choice.btn-uncertain.selected {
      background: #92400e !important;
      border-color: #78350f !important;
      color: #ffffff !important;
    }
    .key-tag {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 9.5px;
      color: var(--text-muted);
      background: #f1f5f9;
      border-radius: 2px;
      padding: 0px 3px;
      flex-shrink: 0;
      min-width: 13px;
      text-align: center;
    }
    .btn-choice.selected .key-tag { background: rgba(255, 255, 255, 0.25); color: #ffffff; }
    .choice-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10px; font-weight: 500; }

    .notes-section { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
    .notes-label { font-size: 9.5px; font-weight: 600; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
    .notes-input {
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 11px;
      height: 22px;
      background: #ffffff;
      color: var(--text-main);
      width: 100%;
      box-sizing: border-box;
    }
    .notes-input:focus { border-color: var(--focus-ring); outline: none; }

    /* Compact Completed Row (Single Row Summary) */
    .compact-row {
      background: var(--panel-bg);
      border: 1px solid var(--border-light);
      border-left: 4px solid #10b981;
      border-radius: 3px;
      padding: 2px 10px;
      min-height: 26px;
      height: 26px;
      display: grid;
      grid-template-columns: 180px 1fr 180px 48px;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.1s, border-color 0.1s;
    }
    .compact-row:hover { background: #f8fafc; border-color: #cbd5e1; }
    .compact-row.focused {
      border-color: var(--focus-ring);
      box-shadow: 0 0 0 1px var(--focus-ring);
      background: #f0f7ff;
    }
    .compact-col-left { display: flex; align-items: center; gap: 5px; overflow: hidden; }
    .compact-check { color: #047857; font-weight: 800; font-size: 11px; }
    .compact-id { font-weight: 700; color: var(--text-main); font-size: 11.5px; }
    .compact-brand { font-family: var(--font-mono); color: #0369a1; font-size: 10.5px; }
    .compact-snippet { color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px; }
    .compact-intent-pill {
      background: #f1f5f9;
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 1px 6px;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }
    .btn-compact-edit {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 2px;
      padding: 1px 4px;
      font-size: 10px;
      color: var(--text-sub);
      font-weight: 500;
      cursor: pointer;
      text-align: center;
    }
    .btn-compact-edit:hover { background: #f1f5f9; color: var(--text-main); }

    /* Footer & Keyboard Reference */
    footer.console-footer {
      background: var(--panel-bg);
      border: 1px solid var(--border-light);
      border-radius: 4px;
      padding: 6px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .footer-left { font-weight: 500; }
    .footer-right { display: flex; align-items: center; gap: 6px; }
    .key-kbd {
      background: #f1f5f9;
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 1px 4px;
      font-family: var(--font-mono);
      font-size: 9.5px;
      color: var(--text-main);
      font-weight: 600;
    }

    /* Responsive adjustments */
    @media (max-width: 1150px) {
      .research-row { grid-template-columns: 160px 1fr 380px; }
      .compact-row { grid-template-columns: 200px 1fr 180px 60px; }
    }
    @media (max-width: 960px) {
      .research-row { grid-template-columns: 1fr; }
      .col-meta, .col-content, .col-controls { border: none; border-bottom: 1px solid var(--border-light); }
      .compact-row { grid-template-columns: 1fr auto; }
      .compact-snippet { display: none; }
    }
  </style>
</head>
<body>
  <div class="console-container">
    <header class="console-header">
      <div class="header-titles">
        <div class="app-title">Hiver Support Annotation Console</div>
        <div class="app-subtitle">Golden Set • Human Intent Annotation</div>
      </div>

      <div class="header-stats">
        <span class="header-batch-pill" id="headerBatchBadge">Batch 1 / 10</span>
        <div class="progress-cluster">
          <span class="progress-text" id="progressText">Human annotated: 0 / 200 (0%)</span>
          <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
        </div>
      </div>
    </header>

    <div class="console-toolbar">
      <div class="toolbar-left">
        <button class="btn-tool" id="prevBatchBtn" onclick="prevBatch()">← Previous Batch</button>
        <span class="batch-range-text" id="batchInfoText">Batch 1 of 10 — Examples 1 to 20</span>
        <button class="btn-tool" id="nextBatchBtn" onclick="nextBatch()">Next Batch →</button>
        <button class="btn-save" onclick="saveCurrentBatch(true)">Save Batch</button>
        <span class="save-indicator" id="saveStatus"></span>
      </div>

      <div class="toolbar-right">
        <label class="toggle-compact">
          <input type="checkbox" id="compactModeToggle" onchange="toggleCompactMode(this.checked)" checked>
          Compact completed rows
        </label>

        <div class="batch-select-wrap">
          <label for="batchSizeSelect">Batch size:</label>
          <select id="batchSizeSelect" onchange="changeBatchSize(this.value)">
            <option value="10">10</option>
            <option value="20" selected>20</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    </div>

    <main class="annotation-feed" id="examplesList">
      <div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px;">Loading batch data...</div>
    </main>

    <div class="console-toolbar" style="margin-top: 4px;">
      <div class="toolbar-left">
        <button class="btn-tool" onclick="prevBatch()">← Previous Batch</button>
        <button class="btn-save" onclick="saveCurrentBatch(true)">Save Batch</button>
        <button class="btn-tool" onclick="nextBatch()">Next Batch →</button>
      </div>
      <div class="toolbar-right">
        <span style="font-size: 11.5px; color: var(--text-muted);">Console autosaves selections immediately</span>
      </div>
    </div>

    <footer class="console-footer">
      <div class="footer-left">
        Human Annotation Console • Golden Set • 200 examples • Local / Offline Evaluation
      </div>
      <div class="footer-right">
        Shortcuts:
        <span class="key-kbd">1–9</span> <span class="key-kbd">0</span> Intent &bull;
        <span class="key-kbd">U</span> Uncertain &bull;
        <span class="key-kbd">↑/↓</span> or <span class="key-kbd">J/K</span> Focus &bull;
        <span class="key-kbd">Ctrl+S</span> Save &bull;
        <span class="key-kbd">Esc</span> Blur
      </div>
    </footer>
  </div>

  <script>
    const INTENTS = [
      ["flight_travel_disruption", "Flight / Travel Disruption", "Delays, cancellations, rebooking, baggage issues", "1"],
      ["order_delivery_issue", "Order & Delivery Issue", "Missing shipments, delivery delays, incorrect items", "2"],
      ["technical_hardware_software_bug", "Technical Bug / Hardware", "App crashes, OS update glitches, device freezes", "3"],
      ["billing_payment_dispute", "Billing & Payment Dispute", "Double charges, disputed fees, checkout errors", "4"],
      ["account_access_security", "Account Access & Security", "Password resets, 2FA lockouts, compromised accounts", "5"],
      ["service_outage_connectivity", "Service Outage & Network", "ISP internet down, network outages, cellular signal", "6"],
      ["subscription_cancellation_refund", "Subscription Cancel & Refund", "Service termination, refund requests, cancellation", "7"],
      ["product_inquiry_availability", "Product Inquiry & Stock", "Store hours, stock availability, menu questions", "8"],
      ["complaint_poor_service", "Complaint / Poor Service", "Rude staff, extreme hold times, unhelpful agents", "9"],
      ["feedback_praise_resolution", "Feedback & Praise", "Compliments, gratitude, positive resolution", "0"],
      ["uncertain", "Uncertain / Ambiguous", "Incomprehensible or insufficient context", "U"]
    ];

    let currentOffset = 0;
    let currentBatchSize = 20;
    let currentBatchData = [];
    let focusedIndex = 0;
    let compactModeActive = true;
    let manuallyExpanded = {};

    function getIntentLabel(code) {
      const match = INTENTS.find(i => i[0] === code);
      return match ? match[1] : code;
    }

    async function loadBatch(offset, size) {
      currentOffset = offset;
      currentBatchSize = size;
      manuallyExpanded = {};
      document.getElementById("batchSizeSelect").value = String(size);

      const res = await fetch(`/api/batch?start=${offset}&size=${size}`);
      const data = await res.json();
      currentBatchData = data.items;

      updateBatchHeader(data.total);
      updateProgress(data.progress);

      // Focus first unannotated item, or index 0
      const firstUn = currentBatchData.findIndex(item => !item.intent);
      focusedIndex = firstUn >= 0 ? firstUn : 0;

      renderBatch();
      scrollToFocused();
    }

    function updateBatchHeader(total) {
      const startNum = currentOffset + 1;
      const endNum = Math.min(currentOffset + currentBatchSize, total);
      const batchNum = Math.floor(currentOffset / currentBatchSize) + 1;
      const totalBatches = Math.ceil(total / currentBatchSize);

      document.getElementById("batchInfoText").innerText = 
        `Batch ${batchNum} of ${totalBatches} — Examples ${startNum} to ${endNum}`;
      document.getElementById("headerBatchBadge").innerText = 
        `Batch ${batchNum} / ${totalBatches}`;

      document.getElementById("prevBatchBtn").disabled = currentOffset <= 0;
      document.getElementById("nextBatchBtn").disabled = endNum >= total;
    }

    function updateProgress(prog) {
      const pct = Math.round((prog.completed / prog.total) * 100);
      document.getElementById("progressFill").style.width = pct + "%";
      document.getElementById("progressText").innerText = `Human annotated: ${prog.completed} / ${prog.total} (${pct}%)`;
    }

    function renderBatch() {
      const list = document.getElementById("examplesList");
      list.innerHTML = "";

      currentBatchData.forEach((item, idx) => {
        const isFocused = idx === focusedIndex;
        const isAnnotated = Boolean(item.intent);
        const shouldCompact = compactModeActive && isAnnotated && !isFocused && !manuallyExpanded[idx];

        if (shouldCompact) {
          // Compact Row View
          const row = document.createElement("div");
          row.id = `row-${idx}`;
          row.className = `compact-row ${isFocused ? 'focused' : ''}`;
          row.onclick = () => {
            expandItem(idx);
          };

          row.innerHTML = `
            <div class="compact-col-left">
              <span class="compact-check">✓</span>
              <span class="compact-id">#${item.id}</span>
              <span class="compact-brand">@${item.brand}</span>
            </div>
            <div class="compact-snippet" title="${escapeHtml(item.text)}">"${escapeHtml(item.text)}"</div>
            <div class="compact-intent-pill" title="${escapeHtml(getIntentLabel(item.intent))}">${escapeHtml(getIntentLabel(item.intent))}</div>
            <button type="button" class="btn-compact-edit" onclick="expandItem(${idx}, event)">Edit ▾</button>
          `;
          list.appendChild(row);
        } else {
          // Full 3-Column Research Workstation Row
          const row = document.createElement("div");
          row.id = `row-${idx}`;
          row.className = `research-row ${isAnnotated ? 'annotated' : 'unannotated'} ${isFocused ? 'focused' : ''}`;
          row.onclick = (e) => {
            if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT") {
              setFocus(idx, false);
            }
          };

          const statusHtml = isAnnotated
            ? `<div class="status-badge done" id="badge-${idx}">✓ ${escapeHtml(getIntentLabel(item.intent))}</div>`
            : `<div class="status-badge pending" id="badge-${idx}">⚪ Incomplete</div>`;

          let contextHtml = "";
          if (item.turns && item.turns.length > 1) {
            const turnsContent = item.turns.slice(0, 4).map((t, tIdx) =>
              `<div class="turn-line"><span class="turn-author">[Turn ${tIdx+1} ${t.inbound ? 'Customer' : 'Agent'}]:</span> ${escapeHtml(t.text_cleaned || t.text)}</div>`
            ).join("");
            contextHtml = `
              <div class="context-wrap">
                <button type="button" class="btn-toggle-context" onclick="toggleContext(${idx}, event)">
                  ▾ Show context (${item.turns.length} turns)
                </button>
                <div class="context-box" id="turns-${idx}" style="display: none;">${turnsContent}</div>
              </div>
            `;
          } else {
            contextHtml = `<div class="context-single-note">💬 Context: Single customer inbound</div>`;
          }

          const buttonsHtml = INTENTS.map(([code, name, desc, key]) => {
            const isSel = item.intent === code;
            const isUncertain = code === "uncertain";
            return `
              <button type="button" 
                      class="btn-choice ${isSel ? 'selected' : ''} ${isUncertain ? 'btn-uncertain' : ''}" 
                      id="btn-${idx}-${code}" 
                      onclick="selectItemIntent(${idx}, '${code}')" 
                      title="${name} — ${desc}">
                <span class="key-tag">${key}</span>
                <span class="choice-title">${name}</span>
              </button>
            `;
          }).join("");

          const collapseActionHtml = isAnnotated
            ? `<button type="button" class="btn-row-action" onclick="collapseItem(${idx}, event)">▴ Compact row</button>`
            : '';

          row.innerHTML = `
            <div class="col-meta">
              <div class="ex-num">Example #${item.id}</div>
              <span class="brand-tag">@${item.brand}</span>
              <div class="tweet-meta">Tweet ID: ${item.tweet_id}</div>
              ${statusHtml}
              ${collapseActionHtml}
            </div>

            <div class="col-content">
              <div class="customer-prompt-label">Customer Inquiry</div>
              <div class="message-box">${escapeHtml(item.text)}</div>
              ${contextHtml}
            </div>

            <div class="col-controls">
              <div class="controls-label">Intent Taxonomy</div>
              <div class="intents-grid">${buttonsHtml}</div>
              <div class="notes-section">
                <label class="notes-label" for="notes-${idx}">Note (opt):</label>
                <input type="text" class="notes-input" id="notes-${idx}" 
                       value="${escapeHtml(item.notes || '')}" 
                       placeholder="Optional note..." 
                       onchange="updateItemNotes(${idx}, this.value)">
              </div>
            </div>
          `;

          list.appendChild(row);
        }
      });
    }

    function toggleCompactMode(checked) {
      compactModeActive = checked;
      renderBatch();
      scrollToFocused();
    }

    function expandItem(idx, event) {
      if (event) event.stopPropagation();
      manuallyExpanded[idx] = true;
      setFocus(idx, true);
    }

    function collapseItem(idx, event) {
      if (event) event.stopPropagation();
      manuallyExpanded[idx] = false;
      renderBatch();
    }

    function toggleContext(idx, event) {
      if (event) event.stopPropagation();
      const box = document.getElementById(`turns-${idx}`);
      if (box) {
        box.style.display = box.style.display === "block" ? "none" : "block";
      }
    }

    function setFocus(idx, shouldRender = true) {
      if (idx < 0 || idx >= currentBatchData.length) return;
      focusedIndex = idx;
      if (shouldRender) {
        renderBatch();
      } else {
        // Update highlight without full re-render
        currentBatchData.forEach((_, i) => {
          const el = document.getElementById(`row-${i}`);
          if (el) {
            if (i === idx) el.classList.add("focused");
            else el.classList.remove("focused");
          }
        });
      }
      scrollToFocused();
    }

    function scrollToFocused() {
      const targetEl = document.getElementById(`row-${focusedIndex}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function selectItemIntent(idx, intentCode) {
      currentBatchData[idx].intent = intentCode;

      // Auto-save batch silently to preserve selection immediately
      saveCurrentBatch(false);

      // Advance focus to next item
      if (idx + 1 < currentBatchData.length) {
        focusedIndex = idx + 1;
      }
      renderBatch();
      scrollToFocused();
    }

    function updateItemNotes(idx, val) {
      currentBatchData[idx].notes = val;
      saveCurrentBatch(false);
    }

    async function saveCurrentBatch(showNotification = true) {
      const payload = currentBatchData.map(item => ({
        id: item.id,
        intent: item.intent || "",
        notes: item.notes || ""
      }));

      const res = await fetch('/api/save_batch', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ items: payload })
      });
      const data = await res.json();
      updateProgress(data.progress);

      if (showNotification) {
        const indicator = document.getElementById("saveStatus");
        indicator.innerText = `✓ Saved (${data.saved_count} annotated)`;
        setTimeout(() => indicator.innerText = "", 2500);
      }
    }

    async function nextBatch() {
      await saveCurrentBatch(false);
      const nextOffset = currentOffset + currentBatchSize;
      if (nextOffset < 200) {
        loadBatch(nextOffset, currentBatchSize);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("You are on the final batch!");
      }
    }

    async function prevBatch() {
      await saveCurrentBatch(false);
      const prevOffset = Math.max(0, currentOffset - currentBatchSize);
      loadBatch(prevOffset, currentBatchSize);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function changeBatchSize(newSize) {
      saveCurrentBatch(false);
      const size = parseInt(newSize, 10);
      const newOffset = Math.floor(currentOffset / size) * size;
      loadBatch(newOffset, size);
    }

    function escapeHtml(text) {
      if (!text) return "";
      return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.activeElement) {
        document.activeElement.blur();
        return;
      }
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;

      // Intent keys 1-9, 0, U
      if (e.key >= "1" && e.key <= "9") {
        const intentCode = INTENTS[parseInt(e.key, 10) - 1][0];
        selectItemIntent(focusedIndex, intentCode);
      } else if (e.key === "0") {
        selectItemIntent(focusedIndex, INTENTS[9][0]);
      } else if (e.key.toLowerCase() === "u") {
        selectItemIntent(focusedIndex, "uncertain");
      }
      // Card navigation: Up/Down arrow or J/K
      else if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        setFocus(Math.min(currentBatchData.length - 1, focusedIndex + 1), true);
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFocus(Math.max(0, focusedIndex - 1), true);
      }
      // Batch save / navigation shortcuts
      else if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveCurrentBatch(true);
      } else if (e.ctrlKey && e.key === "ArrowRight") {
        e.preventDefault();
        nextBatch();
      } else if (e.ctrlKey && e.key === "ArrowLeft") {
        e.preventDefault();
        prevBatch();
      }
    });

    // Startup: find first batch containing unannotated examples
    fetch('/api/first_unannotated_offset?batch_size=' + currentBatchSize)
      .then(r => r.json())
      .then(d => loadBatch(d.offset, currentBatchSize));
  </script>
</body>
</html>
"""


class BatchAnnotationServerHandler(http.server.BaseHTTPRequestHandler):
    def __init__(self, *args, store: AnnotationStore = None, **kwargs):
        self.store = store
        super().__init__(*args, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)

        if parsed.path == "/":
            self.send_response(200)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_PAGE.encode("utf-8"))
        elif parsed.path == "/api/progress":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(self.store.get_progress()).encode("utf-8"))
        elif parsed.path == "/api/batch":
            offset = int(qs.get("start", [0])[0])
            limit = int(qs.get("size", [20])[0])
            data = self.store.get_batch(offset=offset, limit=limit)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))
        elif parsed.path == "/api/first_unannotated_offset":
            bs = int(qs.get("batch_size", [20])[0])
            offset = self.store.get_first_unannotated_offset(batch_size=bs)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"offset": offset}).encode("utf-8"))
        elif parsed.path == "/api/example":
            eid = int(qs.get("id", [1])[0])
            ex = self.store.get_example(eid)
            self.send_response(200 if ex else 404)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(ex or {"error": "Not found"}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        data = json.loads(body)

        if self.path == "/api/save_batch":
            items = data.get("items", [])
            res = self.store.save_batch(items)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
        elif self.path == "/api/annotate":
            # Single item compatibility
            self.store.save_batch([{"id": int(data["id"]), "intent": str(data["intent"]), "notes": str(data.get("notes", ""))}])
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "progress": self.store.get_progress()}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass


def run_cli_annotation(store: AnnotationStore):
    print("=" * 80)
    print("      INTERACTIVE TERMINAL ANNOTATOR (GOLDEN EVALUATION SET)       ")
    print("=" * 80)
    total = len(store.unlabeled_df)
    first_un = 1
    for eid in store.unlabeled_df["id"]:
        if eid not in store.annotations or not store.annotations[eid].get("intent"):
            first_un = int(eid)
            break

    for eid in range(first_un, total + 1):
        ex = store.get_example(eid)
        prog = store.get_progress()
        print(f"\n[{eid}/{total}] Brand: @{ex['brand']} | Tweet ID: {ex['tweet_id']} | Progress: {prog['completed']}/{total}")
        print("-" * 80)
        print(f"Customer Message:\n\"{ex['text']}\"")
        if ex.get("intent"):
            print(f"Current annotation: {ex['intent']}")
        print("-" * 80)
        for idx, (code, title, _, key) in enumerate(INTENTS, 1):
            print(f"  [{key}] {title} ({code})")

        print("  [q] Quit and save")
        choice = input("\nSelect intent [1-9, 0, U, q]: ").strip().lower()
        if choice == "q":
            print("\nAnnotation session paused. Progress preserved in evaluation/golden_set.csv!")
            break

        mapping = {k.lower(): code for code, _, _, k in INTENTS}
        if choice in mapping:
            chosen_intent = mapping[choice]
            notes = input("Optional notes (press Enter to skip): ").strip()
            store.save_batch([{"id": eid, "intent": chosen_intent, "notes": notes}])
            print(f"Saved: {chosen_intent}")
        else:
            print("Invalid selection. Skipping.")


def find_open_port(start_port: int = DEFAULT_PORT, max_attempts: int = 20) -> int:
    import socket
    for p in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", p)) != 0:
                return p
    return start_port


def main():
    parser = argparse.ArgumentParser(description="Batch Human Annotation Interface for Golden Evaluation Set")
    parser.add_argument("--cli", action="store_true", help="Run interactive CLI annotator in terminal")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port for local web interface")
    args = parser.parse_args()

    store = AnnotationStore()
    prog = store.get_progress()
    print(f"Loaded {prog['total']} candidate examples. Completed human annotations: {prog['completed']}/{prog['total']}")

    if args.cli:
        run_cli_annotation(store)
    else:
        socketserver.TCPServer.allow_reuse_address = True
        active_port = find_open_port(args.port)
        server_address = ("", active_port)
        handler = lambda *h_args, **h_kwargs: BatchAnnotationServerHandler(*h_args, store=store, **h_kwargs)

        try:
            httpd = socketserver.TCPServer(server_address, handler)
        except OSError:
            active_port = find_open_port(active_port + 1)
            server_address = ("", active_port)
            httpd = socketserver.TCPServer(server_address, handler)

        url = f"http://localhost:{active_port}"
        print("\n" + "=" * 80)
        print(f"  BATCH HUMAN ANNOTATION SERVER RUNNING: {url}")
        print(f"  - Batch Size Selector: 10, 20, 25, 50 (Default: 20)")
        print(f"  - Keyboard shortcuts: 1-9, 0, U to label focused card | Up/Down or J/K to navigate")
        print(f"  - Press Ctrl+C in terminal to stop server when finished.")
        print("=" * 80 + "\n")

        try:
            webbrowser.open(url)
        except Exception:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nAnnotation server stopped. Annotations preserved in evaluation/golden_set.csv.")


if __name__ == "__main__":
    main()
