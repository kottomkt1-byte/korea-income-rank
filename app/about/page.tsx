import { Article } from "@/components/shell";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("서비스 소개", "/about");
export default function About() {
  return (
    <Article
      eyebrow="A NUMBER. A NEW PERSPECTIVE."
      title="비교를 넘어, 나의 다음으로."
      intro="소득의 위치는 공식 통계를 이해하기 쉬운 언어로 전달하고, 다음 계획을 세우는 데 도움을 주기 위해 만들었습니다."
    >
      <section>
        <h2>한 사람을 숫자로 평가하지 않습니다</h2>
        <p>
          일한 기간, 근로시간, 삶의 선택에 따라 소득은 달라집니다. 높은 소득이 성공을 보증하거나
          낮은 소득이 가치를 정하지 않습니다. 이 서비스는 같은 소득 정의와 모집단 안에서 통계상
          위치를 참고하는 도구입니다.
        </p>
        <h2>알 수 있는 것과 없는 것을 구분합니다</h2>
        <p>
          국세청의 구간 통계는 개인의 정확한 순위를 직접 제공하지 않습니다. 공식 집계, 추정값, 구간
          범위를 구분하고 필요한 자료가 없을 때는 계산 불가 상태를 표시합니다. 원본 수치가 검증되지
          않은 현재 유형은 순위를 제공하지 않습니다.
        </p>
        <h2>독립적인 서비스</h2>
        <p>
          국세청 또는 정부기관이 운영하거나 보증하는 서비스가 아닙니다. 세무 신고, 대출 심사, 자격
          판단을 위한 증명으로 사용할 수 없으며 실제 신고 소득은 공식 서류에서 확인해야 합니다. 소스
          코드와 계산 방법은{" "}
          <a
            href="https://github.com/kottomkt1-byte/korea-income-rank"
            target="_blank"
            rel="noreferrer"
          >
            GitHub 저장소 ↗
          </a>
          에 공개합니다.
        </p>
      </section>
    </Article>
  );
}
