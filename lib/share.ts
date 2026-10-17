import { formatRank, type Result } from "./statistics/engine";
import { compactWon } from "./money";
export function shareUrl(origin: string) {
  return `${new URL(origin).origin}/`;
}
export function shareLines(results: Result[], disclose = false) {
  return results.map(
    (result) =>
      `${result.kind === "worker" ? "근로소득" : "사업소득"}: ${formatRank(result)}${disclose ? ` · ${compactWon(result.amountWon)}` : ""}`,
  );
}
export async function makeShareCard(
  results: Result[],
  ratio: "square" | "story",
  disclose: boolean,
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = ratio === "square" ? 1080 : 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 생성을 지원하지 않는 브라우저입니다.");
  const h = canvas.height;
  ctx.fillStyle = "#101712";
  ctx.fillRect(0, 0, 1080, h);
  ctx.strokeStyle = "#33432a";
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, 984, h - 96);
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    color = "#f2f6ec",
    weight = 650,
  ) => {
    ctx.font = `${weight} ${size}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillStyle = color;
    while (ctx.measureText(value).width > 900 && size > 20) {
      size -= 1;
      ctx.font = `${weight} ${size}px ${getComputedStyle(document.body).fontFamily}`;
    }
    ctx.fillText(value, x, y);
  };
  text("소득의 위치  /  INCOME ATLAS", 90, 145, 30, "#c7f66b");
  const start = ratio === "story" ? 460 : 325;
  text("숫자로 살펴본 나의 소득", 90, start - 100, 38);
  results.forEach((result, index) => {
    const y = start + index * 225;
    text(result.kind === "worker" ? "근로소득" : "사업소득", 90, y, 28, "#a6b4a2");
    text(formatRank(result), 90, y + 85, result.type === "unavailable" ? 47 : 68, "#c7f66b", 750);
    text(
      `${result.metadata.taxYear ? `${result.metadata.taxYear}년 귀속` : "기준연도 확인 중"} · ${result.type === "estimate" ? "보간 추정치" : result.type === "range" ? "공개 구간 범위" : "순위 미제공"}`,
      90,
      y + 135,
      25,
      "#a6b4a2",
    );
    if (disclose) text(`입력 금액 ${compactWon(result.amountWon)}`, 90, y + 175, 27);
  });
  text("당신의 소득은 어디쯤인가요?", 90, h - 205, 35);
  text("출처·계산 방법: 사이트의 데이터와 기준 페이지", 90, h - 145, 24, "#a6b4a2");
  text(
    "추정은 정확한 순위가 아닙니다. 소득이 사람의 가치를 정하지 않습니다.",
    90,
    h - 100,
    21,
    "#a6b4a2",
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG 생성에 실패했습니다."))),
      "image/png",
    ),
  );
}
