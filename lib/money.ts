import { MAX_INCOME } from "./statistics/engine";
export const numberFormat = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 });
export function won(amount: number) {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(amount))}원`;
}
export function compactWon(amount: number) {
  const sign = amount < 0 ? "−" : "";
  const n = Math.abs(amount);
  if (n >= 100_000_000) return `${sign}${numberFormat.format(n / 100_000_000)}억 원`;
  if (n >= 10_000) return `${sign}${numberFormat.format(n / 10_000)}만 원`;
  return won(amount);
}
export function parseMoney(text: string, unit: "man" | "won", allowNegative = false): number {
  const normalized = text.trim();
  if (!normalized) throw new Error("금액을 입력해 주세요.");
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(normalized))
    throw new Error("숫자와 올바른 자릿수의 쉼표만 입력해 주세요.");
  const clean = normalized.replaceAll(",", "");
  const decimalPlaces = clean.split(".")[1]?.length ?? 0;
  if (decimalPlaces > (unit === "won" ? 0 : 4)) throw new Error("원 단위까지 입력할 수 있습니다.");
  const value = Math.round(Number(clean) * (unit === "man" ? 10_000 : 1));
  if (!Number.isSafeInteger(value) || Math.abs(value) > MAX_INCOME)
    throw new Error("입력 가능한 금액은 절댓값 1조 원 이하입니다.");
  if (!allowNegative && value < 0) throw new Error("0원 이상을 입력해 주세요.");
  return value;
}
