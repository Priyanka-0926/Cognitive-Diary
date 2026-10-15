import React from 'react';

interface RadarDataPoint {
  label: string;
  value: number; // e.g. 0 to 100 or frequency
  fullMark?: number;
}

interface SkillsRadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
}

export const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({
  data,
  size = 320,
  className = '',
}) => {
  if (data.length < 3) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[#878D82] italic">
        Gathering more diverse skill categories for polygon map...
      </div>
    );
  }

  const radius = size * 0.38;
  const center = size / 2;
  const numAxes = data.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Maximum value for scaling
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Concentric polygon levels: 25%, 50%, 75%, 100%
  const levels = [0.25, 0.5, 0.75, 1];

  // Helper to get coordinates
  const getCoordinates = (value: number, index: number, max: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / max) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate data polygon points
  const points = data
    .map((d, i) => {
      const { x, y } = getCoordinates(d.value, i, maxValue);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Background Web Rings */}
        {levels.map((lvl, lIdx) => {
          const ringPoints = data
            .map((_, i) => {
              const { x, y } = getCoordinates(maxValue * lvl, i, maxValue);
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <polygon
              key={lIdx}
              points={ringPoints}
              fill="none"
              stroke="#E6E3DE"
              strokeWidth="1"
              strokeDasharray={lIdx === levels.length - 1 ? undefined : '2 3'}
            />
          );
        })}

        {/* Axis Spokes from center */}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(maxValue, i, maxValue);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#EAE8E3"
              strokeWidth="1"
            />
          );
        })}

        {/* Shaded Data Polygon */}
        <polygon
          points={points}
          fill="#3E5A46"
          fillOpacity="0.14"
          stroke="#3E5A46"
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Markers */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(d.value, i, maxValue);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#FFFFFF"
              stroke="#3E5A46"
              strokeWidth="2"
              className="transition-all duration-700 ease-out"
            />
          );
        })}

        {/* Axis Labels */}
        {data.map((d, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 22;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);

          // Anchor text based on position
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (Math.cos(angle) > 0.3) textAnchor = 'start';
          else if (Math.cos(angle) < -0.3) textAnchor = 'end';

          return (
            <text
              key={i}
              x={lx}
              y={ly + 4}
              textAnchor={textAnchor}
              className="text-[11px] font-medium fill-[#5C6059]"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
