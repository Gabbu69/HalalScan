import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  RotateCcw,
  CalendarDays,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import type { ScanRecord } from "../types";
import { useAppStore } from "../store/useAppStore";
import { useCopy } from "../utils/copy";
import { validBarcode } from "../utils/scanInput";
import { Badge } from "./Badge";
import { formatDate } from "./SavedRow";
import { getVerdictPresentation } from "../utils/verdictPresentation";
export function ResultView({ scan }: { scan: ScanRecord }) {
  const c = useCopy();
  const navigate = useNavigate();
  const setDraft = useAppStore((s) => s.setDraft);
  const favorite = useAppStore((s) => s.toggleFavorite);
  const tone = getVerdictPresentation(scan.verdict).tone;
  const rows = [...(scan.ingredient_results || [])].sort(
    (a, b) => Number(a.status === "HALAL") - Number(b.status === "HALAL"),
  );
  const recheck = () => {
    setDraft({
      id: crypto.randomUUID(),
      mode: validBarcode(scan.barcode) ? "barcode" : "text",
      barcode: scan.barcode,
      text: scan.ingredients,
      name: scan.name,
    });
    navigate("/analysis");
  };
  return (
    <div className="page">
      <Link className="btn btn-quiet" to="/history">
        <ArrowLeft size={18} />
        {c("saved")}
      </Link>
      <div className="result-meta">
        <span>
          <CalendarDays
            size={16}
            style={{ display: "inline", verticalAlign: "middle" }}
          />{" "}
          {c("checked")} {formatDate(scan.date)}
        </span>
        <span>
          {c(
            scan.evidenceMode === "local-rules"
              ? "localRules"
              : scan.evidenceMode === "online-services"
                ? "onlineServices"
                : scan.evidenceMode === "server-rules"
                  ? "serverRules"
                  : "historical",
          )}
        </span>
      </div>
      <div className="result-layout">
        <div>
          <section className="result-summary">
            <div className="result-product">
              {scan.image && (
                <img
                  className="product-image"
                  src={scan.image}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div>
                <h1>{scan.name}</h1>
                {scan.brand && <span className="muted">{scan.brand}</span>}
              </div>
            </div>
            <Badge verdict={scan.verdict} size="lg" />
            <p>
              {c(
                tone === "halal"
                  ? "positiveHelp"
                  : tone === "haram"
                    ? "negativeHelp"
                    : "uncertainHelp",
              )}
            </p>
            {scan.flagged_ingredients?.length ? (
              <p className="flagged-list" lang="en">
                {scan.flagged_ingredients.join(" · ")}
              </p>
            ) : null}
            <div className="actions spaced">
              <button
                className={
                  "btn btn-secondary " +
                  (scan.favorite ? "favorite-active" : "")
                }
                onClick={() => void favorite(scan.id)}
                aria-pressed={!!scan.favorite}
              >
                <Star
                  size={19}
                  fill={scan.favorite ? "currentColor" : "none"}
                />
                {c(scan.favorite ? "unfavorite" : "favorite")}
              </button>
              <button className="btn btn-quiet" onClick={recheck}>
                <RotateCcw size={18} />
                {c("recheck")}
              </button>
            </div>
          </section>
          <section className="result-section">
            <h2>{c("nextAction")}</h2>
            <p>
              {c(
                tone === "halal"
                  ? "positiveAction"
                  : tone === "haram"
                    ? "negativeAction"
                    : "uncertainAction",
              )}
            </p>
          </section>
          <section className="result-section">
            <h2>{c("ingredientLabel")}</h2>
            <p style={{ overflowWrap: "anywhere" }} lang="en">
              {scan.ingredients || c("uncertainHelp")}
            </p>
          </section>
          <section className="result-section">
            <div className="notice">
              <ShieldCheck size={22} />
              <div>
                <strong>{c("certificate")}</strong>
                <p>{c("certHelp")}</p>
                {scan.certification?.input && (
                  <p lang="en">{scan.certification.input}</p>
                )}
              </div>
            </div>
          </section>
        </div>
        <section className="result-section" style={{ marginTop: 0 }}>
          <h2>{c("evidence")}</h2>
          {rows.length ? (
            rows.map((row, index) => (
              <details
                className="evidence-row"
                key={index}
                open={row.status !== "HALAL"}
              >
                <summary>
                  <span lang="en">
                    <strong>{row.ingredient}</strong>
                  </span>
                  <ChevronDown size={17} />
                </summary>
                <Badge
                  verdict={
                    row.status === "HARAM"
                      ? "NON-COMPLIANT"
                      : row.status === "HALAL"
                        ? "HALAL COMPLIANT"
                        : "REQUIRES REVIEW"
                  }
                />
                <p lang="en">{row.reason || c("uncertainHelp")}</p>
                {row.matched_rules?.map((rule) => (
                  <p className="source" key={rule.id} lang="en">
                    {c("sources")}: {rule.id} ({rule.status}) ·{" "}
                    {rule.source || "Maintained ingredient rules"}
                  </p>
                ))}
                {
                  <p className="source" lang="en">
                    {c("sources")}: {row.source || "No source available"}
                  </p>
                }
              </details>
            ))
          ) : (
            <p className="muted">{c("uncertainHelp")}</p>
          )}
        </section>
      </div>
      <details className="technical spaced">
        <summary>{c("technical")}</summary>
        <p className="muted">{c("confidenceNote")}</p>
        {scan.originalVerdict && (
          <p>
            {c("original")}: {scan.originalVerdict}
          </p>
        )}
        <pre>
          {JSON.stringify(
            {
              checkedAt: scan.date,
              policyVersion: scan.policyVersion,
              legacyScore: scan.confidence,
              barcode: scan.barcode,
              details: scan.architectureDetails,
            },
            null,
            2,
          )}
        </pre>
      </details>
      <div className="actions spaced">
        <Link className="btn btn-primary" to="/scanner">
          {c("another")}
        </Link>
      </div>
    </div>
  );
}
