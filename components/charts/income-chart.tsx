"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkerDataset } from "@/lib/statistics/schema";
import { workerPoints } from "@/lib/statistics/engine";
import { compactWon } from "@/lib/money";
export function IncomeChart({ data, amount }: { data: WorkerDataset; amount?: number }) {
  const points = workerPoints(data).map((p) => ({
    top: Number(p.top.toFixed(3)),
    amount: Math.round(p.amount),
  }));
  return (
    <figure className="chart">
      <figcaption>
        백분위 구간별 평균 총급여 <span>구간 평균 · 실제 커트라인 아님</span>
      </figcaption>
      <div
        role="img"
        aria-label="공식 백분위 구간별 평균 총급여 그래프. 가로축은 상위 비율, 세로축은 평균 총급여입니다."
        style={{ width: "100%", height: 250 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 15, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid stroke="#28312b" vertical={false} />
            <XAxis
              dataKey="top"
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke="#869185"
              fontSize={11}
            />
            <YAxis
              tickFormatter={(v) => `${Math.round(v / 10000).toLocaleString()}만`}
              stroke="#869185"
              fontSize={10}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: "#1b231e",
                border: "1px solid #40513c",
                borderRadius: 12,
                color: "#fff",
              }}
              formatter={(value) => [compactWon(Number(value)), "구간 평균"]}
              labelFormatter={(value) => `상위 ${value}% 부근`}
            />
            <Line
              type="linear"
              dataKey="amount"
              stroke="#c7f66b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {amount !== undefined && (
              <ReferenceLine y={amount} stroke="#eef5e7" strokeDasharray="5 5" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details>
        <summary>그래프 수치를 표로 보기</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>상위 구간</th>
                <th>인원</th>
                <th>구간 평균 총급여</th>
              </tr>
            </thead>
            <tbody>
              {data.bins.map((b) => (
                <tr key={b.topTo}>
                  <td>
                    {b.topFrom}~{b.topTo}%
                  </td>
                  <td>{b.people.toLocaleString()}명</td>
                  <td>{compactWon(b.salarySumWon / b.people)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
