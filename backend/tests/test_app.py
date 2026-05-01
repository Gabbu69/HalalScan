from __future__ import annotations

import base64
import importlib


def _client(tmp_path, monkeypatch):
    monkeypatch.setenv("HALALSCAN_DB_PATH", str(tmp_path / "test.sqlite3"))
    monkeypatch.delenv("RAPIDAPI_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)

    app_module = importlib.import_module("backend.app")
    app = app_module.create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def test_rules_endpoint_exposes_docx_scale_knowledge_base(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.get("/api/rules")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data["rules"]) >= 50
    assert {body["name"] for body in data["certifying_bodies"]} >= {"JAKIM", "MUI", "IFANCA", "HFA", "ESMA"}


def test_haram_rule_overrides_certification(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Red Cake",
            "ingredients": "sugar, flour, E120, vanilla",
            "certifyingBody": "JAKIM",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] == "NON-COMPLIANT"
    assert "R001" in data["triggered_rules"]
    assert "E120" in data["flagged_ingredients"]


def test_halal_requires_recognized_certifying_body(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Rice Crackers",
            "ingredients": "rice, sunflower oil, sea salt",
            "certifyingBody": "JAKIM",
        },
    )
    assert response.status_code == 200
    assert response.get_json()["final_verdict"] == "HALAL COMPLIANT"


def test_missing_certifying_body_requires_review(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Rice Crackers",
            "ingredients": "rice, sunflower oil, sea salt",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] == "REQUIRES REVIEW"
    assert data["certifying_body"]["status"] == "MISSING"


def test_unrecognized_certifying_body_requires_review(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Rice Crackers",
            "ingredients": "rice, sunflower oil, sea salt",
            "certifyingBody": "Unknown Logo",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] == "REQUIRES REVIEW"
    assert data["certifying_body"]["status"] == "UNRECOGNIZED"


def test_doubtful_ingredients_require_review(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Gummies",
            "ingredients": "sugar, gelatin, natural flavors",
            "certifyingBody": "IFANCA",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] == "REQUIRES REVIEW"
    assert "R002" in data["triggered_rules"]


def test_no_ingredients_requires_review(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Unknown Product",
            "ingredients": "No ingredients listed.",
            "certifyingBody": "JAKIM",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] == "REQUIRES REVIEW"
    assert data["triggered_rules"] == []


def test_google_vision_ocr_skips_cleanly_without_credentials(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    payload = base64.b64encode(b"fake image bytes").decode("ascii")
    response = client.post(
        "/api/ocr",
        json={"fileBase64": payload, "mimeType": "image/png", "fallbackText": "fallback ingredients"},
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["engine"] == "google-vision-unavailable"
    assert data["text"] == "fallback ingredients"


def test_history_persists_scan_results(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    client.post(
        "/api/analyze",
        json={
            "productName": "Rice Crackers",
            "ingredients": "rice, sunflower oil, sea salt",
            "certifyingBody": "JAKIM",
        },
    )
    response = client.get("/api/history")
    data = response.get_json()
    assert response.status_code == 200
    assert len(data["history"]) == 1
    assert data["history"][0]["final_verdict"] == "HALAL COMPLIANT"

