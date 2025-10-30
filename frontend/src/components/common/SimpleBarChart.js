import React from 'react';

/**
 * SimpleBarChart
 * Lightweight responsive bar chart with SVG.
 * Props:
 * - data: Array<{ label: string, value: number, color?: string }>
 * - title?: string
 * - height?: number (px)
 * - showValues?: boolean
 *
 * No external dependencies.
 */
function SimpleBarChart({ data = [], title, height = 220, showValues = true }) {
  const values = data.map(d => d.value || 0);
  const max = Math.max(1, ...values);
  const padding = 48; // bottom padding for axis labels (avoid clipping)
  const svgHeight = height;
  const chartHeight = svgHeight - padding;
  const barWidth = 100 / Math.max(1, data.length); // as percentage

  return (
    <div className="sbchart">
      {title && <div className="sbchart-title">{title}</div>}
      <svg className="sbchart-svg" viewBox={`0 0 100 ${svgHeight}`} preserveAspectRatio="none" role="img" aria-label={title || 'bar chart'}>
        {/* baseline */}
        <line x1="0" y1={chartHeight} x2="100" y2={chartHeight} stroke="#eee" strokeWidth="0.5" />
        {data.map((d, i) => {
          const h = max === 0 ? 0 : (d.value / max) * (chartHeight - 2);
          const x = i * barWidth + 5; // add a small left padding
          const w = Math.max(0, barWidth - 10);
          const y = chartHeight - h;
          const color = d.color || '#4f46e5';
          const labelY = svgHeight - 16; // lift labels further above bottom
          return (
            <g key={d.label + i} className="sbchart-bar" >
              <title>{`${d.label}: ${d.value}`}</title>
              <rect x={x} y={y} width={w} height={h} rx="2" fill={color} />
              {showValues && h > 18 && (
                <text x={x + w / 2} y={y + 12} textAnchor="middle" fontSize="3" fill="#fff">{d.value}</text>
              )}
              <text x={x + w / 2} y={labelY} textAnchor="middle" fontSize="3.6" fill="#6b7280" dy="-0.5">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default SimpleBarChart;
