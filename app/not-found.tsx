import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container article">
      <p className="eyebrow">404</p>
      <h1>페이지를 찾을 수 없어요.</h1>
      <p>주소를 확인하거나 계산기로 돌아가 주세요.</p>
      <Link className="button button-primary" href="/">
        계산기로 돌아가기
      </Link>
    </main>
  );
}
