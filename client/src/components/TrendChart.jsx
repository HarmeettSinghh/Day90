import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Trend chart — SVG line that draws itself as it loads.
 * Accepts weekly ratings array: [{ weekNumber, rating }]
 */
export default function TrendChart({ weeklyLogs }) {
  const pathRef = useRef(null);

  const WIDTH  = 300;
  const HEIGHT = 100;
  const PADDING = { top: 10, right: 16, bottom: 24, left: 28 };

  const plotWidth  = WIDTH  - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top  - PADDING.bottom;

  const sorted = [...weeklyLogs].sort((a, b) => a.weekNumber - b.weekNumber);

  if (sorted.length < 2) {
    return (
      <div className="trend-chart trend-chart--empty">
        <p className="text-sm text-muted text-center italic">
          {sorted.length === 0
            ? 'Weekly ratings will appear here.'
            : 'Log one more week to see your trend.'}
        </p>
      </div>
    );
  }

  const maxWeek = sorted[sorted.length - 1].weekNumber;
  const minWeek = sorted[0].weekNumber;
  const weekRange = Math.max(maxWeek - minWeek, 1);

  const xScale = (weekNumber) =>
    PADDING.left + ((weekNumber - minWeek) / weekRange) * plotWidth;
  const yScale = (rating) =>
    PADDING.top + plotHeight - ((rating - 1) / 4) * plotHeight;

  const points = sorted.map((d) => [xScale(d.weekNumber), yScale(d.rating)]);

  // Build smooth path with cubic bezier
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1][0] + points[i][0]) / 2;
    const cp1y = points[i - 1][1];
    const cp2x = cp1x;
    const cp2y = points[i][1];
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i][0]} ${points[i][1]}`;
  }

  // Y-axis labels
  const yLabels = [1, 2, 3, 4, 5];

  return (
    <div className="trend-chart">
      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Weekly rating trend chart"
      >
        {/* Grid lines */}
        {yLabels.map((v) => (
          <line
            key={v}
            x1={PADDING.left}
            y1={yScale(v)}
            x2={WIDTH - PADDING.right}
            y2={yScale(v)}
            stroke="var(--cream-border)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        ))}

        {/* Y labels */}
        {yLabels.map((v) => (
          <text
            key={v}
            x={PADDING.left - 6}
            y={yScale(v) + 4}
            textAnchor="end"
            fontSize="9"
            fill="var(--ink-faint)"
            fontFamily="var(--font-body)"
          >
            {v}
          </text>
        ))}

        {/* Trend line — draws itself */}
        <motion.path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="var(--forest)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r="4"
            fill="var(--white)"
            stroke="var(--forest)"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}
            aria-label={`Week ${sorted[i].weekNumber}: rating ${sorted[i].rating}`}
          />
        ))}

        {/* X labels */}
        {sorted.map((d, i) => {
          if (i % Math.ceil(sorted.length / 5) === 0 || i === sorted.length - 1) {
            return (
              <text
                key={d.weekNumber}
                x={xScale(d.weekNumber)}
                y={HEIGHT - 4}
                textAnchor="middle"
                fontSize="9"
                fill="var(--ink-faint)"
                fontFamily="var(--font-body)"
              >
                W{d.weekNumber}
              </text>
            );
          }
          return null;
        })}
      </svg>

      <style>{`
        .trend-chart {
          padding: var(--space-2) 0;
        }
        .trend-chart--empty {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
