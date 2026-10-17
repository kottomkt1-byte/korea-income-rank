"use client";
import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { ArrowUpRight, ArrowRight, CircleHelp, FileCheck2, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { Dataset } from "@/lib/statistics/schema";
import {
  calculate,
  calculateMixed,
  formatRank,
  targetIncome,
  type Result,
} from "@/lib/statistics/engine";
import { compactWon } from "@/lib/money";
import { Button } from "@/components/ui/button";
import type { Snapshot } from "@/components/calculator/calculator";
import { IncomeChart } from "@/components/charts/income-chart";
import { Simulator } from "./simulator";
import { SharePanel } from "@/components/share/share-panel";
import { AdSlot } from "@/components/ad-slot";

function AnimatedPercent({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (reduced) return;
    const controls = animate(0.1, value, { duration: 0.45, onUpdate: setDisplay });
    return () => controls.stop();
  }, [value, reduced]);
  return (
    <span aria-label={`${value.toFixed(1)}퍼센트`}>
      <span aria-hidden="true">{Math.max(0.1, reduced ? value : display).toFixed(1)}</span>
      <small>%</small>
    </span>
  );
}
function ResultCard({ result, data }: { result: Result; data: Dataset }) {
  const unavailable = result.type === "unavailable";
  const worker = result.kind === "worker";
  const mean =
    data.status === "verified" && data.kind === "worker"
      ? data.bins.reduce((sum, b) => sum + b.salarySumWon, 0) / data.audit.totalPeople
      : null;
  const median = targetIncome(50, data);
  const goal = targetIncome(10, data);
  return (
    <section
      className={`result-card ${unavailable ? "result-pending" : ""}`}
      aria-label={worker ? "근로소득 결과" : "사업소득 결과"}
    >
      <div className="result-topline">
        <span>{worker ? "근로소득" : "사업소득"}</span>
        <span className="result-badge">
          {result.type === "estimate"
            ? "보간 추정치"
            : result.type === "range"
              ? "공식 구간 기반 범위"
              : "원본 검증 대기"}
        </span>
      </div>
      <p className="result-amount">연간 {compactWon(result.amountWon)}</p>
      {unavailable ? (
        <>
          <div className="pending-symbol">
            <FileCheck2 size={38} />
            <span>…</span>
          </div>
          <h3>
            근거가 준비되면,
            <br />
            숫자로 알려드릴게요.
          </h3>
          <strong className="pending-title">공식 분포자료 확인 중</strong>
          <p className="pending-reason">{result.limitations[0]}</p>
        </>
      ) : (
        <>
          <p className="result-population">{result.metadata.population} 중</p>
          <h3 className="percent-result">
            {result.topPercent !== undefined && result.topPercent > 0.1 ? (
              <>
                <span className="percent-prefix">상위 약</span>
                <AnimatedPercent value={result.topPercent} />
              </>
            ) : (
              formatRank(result)
            )}
          </h3>
          <div className="percentile-track" role="img" aria-label={formatRank(result)}>
            {result.topPercent !== undefined ? (
              <span className="position-marker" style={{ left: `${100 - result.topPercent}%` }} />
            ) : (
              result.topRange && (
                <span
                  className="position-range"
                  style={{
                    left: `${100 - result.topRange[1]}%`,
                    width: `${Math.max(0.5, result.topRange[1] - result.topRange[0])}%`,
                  }}
                />
              )
            )}
          </div>
          <div className="slider-labels">
            <span>낮은 소득</span>
            <span>높은 소득</span>
          </div>
          {result.topPercent !== undefined && result.topPercent >= 1 && result.topPercent <= 99 && (
            <p className="result-interpretation">
              같은 모집단 100명 중 약 <strong>{Math.round(result.topPercent)}명</strong>이 더 높은
              소득을 얻는 것으로 추정돼요.
            </p>
          )}
          {mean !== null && (
            <div className="result-metrics">
              <div>
                <span>전체 평균 총급여</span>
                <strong>{compactWon(mean)}</strong>
              </div>
              <div>
                <span>추정 중위 총급여</span>
                <strong>{median === null ? "산출 불가" : compactWon(median)}</strong>
              </div>
              <div>
                <span>전체 비교 인원</span>
                <strong>
                  {data.status === "verified"
                    ? `${data.audit.totalPeople.toLocaleString()}명`
                    : "확인 중"}
                </strong>
              </div>
            </div>
          )}
          {goal !== null && (
            <p className="goal-note">
              상위 10% 추정 진입금액은 {compactWon(goal)}입니다.
              {result.amountWon < goal
                ? ` 현재 입력보다 약 ${compactWon(goal - result.amountWon)} 높아요.`
                : " 실제 커트라인은 다를 수 있어요."}
            </p>
          )}
        </>
      )}
      <div className="result-source">
        <span>
          {result.metadata.taxYear
            ? `${result.metadata.taxYear}년 귀속 · ${result.metadata.filingYear}년 신고`
            : "기준연도 확인 중"}
        </span>
        <a href={result.metadata.sourceUrl} target="_blank" rel="noreferrer">
          공식 출처 <ArrowUpRight size={12} />
        </a>
      </div>
      {!unavailable && (
        <details className="result-method">
          <summary>추정 방법과 한계 확인하기</summary>
          <p>{result.method}</p>
          {result.limitations.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </details>
      )}
      {unavailable && (
        <Link href="/methodology" className="text-link">
          어떤 자료가 필요한가요? <ArrowRight size={14} />
        </Link>
      )}
    </section>
  );
}
export function Results({
  initial,
  workerData,
  businessData,
  onReset,
}: {
  initial: Snapshot;
  workerData: Dataset;
  businessData: Dataset;
  onReset: () => void;
}) {
  const [worker, setWorker] = useState(initial.worker);
  const [business, setBusiness] = useState(initial.business);
  const mixed =
    initial.mode === "mixed" ? calculateMixed(worker, business, workerData, businessData) : null;
  const results = mixed
    ? [mixed.worker, mixed.business]
    : [
        calculate(
          initial.mode === "worker" ? worker : business,
          initial.mode === "worker" ? workerData : businessData,
        ),
      ];
  return (
    <div className="results">
      <div className="results-heading">
        <div>
          <p className="section-kicker">02 / 나의 소득 리포트</p>
          <h2>같은 기준에서 바라본 나의 위치</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw size={14} /> 다시 계산
        </Button>
      </div>
      <div className={`result-grid ${mixed ? "is-mixed" : ""}`}>
        {results.map((result) => (
          <ResultCard
            key={result.kind}
            result={result}
            data={result.kind === "worker" ? workerData : businessData}
          />
        ))}
      </div>
      {mixed && (
        <div className="mixed-note">
          <CircleHelp size={21} />
          <div>
            <h3>두 소득의 순위는 따로 살펴봐요.</h3>
            <p>{mixed.notice}</p>
            <p>
              입력 금액의 참고 합계 <strong>{compactWon(mixed.referenceTotalWon)}</strong> · 세법상
              종합소득금액과 다를 수 있습니다.
            </p>
            {mixed.worker.metadata.taxYear !== mixed.business.metadata.taxYear && (
              <p>
                두 자료의 기준연도가 같다고 확인되지 않았습니다. 같은 연도 비교로 해석하지 마세요.
              </p>
            )}
          </div>
        </div>
      )}
      {initial.expenseMode && initial.mode !== "worker" && (
        <p className="scenario-note">
          사업소득은 매출 − 필요경비로 계산한 참고값에서 시작합니다. 시뮬레이터의 변경은 가정한 소득
          시나리오이며 실제 신고금액을 바꾸지 않습니다.
        </p>
      )}
      <AdSlot placement="after-results" />
      <div className="simulator-grid">
        {initial.mode !== "business" && (
          <Simulator
            kind="worker"
            amount={worker}
            update={setWorker}
            available={workerData.status === "verified"}
          />
        )}
        {initial.mode !== "worker" && (
          <Simulator
            kind="business"
            amount={business}
            update={setBusiness}
            available={businessData.status === "verified"}
          />
        )}
      </div>
      <AdSlot placement="after-simulator" />
      {initial.mode !== "business" &&
        workerData.kind === "worker" &&
        workerData.status === "verified" && <IncomeChart data={workerData} amount={worker} />}
      <SharePanel results={results} />
    </div>
  );
}
