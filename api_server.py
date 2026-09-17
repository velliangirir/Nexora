"""Lightweight REST API & Static Web Server for AI Customer Support Agent Web UI.

Uses Python standard library http.server to provide zero-dependency local execution.
"""

import csv
import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any, Dict, List
import urllib.parse

from src.agent import CustomerSupportAgent

PROJECT_ROOT = Path(__file__).resolve().parent
WEB_DIR = PROJECT_ROOT / "web"
RESULTS_DIR = PROJECT_ROOT / "results"
EVALUATION_DIR = PROJECT_ROOT / "evaluation"

# Global agent instance
print("Initializing CustomerSupportAgent backend...")
agent = CustomerSupportAgent(auto_init=True)
print("CustomerSupportAgent initialized successfully!")


class AgentApiHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler serving REST endpoints and web dashboard static assets."""

    def _set_headers(self, status: int = HTTPStatus.OK, content_type: str = "application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(HTTPStatus.NO_CONTENT)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path == "" or path == "/index.html":
            self.serve_static_file(WEB_DIR / "index.html", "text/html")
        elif path == "/api/metrics":
            self.get_metrics()
        elif path == "/api/confusion-matrix":
            self.get_confusion_matrix()
        elif path == "/api/golden-set":
            self.get_golden_set(parsed.query)
        elif path == "/api/failure-analysis":
            self.get_failure_analysis()
        elif path == "/api/dataset-stats":
            self.get_dataset_stats()
        elif (WEB_DIR / path.lstrip("/")).is_file():
            filepath = WEB_DIR / path.lstrip("/")
            ext = filepath.suffix.lower()
            mime_map = {
                ".html": "text/html",
                ".css": "text/css",
                ".js": "text/javascript",
                ".json": "application/json",
                ".png": "image/png",
                ".svg": "image/svg+xml",
                ".ico": "image/x-icon",
            }
            self.serve_static_file(filepath, mime_map.get(ext, "application/octet-stream"))
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "Resource not found")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/process":
            self.post_process()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "Endpoint not found")

    def serve_static_file(self, filepath: Path, content_type: str):
        try:
            with open(filepath, "rb") as f:
                content = f.read()
            self._set_headers(HTTPStatus.OK, content_type)
            self.wfile.write(content)
        except Exception as e:
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, f"Error reading file: {e}")

    def post_process(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            data = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}

            message = data.get("message", "").strip()
            brand = data.get("brand", None)

            if not message:
                self._set_headers(HTTPStatus.BAD_REQUEST)
                self.wfile.write(json.dumps({"error": "Message body cannot be empty"}).encode("utf-8"))
                return

            response = agent.process(message=message, brand=brand, top_k=3)
            self._set_headers(HTTPStatus.OK)
            self.wfile.write(json.dumps(response, indent=2).encode("utf-8"))
        except Exception as e:
            self._set_headers(HTTPStatus.INTERNAL_SERVER_ERROR)
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def get_metrics(self):
        summary_file = RESULTS_DIR / "summary" / "evaluation_summary.json"
        intent_file = RESULTS_DIR / "final_intent_results.json"
        
        summary_data = {}
        intent_data = {}

        if summary_file.exists():
            with open(summary_file, "r", encoding="utf-8") as f:
                summary_data = json.load(f)
        
        if intent_file.exists():
            with open(intent_file, "r", encoding="utf-8") as f:
                intent_data = json.load(f)

        self._set_headers(HTTPStatus.OK)
        payload = {
            "summary": summary_data,
            "intent_details": intent_data,
        }
        self.wfile.write(json.dumps(payload, indent=2).encode("utf-8"))

    def get_confusion_matrix(self):
        matrix_file = RESULTS_DIR / "intent" / "confusion_matrix.csv"
        if not matrix_file.exists():
            self._set_headers(HTTPStatus.NOT_FOUND)
            self.wfile.write(json.dumps({"error": "Confusion matrix not found"}).encode("utf-8"))
            return

        intents = []
        matrix = []
        with open(matrix_file, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            headers = next(reader)
            intents = [h.strip() for h in headers[1:] if h.strip()]
            for row in reader:
                if not row or not row[0]:
                    continue
                row_intent = row[0].strip()
                counts = [int(val.strip()) for val in row[1:] if val.strip() != ""]
                matrix.append({"intent": row_intent, "values": counts})

        self._set_headers(HTTPStatus.OK)
        self.wfile.write(json.dumps({"intents": intents, "matrix": matrix}, indent=2).encode("utf-8"))

    def get_golden_set(self, query_str: str):
        golden_file = EVALUATION_DIR / "golden_set.csv"
        baseline2_preds_file = RESULTS_DIR / "baselines" / "predictions_baseline2.csv"
        baseline1_preds_file = RESULTS_DIR / "baselines" / "predictions_baseline1.csv"
        
        query_params = urllib.parse.parse_qs(query_str)
        intent_filter = query_params.get("intent", [None])[0]
        search_filter = query_params.get("search", [None])[0]

        if not golden_file.exists():
            self._set_headers(HTTPStatus.NOT_FOUND)
            self.wfile.write(json.dumps({"error": "Golden set file not found"}).encode("utf-8"))
            return

        b1_map = {}
        if baseline1_preds_file.exists():
            with open(baseline1_preds_file, "r", encoding="utf-8") as f:
                r = csv.DictReader(f)
                for row in r:
                    b1_map[row.get("id")] = row.get("predicted_intent")

        b2_map = {}
        if baseline2_preds_file.exists():
            with open(baseline2_preds_file, "r", encoding="utf-8") as f:
                r = csv.DictReader(f)
                for row in r:
                    b2_map[row.get("id")] = row.get("predicted_intent")

        rows = []
        with open(golden_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rec_id = row.get("id")
                intent = row.get("intent", "")
                text = row.get("text", "")
                brand = row.get("brand", "")

                if intent_filter and intent_filter != "all" and intent != intent_filter:
                    continue
                if search_filter:
                    q = search_filter.lower()
                    if q not in text.lower() and q not in brand.lower() and q not in intent.lower():
                        continue

                rows.append({
                    "id": rec_id,
                    "tweet_id": row.get("tweet_id"),
                    "brand": brand,
                    "text": text,
                    "intent": intent,
                    "notes": row.get("notes", ""),
                    "baseline1_pred": b1_map.get(rec_id, "order_delivery_issue"),
                    "baseline2_pred": b2_map.get(rec_id, "unknown"),
                })

        self._set_headers(HTTPStatus.OK)
        self.wfile.write(json.dumps({"total": len(rows), "data": rows[:200]}, indent=2).encode("utf-8"))

    def get_failure_analysis(self):
        failures = [
            {
                "id": 1,
                "category": "Word Sense Polysemy & Homonym Ambiguity",
                "query_id": "ID #63 (AppleSupport)",
                "query_text": "@AppleSupport this update sucks my phone needs to be charged 3 times a day, please fix. 100% this morning at 7:00 and it’s already at 49%.",
                "expected": "technical_hardware_software_bug",
                "predicted": "billing_payment_dispute (due to raw token 'charged')",
                "confidence": 0.2879,
                "decision": "ESCALATE_HUMAN (Low Confidence: 0.29 < 0.45)",
                "root_cause": "TF-IDF n-gram model treats 'charged' as a strong billing feature (+1.84 LR coeff) and lacks contextual sense disambiguation.",
                "mitigation": "Contextual sentence embeddings (MiniLM/DeBERTa) or domain token masking for battery vs card charge.",
                "severity": "Medium"
            },
            {
                "id": 2,
                "category": "Pragmatic Sarcasm & Irony Inversion",
                "query_id": "ID #190 (AmazonHelp)",
                "query_text": "@115821 Bought 2 Christmas sweaters, scheduled to be delivered today... except I received an email from Amazon the order was cancelled. Thank you Amazon for waiting until the delivery date to tell us!",
                "expected": "order_delivery_issue / complaint_poor_service",
                "predicted": "order_delivery_issue (Conf: 0.36) / feedback_praise_resolution pull",
                "confidence": 0.3638,
                "decision": "ESCALATE_HUMAN (Low Confidence: 0.36 < 0.45)",
                "root_cause": "Lexical polarity inversion ('Thank you' vs 'cancelled'). Surface token models struggle with ironic appreciation.",
                "mitigation": "Sentiment clause polarity contrast scoring and LLM zero-shot irony detection on praise+cancellation patterns.",
                "severity": "Medium"
            },
            {
                "id": 3,
                "category": "Multi-Facet Bundle Queries (Delivery + Refund)",
                "query_id": "ID #28 (Tesco)",
                "query_text": "@Tesco thanks for the non delivery with no explanation. 3-5 day refund, now without shopping or my money. @sainsburys may be better?",
                "expected": "order_delivery_issue",
                "predicted": "subscription_cancellation_refund",
                "confidence": 0.2730,
                "decision": "ESCALATE_HUMAN (Low Grounding: 0.14 < 0.15)",
                "root_cause": "Single-label classification forces mutually exclusive decision on multi-issue tickets containing refund and non-delivery.",
                "mitigation": "Multi-label classification with intent hierarchy resolver prioritizing operational fulfillment over downstream refund.",
                "severity": "Medium"
            },
            {
                "id": 4,
                "category": "Domain Metaphor & Concept Drift (Rideshare vs Delivery)",
                "query_id": "ID #24 (Uber_Support)",
                "query_text": "I can't with @115873. Ordered car. Was outside. Driver drove past me. I had bags. Was walking to him. He canceled. I had to pay $5...",
                "expected": "order_delivery_issue (pickup failure)",
                "predicted": "billing_payment_dispute",
                "confidence": 0.2207,
                "decision": "ESCALATE_HUMAN (Low Confidence: 0.22 < 0.45)",
                "root_cause": "Cross-brand taxonomy blur. Rideshare pickup failure with fee triggers billing tokens ('$5', 'pay') over transit terms.",
                "mitigation": "Condition classifier on brand category priors (e.g. rideshare vs courier delivery).",
                "severity": "Low"
            },
            {
                "id": 5,
                "category": "Regex Guardrail Fragility in Escalation Router",
                "query_id": "ID #137 & #140 (GloCare / Uber)",
                "query_text": "Natural phrasing of customer compensation / legal dispute queries not hitting strict keyword list.",
                "expected": "ESCALATE_HUMAN",
                "predicted": "AUTO_HANDLE (False Negative)",
                "confidence": 0.6400,
                "decision": "AUTO_HANDLE (Missed Escalation)",
                "root_cause": "Keyword regex list missed specific colloquial phrasing of claims, allowing high-risk ticket to auto-reply.",
                "mitigation": "Expand semantic risk classifier with embedding-based policy distance evaluation.",
                "severity": "CRITICAL"
            }
        ]
        self._set_headers(HTTPStatus.OK)
        self.wfile.write(json.dumps({"failures": failures}, indent=2).encode("utf-8"))

    def get_dataset_stats(self):
        stats_file = RESULTS_DIR / "dataset_statistics.json"
        if not stats_file.exists():
            self._set_headers(HTTPStatus.NOT_FOUND)
            self.wfile.write(json.dumps({"error": "Dataset stats file not found"}).encode("utf-8"))
            return

        with open(stats_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._set_headers(HTTPStatus.OK)
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))


def run_server(port: int = 8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, AgentApiHandler)
    url = f"http://localhost:{port}"
    print(f"\n=======================================================")
    print(f"AI Customer Support Agent Web Server running at:")
    print(f"URL: {url}")
    print(f"=======================================================\n")
    
    # Auto-open default browser
    try:
        import webbrowser
        webbrowser.open(url)
    except Exception as e:
        print(f"Note: Automatic browser opening skipped: {e}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping web server...")
        httpd.server_close()


if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 8080))
    run_server(port)

