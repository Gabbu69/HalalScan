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


def test_rule_records_have_required_schema_and_sources(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.get("/api/rules")
    data = response.get_json()

    for rule in data["rules"]:
        assert rule["id"]
        assert rule["category"]
        assert rule["status"] in {"HARAM", "DOUBTFUL", "UNKNOWN", "HALAL", "INFO"}
        assert isinstance(rule["keywords"], list)
        assert isinstance(rule["e_numbers"], list)
        assert rule["keywords"] or rule["e_numbers"]
        assert rule["reason"]
        assert rule["source"]


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
    assert data["architectureDetails"]["krrAnalysis"]["conflictResolution"]["priority"] == [
        "HARAM",
        "DOUBTFUL",
        "UNKNOWN",
        "HALAL",
    ]
    assert data["architectureDetails"]["krrAnalysis"]["facts"]
    assert data["architectureDetails"]["krrAnalysis"]["matchedRules"]


def test_exact_e_number_matching_does_not_flag_longer_codes(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Numbered Additive Sample",
            "ingredients": "water, sugar, E1200",
            "certifyingBody": "JAKIM",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] != "NON-COMPLIANT"
    assert "R001" not in data["triggered_rules"]


def test_ocr_unicode_hyphen_e_number_is_normalized(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Red Candy",
            "ingredients": "water, sugar, E\u2011120",
            "certifyingBody": "JAKIM",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] == "NON-COMPLIANT"
    assert "R001" in data["triggered_rules"]


def test_pork_derivative_and_alcohol_regressions(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Dessert Capsule",
            "ingredients": "sugar, porcine gelatin, rum",
            "certifyingBody": "JAKIM",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] == "NON-COMPLIANT"
    assert {"R003", "R034"} <= set(data["triggered_rules"])


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


def test_rapidapi_no_credentials_is_explicit_but_deterministic(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        json={
            "productName": "Rice Crackers",
            "ingredients": "rice, sunflower oil, sea salt",
            "certifyingBody": "IFANCA",
        },
    )
    data = response.get_json()
    assert response.status_code == 200
    assert data["final_verdict"] == "HALAL COMPLIANT"
    assert {row["api_status"] for row in data["ingredient_results"]} == {"UNAVAILABLE"}
    assert "No-credential runs remain deterministic" in " ".join(
        data["architectureDetails"]["krrAnalysis"]["evaluationNotes"]
    )


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
