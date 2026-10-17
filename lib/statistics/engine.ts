import type { Dataset, Metadata, WorkerDataset } from "./schema";

export type IncomeKind = "worker" | "business";
export type Result = {
  kind: IncomeKind;
  amountWon: number;
  metadata: Metadata;
  type: "estimate" | "range" | "unavailable";
  topPercent?: number;
  topRange?: [number, number];
  method: string;
  limitations: string[];
};

export const MAX_INCOME = 1_000_000_000_000;

export function workerPoints(data: WorkerDataset) {
  let higherPeople = 0;
  return data.bins
    .map((bin) => {
      const top = ((higherPeople + bin.people / 2) / data.audit.totalPeople) * 100;
      higherPeople += bin.people;
      return { amount: bin.salarySumWon / bin.people, top, from: bin.topFrom, to: bin.topTo };
    })
    .reverse();
}

export function calculate(amountWon: number, data: Dataset): Result {
  if (!Number.isSafeInteger(amountWon) || Math.abs(amountWon) > MAX_INCOME)
    throw new Error("금액은 원 단위 정수, 절댓값 1조 원 이하여야 합니다.");
  if (data.kind === "worker" && amountWon < 0)
    throw new Error("근로소득 총급여는 0원 이상이어야 합니다.");
  const base = { kind: data.kind, amountWon, metadata: data.metadata };
  if (data.status === "unavailable")
    return {
      ...base,
      type: "unavailable",
      method: "공식 분포자료 확인 중",
      limitations: [data.reason],
    };
  if (data.kind === "business") {
    const index = data.bins.findIndex(
      (b) =>
        (b.lowerWon === null || amountWon >= b.lowerWon) &&
        (b.upperWon === null || amountWon < b.upperWon),
    );
    if (index < 0)
      return {
        ...base,
        type: "unavailable",
        method: "원자료 범위 밖",
        limitations: ["이 금액에 해당하는 공식 구간이 확인되지 않았습니다."],
      };
    const higher = data.bins.slice(index + 1).reduce((sum, bin) => sum + bin.people, 0);
    return {
      ...base,
      type: "range",
      topRange: [
        (higher / data.audit.totalPeople) * 100,
        ((higher + data.bins[index].people) / data.audit.totalPeople) * 100,
      ],
      method: "소득금액 구간별 누적인원 범위",
      limitations: [
        "구간 내부의 분포와 동점자 수를 알 수 없어 순위 범위로 표시합니다. 통계적 신뢰구간이 아닙니다.",
        ...data.metadata.notes,
      ],
    };
  }
  const points = workerPoints(data);
  const first = points[0],
    last = points[points.length - 1];
  const limitations = [
    "구간 평균을 중간 순위의 대표값으로 가정한 보간 추정치입니다. 실제 커트라인이 아니며 0.1%p 정확도를 뜻하지 않습니다.",
    ...data.metadata.notes,
  ];
  // Handle ties before the tails: an equal top-bin mean is not a unique top-0.1% rank.
  const equal = points.filter((p) => p.amount === amountWon);
  if (equal.length > 1)
    return {
      ...base,
      type: "range",
      topRange: [Math.min(...equal.map((p) => p.from)), Math.max(...equal.map((p) => p.to))],
      method: "동일 평균 구간의 순위 범위",
      limitations,
    };
  if (amountWon >= last.amount)
    return {
      ...base,
      type: "range",
      topRange: [0, last.to],
      method: "최상위 구간 · 세부 순위 미제공",
      limitations,
    };
  if (amountWon <= first.amount)
    return {
      ...base,
      type: "range",
      topRange: [first.from, 100],
      method: "최하위 구간 · 외삽하지 않음",
      limitations,
    };
  const index = points.findIndex((p) => p.amount >= amountWon);
  const low = points[index - 1],
    high = points[index];
  const weight = (amountWon - low.amount) / (high.amount - low.amount);
  return {
    ...base,
    type: "estimate",
    topPercent: Math.max(0.1, low.top + weight * (high.top - low.top)),
    method: "구간 평균·인원 중간 순위의 선형 보간",
    limitations,
  };
}

export function targetIncome(topPercent: number, data: Dataset): number | null {
  if (!Number.isFinite(topPercent) || topPercent < 0.1 || topPercent > 100) return null;
  if (data.status !== "verified" || data.kind !== "worker") return null;
  const points = workerPoints(data).reverse();
  if (topPercent < points[0].top || topPercent > points.at(-1)!.top) return null;
  const index = points.findIndex((p) => p.top >= topPercent);
  if (index === 0) return points[0].amount;
  const a = points[index - 1],
    b = points[index];
  return Math.round(a.amount + ((b.amount - a.amount) * (topPercent - a.top)) / (b.top - a.top));
}

export function calculateMixed(
  worker: number,
  business: number,
  workerData: Dataset,
  businessData: Dataset,
) {
  if (workerData.kind !== "worker" || businessData.kind !== "business")
    throw new Error("소득유형이 맞지 않습니다.");
  return {
    worker: calculate(worker, workerData),
    business: calculate(business, businessData),
    referenceTotalWon: worker + business,
    combinedRank: null,
    notice:
      "근로소득과 사업소득을 합친 전국 상위 순위는 현재 확보된 공개 통계만으로 정확하게 계산할 수 없습니다. 두 소득의 개별 순위를 보여드립니다.",
  } as const;
}

export function formatRank(result: Result): string {
  if (result.type === "unavailable") return "공식 분포자료 확인 중";
  if (result.topPercent !== undefined)
    return result.topPercent <= 0.1
      ? "상위 0.1% 이내 (추정)"
      : `상위 약 ${Math.max(0.1, result.topPercent).toFixed(1)}%`;
  if (result.topRange) {
    const [from, to] = result.topRange;
    if (from === 0) return `상위 ${Math.max(0.1, Math.ceil(to * 10) / 10).toFixed(1)}% 이내`;
    // Outward rounding preserves coverage; no false zero percent at the upper tail.
    return `상위 ${(Math.floor(from * 10) / 10).toFixed(1)}~${(Math.ceil(to * 10) / 10).toFixed(1)}% 구간`;
  }
  return "계산 불가";
}
