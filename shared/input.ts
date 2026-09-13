export function validateAnalysisPayload(
  payload: unknown,
): asserts payload is Record<string, any> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("INVALID_ANALYSIS");
  for (const key of [
    "ingredients",
    "ocrText",
    "text",
    "productName",
    "name",
    "brand",
    "barcode",
    "certifyingBody",
    "certifying_body",
  ]) {
    const value = (payload as Record<string, unknown>)[key];
    if (
      value !== undefined &&
      (typeof value !== "string" ||
        value.length >
          (["ingredients", "ocrText", "text"].includes(key) ? 10000 : 200))
    )
      throw new Error("INVALID_ANALYSIS");
  }
}
