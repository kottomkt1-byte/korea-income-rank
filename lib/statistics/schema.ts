import { z } from "zod";

const year = z.number().int().min(2000).max(2100);
const officialUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    [
      "data.go.kr",
      "www.data.go.kr",
      "nts.go.kr",
      "www.nts.go.kr",
      "tasis.nts.go.kr",
      "kosis.kr",
    ].includes(url.hostname)
  );
}, "공식 기관 HTTPS 출처가 필요합니다.");

export const metadataSchema = z.object({
  title: z.string().min(1),
  sourceUrl: officialUrl,
  taxYear: year.nullable(),
  filingYear: year.nullable(),
  publishedAt: z.string().nullable(),
  checkedAt: z.string(),
  population: z.string().min(1),
  incomeDefinition: z.string().min(1),
  license: z.string().min(1),
  notes: z.array(z.string()),
});
export type Metadata = z.infer<typeof metadataSchema>;

const auditSchema = z.object({
  rawSha256: z.string().regex(/^[a-f0-9]{64}$/),
  importedAt: z.string(),
  totalPeople: z.number().int().positive(),
  sourceReviewed: z.literal(true),
  populationReviewed: z.literal(true),
  unit: z.literal("KRW"),
  fixture: z.literal(false),
});
export const workerBinSchema = z.object({
  topFrom: z.number().min(0).max(100),
  topTo: z.number().positive().max(100),
  people: z.number().int().positive(),
  salarySumWon: z.number().finite().nonnegative(),
});
export const businessBinSchema = z.object({
  lowerWon: z.number().finite().nullable(),
  upperWon: z.number().finite().nullable(),
  people: z.number().int().nonnegative(),
});
const unavailableSchema = z.object({
  kind: z.enum(["worker", "business"]),
  status: z.literal("unavailable"),
  metadata: metadataSchema,
  reason: z.string().min(1),
});
const workerSchema = z.object({
  kind: z.literal("worker"),
  status: z.literal("verified"),
  metadata: metadataSchema,
  audit: auditSchema.extend({
    totalSalaryWon: z.number().positive(),
    sumToleranceWon: z.number().nonnegative(),
  }),
  bins: z.array(workerBinSchema).length(109),
});
const businessSchema = z.object({
  kind: z.literal("business"),
  status: z.literal("verified"),
  metadata: metadataSchema,
  audit: auditSchema.extend({
    countingUnit: z.literal("unique-person"),
    includesMixedEarners: z.enum(["yes", "no", "unknown"]),
  }),
  bins: z.array(businessBinSchema).min(2),
});
export const datasetSchema = z.union([unavailableSchema, workerSchema, businessSchema]);
export type Dataset = z.infer<typeof datasetSchema>;
export type WorkerDataset = z.infer<typeof workerSchema>;
export type BusinessDataset = z.infer<typeof businessSchema>;

export function validateDataset(input: unknown): Dataset {
  const data = datasetSchema.parse(input);
  if (data.status === "unavailable") return data;
  const fail = (message: string): never => {
    throw new Error(message);
  };
  if (
    !data.metadata.taxYear ||
    !data.metadata.filingYear ||
    data.metadata.filingYear < data.metadata.taxYear
  )
    fail("귀속·신고연도 불일치");
  const total = data.bins.reduce((sum, bin) => sum + bin.people, 0);
  if (total !== data.audit.totalPeople) fail("인원 합계 불일치");
  if (data.kind === "worker") {
    let previousEnd = 0;
    let previousMean = Infinity;
    for (const bin of data.bins) {
      if (Math.abs(bin.topFrom - previousEnd) > 1e-7 || bin.topTo <= bin.topFrom)
        fail("백분위 구간 중복 또는 누락");
      const expectedWidth = bin.topFrom < 0.99999 ? 0.1 : 1;
      if (Math.abs(bin.topTo - bin.topFrom - expectedWidth) > 1e-7)
        fail("공식 109개 구간 구조 불일치");
      if (Math.abs(bin.people - (total * expectedWidth) / 100) > 3)
        fail("백분위별 인원 비중 불일치");
      const mean = bin.salarySumWon / bin.people;
      if (mean > previousMean) fail("총급여 구간 평균 정렬 오류");
      previousMean = mean;
      previousEnd = bin.topTo;
    }
    if (Math.abs(previousEnd - 100) > 1e-7) fail("백분위 전체 구간 미포함");
    const sum = data.bins.reduce((acc, bin) => acc + bin.salarySumWon, 0);
    if (Math.abs(sum - data.audit.totalSalaryWon) > data.audit.sumToleranceWon)
      fail("총급여 합계 불일치");
  } else {
    data.bins.forEach((bin, index) => {
      if (bin.lowerWon === null && index !== 0) fail("하한 없는 구간 위치 오류");
      if (bin.upperWon === null && index !== data.bins.length - 1) fail("상한 없는 구간 위치 오류");
      if (bin.lowerWon !== null && bin.upperWon !== null && bin.lowerWon >= bin.upperWon)
        fail("사업소득 구간 역전");
      if (index > 0 && bin.lowerWon !== data.bins[index - 1].upperWon)
        fail("사업소득 구간 중복 또는 누락");
    });
  }
  return data;
}
