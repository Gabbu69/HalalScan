import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageCircle, ChevronDown } from "lucide-react";
import { CANONICAL_RULES } from "../utils/canonicalKnowledgeBase";
import { useCopy } from "../utils/copy";
import { Badge } from "../components/Badge";
export function Knowledge() {
  const c = useCopy();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const rules = useMemo(
    () =>
      CANONICAL_RULES.filter(
        (rule) =>
          (filter === "ALL" || rule.status === filter) &&
          [
            rule.title,
            rule.reason,
            rule.source,
            ...rule.keywords,
            ...rule.e_numbers,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [query, filter],
  );
  return (
    <div className="page">
      <div className="guide-top">
        <div className="page-heading">
          <h1>{c("guideTitle")}</h1>
          <p>{c("guideIntro")}</p>
        </div>
        <Link to="/chat" className="btn btn-quiet">
          <MessageCircle size={20} />
          {c("ask")}
        </Link>
      </div>
      <div className="search-field">
        <Search size={19} />
        <input
          className="input"
          type="search"
          aria-label={c("searchGuide")}
          placeholder={c("searchGuide")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="history-toolbar">
        <select
          className="input"
          aria-label={c("allResults")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {[
            ["ALL", "allResults"],
            ["HALAL", "positive"],
            ["DOUBTFUL", "uncertain"],
            ["HARAM", "negative"],
          ].map(([value, key]) => (
            <option value={value} key={value}>
              {c(key)}
            </option>
          ))}
        </select>
        <span className="muted small">
          {rules.length} / {CANONICAL_RULES.length}
        </span>
      </div>
      <p className="notice">{c("englishEvidence")}</p>
      <div className="guide-list spaced">
        {rules.map((rule) => (
          <details className="evidence-row" key={rule.id}>
            <summary>
              <span lang="en">
                <strong>{rule.title}</strong>
                <p>{rule.e_numbers.join(", ") || rule.category}</p>
              </span>
              <ChevronDown size={18} />
            </summary>
            {rule.status !== "INFO" && (
              <Badge
                verdict={
                  rule.status === "HALAL"
                    ? "HALAL COMPLIANT"
                    : rule.status === "HARAM"
                      ? "NON-COMPLIANT"
                      : "REQUIRES REVIEW"
                }
              />
            )}
            <p lang="en">{rule.reason}</p>
            <p className="source" lang="en">
              {c("sources")}: {rule.id} · {rule.source}
            </p>
          </details>
        ))}
      </div>
      {!rules.length && <p className="empty-state">{c("noRules")}</p>}
      <p className="muted spaced">{c("ruleScope")}</p>
    </div>
  );
}
