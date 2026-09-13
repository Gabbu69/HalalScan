import { useState } from "react";
import { Search, Star, Bookmark, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { useCopy } from "../utils/copy";
import { searchScans } from "../lib/scanStorage";
import { SavedRow } from "../components/SavedRow";
export function History() {
  const c = useCopy();
  const scans = useAppStore((s) => s.scans);
  const ready = useAppStore((s) => s.historyReady);
  const clear = useAppStore((s) => s.clearScans);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [favorites, setFavorites] = useState(false);
  const results = searchScans(scans, query, filter, favorites);
  return (
    <div className="page page-narrow">
      <div className="page-heading">
        <h1>{c("savedTitle")}</h1>
        <p>{c("savedIntro")}</p>
      </div>
      <div className="search-field">
        <Search size={19} />
        <input
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={c("searchSaved")}
          aria-label={c("searchSaved")}
        />
      </div>
      <div className="history-toolbar">
        <button
          className="toggle"
          aria-pressed={favorites}
          onClick={() => setFavorites(!favorites)}
        >
          <Star size={18} />
          {c("favorites")}
        </button>
        <select
          className="input"
          aria-label={c("allResults")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {[
            ["ALL", "allResults"],
            ["HALAL COMPLIANT", "positive"],
            ["REQUIRES REVIEW", "uncertain"],
            ["NON-COMPLIANT", "negative"],
          ].map(([value, key]) => (
            <option key={value} value={value}>
              {c(key)}
            </option>
          ))}
        </select>
        {scans.length > 0 && (
          <button
            className="btn btn-quiet"
            onClick={() => {
              if (window.confirm(c("clearConfirm"))) void clear();
            }}
          >
            <Trash2 size={18} />
            {c("clearHistory")}
          </button>
        )}
      </div>
      {!ready ? (
        <p role="status">{c("saving")}</p>
      ) : results.length ? (
        <div>
          {results.map((scan) => (
            <SavedRow key={scan.id} scan={scan} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Bookmark size={36} />
          <h2>{c(scans.length ? "noMatches" : "emptyTitle")}</h2>
          <p>{c("emptyIntro")}</p>
          <div className="actions spaced">
            {scans.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setQuery("");
                  setFilter("ALL");
                  setFavorites(false);
                }}
              >
                {c("resetFilters")}
              </button>
            )}
            <Link className="btn btn-primary" to="/scanner">
              {c("scanProduct")}
            </Link>
          </div>
        </div>
      )}
      <p className="bottom-note">{c("privacyHelp")}</p>
    </div>
  );
}
