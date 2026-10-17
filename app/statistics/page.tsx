import { Article } from "@/components/shell";
import { workerData, businessData } from "@/lib/statistics/data";
import { targetIncome } from "@/lib/statistics/engine";
import { compactWon } from "@/lib/money";
import { IncomeChart } from "@/components/charts/income-chart";
import { AdSlot } from "@/components/ad-slot";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("공식 소득 통계", "/statistics");
export default function Statistics() {
  return (
    <Article
      eyebrow="THE DATA, IN CONTEXT"
      title="숫자를 이해하는 출발점."
      intro="근로소득과 사업소득은 별개의 통계입니다. 정의가 다른 수치를 한 표의 순위로 섞지 않습니다."
    >
      <section>
        <h2>근로소득 통계</h2>
        <p>
          {workerData.metadata.taxYear}년 귀속 · {workerData.metadata.filingYear}년 신고 · 총급여
          기준
        </p>
        {workerData.status === "verified" && workerData.kind === "worker" ? (
          <>
            <div className="stat-cards">
              <div>
                <span>공식 집계 인원</span>
                <strong>{workerData.audit.totalPeople.toLocaleString()}명</strong>
              </div>
              <div>
                <span>공식 합계 기반 평균</span>
                <strong>
                  {compactWon(
                    workerData.bins.reduce((s, b) => s + b.salarySumWon, 0) /
                      workerData.audit.totalPeople,
                  )}
                </strong>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>목표 상위 비율</th>
                  <th>추정 진입금액 · 실제 경계 아님</th>
                </tr>
              </thead>
              <tbody>
                {[50, 10, 5, 1].map((top) => (
                  <tr key={top}>
                    <td>{top}%</td>
                    <td>
                      {targetIncome(top, workerData) === null
                        ? "계산 불가"
                        : compactWon(targetIncome(top, workerData)!)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <IncomeChart data={workerData} />
          </>
        ) : (
          <div className="empty-data">
            <span className="status-dot" />
            <h3>공식 분포자료 확인 중</h3>
            <p>
              평균·중위값·상위 비율은 원본 수치 검증 후 표시합니다. 확인된 공식 페이지는 109개
              구간을 안내하지만, 실제 분포 그래프를 그리는 데 필요한 수치는 아직 확보하지
              못했습니다.
            </p>
          </div>
        )}
        <p>
          <a href={workerData.metadata.sourceUrl} target="_blank" rel="noreferrer">
            국세청 공식 원본 페이지 ↗
          </a>
        </p>
      </section>
      <section>
        <h2>사업소득 통계</h2>
        <p>총수입금액에서 필요경비 등을 차감한 사업소득금액 기준</p>
        {businessData.status === "verified" && businessData.kind === "business" ? (
          <>
            <p>
              {businessData.metadata.taxYear}년 귀속 · {businessData.metadata.population} ·{" "}
              {businessData.audit.totalPeople.toLocaleString()}명
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>소득금액 구간 (하한 이상·상한 미만)</th>
                    <th>인원</th>
                  </tr>
                </thead>
                <tbody>
                  {businessData.bins.map((b, i) => (
                    <tr key={i}>
                      <td>
                        {b.lowerWon === null ? "하한 없음" : compactWon(b.lowerWon)} ~{" "}
                        {b.upperWon === null ? "상한 없음" : compactWon(b.upperWon)}
                      </td>
                      <td>{b.people.toLocaleString()}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-data">
            <span className="status-dot" />
            <h3>공식 분포자료 확인 중</h3>
            <p>
              소득금액 규모별 통계와 모집단 주석을 검증한 뒤 제공됩니다. 종합소득이나 매출 통계로
              사업소득 순위를 대신 계산하지 않습니다.
            </p>
          </div>
        )}
        <p>
          <a href={businessData.metadata.sourceUrl} target="_blank" rel="noreferrer">
            국세통계포털 TASIS ↗
          </a>
        </p>
      </section>
      <AdSlot placement="statistics" />
    </Article>
  );
}
