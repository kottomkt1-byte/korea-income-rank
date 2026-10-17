import { describe, it, expect } from "vitest";
import { parseMoney } from "../lib/money";
import { shareLines, shareUrl } from "../lib/share";
import { calculate } from "../lib/statistics/engine";
import { workerFixture } from "./fixtures/datasets";
describe("입력과 개인정보", () => {
  it("만원·원 단위 정밀 입력", () => {
    expect(parseMoney("5,000.0001", "man")).toBe(50_000_001);
    expect(parseMoney("50,000,001", "won")).toBe(50_000_001);
  });
  it("사업소득 음수 지원", () => expect(parseMoney("-100", "man", true)).toBe(-1_000_000));
  it.each(["", "abc", "1,00", "1e8", "12원", "1.00001", "--1"])("잘못된 입력 %s", (value) =>
    expect(() => parseMoney(value, "man")).toThrow(),
  );
  it("원 단위 소수점 거부", () => expect(() => parseMoney("0.1", "won")).toThrow());
  it("음수 근로소득·너무 큰 금액 거부", () => {
    expect(() => parseMoney("-1", "man")).toThrow();
    expect(() => parseMoney("100000001", "man")).toThrow();
  });
  it("공유 링크에서 경로·query·hash 제거", () =>
    expect(shareUrl("https://example.com/path?salary=50000000#secret")).toBe(
      "https://example.com/",
    ));
  it("기본 공유 문구에 소득금액 없음", () => {
    const result = calculate(50_000_000, workerFixture());
    expect(shareLines([result]).join()).not.toMatch(/5,000|50000000/);
    expect(shareLines([result], true).join()).toContain("5,000만 원");
  });
});
