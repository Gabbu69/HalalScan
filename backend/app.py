from __future__ import annotations

import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from .analysis import analyze_payload
from .database import init_db, list_history
from .knowledge_base import load_certifying_bodies, load_rules
from .ocr import is_configured as is_google_vision_configured
from .ocr import run_ocr_payload
from .rapidapi_client import is_configured as is_rapidapi_configured


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    init_db()

    @app.get("/api/health")
    def health():
        return jsonify(
            {
                "ok": True,
                "service": "HalalScan Flask API",
                "googleVision": {"configured": is_google_vision_configured()},
                "rapidapi": {"configured": is_rapidapi_configured()},
                "rules": {"count": len(load_rules())},
                "certifyingBodies": {"count": len(load_certifying_bodies())},
            }
        )

    @app.post("/api/ocr")
    def ocr():
        try:
            return jsonify(run_ocr_payload(request))
        except ValueError as exc:
            return jsonify({"code": "INVALID_OCR_REQUEST", "error": str(exc)}), 400
        except Exception as exc:
            return jsonify({"code": "OCR_FAILED", "error": str(exc)}), 502

    @app.post("/api/analyze")
    def analyze():
        payload = request.get_json(silent=True) or {}
        try:
            return jsonify(analyze_payload(payload))
        except Exception as exc:
            return jsonify({"code": "ANALYSIS_FAILED", "error": str(exc)}), 500

    @app.get("/api/rules")
    def rules():
        return jsonify(
            {
                "rules": load_rules(),
                "certifying_bodies": load_certifying_bodies(),
            }
        )

    @app.get("/api/history")
    def history():
        try:
            limit = int(request.args.get("limit", "100"))
        except ValueError:
            limit = 100
        return jsonify({"history": list_history(limit=max(1, min(limit, 500)))})

    @app.post("/api/chat")
    def chat():
        payload = request.get_json(silent=True) or {}
        prompt = str(payload.get("prompt") or "").strip()
        if not prompt:
            return jsonify({"code": "INVALID_PROMPT", "error": "A non-empty prompt is required."}), 400
        return jsonify(
            {
                "text": (
                    "The Flask backend is configured for DOCX compliance analysis. "
                    "Use the scanner or ingredient text input for rule-backed halal verification."
                )
            }
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
        use_reloader=False,
    )
