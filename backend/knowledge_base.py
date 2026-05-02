from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parent / "data"
RULES_PATH = DATA_DIR / "halal_rules.json"

STATUS_PRIORITY = {
    "HARAM": 4,
    "DOUBTFUL": 3,
    "UNKNOWN": 2,
    "HALAL": 1,
    "INFO": 0,
}


@lru_cache(maxsize=1)
def load_knowledge_base() -> dict[str, Any]:
    with RULES_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_rules() -> list[dict[str, Any]]:
    return load_knowledge_base()["rules"]


def load_certifying_bodies() -> list[dict[str, Any]]:
    return load_knowledge_base()["certifying_bodies"]


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def normalize_ecodes(value: str) -> str:
    normalized = re.sub(r"[\u2010-\u2015]", "-", normalize_text(value))
    return re.sub(r"\be[\s-]+(?=\d)", "e", normalized)


def contains_term(source: str, term: str) -> bool:
    source_norm = normalize_ecodes(source)
    term_norm = normalize_ecodes(term)
    pattern = rf"(^|[^a-z0-9]){re.escape(term_norm)}([^a-z0-9]|$)"
    return re.search(pattern, source_norm, flags=re.IGNORECASE) is not None


def extract_e_numbers(source: str) -> set[str]:
    normalized = normalize_ecodes(source).upper()
    return set(re.findall(r"\bE\d{3,4}[A-Z]?\b", normalized))


def verify_certifying_body(value: str | None) -> dict[str, Any]:
    raw_value = (value or "").strip()
    if not raw_value:
        return {
            "input": "",
            "status": "MISSING",
            "recognized": False,
            "matched_body": None,
            "reason": "No certifying body was provided.",
        }

    needle = normalize_text(raw_value)
    for body in load_certifying_bodies():
        names = [body["name"], *body.get("aliases", [])]
        if any(needle == normalize_text(name) for name in names):
            return {
                "input": raw_value,
                "status": "RECOGNIZED",
                "recognized": True,
                "matched_body": body,
                "reason": f"{body['name']} is in the maintained recognized-body list.",
            }

    return {
        "input": raw_value,
        "status": "UNRECOGNIZED",
        "recognized": False,
        "matched_body": None,
        "reason": "The provided certifying body is not in the maintained recognized-body list.",
    }


def evaluate_ingredient_against_rules(ingredient: str) -> dict[str, Any]:
    matched: list[dict[str, Any]] = []
    ingredient_ecodes = extract_e_numbers(ingredient)

    for rule in load_rules():
        matched_ecode = any(code.upper() in ingredient_ecodes for code in rule.get("e_numbers", []))
        matched_keyword = any(contains_term(ingredient, keyword) for keyword in rule.get("keywords", []))

        if matched_ecode or matched_keyword:
            matched.append(
                {
                    "id": rule["id"],
                    "status": rule["status"],
                    "category": rule["category"],
                    "title": rule["title"],
                    "reason": rule["reason"],
                    "source": rule["source"],
                }
            )

    if not matched:
        return {
            "status": "UNKNOWN",
            "matched_rules": [],
            "reason": "No explicit knowledge-base rule matched this ingredient.",
        }

    strongest = max(matched, key=lambda item: STATUS_PRIORITY.get(item["status"], 0))
    return {
        "status": strongest["status"],
        "matched_rules": matched,
        "reason": strongest["reason"],
    }
