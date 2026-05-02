from __future__ import annotations

import base64
import os
from typing import Any


SUPPORTED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}


def is_configured() -> bool:
    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and not os.getenv("GOOGLE_CLOUD_PROJECT"):
        return False
    try:
        import google.cloud.vision  # noqa: F401
    except ImportError:
        return False
    return True


def _decode_base64(data: str) -> bytes:
    payload = data.split(",", 1)[1] if "," in data and data.startswith("data:") else data
    return base64.b64decode(payload)


def _extract_payload(req: Any) -> tuple[bytes, str, str, str]:
    if req.files:
        upload = req.files.get("file") or next(iter(req.files.values()))
        content = upload.read()
        mime_type = upload.mimetype or "image/jpeg"
        filename = upload.filename or "upload"
        fallback_text = req.form.get("fallbackText", "")
        return content, mime_type, filename, fallback_text

    data = req.get_json(silent=True) or {}
    base64_value = data.get("fileBase64") or data.get("imageBase64") or data.get("data")
    if not base64_value:
        raise ValueError("fileBase64, imageBase64, or multipart file is required.")

    return (
        _decode_base64(base64_value),
        data.get("mimeType") or "image/jpeg",
        data.get("filename") or "upload",
        data.get("fallbackText") or "",
    )


def _average_confidence(full_text_annotation: Any) -> float:
    values: list[float] = []
    for page in getattr(full_text_annotation, "pages", []) or []:
        for block in getattr(page, "blocks", []) or []:
            confidence = getattr(block, "confidence", None)
            if confidence is not None:
                values.append(float(confidence))
            for paragraph in getattr(block, "paragraphs", []) or []:
                confidence = getattr(paragraph, "confidence", None)
                if confidence is not None:
                    values.append(float(confidence))
    if not values:
        return 0.0
    return round(sum(values) / len(values) * 100, 2)


def _run_image_ocr(content: bytes) -> dict[str, Any]:
    from google.cloud import vision

    client = vision.ImageAnnotatorClient()
    response = client.document_text_detection(image=vision.Image(content=content))
    if getattr(response, "error", None) and response.error.message:
        raise RuntimeError(response.error.message)

    annotation = response.full_text_annotation
    return {
        "text": annotation.text or "",
        "confidence": _average_confidence(annotation),
        "pages": [{"page": 1, "text": annotation.text or ""}],
        "engine": "google-vision-document-text-detection",
    }


def _run_pdf_ocr(content: bytes, mime_type: str) -> dict[str, Any]:
    from google.cloud import vision

    client = vision.ImageAnnotatorClient()
    request = vision.AnnotateFileRequest(
        input_config=vision.InputConfig(content=content, mime_type=mime_type),
        features=[vision.Feature(type_=vision.Feature.Type.DOCUMENT_TEXT_DETECTION)],
        pages=[1, 2, 3, 4, 5],
    )
    response = client.batch_annotate_files(requests=[request])
    annotate_response = response.responses[0]

    pages: list[dict[str, Any]] = []
    confidence_values: list[float] = []
    for idx, page_response in enumerate(annotate_response.responses, start=1):
        if getattr(page_response, "error", None) and page_response.error.message:
            pages.append({"page": idx, "text": "", "error": page_response.error.message})
            continue
        annotation = page_response.full_text_annotation
        pages.append({"page": idx, "text": annotation.text or ""})
        confidence_values.append(_average_confidence(annotation))

    text = "\n".join(page["text"] for page in pages if page.get("text")).strip()
    confidence = round(sum(confidence_values) / len(confidence_values), 2) if confidence_values else 0.0
    return {
        "text": text,
        "confidence": confidence,
        "pages": pages,
        "engine": "google-vision-pdf-document-text-detection",
    }


def run_ocr_payload(req: Any) -> dict[str, Any]:
    content, mime_type, filename, fallback_text = _extract_payload(req)
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise ValueError(f"Unsupported OCR file type: {mime_type}")

    if not is_configured():
        return {
            "text": fallback_text,
            "confidence": 0,
            "pages": [],
            "engine": "google-vision-unavailable",
            "filename": filename,
            "warning": "Google Vision is not configured. Set GOOGLE_APPLICATION_CREDENTIALS to enable primary OCR.",
        }

    result = _run_pdf_ocr(content, mime_type) if mime_type == "application/pdf" else _run_image_ocr(content)
    result["filename"] = filename
    return result

