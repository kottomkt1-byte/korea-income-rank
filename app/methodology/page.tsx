import { Article } from "@/components/shell";
import { workerData, businessData } from "@/lib/statistics/data";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("데이터 출처와 계산 방법", "/methodology");
export default function Methodology() {
  return (
    <Article
      eyebrow="OUR METHODOLOGY"
      title="숫자에 앞서, 기준을 공개합니다."
      intro="공식값, 모델의 추정치, 구간 범위, 계산 불가를 구분합니다. 알 수 없는 순위를 그럴듯한 숫자로 채우지 않습니다."
    >
      <section>
        <h2>현재 데이터 상태</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>유형</th>
                <th>확보·검증 상태</th>
                <th>귀속 / 신고연도</th>
              </tr>
            </thead>
            <tbody>
              {[workerData, businessData].map((data) => (
                <tr key={data.kind}>
                  <td>{data.kind === "worker" ? "근로소득" : "사업소득"}</td>
                  <td>{data.status === "verified" ? "원본 검증 완료" : "공식 분포자료 확인 중"}</td>
                  <td>
                    {data.metadata.taxYear ?? "미확인"} / {data.metadata.filingYear ?? "미확인"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          확인일: 2026년 10월 17일.{" "}
          {workerData.status === "unavailable" &&
            "근로소득은 공식 페이지의 메타데이터만 확인했으며, 원본 CSV의 숫자는 아직 검증하지 못했습니다."}{" "}
          {businessData.status === "unavailable" &&
            "사업소득은 원본 통계표와 주석을 확보하지 못했습니다."}
        </p>
      </section>
      <section>
        <h2>01. 근로소득 — 총급여와 비교</h2>
        <p>
          <a href={workerData.metadata.sourceUrl} target="_blank" rel="noreferrer">
            {workerData.metadata.title} ↗
          </a>
        </p>
        <p>
          현재 자료의 기준은 {workerData.metadata.taxYear}년 귀속, {workerData.metadata.filingYear}
          년 신고이며 공개일은 {workerData.metadata.publishedAt ?? "확인 중"}입니다. 파일 이름에
          포함된 날짜를 귀속연도나 공개일로 해석하지 않습니다.
        </p>
        <p>
          공식 설명은 구분·인원(명)·총급여(억 원)·근로소득금액·소득공제금액·과세표준·결정세액을
          안내합니다. 순위 비교에는 총급여를 사용합니다. 이전 연도 파일은 금액 단위가 다를 수 있어
          새 파일마다 확인합니다.
        </p>
        <p>
          총 109개 구간으로, 상위 1% 안에서는 0.1%씩, 나머지는 1%씩 구분됩니다. 구간의 평균은 총급여
          합계 ÷ 인원으로 구할 수 있지만 해당 구간의 경계금액은 아닙니다.
        </p>
        <h3>모델의 가정</h3>
        <ol>
          <li>원본의 구간·인원·금액 단위와 합계를 검증합니다.</li>
          <li>구간 평균과 누적 인원 중간 순위를 대표점으로 연결합니다.</li>
          <li>대표점 사이에서 선형 보간하며 소득 증가에 따른 상위 비율의 단조성을 유지합니다.</li>
          <li>
            최상·최하위 대표점 밖으로 외삽하지 않습니다. 최상위는 상위 0.1% 이내, 최하위는 해당 구간
            범위로 표시합니다.
          </li>
        </ol>
        <p>
          구간 평균을 중간 순위의 소득으로 보는 것은 모델 가정입니다. 추정 중위값 및 상위 10%·5%·1%
          진입금액도 같은 가정에 따릅니다. 0.1% 단위 표시는 0.1%p 정확도를 보장하지 않습니다.
        </p>
        <p>
          해당 자료의 근로소득자를 비교하며 대한민국 전체 국민이나 정규직 12개월 근무자만의 순위가
          아닙니다. 월급 입력은 상여금이나 변동급여가 없다는 가정으로 12배 환산합니다.
        </p>
      </section>
      <section>
        <h2>02. 사업소득 — 매출과 구분</h2>
        <p>
          <a href="https://tasis.nts.go.kr/" target="_blank" rel="noreferrer">
            국세통계포털 TASIS ↗
          </a>
          의 3-2-5 소득금액 규모별·업태별 사업소득 신고 현황을 우선 검토합니다.
        </p>
        <p>
          원자료에서 소득금액 구간별 고유 신고인원을 확인해야 합니다. 업태별 숫자에 같은 사람이
          중복될 수 있으므로 업태 행을 단순 합산하지 않습니다. 사업소득 신고자와 종합소득 신고자,
          사업자등록 인원은 다릅니다. 프리랜서와 근로소득 병행자가 포함되는 범위도 주석으로
          확인합니다.
        </p>
        <p>
          구간은 하한 이상·상한 미만으로 정규화합니다. 해당 구간보다 높은 소득 구간의 인원 비율부터
          해당 구간 인원을 포함한 비율까지를 범위로 표시합니다. 범위를 좁혀 보이게 하지 않도록
          바깥쪽으로 반올림합니다. 구간 내부는 균등분포로 가정하지 않으며, 이 범위는 통계적
          신뢰구간이 아닙니다.
        </p>
        <p>
          음수도 유효한 입력입니다. 원자료의 해당 구간이 없으면 계산 불가로 표시합니다. 3-2-6은
          수입금액, 3-3-3과 3-3-4는 종합소득 통계이므로 사업소득금액 분포의 대용으로 쓰지 않습니다.
        </p>
      </section>
      <section>
        <h2>03. 복수소득 — 개별 순위만 제공</h2>
        <p>
          근로소득과 사업소득의 독립된 분포로는 두 소득을 가진 개인의 결합 분포를 복원할 수
          없습니다. 모집단 인원과 백분위를 합산하거나 평균하지 않습니다. 참고 합계는 세법상
          종합소득금액과 다를 수 있으며 어떤 백분위 엔진에도 전달하지 않습니다.
        </p>
        <p>
          같은 사람이 두 자료에 포함될 수 있습니다. 두 자료의 기준연도가 다르거나 미확인인 경우에도
          개별 출처를 표시하며 같은 연도 비교로 해석하지 않습니다.
        </p>
      </section>
      <section>
        <h2>검증과 업데이트</h2>
        <p>
          원본 파일 → 컬럼·인코딩·단위 확인 → 해시 기록 → 중복·누락·인원·금액 합계 검증 → 계산
          테스트 → 검토 후 배포의 순서로 반영합니다. 원본 수동 등록 절차와 CLI는 저장소의{" "}
          <a
            href="https://github.com/kottomkt1-byte/korea-income-rank/blob/main/docs/DATA_IMPORT.md"
            target="_blank"
            rel="noreferrer"
          >
            데이터 등록 가이드 ↗
          </a>
          에 공개합니다.
        </p>
        <p>
          근로소득의 포털 이용허락범위는 제한 없음으로 확인했습니다. 사업소득 원본의 이용조건은 확보
          시 별도로 확인합니다.
        </p>
      </section>
    </Article>
  );
}
