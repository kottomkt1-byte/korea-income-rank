import { describe, it, expect } from "vitest";
import { normalize, numeric } from "../scripts/import/normalize";
import { workerFixture, businessFixture } from "./fixtures/datasets";
const fixture = workerFixture();
const manifest = {
  kind: "worker",
  metadata: fixture.metadata,
  sourceReviewed: true,
  populationReviewed: true,
  sourceUnit: "KRW",
  expectedTotalPeople: fixture.audit.totalPeople,
  expectedTotalSalaryInSourceUnit: fixture.audit.totalSalaryWon,
  columns: { rank: "구분", people: "인원", salary: "총급여" },
  rankFormat: "cumulative-endpoint",
};
const rows = fixture.bins.map((b) => ({
  구분: `상위 ${b.topTo}%`,
  인원: b.people,
  총급여: b.salarySumWon,
}));
describe("원본 등록 — SYNTHETIC TEST FIXTURE", () => {
  it("공식 컬럼명·정렬·숫자 파싱", () =>
    expect(normalize([...rows].reverse(), manifest, "0".repeat(64))).toMatchObject({
      kind: "worker",
      status: "verified",
    }));
  it("억원 단위 변환", () =>
    expect(
      normalize(
        rows.map((r) => ({ ...r, 총급여: r.총급여 / 1e8 })),
        {
          ...manifest,
          sourceUnit: "EOK_KRW",
          expectedTotalSalaryInSourceUnit: fixture.audit.totalSalaryWon / 1e8,
        },
        "0".repeat(64),
      ),
    ).toMatchObject({ bins: fixture.bins }));
  it("컬럼 이름이 달라지면 거부", () =>
    expect(() =>
      normalize(
        rows,
        { ...manifest, columns: { ...manifest.columns, salary: "근로소득금액" } },
        "0".repeat(64),
      ),
    ).toThrow("컬럼"));
  it("합계·소계 행 중복 거부", () =>
    expect(() =>
      normalize([...rows, { 구분: "합계", 인원: 100000, 총급여: 1 }], manifest, "0".repeat(64)),
    ).toThrow("합계"));
  it("비공개·누락 숫자를 0으로 바꾸지 않는다", () => {
    for (const cell of ["-", "*", "비공개", "", null]) expect(() => numeric(cell)).toThrow();
  });
  it("자료 검토 표시 없이는 등록하지 않는다", () =>
    expect(() =>
      normalize(rows, { ...manifest, sourceReviewed: false }, "0".repeat(64)),
    ).toThrow());
  it("데이터 연도 혼합 차단", () =>
    expect(() =>
      normalize(
        rows.map((r) => ({ ...r, 연도: 2023 })),
        { ...manifest, columns: { ...manifest.columns, taxYear: "연도" } },
        "0".repeat(64),
      ),
    ).toThrow("연도"));
  it("업태 합계 선택 후 비중복 인원 검증", () => {
    const b = businessFixture();
    const rows = b.bins.flatMap((bin) => [
      {
        업태: "전체",
        하한: bin.lowerWon ?? "OPEN",
        상한: bin.upperWon ?? "OPEN",
        인원: bin.people,
      },
      {
        업태: "일부업태",
        하한: bin.lowerWon ?? "OPEN",
        상한: bin.upperWon ?? "OPEN",
        인원: bin.people,
      },
    ]);
    const m = {
      kind: "business",
      metadata: b.metadata,
      sourceReviewed: true,
      populationReviewed: true,
      sourceUnit: "KRW",
      expectedTotalPeople: 100,
      countingUnit: "unique-person",
      includesMixedEarners: "unknown",
      columns: { people: "인원", lower: "하한", upper: "상한" },
      filter: { column: "업태", equals: "전체" },
    };
    expect(normalize(rows, m, "0".repeat(64))).toMatchObject({ bins: b.bins });
    expect(() => normalize(rows, { ...m, filter: undefined }, "0".repeat(64))).toThrow();
  });
});
