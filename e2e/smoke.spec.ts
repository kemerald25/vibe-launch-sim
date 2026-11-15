import { expect, test, type Page } from "@playwright/test";

const UNOFFICIAL = "Unofficial community tool. Not affiliated with or endorsed by vibe/vibe.";

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function pickTax(page: Page, label: string) {
  await page
    .locator("label")
    .filter({ hasText: new RegExp(`^${label}$`) })
    .click();
}

test("changing the tax updates the numbers, and the shared URL reproduces the state", async ({
  page,
  context,
}) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await expect(page.getByTestId("unofficial-label")).toHaveText(UNOFFICIAL);
  await expect(page).toHaveURL(/\/$/);

  // Default: 1% tax on a 1 ETH trade.
  await expect(page.getByTestId("total-tax")).toHaveText("0.01");

  // The docs' worked example: 2% on 1,000 is 20, split 16 project / 4 protocol.
  await page.getByLabel("Trade size (ETH)").fill("1000");
  await pickTax(page, "2%");
  await expect(page.getByTestId("total-tax")).toHaveText("20");
  await expect(page.getByTestId("project-share")).toHaveText("16");
  await expect(page.getByTestId("protocol-share")).toHaveText("4");
  await expect(page.getByTestId("locked-tax")).toContainText("2%");

  await pickTax(page, "3%");
  await expect(page.getByTestId("total-tax")).toHaveText("30");
  await expect(page.locator('[data-notice="tax-at-maximum"]')).toBeVisible();

  // The address bar now carries the whole configuration.
  await expect(page).toHaveURL(/tax=300/);
  await expect(page).toHaveURL(/ts=1000/);
  const sharedUrl = page.url();

  // A fresh tab opened from the shared link shows the same simulation.
  const second = await context.newPage();
  const secondErrors = trackErrors(second);
  await second.goto(sharedUrl);
  await expect(second.getByTestId("total-tax")).toHaveText("30");
  await expect(second.getByTestId("project-share")).toHaveText("24");
  await expect(second.getByLabel("Trade size (ETH)")).toHaveValue("1000");
  await expect(second.getByRole("radio", { name: "3%" })).toBeChecked();
  await expect(second.locator('[data-notice="tax-at-maximum"]')).toBeVisible();

  expect(errors).toEqual([]);
  expect(secondErrors).toEqual([]);
});

test("the 50% cap is enforced with a specific message", async ({ page }) => {
  await page.goto("/?v=1&ob=3000&ad=2500");
  await expect(page.getByTestId("error-summary")).toContainText("55%");
  await expect(page.getByTestId("error-summary")).toContainText("cannot exceed 50%");
  await page.getByLabel("Airdrop reserve, percent of supply").fill("20");
  await expect(page.getByTestId("error-summary")).toHaveCount(0);
  await expect(page.getByTestId("cap-readout")).toContainText("50% of the 50% limit");
});

test("a new simulation starts with no opening buy, and old links keep theirs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Opening buy, percent of supply")).toHaveValue("0");
  await expect(page.getByTestId("no-opening-buy")).toHaveText("No opening buy set");
  await expect(page.getByTestId("opening-cost")).toHaveCount(0);

  await page.goto("/?v=1&ob=500");
  await expect(page.getByLabel("Opening buy, percent of supply")).toHaveValue("5");
  await expect(page.getByTestId("opening-cost")).toBeVisible();
});

test("the report link opens a pre-filled GitHub issue in a new tab", async ({ page }) => {
  for (const path of ["/", "/about"]) {
    await page.goto(path);
    const links = page.getByRole("link", { name: /report a wrong number/i });
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute(
        "href",
        /github\.com\/.+\/issues\/new\?title=Wrong%20number/,
      );
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(await links.count()).toBeGreaterThan(0);
  }
});

test("sharing: summary text and PNG card both carry the unofficial label", async ({ page }) => {
  await page.goto("/?v=1&n=Moon+Cat&t=MCAT&tax=200");
  await page.getByRole("button", { name: "Copy summary" }).click();
  await expect(page.getByTestId("share-status")).toContainText("Summary copied");
  const summary = await page.evaluate(() => navigator.clipboard.readText());
  expect(summary).toContain(UNOFFICIAL);
  expect(summary).toContain("Moon Cat ($MCAT)");
  expect(summary).toContain("tax=200");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download card" }).click();
  expect((await download).suggestedFilename()).toBe("preflight-mcat.png");
});

test("the Open Graph image renders for a shared configuration", async ({ page, request }) => {
  const response = await request.get("/og?v=1&n=Moon+Cat&t=MCAT&tax=300");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  expect((await response.body()).byteLength).toBeGreaterThan(5_000);

  await page.goto("/?v=1&n=Moon+Cat&t=MCAT&tax=300");
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toContain("/og?");
  expect(ogImage).toContain("tax=300");
});

test("every page shows the unofficial label, fits the viewport, and does not shift", async ({
  page,
}) => {
  for (const path of ["/", "/learn", "/about"]) {
    const errors = trackErrors(page);
    await page.goto(path);
    await expect(page.getByTestId("unofficial-label")).toHaveText(UNOFFICIAL);
    await expect(page.getByTestId("unofficial-label")).toBeInViewport();
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);

    const layoutShift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as unknown as { value: number; hadRecentInput: boolean };
              if (!shift.hadRecentInput) total += shift.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(layoutShift, `${path} layout shift`).toBeLessThan(0.01);
    expect(errors, `${path} console errors`).toEqual([]);
  }
});
