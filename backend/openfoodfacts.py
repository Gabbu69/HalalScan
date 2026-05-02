from __future__ import annotations

from typing import Any

import requests


def fetch_product_by_barcode(barcode: str) -> dict[str, Any] | None:
    clean = barcode.strip()
    if not clean:
        return None

    try:
        response = requests.get(
            f"https://world.openfoodfacts.org/api/v0/product/{clean}.json",
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException:
        return None

    if data.get("status") != 1 or not data.get("product"):
        return None

    product = data["product"]
    labels = product.get("labels") or ""
    return {
        "barcode": clean,
        "name": product.get("product_name") or "Unknown Product",
        "brand": product.get("brands") or "Unknown Brand",
        "image": product.get("image_url"),
        "ingredients": product.get("ingredients_text") or "",
        "labels": labels,
    }

