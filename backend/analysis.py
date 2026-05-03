from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from .database import save_scan
from .knowledge_base import STATUS_PRIORITY, evaluate_ingredient_against_rules, verify_certifying_body
from .openfoodfacts import fetch_product_by_barcode
from .rapidapi_client import classify_ingredient


def split_ingredients(text: str) -> list[str]:
    clean = re.sub(r"\bingredients?\s*[:.-]\s*", "", text or "", flags=re.IGNORECASE)
    parts: list[str] = []
    current: list[str] = []
    depth = 0

    for char in clean:
        if char in "([{":
            depth += 1
        elif char in ")]}" and depth > 0:
            depth -= 1

        if char in ",;\n" and depth == 0:
            parts.append("".join(current))
            current = []
        else:
            current.append(char)

    parts.append("".join(current))
    ingredients = [re.sub(r"\s+", " ", part).strip(" .:-,;") for part in parts]
    return [item for item in ingredients if len(item) >= 2]


def extract_ingredient_focused_text(text: str) -> str:
    normalized = (text or "").replace("\r", "")
    if not normalized.strip():
        return ""

    markers = [
        r"\bingredients?\b",
        r"\bingredient list\b",
        r"\bcontains\b",
    ]
    start_match = None
    for marker in markers:
        start_match = re.search(marker, normalized, flags=re.IGNORECASE)
        if start_match:
            break

    candidate = normalized[start_match.start():] if start_match else normalized
    stop_markers = [
        r"\bnutrition(?:al)? facts\b",
        r"\bsupplement facts\b",
        r"\bdirections\b",
        r"\bdistributed by\b",
        r"\bmanufactured by\b",
        r"\bproduct of\b",
        r"\bbest before\b",
        r"\bexpiry\b",
        r"\bexpiration\b",
        r"\bstorage\b",
        r"\bkeep refrigerated\b",
        r"\bnet wt\b",
        r"\bbarcode\b",
    ]
    end_positions = [
        match.start()
        for pattern in stop_markers
        for match in [re.search(pattern, candidate, flags=re.IGNORECASE)]
        if match
    ]
    if end_positions:
        candidate = candidate[: min(end_positions)]

    candidate = re.sub(r"\s+", " ", candidate).strip(" .:-")
    return candidate


def _priority_status(*statuses: str) -> str:
    return max(statuses, key=lambda status: STATUS_PRIORITY.get(status, 0))


def _is_missing_ingredients(text: str) -> bool:
    normalized = re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()
    if not normalized:
        return True
    return normalized in {
        "no ingredients",
        "no ingredients listed",
        "ingredients unavailable",
        "ingredients not available",
        "ingredients not listed",
        "unknown",
        "unknown ingredients",
        "not available",
        "na",
    }


def _normalize_api_status(status: str) -> str:
    if status == "MASHBOOH":
        return "DOUBTFUL"
    return status


def analyze_payload(payload: dict[str, Any]) -> dict[str, Any]:
    barcode = str(payload.get("barcode") or "").strip()
    certifying_body = payload.get("certifyingBody") or payload.get("certifying_body")
    product = {
        "barcode": barcode,
        "name": payload.get("productName") or payload.get("name") or "Manual Scan",
        "brand": payload.get("brand") or "User Input",
        "image": payload.get("image"),
        "labels": payload.get("labels") or "",
    }

    raw_ingredients_text = (
        payload.get("ocrText")
        or payload.get("ingredients")
        or payload.get("text")
        or ""
    )
    ingredients_text = extract_ingredient_focused_text(raw_ingredients_text)

    if barcode and not ingredients_text:
        off_product = fetch_product_by_barcode(barcode)
        if off_product:
            product.update(off_product)
            raw_ingredients_text = off_product.get("ingredients", "")
            ingredients_text = extract_ingredient_focused_text(raw_ingredients_text)

    cert_result = verify_certifying_body(certifying_body)
    fact_trace: list[dict[str, Any]] = []
    matched_rule_trace: list[dict[str, Any]] = []
    logic_path = [
        "Input collection complete.",
        f"Certifying body status: {cert_result['status']}.",
    ]

    if _is_missing_ingredients(ingredients_text):
        ingredients = []
        ingredient_results = [
            {
                "ingredient": "insufficient ingredient information",
                "status": "UNKNOWN",
                "api_status": "UNAVAILABLE",
                "kb_status": "UNKNOWN",
                "confidence": 55,
                "reason": "No usable ingredient list was provided.",
                "rule_ids": ["INSUFFICIENT_DATA"],
                "source": "input-quality-guard",
            }
        ]
        fact_trace.append(
            {
                "ingredient": "insufficient ingredient information",
                "kb_status": "UNKNOWN",
                "api_status": "UNAVAILABLE",
                "final_status": "UNKNOWN",
                "rule_ids": ["INSUFFICIENT_DATA"],
            }
        )
        logic_path.append("No usable ingredient facts were available.")
    else:
        ingredients = split_ingredients(ingredients_text)
        logic_path.append(f"Extracted {len(ingredients)} ingredient facts.")
        ingredient_results = []

        for ingredient in ingredients:
            kb_result = evaluate_ingredient_against_rules(ingredient)
            api_result = classify_ingredient(ingredient)
            api_status = _normalize_api_status(api_result.get("status", "UNKNOWN"))
            kb_status = kb_result["status"]

            effective_api_status = api_status if api_status != "UNAVAILABLE" else "INFO"
            final_status = _priority_status(kb_status, effective_api_status)
            if final_status == "INFO":
                final_status = "UNKNOWN"

            rule_ids = [rule["id"] for rule in kb_result["matched_rules"]]
            fact_trace.append(
                {
                    "ingredient": ingredient,
                    "kb_status": kb_status,
                    "api_status": api_status,
                    "final_status": final_status,
                    "rule_ids": rule_ids,
                }
            )
            matched_rule_trace.extend(kb_result["matched_rules"])
            if rule_ids:
                logic_path.append(
                    f"Rule match for '{ingredient}': {', '.join(rule_ids)} -> {kb_status}."
                )
            if api_status not in {"UNAVAILABLE", "INFO"}:
                logic_path.append(f"RapidAPI classification for '{ingredient}': {api_status}.")

            ingredient_results.append(
                {
                    "ingredient": ingredient,
                    "status": final_status,
                    "api_status": api_status,
                    "kb_status": kb_status,
                    "confidence": api_result.get("confidence", 0) or (90 if kb_result["matched_rules"] else 50),
                    "reason": kb_result["reason"] if kb_result["matched_rules"] else api_result.get("reason", kb_result["reason"]),
                    "rule_ids": rule_ids,
                    "matched_rules": kb_result["matched_rules"],
                    "source": api_result.get("source", "knowledge-base"),
                }
            )

    statuses = [row["status"] for row in ingredient_results]
    haram_items = [row for row in ingredient_results if row["status"] == "HARAM"]
    doubtful_items = [row for row in ingredient_results if row["status"] in {"DOUBTFUL", "UNKNOWN"}]

    if haram_items:
        final_verdict = "NON-COMPLIANT"
        confidence = 98
        reason = "One or more ingredients were classified as haram by the knowledge base or Halal Food Checker API."
        recommendation = "Avoid this product unless a qualified halal authority provides a corrected ingredient source."
        logic_path.append("Verdict rule: any HARAM ingredient produces NON-COMPLIANT.")
    elif doubtful_items or not cert_result["recognized"]:
        final_verdict = "REQUIRES REVIEW"
        confidence = 72 if doubtful_items else 68
        if doubtful_items:
            reason = "One or more ingredients are doubtful, unknown, or require source verification."
        else:
            reason = "Ingredients did not trigger haram or doubtful rules, but the certifying body is missing or unrecognized."
        recommendation = "Check for a recognized halal certificate or contact the manufacturer before consuming."
        logic_path.append("Verdict rule: doubtful/unknown ingredients or missing/unrecognized certification require review.")
    else:
        final_verdict = "HALAL COMPLIANT"
        confidence = 94
        reason = "All ingredients were classified as halal or clear, and the certifying body is recognized."
        recommendation = "Product is compliant based on the maintained ingredient rules and certifying-body list."
        logic_path.append("Verdict rule: all ingredients halal plus recognized certification produces HALAL COMPLIANT.")

    flagged = [row["ingredient"] for row in ingredient_results if row["status"] in {"HARAM", "DOUBTFUL", "UNKNOWN"}]
    scan = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "final_verdict": final_verdict,
        "confidence": confidence,
        "reason": reason,
        "recommendation": recommendation,
        "flagged_ingredients": flagged,
        "ingredients": ingredients_text or raw_ingredients_text,
        "product": product,
        "certifying_body": cert_result,
        "ingredient_results": ingredient_results,
        "triggered_rules": sorted(
            {
                rule["id"]
                for row in ingredient_results
                for rule in row.get("matched_rules", [])
            }
        ),
        "architectureDetails": {
            "krrAnalysis": {
                "status": "HARAM" if haram_items else "MASHBOOH" if doubtful_items or not cert_result["recognized"] else "HALAL",
                "confidence": confidence / 100,
                "flags": [
                    {
                        "ingredient": row["ingredient"],
                        "type": "HARAM" if row["status"] == "HARAM" else "MASHBOOH",
                        "ruleId": ",".join(row["rule_ids"]) if row["rule_ids"] else "UNRESOLVED",
                    }
                    for row in ingredient_results
                    if row["status"] in {"HARAM", "DOUBTFUL", "UNKNOWN"}
                ],
                "logicPath": logic_path,
                "facts": fact_trace,
                "matchedRules": matched_rule_trace,
                "conflictResolution": {
                    "priority": ["HARAM", "DOUBTFUL", "UNKNOWN", "HALAL"],
                    "selectedVerdict": final_verdict,
                    "reason": reason,
                },
                "certificationCheck": cert_result,
                "evaluationNotes": [
                    "RapidAPI Halal Food Checker is the primary ingredient classifier when RAPIDAPI_KEY is configured.",
                    "Knowledge-base rules are always evaluated and can veto API output.",
                    "No-credential runs remain deterministic by treating live API status as unavailable.",
                ],
            },
            "mlAnalysis": {
                "provider": "RapidAPI Halal Food Checker",
                "verdict": "HARAM" if "HARAM" in statuses else "MASHBOOH" if doubtful_items else "HALAL",
                "ingredient_results": ingredient_results,
            },
            "integrationLogic": logic_path,
        },
    }
    save_scan(scan)
    return scan
