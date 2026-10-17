"use client";
import { useState } from "react";
import { Copy, Download, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { makeShareCard, shareLines, shareUrl } from "@/lib/share";
import type { Result } from "@/lib/statistics/engine";

type KakaoSDK = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: { sendDefault: (payload: Record<string, unknown>) => void };
};
declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}
let kakaoLoading: Promise<void> | undefined;
async function loadKakao() {
  if (window.Kakao) return;
  kakaoLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      kakaoLoading = undefined;
      reject(new Error("카카오 SDK를 불러오지 못했습니다. 링크 복사를 이용해 주세요."));
    };
    document.head.appendChild(script);
  });
  await kakaoLoading;
}
export function SharePanel({ results }: { results: Result[] }) {
  const [disclose, setDisclose] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [manualLink, setManualLink] = useState("");
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  const url = () => shareUrl(window.location.origin);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setNotice("링크를 복사했어요. 소득금액은 포함되지 않습니다.");
    } catch {
      setManualLink(url());
      setNotice("아래 링크를 선택해 복사해 주세요.");
    }
  }
  async function save(ratio: "square" | "story") {
    setBusy(true);
    setNotice("");
    try {
      const blob = await makeShareCard(results, ratio, disclose);
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `income-atlas-${ratio}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(href), 5000);
      setNotice(`${ratio === "square" ? "정사각형" : "세로형"} PNG를 저장했어요.`);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function nativeShare() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: "소득의 위치",
        text: shareLines(results, disclose).join("\n"),
        url: url(),
      });
      setNotice("공유를 완료했어요.");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setNotice("공유하지 못했어요. 링크 복사를 이용해 주세요.");
      }
    }
  }
  async function kakao() {
    if (!kakaoKey) {
      await copy();
      return;
    }
    try {
      await loadKakao();
      if (!window.Kakao) throw new Error("카카오톡 공유를 준비하지 못했습니다.");
      if (!window.Kakao.isInitialized()) window.Kakao.init(kakaoKey);
      window.Kakao.Share.sendDefault({
        objectType: "text",
        text: `소득의 위치\n${shareLines(results, disclose).join("\n")}\n당신의 소득은 어디쯤인가요?`,
        link: { mobileWebUrl: url(), webUrl: url() },
      });
    } catch (error) {
      setNotice(`${(error as Error).message} 링크 복사로도 공유할 수 있습니다.`);
    }
  }
  return (
    <section className="share-panel" aria-labelledby="share-title">
      <div>
        <p className="section-kicker">함께 이야기해 볼까요?</p>
        <h3 id="share-title">결과를 나만의 카드로.</h3>
        <p>기본 공유에는 소득금액이 포함되지 않아요.</p>
      </div>
      <label className="disclose-control">
        <input type="checkbox" checked={disclose} onChange={(e) => setDisclose(e.target.checked)} />{" "}
        공유 카드·문구에 내 소득금액 공개
      </label>
      <div className="share-buttons">
        <Button variant="outline" onClick={() => save("square")} disabled={busy}>
          <Download size={16} /> PNG 저장 · 1:1
        </Button>
        <Button variant="outline" onClick={() => save("story")} disabled={busy}>
          <Download size={16} /> PNG 저장 · 9:16
        </Button>
        <Button variant="outline" onClick={nativeShare}>
          <Share2 size={16} /> 공유하기
        </Button>
        <Button variant="outline" onClick={copy}>
          <Copy size={16} /> 링크 복사
        </Button>
        <Button variant="outline" onClick={kakao}>
          <MessageCircle size={16} />
          {kakaoKey ? "카카오톡 공유" : "카카오톡용 링크 복사"}
        </Button>
      </div>
      <p role="status" className="share-status">
        {notice}
      </p>
      {manualLink && (
        <input
          className="manual-link"
          aria-label="공유 링크 직접 복사"
          readOnly
          value={manualLink}
          onFocus={(e) => e.target.select()}
        />
      )}
    </section>
  );
}
