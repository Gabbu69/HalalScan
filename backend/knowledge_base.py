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


def _get_rule_match(rule: dict[str, Any], ingredient: str, ingredient_ecodes: set[str]) -> dict[str, Any] | None:
    e_number_matches = [
        code
        for code in rule.get("e_numbers", [])
        if code.upper() in ingredient_ecodes
    ]
    keyword_matches = [
        keyword
        for keyword in rule.get("keywords", [])
        if contains_term(ingredient, keyword)
    ]

    if not e_number_matches and not keyword_matches:
        return None

    specificity_values = [
        *(len(normalize_ecodes(code)) + 100 for code in e_number_matches),
        *(len(normalize_ecodes(keyword)) for keyword in keyword_matches),
    ]

    return {
        "id": rule["id"],
        "status": rule["status"],
        "category": rule["category"],
        "title": rule["title"],
        "reason": rule["reason"],
        "source": rule["source"],
        "matched_terms": [*e_number_matches, *keyword_matches],
        "specificity": max(specificity_values, default=0),
    }


def _choose_strongest_match(matches: list[dict[str, Any]]) -> dict[str, Any]:
    def sort_key(match: dict[str, Any]) -> tuple[int, int]:
        return (
            STATUS_PRIORITY.get(match["status"], 0),
            int(match.get("specificity", 0)),
        )

    haram_matches = [match for match in matches if match["status"] == "HARAM"]
    if haram_matches:
        return max(haram_matches, key=sort_key)

    halal_matches = [match for match in matches if match["status"] == "HALAL"]
    non_halal_matches = [
        match
        for match in matches
        if match["status"] not in {"HALAL", "INFO"}
    ]
    best_halal = max(halal_matches, key=sort_key, default=None)
    best_non_halal = max(non_halal_matches, key=sort_key, default=None)

    if (
        best_halal
        and best_non_halal
        and int(best_halal.get("specificity", 0)) > int(best_non_halal.get("specificity", 0))
    ):
        return best_halal

    return max(matches, key=sort_key)


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
        rule_match = _get_rule_match(rule, ingredient, ingredient_ecodes)
        if rule_match:
            matched.append(rule_match)

    if not matched:
        return {
            "status": "UNKNOWN",
            "matched_rules": [],
            "reason": "No explicit knowledge-base rule matched this ingredient.",
        }

    strongest = _choose_strongest_match(matched)
    return {
        "status": strongest["status"],
        "matched_rules": matched,
        "reason": strongest["reason"],
    }
