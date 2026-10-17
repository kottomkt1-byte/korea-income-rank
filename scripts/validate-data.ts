import { workerData, businessData } from "../lib/statistics/data";
for (const data of [workerData, businessData])
  console.log(`${data.kind}: ${data.status}, 귀속연도 ${data.metadata.taxYear ?? "미확인"}`);
console.log(
  "데이터 구조 검증 완료. unavailable은 원자료 미확보 상태이며 계산 성공을 의미하지 않습니다.",
);
