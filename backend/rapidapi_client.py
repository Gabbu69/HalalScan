from __future__ import annotations

import os
from typing import Any

import requests

from .database import cache_ingredient, get_cached_ingredient


DEFAULT_RAPIDAPI_HOST = "halal-food-checker.p.rapidapi.com"
DEFAULT_RAPIDAPI_URL = f"https://{DEFAULT_RAPIDAPI_HOST}/check"


def is_configured() -> bool:
    return bool(os.getenv("RAPIDAPI_KEY"))


def _normalize_status(value: Any) -> str:
    text = str(value or "").strip().lower()
    if not text:
        return "UNKNOWN"
    if any(token in text for token in ["haram", "non-halal", "non halal", "forbidden"]):
        return "HARAM"
    if any(token in text for token in ["doubt", "doubtful", "mashbooh", "mushbooh", "questionable", "suspect"]):
        return "DOUBTFUL"
    if "halal" in text or "permissible" in text:
        return "HALAL"
    return "UNKNOWN"


def _find_first(data: Any, keys: tuple[str, ...]) -> Any:
    if isinstance(data, dict):
        for key in keys:
            if key in data:
                return data[key]
        for value in data.values():
            found = _find_first(value, keys)
            if found is not None:
                return found
    if isinstance(data, list):
        for value in data:
            found = _find_first(value, keys)
            if found is not None:
                return found
    return None


def _parse_response(data: Any) -> dict[str, Any]:
    status_value = _find_first(
        data,
        (
            "status",
            "halal_status",
            "halalStatus",
            "classification",
            "result",
            "verdict",
        ),
    )
    confidence_value = _find_first(data, ("confidence", "score", "probability"))
    reason_value = _find_first(data, ("reason", "description", "message", "explanation"))

    try:
        confidence = float(confidence_value)
        if confidence <= 1:
            confidence *= 100
    except (TypeError, ValueError):
        confidence = 70.0

    return {
        "status": _normalize_status(status_value),
        "confidence": max(0.0, min(confidence, 100.0)),
        "reason": str(reason_value or "RapidAPI Halal Food Checker returned a classification."),
        "raw": data,
        "source": "rapidapi",
    }


def classify_ingredient(ingredient: str) -> dict[str, Any]:
    cached = get_cached_ingredient(ingredient)
    if cached:
        cached["source"] = "rapidapi-cache"
        return cached

    api_key = os.getenv("RAPIDAPI_KEY")
    if not api_key:
        return {
            "status": "UNAVAILABLE",
            "confidence": 0,
            "reason": "RAPIDAPI_KEY is not configured; skipping live Halal Food Checker lookup.",
            "source": "rapidapi-unavailable",
        }

    host = os.getenv("RAPIDAPI_HOST", DEFAULT_RAPIDAPI_HOST)
    url = os.getenv("RAPIDAPI_URL", DEFAULT_RAPIDAPI_URL)
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": host,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json={"ingredient": ingredient, "ingredients": ingredient, "text": ingredient},
            timeout=12,
        )
        if response.status_code in {404, 405}:
            response = requests.get(
                url,
                headers={key: value for key, value in headers.items() if key != "Content-Type"},
                params={"ingredient": ingredient, "q": ingredient},
                timeout=12,
            )
        response.raise_for_status()
        parsed = _parse_response(response.json())
        cache_ingredient(ingredient, parsed)
        return parsed
    except requests.RequestException as exc:
        return {
            "status": "UNAVAILABLE",
            "confidence": 0,
            "reason": f"RapidAPI lookup failed: {exc}",
            "source": "rapidapi-error",
        }

