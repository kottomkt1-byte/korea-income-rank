"use client";
import { useState } from "react";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { MAX_INCOME } from "@/lib/statistics/engine";
import { compactWon, numberFormat, parseMoney } from "@/lib/money";
export function Simulator({
  kind,
  amount,
  update,
  available,
}: {
  kind: "worker" | "business";
  amount: number;
  update: (value: number) => void;
  available: boolean;
}) {
  const [draft, setDraft] = useState(numberFormat.format(amount / 10000));
  const [error, setError] = useState("");
  const title = kind === "worker" ? "연간 총급여" : "연간 사업소득금액";
  const [bounds, setBounds] = useState(() => ({
    min: kind === "worker" ? 0 : Math.max(-MAX_INCOME, Math.min(-50_000_000, amount * 2)),
    max: Math.min(MAX_INCOME, Math.max(200_000_000, amount * 2)),
  }));
  const { min, max } = bounds;
  function commit(value: number) {
    // Keep a stable scale while dragging; expand only for typed amounts outside it.
    if (value < min || value > max)
      setBounds({ min: Math.min(min, value), max: Math.max(max, value) });
    update(value);
  }
  function change(value: number) {
    const bounded = Math.max(
      kind === "worker" ? 0 : -MAX_INCOME,
      Math.min(MAX_INCOME, Math.round(value)),
    );
    setDraft(numberFormat.format(bounded / 10000));
    setError("");
    commit(bounded);
  }
  return (
    <section className="simulator" aria-labelledby={`${kind}-sim-title`}>
      <div className="sim-heading">
        <SlidersHorizontal size={18} />
        <h4 id={`${kind}-sim-title`}>{title} 시뮬레이터</h4>
        <span>WHAT IF</span>
      </div>
      <p>
        {available
          ? "금액을 바꾸며 소득 위치의 변화를 살펴보세요."
          : "금액 변화는 확인할 수 있어요. 순위는 공식 원본 검증 후 제공됩니다."}
      </p>
      <label className="sim-input">
        <span>{title}</span>
        <input
          aria-label={`${title} 시뮬레이터 금액`}
          inputMode={kind === "business" ? "text" : "decimal"}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            try {
              const value = parseMoney(e.target.value, "man", kind === "business");
              commit(value);
              setError("");
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        />
        <span>만 원</span>
      </label>
      <input
        type="range"
        className="income-slider"
        aria-label={`${title} 조절`}
        min={min}
        max={max}
        step={1}
        value={amount}
        onChange={(e) => change(Number(e.target.value))}
        aria-valuetext={compactWon(amount)}
      />
      <div className="slider-labels">
        <span>{compactWon(min)}</span>
        <span>{compactWon(max)}</span>
      </div>
      <div className="sim-actions">
        {kind === "business" && (
          <button type="button" onClick={() => change(amount - 5_000_000)}>
            −500만
          </button>
        )}
        {[100, 500, 1000, 3000].map((n) => (
          <button type="button" key={n} onClick={() => change(amount + n * 10000)}>
            +{n.toLocaleString()}만 <ArrowUpRight size={12} />
          </button>
        ))}
      </div>
      <p className="field-error" role="alert">
        {error}
      </p>
    </section>
  );
}
