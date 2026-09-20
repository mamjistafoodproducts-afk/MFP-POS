import React from 'react';
import { generateBarcodeBarPattern } from '../utils/barcodeLookup';

interface BarcodeBadgeProps {
  code: string;
  sku?: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeBadge: React.FC<BarcodeBadgeProps> = ({
  code,
  sku,
  width = 160,
  height = 42,
  showText = true,
  className = ''
}) => {
  const bars = generateBarcodeBarPattern(code || '890600100101');
  const totalUnits = bars.reduce((a, b) => a + b, 0);
  const unitWidth = width / totalUnits;

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden bg-white px-1 py-0.5 rounded border border-slate-200"
      >
        {bars.map((barWidth, idx) => {
          const x = currentX;
          currentX += barWidth * unitWidth;
          const isBar = idx % 2 === 0;

          if (!isBar) return null;

          return (
            <rect
              key={idx}
              x={x}
              y={2}
              width={barWidth * unitWidth}
              height={height - 4}
              fill="#0f172a"
            />
          );
        })}
      </svg>
      {showText && (
        <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] tracking-widest text-slate-600 font-bold">
          <span>{code}</span>
          {sku && <span className="text-[9px] text-slate-400 font-normal">({sku})</span>}
        </div>
      )}
    </div>
  );
};
