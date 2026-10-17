"use client";
import { useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Database,
  Info,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Store,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AmountField } from "./amount-field";
import { workerData, businessData } from "@/lib/statistics/data";
import { MAX_INCOME } from "@/lib/statistics/engine";
import { compactWon, numberFormat, parseMoney } from "@/lib/money";
import { Results } from "@/components/results/results";

export type IncomeMode = "worker" | "business" | "mixed";
export type Snapshot = { mode: IncomeMode; worker: number; business: number; expenseMode: boolean };
const modes = [
  { id: "worker", title: "직장인", sub: "근로소득", icon: BriefcaseBusiness },
  { id: "business", title: "사업자·프리랜서", sub: "사업소득", icon: Store },
  { id: "mixed", title: "직장인 + 사업", sub: "복수소득", icon: Layers3 },
] as const;

export function Calculator() {
  const [mode, setMode] = useState<IncomeMode>("worker");
  const [unit, setUnit] = useState<"man" | "won">("man");
  const [period, setPeriod] = useState<"year" | "month">("year");
  const [worker, setWorker] = useState("5,000");
  const [business, setBusiness] = useState("");
  const [revenue, setRevenue] = useState("");
  const [expense, setExpense] = useState("");
  const [expenseMode, setExpenseMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snapshot, setSnapshot] = useState<(Snapshot & { revision: number }) | null>(null);
  const revision = useRef(0);
  const reduced = useReducedMotion();
  const resultRef = useRef<HTMLDivElement>(null);
  const rawReference = (() => {
    try {
      return parseMoney(revenue, unit) - parseMoney(expense, unit);
    } catch {
      return null;
    }
  })();
  function edit(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setErrors({});
      setSnapshot(null);
    };
  }
  function convertUnit(next: "man" | "won") {
    if (unit === next) return;
    const values = [worker, business, revenue, expense];
    const setters = [setWorker, setBusiness, setRevenue, setExpense];
    try {
      const converted = values.map((value) =>
        value.trim()
          ? numberFormat.format(parseMoney(value, unit, true) / (next === "man" ? 10_000 : 1))
          : "",
      );
      converted.forEach((value, index) => setters[index](value));
      setUnit(next);
      setErrors({});
    } catch {
      setErrors({ general: "단위를 바꾸기 전에 입력한 금액을 확인해 주세요." });
    }
  }
  function convertPeriod(next: "year" | "month") {
    if (period === next) return;
    try {
      if (worker.trim()) {
        const value = parseMoney(worker, unit);
        const nextWon = next === "month" ? Math.round(value / 12) : value * 12;
        if (nextWon > MAX_INCOME) throw new Error("입력 범위 초과");
        setWorker(numberFormat.format(nextWon / (unit === "man" ? 10_000 : 1)));
      }
      setPeriod(next);
      setSnapshot(null);
      setErrors({});
    } catch {
      setErrors({ worker: "금액을 확인한 후 연봉·월급을 전환해 주세요." });
    }
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    let workerWon = 0,
      businessWon = 0;
    if (mode !== "business")
      try {
        workerWon = parseMoney(worker, unit) * (period === "month" ? 12 : 1);
        if (workerWon > MAX_INCOME) throw new Error("연간 환산금액은 1조 원 이하여야 합니다.");
      } catch (error) {
        nextErrors.worker = (error as Error).message;
      }
    if (mode !== "worker") {
      if (expenseMode) {
        let r = 0,
          e = 0;
        try {
          r = parseMoney(revenue, unit);
        } catch (error) {
          nextErrors.revenue = (error as Error).message;
        }
        try {
          e = parseMoney(expense, unit);
        } catch (error) {
          nextErrors.expense = (error as Error).message;
        }
        businessWon = r - e;
      } else
        try {
          businessWon = parseMoney(business, unit, true);
        } catch (error) {
          nextErrors.business = (error as Error).message;
        }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSnapshot({
      mode,
      worker: workerWon,
      business: businessWon,
      expenseMode,
      revision: ++revision.current,
    });
    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: reduced ? "instant" : "smooth",
        block: "start",
      });
      resultRef.current?.focus({ preventScroll: true });
    }, 80);
  }
  return (
    <>
      <div className="calculator-grid" id="calculator">
        <section className="calculator-card" aria-labelledby="calculator-title">
          <div className="card-heading">
            <div>
              <p className="section-kicker">01 / 나의 소득 입력</p>
              <h2 id="calculator-title">어떤 소득이 있으신가요?</h2>
            </div>
            <span className="small-pill">
              <LockKeyhole size={12} /> 비공개 계산
            </span>
          </div>
          <Tabs.Root
            value={mode}
            onValueChange={(value) => {
              setMode(value as IncomeMode);
              setErrors({});
              setSnapshot(null);
            }}
          >
            <Tabs.List className="income-tabs" aria-label="소득 유형">
              {modes.map(({ id, title, sub, icon: Icon }) => (
                <Tabs.Trigger key={id} value={id} className="income-tab">
                  <Icon size={21} />
                  <strong>{title}</strong>
                  <span>{sub}</span>
                  <Check className="tab-check" size={13} />
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {modes.map(({ id }) => (
              <Tabs.Content key={id} value={id} className="tab-panel">
                <form onSubmit={submit} noValidate>
                  <div className="form-toolbar">
                    <span>
                      {mode === "worker"
                        ? "근로소득 원천징수영수증 기준"
                        : mode === "business"
                          ? "개인 사업소득 기준"
                          : "두 소득을 각각 입력해 주세요"}
                    </span>
                    <div className="mini-toggle" role="group" aria-label="금액 단위">
                      <button
                        type="button"
                        aria-pressed={unit === "man"}
                        onClick={() => convertUnit("man")}
                      >
                        만원
                      </button>
                      <button
                        type="button"
                        aria-pressed={unit === "won"}
                        onClick={() => convertUnit("won")}
                      >
                        원
                      </button>
                    </div>
                  </div>
                  {mode !== "business" && (
                    <div className="worker-fields">
                      <div className="period-switch" role="group" aria-label="급여 입력 기간">
                        <button
                          type="button"
                          aria-pressed={period === "year"}
                          onClick={() => convertPeriod("year")}
                        >
                          연봉으로 입력
                        </button>
                        <button
                          type="button"
                          aria-pressed={period === "month"}
                          onClick={() => convertPeriod("month")}
                        >
                          월급으로 입력
                        </button>
                      </div>
                      <AmountField
                        id="worker-income"
                        label={period === "year" ? "연간 세전 총급여" : "월 세전 급여"}
                        value={worker}
                        onChange={edit(setWorker)}
                        unit={unit}
                        error={errors.worker}
                        help={
                          period === "year"
                            ? "성과급·상여금은 포함하고, 비과세 소득은 제외해 주세요."
                            : "월급 × 12의 단순 환산입니다. 상여금·변동급여가 없다고 가정하며 전환 시 원 단위로 반올림합니다."
                        }
                      />
                      <div className="quick-amounts" aria-label="연봉 빠른 입력">
                        {[3000, 4000, 5000, 7000, 10000].map((n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => {
                              setPeriod("year");
                              edit(setWorker)(
                                numberFormat.format(n * (unit === "won" ? 10_000 : 1)),
                              );
                            }}
                          >
                            {n === 10000 ? "1억" : `${(n / 1000).toFixed(0)},000만`}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            edit(setWorker)("");
                            document.getElementById("worker-income")?.focus();
                          }}
                        >
                          직접 입력
                        </button>
                      </div>
                    </div>
                  )}
                  {mode !== "worker" && (
                    <div className="business-fields">
                      <fieldset className="business-mode">
                        <legend className="sr-only">사업소득 입력 방식</legend>
                        <label>
                          <input
                            type="radio"
                            name="business-mode"
                            checked={!expenseMode}
                            onChange={() => {
                              setExpenseMode(false);
                              setSnapshot(null);
                            }}
                          />
                          <span>사업소득금액을 알아요</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="business-mode"
                            checked={expenseMode}
                            onChange={() => {
                              setExpenseMode(true);
                              setSnapshot(null);
                            }}
                          />
                          <span>매출과 비용으로 계산</span>
                        </label>
                      </fieldset>
                      {!expenseMode ? (
                        <AmountField
                          id="business-income"
                          label="연간 사업소득금액"
                          value={business}
                          onChange={edit(setBusiness)}
                          unit={unit}
                          negative
                          error={errors.business}
                          help="종합소득세 신고서의 사업소득금액을 입력하세요. 손실은 음수로 입력할 수 있습니다."
                        />
                      ) : (
                        <>
                          <div className="expense-grid">
                            <AmountField
                              id="revenue"
                              label="연간 총수입금액 (매출)"
                              value={revenue}
                              onChange={edit(setRevenue)}
                              unit={unit}
                              error={errors.revenue}
                            />
                            <AmountField
                              id="expense"
                              label="연간 필요경비"
                              value={expense}
                              onChange={edit(setExpense)}
                              unit={unit}
                              error={errors.expense}
                            />
                          </div>
                          <div className="reference-income">
                            <span>참고 사업소득금액</span>
                            <strong>
                              {rawReference === null
                                ? "금액을 입력해 주세요"
                                : compactWon(rawReference)}
                            </strong>
                          </div>
                          <p className="field-hint">
                            세무조정에 따라 신고 소득과 다를 수 있는 참고값입니다. 복수 사업장은
                            신고 기준에 맞춰 합산해 주세요.
                          </p>
                        </>
                      )}
                      <div className="info-note">
                        <Info size={16} />
                        <p>
                          3.3% 원천징수된 수입은 사업소득금액이 아닙니다. 필요경비 차감 후 소득을
                          입력하세요. 법인 매출·순이익은 비교 대상이 아닙니다.
                        </p>
                      </div>
                    </div>
                  )}
                  <p role="alert" className="field-error">
                    {errors.general}
                  </p>
                  {((mode !== "business" && workerData.status === "unavailable") ||
                    (mode !== "worker" && businessData.status === "unavailable")) && (
                    <p className="availability-note">
                      <span className="status-dot" />
                      공식 분포자료 확인 중 · 미확보 유형의 순위는 제공되지 않습니다.
                    </p>
                  )}
                  <Button type="submit" className="calculate-button">
                    나의 소득 위치 확인하기 <ArrowRight size={19} />
                  </Button>
                  <p className="private-caption">
                    <ShieldCheck size={13} /> 입력한 금액은 이 브라우저 안에서만 계산됩니다.
                  </p>
                </form>
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </section>
        <aside className="context-column" aria-label="통계 기준 안내">
          <div className="context-card">
            <div className="context-icon">
              <Database size={20} />
            </div>
            <p className="section-kicker">숫자보다 중요한 건, 기준</p>
            <h2>
              같은 소득끼리.
              <br />
              정확한 기준으로.
            </h2>
            <p>
              총급여와 매출은 다릅니다.
              <br />
              나의 소득 유형에 맞는 모집단과
              <br />
              비교해야 의미 있는 숫자가 됩니다.
            </p>
            <div className="source-row">
              <span>근로소득 기준</span>
              <strong>{workerData.metadata.taxYear}년 귀속</strong>
            </div>
            <div className="source-row">
              <span>공식 제공기관</span>
              <strong>국세청</strong>
            </div>
            <div className="source-status">
              <span className="status-dot" />
              {workerData.status === "verified"
                ? "근로소득 원본 검증 완료"
                : "근로소득 원본 검증 대기"}
            </div>
            <Link href="/methodology">
              출처와 계산 기준 살펴보기 <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="small-context">
            <span className="small-context-mark">%</span>
            <p>
              <strong>
                소득은 나를 설명하는
                <br />
                하나의 숫자일 뿐이에요.
              </strong>
              <span>비교를 넘어, 다음 계획을 세우는 데 활용해 보세요.</span>
            </p>
          </div>
        </aside>
      </div>
      <div
        ref={resultRef}
        tabIndex={-1}
        role="region"
        className="results-anchor"
        aria-label="계산 결과"
      >
        <AnimatePresence mode="wait">
          {snapshot && (
            <motion.div
              key={snapshot.revision}
              initial={{ opacity: 1, y: reduced ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Results
                initial={snapshot}
                workerData={workerData}
                businessData={businessData}
                onReset={() => {
                  setSnapshot(null);
                  document
                    .getElementById("calculator")
                    ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
                  document
                    .querySelector<HTMLInputElement>(".tab-panel input")
                    ?.focus({ preventScroll: true });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!snapshot && (
        <p className="below-calculator">
          <ArrowDown size={14} /> 공식 데이터의 기준을 먼저 확인해 보세요
        </p>
      )}
    </>
  );
}
