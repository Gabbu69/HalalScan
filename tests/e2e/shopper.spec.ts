import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const record = (id: string, text = "sugar, salt", name = "Oat biscuits") => {
  const rows = text
    .split(",")
    .map((ingredient) => ({
      ingredient: ingredient.trim(),
      status: /zorbium|gelatin/.test(ingredient) ? "UNKNOWN" : "HALAL",
      reason: "Browser test fixture",
      source: "test-fixture",
    }));
  const result = {
    ingredients: text,
    ingredient_results: rows,
    confidence: 0,
    finalVerdict: rows.some((row) => row.status !== "HALAL")
      ? "REQUIRES REVIEW"
      : "HALAL COMPLIANT",
  };
  return {
    ...result,
    id,
    name,
    date: "2026-09-13T06:00:00.000Z",
    barcode: "3017620422003",
    brand: "Test Pantry",
    verdict: result.finalVerdict,
  };
};
async function seed(page: Page, scans = [record("saved-one")]) {
  await page.addInitScript((scans) => {
    if (!localStorage.getItem("e2e-seeded")) {
      localStorage.setItem(
        "halalscan-storage",
        JSON.stringify({ state: { scans, hasOnboarded: true } }),
      );
      localStorage.setItem("e2e-seeded", "yes");
    }
  }, scans);
}
async function checkText(page: Page, text: string, name: string) {
  await page.goto("/scanner?mode=text");
  await page.getByLabel("Product name (optional)", { exact: true }).fill(name);
  await page.getByLabel("Full ingredient list", { exact: true }).fill(text);
  await page
    .getByRole("button", { name: "Check ingredients", exact: true })
    .click();
  await expect(page).toHaveURL(/\/history\/[^/]+$/);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}
async function countScans(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const req = indexedDB.open("halalscan-device");
        req.onsuccess = () => {
          const db = req.result;
          const count = db.transaction("scans").objectStore("scans").count();
          count.onsuccess = () => {
            resolve(count.result);
            db.close();
          };
          count.onerror = () => reject(count.error);
        };
        req.onerror = () => reject(req.error);
      }),
  );
}
async function offlineReady(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller)))
    await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}
test("result labels reflect all three outcomes and rechecks create a new record", async ({
  page,
}) => {
  await checkText(page, "sugar, salt", "Everyday oats");
  await expect(
    page
      .locator(".result-summary")
      .getByText("No flagged ingredients", { exact: true }),
  ).toBeVisible();
  const first = page.url();
  await page.getByRole("button", { name: "Check again", exact: true }).click();
  await expect(page).not.toHaveURL(first);
  await expect(page).toHaveURL(/\/history\//);
  expect(await countScans(page)).toBe(2);
  await checkText(page, "sugar, zorbium", "Unresolved snack");
  await expect(
    page
      .locator(".result-summary")
      .getByText("Needs verification", { exact: true }),
  ).toBeVisible();
  await checkText(page, "pork fat, zorbium", "Flagged snack");
  await expect(
    page.locator(".result-summary").getByText("Non-compliant", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Flagged snack", exact: true }),
  ).toBeVisible();
  expect(await countScans(page)).toBe(4);
});
test("favorites, search fields, filters and deletion persist", async ({
  page,
}) => {
  await seed(page, [
    record("saved-one"),
    record("saved-two", "gelatin", "Fruit sweets"),
  ]);
  await page.goto("/history/saved-one");
  await page
    .getByRole("button", { name: "Add to favorites", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remove from favorites", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/history");
  const search = page.getByRole("searchbox");
  for (const query of ["biscuits", "Test Pantry", "3017620422003", "salt"]) {
    await search.fill(query);
    await expect(
      page.getByRole("link", { name: /Oat biscuits/ }),
    ).toBeVisible();
  }
  await search.fill("");
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await expect(page.getByRole("link", { name: /Fruit sweets/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await page.getByRole("combobox").selectOption("REQUIRES REVIEW");
  await expect(page.getByRole("link", { name: /Fruit sweets/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Oat biscuits/ })).toHaveCount(0);
  await page.getByRole("combobox").selectOption("ALL");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Delete.*Oat biscuits/ }).click();
  await page.reload();
  await expect(page.getByRole("link", { name: /Oat biscuits/ })).toHaveCount(0);
  await page.goto("/history/saved-one");
  await expect(
    page.getByRole("heading", {
      name: "This result is not on this device",
      exact: true,
    }),
  ).toBeVisible();
  expect(await countScans(page)).toBe(1);
});
test("camera starts only on demand and rejection allows manual recovery", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).cameraCalls = 0;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        (window as any).cameraCalls++;
        throw new DOMException("Denied", "NotAllowedError");
      },
    });
    Object.defineProperty(navigator.mediaDevices, "enumerateDevices", {
      value: async () => [
        {
          kind: "videoinput",
          deviceId: "test",
          label: "Test camera",
          groupId: "test",
          toJSON() {
            return {};
          },
        },
      ],
    });
  });
  await page.goto("/scanner");
  await expect(
    page.getByRole("button", { name: "Start camera", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => (window as any).cameraCalls)).toBe(0);
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("camera could not start");
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).cameraCalls))
    .toBeGreaterThan(1);
  await page.getByLabel("Or enter the barcode number").fill("123");
  await page
    .getByRole("button", { name: "Look up product", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("valid 8, 12, 13, or 14");
});
test("unknown barcode and failed lookup never become positive", async ({
  page,
}) => {
  let failed = true;
  await page.route("**/api/analyze", (route) =>
    failed
      ? route.abort()
      : route.fulfill({
          json: {
            ingredients: "",
            ingredient_results: [],
            final_verdict: "REQUIRES REVIEW",
            product: { name: "Unlisted product", barcode: "3017620422003" },
          },
        }),
  );
  await page.goto("/scanner");
  await page.getByLabel("Or enter the barcode number").fill("3017620422003");
  await page
    .getByRole("button", { name: "Look up product", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "The check could not finish",
      exact: true,
    }),
  ).toBeVisible();
  expect(await countScans(page)).toBe(0);
  failed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page).toHaveURL(/\/history\//);
  await expect(
    page
      .locator(".result-summary")
      .getByText("Needs verification", { exact: true }),
  ).toBeVisible();
});
test("photo validation, OCR review, empty OCR and cancellation", async ({
  page,
}) => {
  await page.goto("/scanner?mode=photo");
  const upload = page.locator("input[type=file]");
  await upload.setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("supported image");
  await page.route("**/api/ocr", (route) =>
    route.fulfill({ json: { text: "sugar, zorbium" } }),
  );
  await upload.setInputFiles({
    name: "label.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test label"),
  });
  await expect(
    page.getByRole("heading", {
      name: "Review the extracted ingredients",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Full ingredient list", { exact: true }),
  ).toHaveValue("sugar, zorbium");
  expect(await countScans(page)).toBe(0);
  await page
    .getByLabel("Full ingredient list", { exact: true })
    .fill("sugar, salt");
  await page
    .getByRole("button", { name: "Check ingredients", exact: true })
    .click();
  await expect(page).toHaveURL(/\/history\//);
  await page.goto("/scanner?mode=photo");
  await page.unroute("**/api/ocr");
  await page.route("**/api/ocr", (route) =>
    route.fulfill({ json: { text: "" } }),
  );
  await upload.setInputFiles({
    name: "empty.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 empty"),
  });
  await expect(page.getByRole("alert")).toContainText(
    "could not read usable ingredients",
  );
  await page
    .getByRole("button", { name: "Check ingredients", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "complete ingredient list",
  );
  await page.unroute("**/api/ocr");
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/ocr", async (route) => {
    await gate;
    await route.fulfill({ json: { text: "pork fat" } }).catch(() => {});
  });
  await upload.setInputFiles({
    name: "slow.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 slow"),
  });
  await expect(
    page.getByText("Reading the label…", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel", exact: true })
    .first()
    .click();
  release();
  await expect(
    page.getByText("Reading the label…", { exact: true }),
  ).toHaveCount(0);
  expect(await countScans(page)).toBe(1);
});
test("cancelled analysis does not save late results and drafts survive refresh", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route("**/api/analyze", async (route) => {
    calls++;
    await gate;
    await route
      .fulfill({
        json: {
          ingredients: "sugar",
          ingredient_results: [{ ingredient: "sugar", status: "HALAL" }],
          final_verdict: "HALAL COMPLIANT",
        },
      })
      .catch(() => {});
  });
  await page.goto("/scanner?mode=text");
  await page.getByLabel("Full ingredient list", { exact: true }).fill("sugar");
  await page.reload();
  await expect(
    page.getByLabel("Full ingredient list", { exact: true }),
  ).toHaveValue("sugar");
  await page
    .getByRole("button", { name: "Check ingredients", exact: true })
    .click();
  await expect.poll(() => calls).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  release();
  await expect(page).toHaveURL(/\/scanner$/);
  expect(await countScans(page)).toBe(0);
  await page.goto("/analysis");
  await expect(
    page.getByRole("heading", { name: "Start a new check", exact: true }),
  ).toBeVisible();
});
test("save failure keeps an unsaved result and retry saves once", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    (window as any).failSaves = true;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<typeof original>
    ) {
      if (this.name === "scans" && (window as any).failSaves)
        throw new DOMException("Full", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await page.goto("/scanner?mode=text");
  await page.getByLabel("Full ingredient list", { exact: true }).fill("sugar");
  await page
    .getByRole("button", { name: "Check ingredients", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "not been saved",
  );
  expect(await countScans(page)).toBe(0);
  await page.evaluate(() => {
    (window as any).failSaves = false;
  });
  await page
    .locator("main")
    .getByRole("button", { name: "Try again", exact: true })
    .click();
  await expect(page).toHaveURL(/\/history\//);
  await page.reload();
  expect(await countScans(page)).toBe(1);
});
test("production PWA starts offline, reopens results and searches guidance", async ({
  page,
  context,
}) => {
  await seed(page);
  await page.goto("/history/saved-one");
  await offlineReady(page);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Oat biscuits", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("You’re offline", { exact: true })).toBeVisible();
  await page.goto("/knowledge");
  await page.getByRole("searchbox").fill("E120");
  await expect(page.locator(".evidence-row")).toHaveCount(1);
  await page.goto("/scanner?mode=barcode");
  await expect(
    page.getByRole("button", { name: "Look up product", exact: true }),
  ).toBeDisabled();
  await checkText(page, "salt, sugar", "Offline check");
  await expect(
    page.getByText("Local ingredient rules", { exact: true }),
  ).toBeVisible();
  const urls = await page.evaluate(async () => {
    const names = await caches.keys();
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map((r) => r.url),
        ),
      )
    ).flat();
  });
  expect(
    urls.some((url) => url.includes("/api/") || url.startsWith("data:")),
  ).toBe(false);
  await context.setOffline(false);
  await expect(page.getByText("You’re offline", { exact: true })).toHaveCount(
    0,
  );
});
test("real service-worker update waits for the unfinished check", async ({
  page,
  request,
}) => {
  await page.goto("/scanner?mode=text");
  await offlineReady(page);
  await page.getByLabel("Full ingredient list", { exact: true }).fill("sugar");
  await request.post("/__test/update");
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  });
  await expect(
    page.getByText("An app update is ready.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update now", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByLabel("Full ingredient list", { exact: true }),
  ).toHaveValue("sugar");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Update now", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Update now", exact: true }).click();
  await expect(
    page.getByText("An app update is ready.", { exact: true }),
  ).toHaveCount(0);
});
test("mobile, dark mode, keyboard access, long labels and translations", async ({
  page,
}) => {
  test.setTimeout(90000);
  await seed(page, [
    record(
      "long-label",
      "sugar, zorbium",
      "Very long ingredient-label product ".repeat(4),
    ),
  ]);
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content", exact: true }),
  ).toBeFocused();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/scanner",
      "/history",
      "/history/long-label",
      "/knowledge",
      "/profile",
      "/chat",
      "/onboarding",
      "/evaluation",
    ]) {
      await page.goto(path);
      await expect(page.locator("main h1").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.goto("/profile");
  await page.getByRole("switch", { name: "Dark mode", exact: true }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("Tagalog");
  await expect(
    page.getByRole("heading", { name: "Mga setting", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.getByRole("combobox").selectOption("Arabic");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  for (const path of [
    "/",
    "/scanner",
    "/history",
    "/history/long-label",
    "/knowledge",
    "/profile",
    "/chat",
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  await page.screenshot({
    path: "test-results/arabic-dark-mobile.png",
    fullPage: true,
  });
});
test("clear app data preserves unrelated keys and history stays deleted", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/profile");
  await page.evaluate(() => localStorage.setItem("another-app-key", "keep"));
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Clear app data", exact: true })
    .click();
  await expect.poll(() => countScans(page)).toBe(0);
  await page.reload();
  expect(await countScans(page)).toBe(0);
  expect(
    await page.evaluate(() => localStorage.getItem("another-app-key")),
  ).toBe("keep");
});
