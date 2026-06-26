"use client";

import { useMemo } from "react";
import type { WeeklyTrendPoint } from "@/lib/dashboardTrend";
import { formatCurrency } from "@/lib/format";

const CHART_W = 560;
const CHART_H = 220;
const PAD = { top: 16, right: 16, bottom: 36, left: 52 };

type Props = {
  data: WeeklyTrendPoint[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

function scaleY(value: number, max: number, innerH: number): number {
  if (max <= 0) return PAD.top + innerH;
  return PAD.top + innerH - (value / max) * innerH;
}

export function WeeklySalesLaborChart({ data, selectedDate, onSelectDate }: Props) {
  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const { salesPoints, laborPoints, ticks } = useMemo(() => {
    const values = data.flatMap((d) =>
      d.sales != null ? [d.sales, d.labor] : [d.labor],
    );
    const max = Math.max(...values, 1);
    const niceMax = Math.ceil(max / 100) * 100 || 100;

    const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

    const salesPts = data.map((d, i) => ({
      ...d,
      x: PAD.left + i * xStep,
      y: d.sales != null ? scaleY(d.sales, niceMax, innerH) : null,
    }));

    const laborPts = data.map((d, i) => ({
      ...d,
      x: PAD.left + i * xStep,
      y: scaleY(d.labor, niceMax, innerH),
    }));

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      value: niceMax * t,
      y: scaleY(niceMax * t, niceMax, innerH),
    }));

    return { salesPoints: salesPts, laborPoints: laborPts, ticks: yTicks };
  }, [data, innerW, innerH]);

  const salesLine = salesPoints
    .filter((p) => p.y != null)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const laborLine = laborPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full min-w-0"
        role="img"
        aria-label="Weekly sales and labour comparison"
      >
        {ticks.map((t) => (
          <g key={t.value}>
            <line
              x1={PAD.left}
              y1={t.y}
              x2={CHART_W - PAD.right}
              y2={t.y}
              stroke="#f0d4dc"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 8}
              y={t.y + 4}
              textAnchor="end"
              className="fill-[#8b5a6b] text-[10px]"
            >
              {t.value >= 1000 ? `$${(t.value / 1000).toFixed(1)}k` : `$${t.value}`}
            </text>
          </g>
        ))}

        {laborLine ? (
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={laborLine}
          />
        ) : null}

        {salesLine ? (
          <polyline
            fill="none"
            stroke="#e85d8a"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={salesLine}
          />
        ) : null}

        {salesPoints.map((p) =>
          p.y != null ? (
            <circle
              key={`sales-${p.date}`}
              cx={p.x}
              cy={p.y}
              r={p.date === selectedDate ? 6 : 4}
              fill="#e85d8a"
              stroke={p.date === selectedDate ? "#3d2a32" : "white"}
              strokeWidth={2}
            />
          ) : null,
        )}

        {laborPoints.map((p) => (
          <circle
            key={`labor-${p.date}`}
            cx={p.x}
            cy={p.y}
            r={p.date === selectedDate ? 6 : 4}
            fill="#6366f1"
            stroke={p.date === selectedDate ? "#3d2a32" : "white"}
            strokeWidth={2}
          />
        ))}

        {data.map((d, i) => {
          const x = PAD.left + (data.length > 1 ? (innerW / (data.length - 1)) * i : innerW / 2);
          return (
            <text
              key={d.date}
              x={x}
              y={CHART_H - 10}
              textAnchor="middle"
              className={`text-[11px] ${d.date === selectedDate ? "fill-[#3d2a32] font-semibold" : "fill-[#8b5a6b]"}`}
            >
              {d.label}
            </text>
          );
        })}

        {data.map((d, i) => {
          const x = PAD.left + (data.length > 1 ? (innerW / (data.length - 1)) * i : innerW / 2);
          return (
            <g key={`hit-${d.date}`}>
              <rect
                x={x - 24}
                y={PAD.top}
                width={48}
                height={innerH + PAD.bottom}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelectDate(d.date)}
              />
              <title>
                {d.label}: Sales {d.sales != null ? formatCurrency(d.sales) : "—"}, Labour{" "}
                {formatCurrency(d.labor)}
              </title>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#6b4f5a]">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6 rounded bg-[#e85d8a]" />
          Sales (closing form)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6 rounded bg-[#6366f1]" />
          Labour (roster)
        </span>
      </div>
    </div>
  );
}
