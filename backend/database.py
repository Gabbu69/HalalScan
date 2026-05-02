from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "halalscan.sqlite3"


def get_db_path() -> Path:
    return Path(os.getenv("HALALSCAN_DB_PATH", str(DEFAULT_DB_PATH))).resolve()


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ingredient_cache (
              ingredient TEXT PRIMARY KEY,
              status TEXT NOT NULL,
              confidence REAL NOT NULL,
              reason TEXT NOT NULL,
              raw_json TEXT,
              created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scan_history (
              id TEXT PRIMARY KEY,
              created_at TEXT NOT NULL,
              verdict TEXT NOT NULL,
              product_name TEXT NOT NULL,
              payload_json TEXT NOT NULL
            )
            """
        )


def get_cached_ingredient(ingredient: str) -> dict[str, Any] | None:
    normalized = ingredient.strip().lower()
    if not normalized:
        return None

    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM ingredient_cache WHERE ingredient = ?",
            (normalized,),
        ).fetchone()

    if not row:
        return None

    return {
        "ingredient": normalized,
        "status": row["status"],
        "confidence": row["confidence"],
        "reason": row["reason"],
        "raw": json.loads(row["raw_json"] or "{}"),
        "cached": True,
    }


def cache_ingredient(ingredient: str, result: dict[str, Any]) -> None:
    normalized = ingredient.strip().lower()
    if not normalized:
        return

    with connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO ingredient_cache
              (ingredient, status, confidence, reason, raw_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                normalized,
                result.get("status", "UNKNOWN"),
                float(result.get("confidence", 0)),
                result.get("reason", ""),
                json.dumps(result.get("raw", {}), ensure_ascii=True),
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def save_scan(scan: dict[str, Any]) -> None:
    scan_id = str(scan["id"])
    with connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO scan_history
              (id, created_at, verdict, product_name, payload_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                scan_id,
                scan.get("created_at", datetime.now(timezone.utc).isoformat()),
                scan.get("final_verdict", "REQUIRES REVIEW"),
                scan.get("product", {}).get("name", "Unknown Product"),
                json.dumps(scan, ensure_ascii=True),
            ),
        )


def list_history(limit: int = 100) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT payload_json FROM scan_history
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [json.loads(row["payload_json"]) for row in rows]

