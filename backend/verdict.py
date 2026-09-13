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


def decide_verdict(text, rows):
    if any(row.get("status") == "HARAM" for row in rows):
        return "NON-COMPLIANT"
    if not has_usable_ingredients(text) or not rows or any(row.get("status") != "HALAL" for row in rows):
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
