import { describe, it, expect } from "vitest";
import { workerFixture, businessFixture } from "./fixtures/datasets";
import { calculate, calculateMixed, formatRank, targetIncome } from "../lib/statistics/engine";
import { validateDataset } from "../lib/statistics/schema";
import { workerData, businessData } from "../lib/statistics/data";
describe("검증된 통계의 계산 계약 — SYNTHETIC TEST FIXTURE", () => {
  it("반복 계산이 동일하다", () =>
    expect(calculate(50_000_000, workerFixture())).toEqual(calculate(50_000_000, workerFixture())));
  it("109개 구간 합계와 구조를 검증한다", () =>
    expect(validateDataset(workerFixture()).status).toBe("verified"));
  it("소득 증가에 따라 상위 비율이 단조 감소한다", () => {
    let previous = 100;
    for (let amount = 0; amount <= 200_000_000; amount += 123_457) {
      const result = calculate(amount, workerFixture());
      const top = result.topPercent ?? result.topRange![1];
      expect(top).toBeLessThanOrEqual(previous + 1e-8);
      previous = top;
    }
  });
  it("최상위 꼬리는 외삽하거나 0.0%로 표시하지 않는다", () => {
    const result = calculate(1_000_000_000_000, workerFixture());
    expect(result.topRange).toEqual([0, 0.1]);
    expect(formatRank(result)).toBe("상위 0.1% 이내");
  });
  it("0원의 근로소득은 유효하며 최하위 구간으로 처리한다", () =>
    expect(calculate(0, workerFixture()).topRange).toEqual([99, 100]));
  it("음수 근로소득을 거부한다", () => expect(() => calculate(-1, workerFixture())).toThrow());
  it("음수 사업소득은 오류가 아니다", () =>
    expect(calculate(-1_000_000, businessFixture()).topRange).toEqual([90, 100]));
  it("사업소득의 하한 포함·상한 제외를 적용한다", () => {
    expect(calculate(29_999_999, businessFixture()).topRange).toEqual([50, 90]);
    expect(calculate(30_000_000, businessFixture()).topRange).toEqual([5, 50]);
    expect(calculate(100_000_000, businessFixture()).topRange).toEqual([0, 5]);
  });
  it("사업소득 구간 밖은 계산 불가로 처리한다", () => {
    const fixture = businessFixture();
    fixture.bins[0].lowerWon = -10_000;
    expect(calculate(-10_001, fixture).type).toBe("unavailable");
  });
  it("사업소득 누적 범위도 단조성을 유지한다", () => {
    let last = 100;
    for (const amount of [-1000, 0, 1000, 29_999_999, 30_000_000, 99_999_999, 100_000_000]) {
      const value = calculate(amount, businessFixture()).topRange![1];
      expect(value).toBeLessThanOrEqual(last);
      last = value;
    }
  });
  it("목표 역산이 계산 모델과 일치한다", () => {
    for (const top of [1, 5, 10, 50])
      expect(
        calculate(targetIncome(top, workerFixture())!, workerFixture()).topPercent,
      ).toBeCloseTo(top, 5);
  });
  it("추정치의 소수점 표시와 범위 바깥쪽 반올림", () => {
    const result = calculate(50_000_000, workerFixture());
    expect(formatRank({ ...result, topPercent: 12.345 })).toBe("상위 약 12.3%");
    expect(formatRank({ ...result, topPercent: 0.04 })).toBe("상위 0.1% 이내 (추정)");
    expect(
      formatRank({ ...result, type: "range", topPercent: undefined, topRange: [12.34, 15.61] }),
    ).toBe("상위 12.3~15.7% 구간");
  });
  it("복수소득의 순위를 합산하지 않는다", () => {
    const result = calculateMixed(50_000_000, 30_000_000, workerFixture(), businessFixture());
    expect(result.referenceTotalWon).toBe(80_000_000);
    expect(result.combinedRank).toBeNull();
    expect(result.worker).toEqual(calculate(50_000_000, workerFixture()));
  });
  it("복수소득의 연도 정보를 각각 보존한다", () => {
    const b = businessFixture();
    b.metadata = { ...b.metadata, taxYear: 2023, filingYear: 2024 };
    const result = calculateMixed(1, 1, workerFixture(), b);
    expect(result.worker.metadata.taxYear).toBe(2024);
    expect(result.business.metadata.taxYear).toBe(2023);
    expect(result.combinedRank).toBeNull();
  });
  it.each([NaN, Infinity, 1.5, 1_000_000_000_001])("유효하지 않은 금액 %s 거부", (amount) =>
    expect(() => calculate(amount, workerFixture())).toThrow(),
  );
  it("실제 원본 미확보 상태는 숫자를 반환하지 않는다", () => {
    for (const data of [workerData, businessData]) {
      if (data.status === "unavailable") {
        const result = calculate(50_000_000, data);
        expect(result.type).toBe("unavailable");
        expect(result.topPercent).toBeUndefined();
        expect(result.topRange).toBeUndefined();
      }
      expect(data.metadata.title).not.toContain("SYNTHETIC");
    }
  });
});
describe("원본 검증 실패 차단", () => {
  it("최상위 평균 동률에서 구간을 임의로 좁히지 않는다", () => {
    const f = workerFixture();
    f.bins[1].salarySumWon = f.bins[0].salarySumWon;
    expect(calculate(110_000_000, f).topRange).toEqual([0, 0.2]);
  });
  it("지원하지 않는 목표 순위는 외삽하지 않는다", () => {
    for (const top of [NaN, Infinity, -1, 0.01, 101])
      expect(targetIncome(top, workerFixture())).toBeNull();
  });
  it("인원 합계 불일치", () => {
    const f = workerFixture();
    f.audit.totalPeople++;
    expect(() => validateDataset(f)).toThrow("인원 합계");
  });
  it("금액 합계 불일치", () => {
    const f = workerFixture();
    f.audit.totalSalaryWon++;
    expect(() => validateDataset(f)).toThrow("총급여 합계");
  });
  it("중복 백분위", () => {
    const f = workerFixture();
    f.bins[15] = f.bins[14];
    expect(() => validateDataset(f)).toThrow();
  });
  it("누락 백분위", () => {
    const f = workerFixture();
    f.bins.splice(15, 1);
    expect(() => validateDataset(f)).toThrow();
  });
  it("평균 단조성 위반", () => {
    const f = workerFixture();
    f.bins[50].salarySumWon = 1e16;
    expect(() => validateDataset(f)).toThrow("정렬");
  });
  it("사업소득 구간 중복·누락", () => {
    const f = businessFixture();
    f.bins[1].lowerWon = -1;
    expect(() => validateDataset(f)).toThrow("중복 또는 누락");
  });
  it("신고연도 오류", () => {
    const f = workerFixture();
    f.metadata.filingYear = 2020;
    expect(() => validateDataset(f)).toThrow("연도");
  });
  it("잘못된 단위·가상 데이터·집계단위 거부", () => {
    expect(() =>
      validateDataset({ ...workerFixture(), audit: { ...workerFixture().audit, unit: "MAN_KRW" } }),
    ).toThrow();
    expect(() =>
      validateDataset({ ...workerFixture(), audit: { ...workerFixture().audit, fixture: true } }),
    ).toThrow();
    expect(() =>
      validateDataset({
        ...businessFixture(),
        audit: { ...businessFixture().audit, countingUnit: "business-registration" },
      }),
    ).toThrow();
  });
});
