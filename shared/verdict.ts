export type ProductVerdict =
  "HALAL COMPLIANT" | "NON-COMPLIANT" | "REQUIRES REVIEW";
export type IngredientEvidence = {
  ingredient: string;
  status: string;
  reason?: string;
  source?: string;
  api_status?: string;
  kb_status?: string;
  confidence?: number;
  rule_ids?: string[];
  matched_rules?: {
    id: string;
    title?: string;
    reason?: string;
    source?: string;
    status?: string;
  }[];
};
export const hasUsableIngredients = (text: unknown): text is string => {
  if (typeof text !== "string") return false;
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
  return (
    clean.length >= 2 &&
    ![
      "no ingredients",
      "no ingredients listed",
      "ingredients unavailable",
      "ingredients not available",
      "ingredients not listed",
      "unknown",
      "unknown ingredients",
      "not available",
      "na",
      "ingredients",
      "image uploaded but ingredients could not be extracted",
    ].includes(clean)
  );
};
const normalizeEvidence = (text: string) =>
  text
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\be[\s-]+(?=\d)/g, "e");
const evidenceTokens = (text: string) =>
  normalizeEvidence(text).match(/[a-z0-9\u0600-\u06ff]+/g) || [];
/** A keyword cannot resolve additional words in a compound ingredient. */
export function hasFullRuleCoverage(
  ingredient: string,
  matches: { matched_terms?: string[] }[],
) {
  let remaining = normalizeEvidence(ingredient);
  const terms = [
    ...new Set(matches.flatMap((match) => match.matched_terms || [])),
  ].sort((a, b) => b.length - a.length);
  for (const term of terms) {
    const escaped = normalizeEvidence(term).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    remaining = remaining.replace(
      new RegExp("(^|[^a-z0-9])" + escaped + "(?=[^a-z0-9]|$)", "g"),
      "$1 ",
    );
  }
  return evidenceTokens(remaining).every(
    (token) => ["and", "or"].includes(token) || /^\d+$/.test(token),
  );
}
function evidenceCoversLabel(text: string, rows: IngredientEvidence[]) {
  const label = text.replace(/\bingredients?\s*[:.-]\s*/i, "");
  const expected = evidenceTokens(label).sort();
  const actual = rows.flatMap((row) => evidenceTokens(row.ingredient)).sort();
  return (
    expected.length === actual.length &&
    expected.every((token, index) => token === actual[index])
  );
}
/** Missing evidence and unfamiliar statuses never produce a positive verdict. */
export function decideVerdict(
  text: unknown,
  rows: IngredientEvidence[],
): ProductVerdict {
  if (rows.some((row) => row.status === "HARAM")) return "NON-COMPLIANT";
  if (
    !hasUsableIngredients(text) ||
    !rows.length ||
    rows.some((row) => row.status !== "HALAL") ||
    !evidenceCoversLabel(text, rows)
  )
    return "REQUIRES REVIEW";
  return "HALAL COMPLIANT";
}
export function normalizeVerdict(value: unknown): ProductVerdict {
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : "";
  if (["HARAM", "NON-COMPLIANT"].includes(normalized)) return "NON-COMPLIANT";
  if (["HALAL", "HALAL COMPLIANT"].includes(normalized))
    return "HALAL COMPLIANT";
  return "REQUIRES REVIEW";
}
export const verdictCopy: Record<
  ProductVerdict,
  { reason: string; recommendation: string }
> = {
  "NON-COMPLIANT": {
    reason:
      "The available evidence identifies one or more non-compliant ingredients.",
    recommendation:
      "Check the flagged ingredients and their sources before choosing this product.",
  },
  "REQUIRES REVIEW": {
    reason:
      "There is not enough resolved ingredient evidence to complete this check.",
    recommendation:
      "Review the full label. Ask the manufacturer or a qualified halal authority about unresolved ingredient sources.",
  },
  "HALAL COMPLIANT": {
    reason:
      "All listed ingredients matched positive screening evidence. This is an ingredient check, not product certification.",
    recommendation:
      "Compare this ingredient list with your package and check product certification separately.",
  },
};
