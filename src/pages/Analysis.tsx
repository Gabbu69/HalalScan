import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useCopy } from "../utils/copy";
import {
  runIntegratedAnalysis,
  runIntegratedBarcodeAnalysis,
  runIntegratedImageAnalysis,
} from "../utils/systemIntegration";
import type { ScanRecord } from "../types";
import { Badge } from "../components/Badge";
import { validBarcode } from "../utils/scanInput";
export function Analysis() {
  const c = useCopy();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [draft] = useState(
    () =>
      useAppStore.getState().draft ||
      (validBarcode(params.get("barcode") || "")
        ? {
            id: crypto.randomUUID(),
            mode: "barcode" as const,
            barcode: params.get("barcode")!,
          }
        : null),
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [unsaved, setUnsaved] = useState<ScanRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const addScan = useAppStore((s) => s.addScan);
  const setDraft = useAppStore((s) => s.setDraft);
  const setBusy = useAppStore((s) => s.setBusy);
  const saveResult = async (scan: ScanRecord, signal?: AbortSignal) => {
    setSaving(true);
    const ok = await addScan(scan);
    if (signal?.aborted || controller.current?.signal.aborted) return;
    setSaving(false);
    if (ok) {
      setDraft(null);
      setBusy(false);
      navigate("/history/" + encodeURIComponent(scan.id), { replace: true });
    } else setUnsaved(scan);
  };
  useEffect(() => {
    if (!draft) return;
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError("");
    setUnsaved(null);
    void (async () => {
      try {
        const existing = useAppStore
          .getState()
          .scans.find((s) => s.id === draft.id);
        if (existing) {
          setDraft(null);
          navigate("/history/" + encodeURIComponent(existing.id), {
            replace: true,
          });
          return;
        }
        const result =
          draft.mode === "barcode"
            ? await runIntegratedBarcodeAnalysis(
                draft.barcode || "",
                "General",
                "",
                request.signal,
              )
            : draft.mode === "photo"
              ? await runIntegratedImageAnalysis(
                  draft.image || "",
                  "General",
                  draft.text || "",
                  "",
                  request.signal,
                )
              : await runIntegratedAnalysis(
                  draft.name || "Ingredient check",
                  draft.text || "",
                  "General",
                  "",
                  { signal: request.signal },
                );
        if (request.signal.aborted) return;
        const scan: ScanRecord = {
          id: draft.id,
          date: new Date().toISOString(),
          name: draft.name || result.name || "Ingredient check",
          brand: result.brand || "",
          barcode: result.barcode || draft.barcode || "",
          image: draft.image || result.image || null,
          ingredients: result.ingredients || draft.text || "",
          verdict: result.finalVerdict,
          confidence: result.confidence,
          reason: result.reason,
          recommendation: result.recommendation,
          flagged_ingredients: result.flagged_ingredients,
          certification: result.certification,
          ingredient_results: result.ingredient_results,
          triggered_rules: result.triggered_rules,
          architectureDetails: result.architectureDetails,
          rubric_evidence: result.rubric_evidence,
          evidenceMode: result.evidenceMode,
          policyVersion: 2,
        };
        await saveResult(scan, request.signal);
      } catch (err) {
        if (!request.signal.aborted)
          setError(err instanceof Error ? err.message : c("failed"));
      } finally {
        if (!request.signal.aborted) setBusy(false);
      }
    })();
    return () => {
      request.abort();
      setBusy(false);
    };
  }, [draft, retry]);
  const cancel = () => {
    controller.current?.abort();
    setBusy(false);
    setDraft(null);
    navigate("/scanner");
  };
  if (!draft)
    return (
      <div className="page page-narrow empty-state">
        <h1>{c("expired")}</h1>
        <p>{c("expiredHelp")}</p>
        <Link to="/scanner" className="btn btn-primary spaced">
          {c("scanProduct")}
        </Link>
      </div>
    );
  return (
    <div className="page page-narrow">
      {unsaved ? (
        <section className="stack">
          <h1>{unsaved.name}</h1>
          <Badge verdict={unsaved.verdict} size="lg" />
          <p>{unsaved.reason}</p>
          <p className="notice notice-error" role="alert">
            {c("notSaved")}
          </p>
          <div className="actions">
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={() =>
                void saveResult(unsaved, controller.current?.signal)
              }
            >
              {c(saving ? "saving" : "retry")}
            </button>
            <button className="btn btn-secondary" onClick={cancel}>
              {c("cancel")}
            </button>
          </div>
        </section>
      ) : error ? (
        <section className="empty-state">
          <AlertCircle size={36} />
          <h1>{c("failed")}</h1>
          <p role="alert">{error}</p>
          <div className="actions spaced">
            <button
              className="btn btn-primary"
              onClick={() => setRetry(retry + 1)}
            >
              {c("retry")}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/scanner?mode=text")}
            >
              {c("typeInstead")}
            </button>
            <button className="btn btn-quiet" onClick={cancel}>
              {c("cancel")}
            </button>
          </div>
        </section>
      ) : (
        <section className="progress" role="status">
          <h1>{c("checking")}</h1>
          <p className="muted spaced">{c("checkingHelp")}</p>
          <div className="progress-line" />
          <button className="btn btn-secondary" onClick={cancel}>
            {c("cancel")}
          </button>
        </section>
      )}
    </div>
  );
}
