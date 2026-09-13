import test from "node:test";
import assert from "node:assert/strict";
import fixtures from "./fixtures/verdicts.json";
import { decideVerdict, normalizeVerdict } from "../shared/verdict";
import {
  runLocalAnalysis,
  adaptBackendResult,
  runIntegratedImageAnalysis,
  runIntegratedAnalysis,
  runIntegratedBarcodeAnalysis,
} from "../src/utils/systemIntegration";
import { analyzePayload, normalizeApiStatus } from "../api/_halalscan";
import history from "../api/history";
import analyze from "../api/analyze";
import {
  validBarcode,
  validateLabelFile,
  MAX_FILE_BYTES,
} from "../src/utils/scanInput";
import { fetchJson } from "../src/utils/requests";
delete process.env.RAPIDAPI_KEY;

for (const fixture of fixtures)
  test("verdict parity: " + fixture.name, async () => {
    if ("rows" in fixture) {
      assert.equal(
        decideVerdict(fixture.ingredients, fixture.rows!),
        fixture.expected,
      );
      assert.equal(
        adaptBackendResult({
          ingredients: fixture.ingredients,
          ingredient_results: fixture.rows,
          final_verdict: fixture.expected,
        }).finalVerdict,
        fixture.expected,
      );
    } else {
      const local = runLocalAnalysis("Test", fixture.ingredients);
      assert.equal(local.finalVerdict, fixture.expected, "browser");
      const server = await analyzePayload({
        ingredients: fixture.ingredients,
        certifyingBody: "JAKIM",
      });
      assert.equal(server.final_verdict, fixture.expected, "Vercel");
      assert.equal(
        adaptBackendResult(server).finalVerdict,
        fixture.expected,
        "adapter",
      );
    }
  });
test("unfamiliar verdicts and compound provider messages stay unresolved", () => {
  assert.equal(normalizeVerdict("new-status"), "REQUIRES REVIEW");
  assert.equal(normalizeApiStatus("not halal"), "HARAM");
  assert.equal(normalizeApiStatus("probably halal"), "UNKNOWN");
  assert.equal(normalizeApiStatus("halal status unavailable"), "UNKNOWN");
  assert.equal(
    adaptBackendResult({
      ingredients: "sugar",
      ingredient_results: [{ ingredient: "sugar", status: "HALAL" }],
      final_verdict: "NEW",
    }).finalVerdict,
    "REQUIRES REVIEW",
  );
});
test("image with no OCR never calls a model or returns positive", async () => {
  assert.equal(
    (await runIntegratedImageAnalysis("data:image/png;base64,missing"))
      .finalVerdict,
    "REQUIRES REVIEW",
  );
});
test("offline service failure uses evidence, never an AI guess", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("Offline");
  };
  try {
    assert.equal(
      (await runIntegratedAnalysis("Unknown", "mysterium")).finalVerdict,
      "REQUIRES REVIEW",
    );
    await assert.rejects(
      runIntegratedBarcodeAnalysis("0000000000000"),
      /lookup/,
    );
  } finally {
    globalThis.fetch = old;
  }
});
test("unknown barcode cannot become a positive check", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ status: 0 }), { status: 200 });
  try {
    assert.equal(
      (await analyzePayload({ barcode: "0000000000000" })).final_verdict,
      "REQUIRES REVIEW",
    );
  } finally {
    globalThis.fetch = old;
  }
});
test("request cancellation does not turn into a fallback", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (_url, init) =>
    new Promise<Response>((_resolve, reject) => {
      if (init?.signal?.aborted)
        reject(new DOMException("Aborted", "AbortError"));
      else
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
    });
  try {
    const controller = new AbortController();
    const pending = runIntegratedAnalysis("Check", "sugar", "General", "", {
      signal: controller.signal,
    });
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    await assert.rejects(fetchJson("/never", {}, 5), { name: "AbortError" });
  } finally {
    globalThis.fetch = old;
  }
});
test("public history never returns shared records", async () => {
  let body: any;
  history(
    { method: "GET" } as any,
    {
      status() {
        return this;
      },
      json(value: any) {
        body = value;
      },
    } as any,
  );
  assert.deepEqual(body.history, []);
  assert.equal(body.storage, "device-local");
});
test("API rejects malformed and excessive fields", async () => {
  for (const payload of [
    { ingredients: ["sugar"] },
    { ingredients: "x".repeat(10001) },
    ["sugar"],
  ]) {
    const response: any = {
      statusCode: 200,
      status(n: number) {
        this.statusCode = n;
        return this;
      },
      json(value: any) {
        this.body = value;
        return this;
      },
    };
    await analyze({ method: "POST", body: payload } as any, response);
    assert.equal(response.statusCode, 400);
  }
});
test("product barcodes require valid GTIN check digits", () => {
  assert.equal(validBarcode("3017620422003"), true);
  assert.equal(validBarcode("3017620422004"), false);
  assert.equal(validBarcode("https://example.com"), false);
  assert.equal(validBarcode("123"), false);
});
test("files need supported type, size, and signature", async () => {
  assert.equal(
    await validateLabelFile(new File(["fake"], "x.png", { type: "image/png" })),
    false,
  );
  assert.equal(
    await validateLabelFile(
      new File(["%PDF-1.4 test"], "x.pdf", { type: "application/pdf" }),
    ),
    true,
  );
  assert.equal(
    await validateLabelFile(
      new File([new Uint8Array(MAX_FILE_BYTES + 1)], "x.pdf", {
        type: "application/pdf",
      }),
    ),
    false,
  );
});
