import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header, Footer } from "@/components/shell";
import { description, siteName, siteUrl } from "@/lib/site";
import { workerData } from "@/lib/statistics/data";
import "./globals.css";
const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "45 920",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl ?? "http://localhost:3000"),
  title: { default: siteName, template: "%s | 소득의 위치" },
  description,
  keywords: [
    "연봉 상위 몇 %",
    "내 연봉 순위",
    "연봉 백분위 계산기",
    "근로소득",
    "사업소득",
    "프리랜서 소득",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "소득의 위치",
    title: siteName,
    description,
  },
  twitter: { card: "summary_large_image", title: siteName, description },
  robots: { index: Boolean(siteUrl) && workerData.status === "verified", follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <a href="#main" className="skip-link">
          본문 바로가기
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
