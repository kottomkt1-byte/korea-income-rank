import workerRaw from "@/data/processed/worker.json";
import businessRaw from "@/data/processed/business.json";
import { validateDataset } from "./schema";
// Invalid or synthetic production data fails the build rather than silently producing ranks.
export const workerData = validateDataset(workerRaw);
export const businessData = validateDataset(businessRaw);
if (workerData.kind !== "worker" || businessData.kind !== "business")
  throw new Error("데이터 파일의 소득유형이 다릅니다.");
for (const dataset of [workerData, businessData]) {
  if (/synthetic|test fixture/i.test(dataset.metadata.title))
    throw new Error("테스트 데이터를 서비스에 사용할 수 없습니다.");
}
