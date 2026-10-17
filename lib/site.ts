export const siteName = "내 소득은 대한민국 상위 몇 %일까?";
const configured = process.env.NEXT_PUBLIC_SITE_URL;
export const siteUrl =
  configured && /^https?:\/\//.test(configured) ? new URL(configured).origin : null;
export const description =
  "직장인부터 개인사업자·프리랜서까지. 공식 통계의 기준과 한계를 확인하며 나의 소득 위치를 살펴보세요.";
export function pageMetadata(title: string, path: string, text = description) {
  return {
    title,
    description: text,
    alternates: siteUrl ? { canonical: `${siteUrl}${path}` } : undefined,
    openGraph: { title, description: text, url: siteUrl ? `${siteUrl}${path}` : undefined },
  };
}
