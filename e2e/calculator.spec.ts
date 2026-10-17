import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import workerDataset from "../data/processed/worker.json";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("근로소득 입력·월급 환산·원 단위·시뮬레이터", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("상위 몇 %");
  await page.getByRole("button", { name: "월급으로 입력", exact: true }).click();
  await page.getByLabel("월 세전 급여", { exact: true }).fill("400");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByLabel("근로소득 결과", { exact: true })).toContainText("4,800만 원");
  if (workerDataset.status === "unavailable") {
    await expect(page.getByLabel("근로소득 결과", { exact: true })).toContainText(
      "공식 분포자료 확인 중",
    );
  } else {
    await expect(page.getByLabel("근로소득 결과", { exact: true })).toContainText("상위");
  }
  await page.getByRole("button", { name: "+500만", exact: false }).click();
  await expect(page.getByLabel("근로소득 결과", { exact: true })).toContainText("5,300만 원");
  await page.getByRole("button", { name: "다시 계산", exact: false }).click();
  await page.getByRole("button", { name: "연봉으로 입력", exact: true }).click();
  await page.getByRole("button", { name: "원", exact: true }).click();
  await page.getByLabel("연간 세전 총급여", { exact: true }).fill("50,000,001");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByLabel("근로소득 결과", { exact: true })).toContainText("5,000.0001만 원");
});
test("빈 입력·오류·음수 사업소득·매출 비용", async ({ page }) => {
  await page.getByLabel("연간 세전 총급여", { exact: true }).fill("");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByText("금액을 입력해 주세요.", { exact: true })).toBeVisible();
  await page.getByLabel("연간 세전 총급여", { exact: true }).fill("-100");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByText("0원 이상을 입력해 주세요.", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "사업자·프리랜서" }).click();
  await page.getByLabel("연간 사업소득금액", { exact: true }).fill("-100");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByLabel("사업소득 결과", { exact: true })).toContainText("−100만 원");
  await page.getByRole("radio", { name: "매출과 비용으로 계산" }).check();
  await page.getByLabel("연간 총수입금액 (매출)", { exact: true }).fill("5000");
  await page.getByLabel("연간 필요경비", { exact: true }).fill("6000");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByLabel("사업소득 결과", { exact: true })).toContainText("−1,000만 원");
});
test("복수소득 개별 결과와 통합 순위 차단", async ({ page }) => {
  await page.getByRole("tab", { name: "직장인 + 사업" }).click();
  await page.getByLabel("연간 사업소득금액", { exact: true }).fill("2000");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByLabel("근로소득 결과", { exact: true })).toBeVisible();
  await expect(page.getByLabel("사업소득 결과", { exact: true })).toBeVisible();
  await expect(
    page.getByText("근로소득과 사업소득을 합친 전국 상위 순위는", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".mixed-note")).toContainText("7,000만 원");
});
test("PNG 두 비율 저장·개인정보 기본 비공개·공유 대체 동작", async ({ page }) => {
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(
    page.getByRole("checkbox", { name: "공유 카드·문구에 내 소득금액 공개" }),
  ).not.toBeChecked();
  for (const [label, height] of [
    ["PNG 저장 · 1:1", 1080],
    ["PNG 저장 · 9:16", 1920],
  ] as const) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: label, exact: true }).click();
    const download = await downloadPromise;
    const buffer = await readFile((await download.path())!);
    expect(buffer.subarray(1, 4).toString()).toBe("PNG");
    expect(buffer.readUInt32BE(16)).toBe(1080);
    expect(buffer.readUInt32BE(20)).toBe(height);
    expect(buffer.length).toBeGreaterThan(10000);
  }
  await page.getByRole("button", { name: "카카오톡용 링크 복사" }).click();
  await expect(page.getByRole("status")).toContainText(/복사/);
});
test("개인 소득이 요청·저장소·URL에 남지 않는다", async ({ page }) => {
  const requests: string[] = [];
  await page.waitForLoadState("networkidle");
  page.on("request", (r) => requests.push(`${r.url()} ${r.postData() ?? ""}`));
  await page.getByLabel("연간 세전 총급여", { exact: true }).fill("8765.4321");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByLabel("근로소득 결과", { exact: true })).toBeVisible();
  expect(requests.join()).not.toMatch(/8765|87654321/);
  expect(page.url()).not.toContain("?");
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
});
test("키보드 탭 전환과 접근성", async ({ page }) => {
  await page.getByRole("tab", { name: "직장인 근로소득" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "사업자·프리랜서" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByLabel("연간 사업소득금액", { exact: true }).fill("3000");
  await page.getByRole("button", { name: "나의 소득 위치 확인하기" }).click();
  await expect(page.getByLabel("사업소득 결과", { exact: true })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
});
test("SEO·서버 렌더링 정보·페이지·모바일 넘침", async ({ page, request }) => {
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /공식 통계/);
  expect(
    JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)["@type"],
  ).toBe("FAQPage");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  for (const route of [
    "/methodology",
    "/statistics",
    "/privacy",
    "/about",
    "/robots.txt",
    "/sitemap.xml",
    "/opengraph-image",
  ]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }
  const html = await (await request.get("/methodology")).text();
  expect(html).toContain("109개");
});
