import Link from "next/link";
import { ArrowUpRight, ChartNoAxesColumnIncreasing } from "lucide-react";
export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="소득의 위치 홈">
          <span className="brand-mark">
            <ChartNoAxesColumnIncreasing size={22} strokeWidth={2.6} />
          </span>
          소득의 위치<span className="brand-en">INCOME ATLAS</span>
        </Link>
        <nav aria-label="주 메뉴">
          <Link href="/statistics">소득 통계</Link>
          <Link href="/methodology">
            데이터와 기준 <ArrowUpRight size={14} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="container footer">
      <div>
        <Link href="/" className="footer-brand">
          소득의 위치<span>INCOME ATLAS</span>
        </Link>
        <p>숫자로 이해하는 나의 소득, 그 이상의 나의 가치.</p>
        <small>국세청과 무관한 독립 서비스입니다.</small>
      </div>
      <nav aria-label="하단 메뉴">
        <Link href="/about">서비스 소개</Link>
        <Link href="/methodology">계산 방법</Link>
        <Link href="/privacy">개인정보 처리</Link>
        <a
          href="https://github.com/kottomkt1-byte/korea-income-rank"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ArrowUpRight size={13} />
        </a>
      </nav>
    </footer>
  );
}
export function Article({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="container article">
      <Link href="/" className="back-link">
        ← 계산기로 돌아가기
      </Link>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="article-intro">{intro}</p>
      <div className="article-body">{children}</div>
    </main>
  );
}
