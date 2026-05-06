from __future__ import annotations

import re
from typing import Any

from .knowledge_base import load_certifying_bodies, load_rules


GUARDRAIL = "RAG explanation only: final product verdicts must still come from /api/analyze."


def _normalize(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def _normalize_ecodes(value: str) -> str:
    return re.sub(r"\be[\s-]+(?=\d)", "e", re.sub(r"[\u2010-\u2015]", "-", _normalize(value)))


def _contains_term(source: str, term: str) -> bool:
    source_norm = _normalize_ecodes(source)
    term_norm = re.escape(_normalize_ecodes(term))
    return re.search(rf"(^|[^a-z0-9]){term_norm}([^a-z0-9]|$)", source_norm) is not None


def retrieve_knowledge(query: str, limit: int = 5) -> dict[str, Any]:
    query_norm = _normalize_ecodes(query)
    query_tokens = set(re.findall(r"\b[a-z0-9]{2,}\b", query_norm))
    query_ecodes = set(re.findall(r"\bE\d{3,4}[A-Z]?\b", query_norm.upper()))

    scored_rules: list[tuple[int, dict[str, Any]]] = []
    for rule in load_rules():
        score = 0
        matched_terms: list[str] = []

        for code in rule.get("e_numbers", []):
            if code.upper() in query_ecodes or _contains_term(query_norm, code):
                score += 12
                matched_terms.append(code)

        for keyword in rule.get("keywords", []):
            if _contains_term(query_norm, keyword):
                score += 8
                matched_terms.append(keyword)

        haystack = _normalize(
            " ".join(
                [
                    rule.get("id", ""),
                    rule.get("title", ""),
                    rule.get("category", ""),
                    rule.get("status", ""),
                    rule.get("source", ""),
                ]
            )
        )
        overlap = query_tokens.intersection(set(re.findall(r"\b[a-z0-9]{2,}\b", haystack)))
        score += min(len(overlap), 4)

        if score > 0:
            scored_rules.append(
                (
                    score,
                    {
                        "id": rule["id"],
                        "title": rule["title"],
                        "status": rule["status"],
                        "category": rule["category"],
                        "reason": rule["reason"],
                        "source": rule["source"],
                        "matched_terms": matched_terms[:8],
                    },
                )
            )

    certifying_bodies = []
    for body in load_certifying_bodies():
        names = [body["name"], *body.get("aliases", [])]
        if any(_contains_term(query_norm, name) for name in names):
            certifying_bodies.append(body)

    scored_rules.sort(key=lambda item: item[0], reverse=True)
    return {
        "rules": [rule for _, rule in scored_rules[:limit]],
        "certifying_bodies": certifying_bodies,
    }


def build_rag_chat_response(query: str, retrieval: dict[str, Any]) -> str:
    rules = retrieval.get("rules", [])
    certifying_bodies = retrieval.get("certifying_bodies", [])

    if not rules and not certifying_bodies:
        return "\n".join(
            [
                "I could not find a direct match in the maintained halal knowledge base.",
                "Try asking about a specific ingredient, E-number, additive, or certifying body.",
                GUARDRAIL,
            ]
        )

    lines = ["Knowledge-base matches:"]
    for rule in rules:
        terms = ", ".join(rule.get("matched_terms") or [])
        term_text = f" Matched: {terms}." if terms else ""
        lines.append(
            f"- {rule['id']} [{rule['status']}]: {rule['title']}. {rule['reason']} "
            f"Source: {rule['source']}.{term_text}"
        )

    for body in certifying_bodies:
        aliases = ", ".join(body.get("aliases", [])[:3])
        lines.append(
            f"- Certifier {body['id']}: {body['name']} ({body['country']}). "
            f"Recognized aliases: {aliases}."
        )

    lines.append(GUARDRAIL)
    return "\n".join(lines)
