import { Link } from "react-router-dom";
import { Star, Trash2 } from "lucide-react";
import type { ScanRecord } from "../types";
import { Badge } from "./Badge";
import { useAppStore } from "../store/useAppStore";
import { useCopy } from "../utils/copy";
export function SavedRow({
  scan,
  compact = false,
}: {
  scan: ScanRecord;
  compact?: boolean;
}) {
  const c = useCopy();
  const favorite = useAppStore((s) => s.toggleFavorite);
  const remove = useAppStore((s) => s.deleteScan);
  return (
    <article className="saved-row">
      <Link
        className="saved-link"
        to={"/history/" + encodeURIComponent(scan.id)}
      >
        {scan.image && (
          <img
            className="product-image"
            src={scan.image}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="saved-info">
          <h3>{scan.name}</h3>
          <p>{scan.brand || scan.barcode || c("ingredients")}</p>
          <Badge verdict={scan.verdict} />
          <span className="saved-date"> {formatDate(scan.date)}</span>
        </div>
      </Link>
      {!compact && (
        <div className="saved-actions">
          <button
            className={
              "icon-button " + (scan.favorite ? "favorite-active" : "")
            }
            aria-label={c(scan.favorite ? "unfavorite" : "favorite")}
            aria-pressed={!!scan.favorite}
            onClick={() => void favorite(scan.id)}
          >
            <Star size={20} fill={scan.favorite ? "currentColor" : "none"} />
          </button>
          <button
            className="icon-button"
            aria-label={c("delete") + ": " + scan.name}
            onClick={() => {
              if (window.confirm(c("deleteConfirm"))) void remove(scan.id);
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </article>
  );
}
export function formatDate(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? "—"
    : value.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}
