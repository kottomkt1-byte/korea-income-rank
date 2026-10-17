import { z } from "zod";
import { metadataSchema, validateDataset, type Dataset } from "../../lib/statistics/schema";

export const manifestSchema = z.object({
  kind: z.enum(["worker", "business"]),
  metadata: metadataSchema,
  sourceReviewed: z.literal(true),
  populationReviewed: z.literal(true),
  sourceUnit: z.enum(["KRW", "MAN_KRW", "MILLION_KRW", "EOK_KRW"]),
  expectedTotalPeople: z.number().int().positive(),
  expectedTotalSalaryInSourceUnit: z.number().positive().optional(),
  sumToleranceInSourceUnit: z.number().min(0).max(55).default(0),
  columns: z.object({
    people: z.string(),
    rank: z.string().optional(),
    salary: z.string().optional(),
    lower: z.string().optional(),
    upper: z.string().optional(),
    taxYear: z.string().optional(),
  }),
  rankFormat: z.enum(["cumulative-endpoint", "range"]).optional(),
  countingUnit: z.literal("unique-person").optional(),
  includesMixedEarners: z.enum(["yes", "no", "unknown"]).optional(),
  sheet: z.string().optional(),
  filter: z.object({ column: z.string(), equals: z.string() }).optional(),
});
export type ImportManifest = z.infer<typeof manifestSchema>;
export function numeric(value: unknown): number {
  const text = String(value ?? "")
    .trim()
    .replaceAll(",", "");
  if (!/^-?\d+(\.\d+)?$/.test(text))
    throw new Error(`숫자 누락·비공개·형식 오류: ${String(value)}`);
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error("유한한 숫자가 아닙니다.");
  return number;
}
export function normalize(
  rows: Record<string, unknown>[],
  manifestInput: unknown,
  hash: string,
): Dataset {
  const m = manifestSchema.parse(manifestInput);
  const factor = { KRW: 1, MAN_KRW: 10_000, MILLION_KRW: 1_000_000, EOK_KRW: 100_000_000 }[
    m.sourceUnit
  ];
  const filtered = m.filter
    ? rows.filter((row) => String(row[m.filter!.column]).trim() === m.filter!.equals)
    : rows;
  if (!filtered.length) throw new Error("선택된 데이터 행이 없습니다.");
  const get = (row: Record<string, unknown>, key: string | undefined) => {
    if (!key || !(key in row)) throw new Error(`컬럼을 찾을 수 없습니다: ${key}`);
    return row[key];
  };
  if (
    m.columns.taxYear &&
    filtered.some((row) => numeric(get(row, m.columns.taxYear)) !== m.metadata.taxYear)
  )
    throw new Error("원본과 메타데이터 귀속연도 불일치");
  const audit = {
    rawSha256: hash,
    importedAt: new Date().toISOString(),
    totalPeople: m.expectedTotalPeople,
    sourceReviewed: m.sourceReviewed,
    populationReviewed: m.populationReviewed,
    unit: "KRW",
    fixture: false,
  };
  if (m.kind === "worker") {
    if (!m.rankFormat || !m.expectedTotalSalaryInSourceUnit)
      throw new Error("백분위 표기 방식과 총급여 합계를 확인해야 합니다.");
    const parsed = filtered
      .map((row) => {
        const rankText = String(get(row, m.columns.rank)).replace(/\s/g, "");
        if (/합계|소계|전체|계$/.test(rankText))
          throw new Error("합계·소계 행을 제외한 비중복 구간만 사용하세요.");
        const numbers = rankText.match(/\d+(?:\.\d+)?/g)?.map(Number);
        if (!numbers || numbers.length !== (m.rankFormat === "range" ? 2 : 1))
          throw new Error(`백분위 라벨 확인 필요: ${rankText}`);
        return {
          topTo: numbers.at(-1)!,
          explicitFrom: m.rankFormat === "range" ? numbers[0] : undefined,
          people: numeric(get(row, m.columns.people)),
          salarySumWon: numeric(get(row, m.columns.salary)) * factor,
        };
      })
      .sort((a, b) => a.topTo - b.topTo);
    const bins = parsed.map((bin, index) => ({
      topFrom: bin.explicitFrom ?? (index === 0 ? 0 : parsed[index - 1].topTo),
      topTo: bin.topTo,
      people: bin.people,
      salarySumWon: bin.salarySumWon,
    }));
    return validateDataset({
      kind: m.kind,
      status: "verified",
      metadata: m.metadata,
      audit: {
        ...audit,
        totalSalaryWon: m.expectedTotalSalaryInSourceUnit * factor,
        sumToleranceWon: m.sumToleranceInSourceUnit * factor,
      },
      bins,
    });
  }
  if (!m.countingUnit || !m.includesMixedEarners)
    throw new Error("신고인원 집계 단위와 근로소득 병행자 포함 여부를 기록하세요.");
  const boundary = (value: unknown) =>
    String(value).trim() === "OPEN" ? null : numeric(value) * factor;
  const bins = filtered
    .map((row) => ({
      lowerWon: boundary(get(row, m.columns.lower)),
      upperWon: boundary(get(row, m.columns.upper)),
      people: numeric(get(row, m.columns.people)),
    }))
    .sort((a, b) => (a.lowerWon ?? -Infinity) - (b.lowerWon ?? -Infinity));
  return validateDataset({
    kind: m.kind,
    status: "verified",
    metadata: m.metadata,
    audit: { ...audit, countingUnit: m.countingUnit, includesMixedEarners: m.includesMixedEarners },
    bins,
  });
}
