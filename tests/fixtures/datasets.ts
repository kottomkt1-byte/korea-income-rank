// SYNTHETIC TEST FIXTURE — invented distributions, never import into app/ or components/.
import type { WorkerDataset, BusinessDataset } from "../../lib/statistics/schema";
export const fixtureNotice = "SYNTHETIC TEST FIXTURE";
const metadata = {
  title: fixtureNotice,
  sourceUrl: "https://www.data.go.kr/data/15082063/fileData.do",
  taxYear: 2024,
  filingYear: 2025,
  publishedAt: "2026-02-24",
  checkedAt: "2026-10-17",
  population: fixtureNotice,
  incomeDefinition: "테스트 소득",
  license: "TEST ONLY",
  notes: [fixtureNotice],
};
export function workerFixture(): WorkerDataset {
  const bins = Array.from({ length: 109 }, (_, i) => {
    const topFrom = i < 10 ? i / 10 : i - 9;
    const topTo = i < 10 ? (i + 1) / 10 : i - 8;
    const people = i < 10 ? 100 : 1000;
    return { topFrom, topTo, people, salarySumWon: people * (110 - i) * 1_000_000 };
  });
  return {
    kind: "worker",
    status: "verified",
    metadata: { ...metadata, notes: [...metadata.notes] },
    audit: {
      rawSha256: "0".repeat(64),
      importedAt: "2026-10-17",
      totalPeople: 100_000,
      totalSalaryWon: bins.reduce((s, b) => s + b.salarySumWon, 0),
      sumToleranceWon: 0,
      sourceReviewed: true,
      populationReviewed: true,
      unit: "KRW",
      fixture: false,
    },
    bins,
  };
}
export function businessFixture(): BusinessDataset {
  return {
    kind: "business",
    status: "verified",
    metadata: { ...metadata, incomeDefinition: "테스트 사업소득" },
    audit: {
      rawSha256: "0".repeat(64),
      importedAt: "2026-10-17",
      totalPeople: 100,
      sourceReviewed: true,
      populationReviewed: true,
      unit: "KRW",
      fixture: false,
      countingUnit: "unique-person",
      includesMixedEarners: "unknown",
    },
    bins: [
      { lowerWon: null, upperWon: 0, people: 10 },
      { lowerWon: 0, upperWon: 30_000_000, people: 40 },
      { lowerWon: 30_000_000, upperWon: 100_000_000, people: 45 },
      { lowerWon: 100_000_000, upperWon: null, people: 5 },
    ],
  };
}
