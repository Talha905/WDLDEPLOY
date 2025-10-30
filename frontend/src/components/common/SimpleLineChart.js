import React from 'react';

/**
 * SimpleLineChart
 * Lightweight responsive SVG line chart for small time-series (sparklines or mini charts).
 * Props:
 * - data: Array<{ date?: string, label?: string, count?: number, y?: number }>
 *   Accepts either {date, count} or a generic {y}; x is derived from index.
 * - height?: number (px) default 80
 * - stroke?: string (line color)
 * - fill?: string (area fill) - optional translucent
 * - title?: string
 */
function SimpleLineChart({ data = [], height = 80, stroke = '#4f46e5', fill = 'rgba(79,70,229,0.12)', title }) {
  const values = data.map(d => (typeof d.count === 'number' ? d.count : (typeof d.y === 'number' ? d.y : 0)));
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const h = height;
  const paddingY = 6;
  const chartH = h - paddingY * 2;
  const n = Math.max(1, data.length);

  const points = data.map((d, i) => {
    const v = typeof d.count === 'number' ? d.count : (typeof d.y === 'number' ? d.y : 0);
    const x = (i / (n - 1 || 1)) * 100; // 0..100
    const y = paddingY + (1 - (v - min) / range) * chartH;
    return { x, y };
  });

  const path = points.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'}${p.x},${p.y} `, '');
  const area = points.length
    ? `M0,${h - paddingY} ` + points.map(p => `L${p.x},${p.y}`).join(' ') + ` L100,${h - paddingY} Z`
    : '';

  return (
    <div className="slchart">
      {title && <div className="slchart-title">{title}</div>}
      <svg className="slchart-svg" viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" role="img" aria-label={title || 'trend chart'}>
        {/* baseline */}
        <line x1="0" y1={h - paddingY} x2="100" y2={h - paddingY} stroke="#eee" strokeWidth="0.5" />
        {/* area */}
        {points.length > 1 && <path d={area} fill={fill} stroke="none" />}
        {/* line */}
        {points.length > 1 && <path d={path} fill="none" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />}
      </svg>
    </div>
  );
}

export default SimpleLineChart;
