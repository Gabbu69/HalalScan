import re


def has_usable_ingredients(text):
    if not isinstance(text, str):
        return False
    clean = re.sub(r"[^a-z0-9\u0600-\u06ff]+", " ", text.lower()).strip()
    return len(clean) >= 2 and clean not in {
        "no ingredients", "no ingredients listed", "ingredients unavailable",
        "ingredients not available", "ingredients not listed", "unknown",
        "unknown ingredients", "not available", "na", "ingredients",
        "image uploaded but ingredients could not be extracted",
    }


def _evidence_tokens(text):
    normalized = re.sub(r"[\u2010-\u2015]", "-", text.lower())
    normalized = re.sub(r"\be[\s-]+(?=\d)", "e", normalized)
    return re.findall(r"[a-z0-9\u0600-\u06ff]+", normalized)


def has_full_rule_coverage(ingredient, matches):
    remaining = re.sub(r"[\u2010-\u2015]", "-", ingredient.lower())
    remaining = re.sub(r"\be[\s-]+(?=\d)", "e", remaining)
    terms = {term.lower() for match in matches for term in match.get("matched_terms", [])}
    for term in sorted(terms, key=len, reverse=True):
        remaining = re.sub(r"(^|[^a-z0-9])" + re.escape(term) + r"(?=[^a-z0-9]|$)", r"\1 ", remaining)
    return all(token in {"and", "or"} or token.isdigit() for token in _evidence_tokens(remaining))


def _evidence_covers_label(text, rows):
    label = re.sub(r"\bingredients?\s*[:.-]\s*", "", text, count=1, flags=re.IGNORECASE)
    return sorted(_evidence_tokens(label)) == sorted(token for row in rows for token in _evidence_tokens(row.get("ingredient", "")))


def decide_verdict(text, rows):
    if any(row.get("status") == "HARAM" for row in rows):
        return "NON-COMPLIANT"
    if not has_usable_ingredients(text) or not rows or any(row.get("status") != "HALAL" for row in rows) or not _evidence_covers_label(text, rows):
        return "REQUIRES REVIEW"
    return "HALAL COMPLIANT"


VERDICT_COPY = {
    "NON-COMPLIANT": (
        "The available evidence identifies one or more non-compliant ingredients.",
        "Check the flagged ingredients and their sources before choosing this product.",
    ),
    "REQUIRES REVIEW": (
        "There is not enough resolved ingredient evidence to complete this check.",
        "Review the full label. Ask the manufacturer or a qualified halal authority about unresolved ingredient sources.",
    ),
    "HALAL COMPLIANT": (
        "All listed ingredients matched positive screening evidence. This is an ingredient check, not product certification.",
        "Compare this ingredient list with your package and check product certification separately.",
    ),
}
