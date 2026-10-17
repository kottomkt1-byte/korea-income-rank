import { ArrowUpRight, Check, Fingerprint, ScanLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Calculator } from "@/components/calculator/calculator";
import { FAQ } from "@/components/faq";
import { faqs } from "@/lib/faq";
import { pageMetadata, siteName } from "@/lib/site";
export const metadata = pageMetadata(siteName, "/");
export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <main id="main" className="container">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span /> KNOW YOUR POSITION, PLAN YOUR NEXT
          </p>
          <h1>
            내 소득,
            <br />
            대한민국 <span>상위 몇 %</span>일까?
          </h1>
          <p className="hero-description">
            직장인부터 사장님까지.
            <br className="mobile-br" /> 공식 통계로 살펴보는 나의 소득 위치.
          </p>
          <div className="hero-tags">
            <span>
              <Check size={13} /> 가입 없이
            </span>
            <span>
              <Check size={13} /> 금액 저장 없이
            </span>
            <span>
              <Check size={13} /> 같은 기준으로
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="orbit-dot" />
          <span className="percent-symbol">%</span>
          <span className="art-label">
            A NUMBER.
            <br />A NEW PERSPECTIVE.
          </span>
          <span className="art-cross">+</span>
        </div>
      </section>
      <Calculator />
      <section className="trust-grid" aria-label="서비스 원칙">
        <div>
          <ShieldCheck size={22} />
          <h3>공식 통계, 투명한 출처</h3>
          <p>국세청 자료의 기준연도와 모집단을 확인하고, 검증한 데이터만 사용합니다.</p>
        </div>
        <div>
          <ScanLine size={22} />
          <h3>추정은 추정이라고</h3>
          <p>숫자를 세밀하게 표시하는 것과 정확하게 아는 것은 다릅니다. 한계도 함께 보여드려요.</p>
        </div>
        <div>
          <Fingerprint size={22} />
          <h3>내 소득은 나만 알도록</h3>
          <p>입력 금액은 서버에 전송하지 않습니다. 결과를 공유할 때도 금액은 기본 비공개예요.</p>
        </div>
      </section>
      <section className="data-banner">
        <div>
          <span className="section-kicker">TRANSPARENCY FIRST</span>
          <h2>이 숫자는 어디에서 왔을까요?</h2>
          <p>어떤 자료를 사용하고, 어디까지 알 수 있는지 확인하세요.</p>
        </div>
        <Link href="/methodology">
          데이터와 계산 방법 <ArrowUpRight size={19} />
        </Link>
      </section>
      <FAQ />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}
