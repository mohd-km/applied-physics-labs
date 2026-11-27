import React, { useState } from 'react';
import { Compound, CompoundScores } from '../types';
import { PATHWAY_COLORS, PATHWAYS } from '../data/compounds';
import { evaluateLipinski } from '../utils/cheminformatics';

interface ScatterPlotProps {
  compounds: Compound[];
  scoreMap: Record<string, CompoundScores>;
  selectedId: string | null;
  onSelect: (compound: Compound) => void;
}

type XAxisMode = 'composite' | 'qed' | 'mw' | 'logP';

const X_AXIS_CONFIG: Record<
  XAxisMode,
  { label: string; min: number; max: number; ticks: number[]; format: (v: number) => string }
> = {
  composite: {
    label: 'Weighted Composite Score (0–100)',
    min: 30,
    max: 100,
    ticks: [35, 50, 65, 80, 95],
    format: (v) => `${v}`,
  },
  qed: {
    label: 'Drug-Likeness Score (QED)',
    min: 0.05,
    max: 0.9,
    ticks: [0.1, 0.3, 0.5, 0.7, 0.9],
    format: (v) => v.toFixed(1),
  },
  mw: {
    label: 'Molecular Weight (Da)',
    min: 50,
    max: 1050,
    ticks: [100, 300, 500, 700, 900],
    format: (v) => `${v}`,
  },
  logP: {
    label: 'Lipophilicity (cLogP)',
    min: -7.5,
    max: 8.5,
    ticks: [-6, -3, 0, 3, 5, 8],
    format: (v) => `${v}`,
  },
};

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  compounds,
  scoreMap,
  selectedId,
  onSelect,
}) => {
  const [xMode, setXMode] = useState<XAxisMode>('composite');
  const [hovered, setHovered] = useState<Compound | null>(null);

  const width = 680;
  const height = 400;
  const pad = { top: 28, right: 26, bottom: 54, left: 60 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const yMin = 3.5;
  const yMax = 10.0;
  const yTicks = [4, 5, 6, 7, 8, 9, 10];

  const xConf = X_AXIS_CONFIG[xMode];

  const getXVal = (c: Compound) =>
    xMode === 'composite'
      ? scoreMap[c.id]?.composite ?? 50
      : xMode === 'qed'
      ? c.qed
      : xMode === 'mw'
      ? c.mw
      : c.logP;

  const scaleX = (v: number) =>
    pad.left + ((v - xConf.min) / (xConf.max - xConf.min)) * plotW;
  const scaleY = (v: number) =>
    pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const sweetSpot =
    xMode === 'composite'
      ? {
          x: scaleX(70),
          y: scaleY(yMax),
          w: scaleX(xConf.max) - scaleX(70),
          h: scaleY(6.5) - scaleY(yMax),
          label: 'Top Weighted & Potent (Score >= 70, pIC50 >= 6.5)',
        }
      : xMode === 'qed'
      ? {
          x: scaleX(0.5),
          y: scaleY(yMax),
          w: scaleX(xConf.max) - scaleX(0.5),
          h: scaleY(6.5) - scaleY(yMax),
          label: 'Lead-Like Sweet Spot (QED >= 0.5, pIC50 >= 6.5)',
        }
      : xMode === 'mw'
      ? {
          x: scaleX(xConf.min),
          y: scaleY(yMax),
          w: scaleX(500) - scaleX(xConf.min),
          h: scaleY(6.5) - scaleY(yMax),
          label: 'Ro5 MW <= 500 Da & High Potency',
        }
      : {
          x: scaleX(0),
          y: scaleY(yMax),
          w: scaleX(5) - scaleX(0),
          h: scaleY(6.5) - scaleY(yMax),
          label: 'Optimal cLogP (0–5) & High Potency',
        };

  return (
    <section className="card chart-card" aria-label="Binding Potency vs Chemical Space Scatter Plot">
      <div className="chart-header">
        <div>
          <h2 className="panel-title">Potency vs. Chemical Space</h2>
          <p className="panel-subtitle">
            Tap any node to open its full profile.
          </p>
        </div>
        <div className="axis-switcher" role="group" aria-label="X-axis metric">
          {(['composite', 'qed', 'mw', 'logP'] as XAxisMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`axis-btn ${xMode === mode ? 'active' : ''}`}
              onClick={() => setXMode(mode)}
            >
              {mode === 'composite'
                ? 'Score'
                : mode === 'qed'
                ? 'QED'
                : mode === 'mw'
                ? 'MW'
                : 'cLogP'}
            </button>
          ))}
        </div>
      </div>

      <div className="svg-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="scatter-svg"
          role="img"
          aria-label={`Scatter plot of Binding Potency versus ${xConf.label} for ${compounds.length} compounds`}
        >
          <rect
            x={pad.left}
            y={pad.top}
            width={plotW}
            height={plotH}
            fill="#fafaf9"
            stroke="#e5e5e3"
            strokeWidth="1"
            rx="4"
          />

          <rect
            x={sweetSpot.x}
            y={sweetSpot.y}
            width={Math.max(0, sweetSpot.w)}
            height={Math.max(0, sweetSpot.h)}
            fill="#166534"
            fillOpacity="0.07"
          />
          <text
            x={sweetSpot.x + 8}
            y={sweetSpot.y + 18}
            fontSize="12"
            fontWeight="600"
            fill="#166534"
          >
            {sweetSpot.label}
          </text>

          {yTicks.map((t) => {
            const y = scaleY(t);
            return (
              <g key={`y-${t}`}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={pad.left + plotW}
                  y2={y}
                  stroke="#e5e5e3"
                  strokeDasharray={t === 6.5 ? '4 4' : undefined}
                />
                <text
                  x={pad.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#555555"
                  className="svg-num"
                >
                  {t.toFixed(1)}
                </text>
              </g>
            );
          })}

          {xConf.ticks.map((t) => {
            const x = scaleX(t);
            const isRo5Line = (xMode === 'mw' && t === 500) || (xMode === 'logP' && t === 5);
            return (
              <g key={`x-${t}`}>
                <line
                  x1={x}
                  y1={pad.top}
                  x2={x}
                  y2={pad.top + plotH}
                  stroke={isRo5Line ? '#b45309' : '#e5e5e3'}
                  strokeWidth={isRo5Line ? '1.5' : '1'}
                  strokeDasharray={isRo5Line ? '5 4' : undefined}
                />
                <text
                  x={x}
                  y={pad.top + plotH + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill={isRo5Line ? '#b45309' : '#555555'}
                  fontWeight={isRo5Line ? '600' : '400'}
                  className="svg-num"
                >
                  {xConf.format(t)}
                </text>
              </g>
            );
          })}

          <text
            x={pad.left + plotW / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="600"
            fill="#111111"
          >
            {xConf.label}
          </text>
          <text
            x={16}
            y={pad.top + plotH / 2}
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="600"
            fill="#111111"
            transform={`rotate(-90 16 ${pad.top + plotH / 2})`}
          >
            Binding Potency (pIC50 / pKi)
          </text>

          {compounds.map((c) => {
            const cx = scaleX(getXVal(c));
            const cy = scaleY(c.potency);
            const color = PATHWAY_COLORS[c.pathway].hex;
            const isSelected = c.id === selectedId;
            const isHovered = hovered?.id === c.id;
            const ro5 = evaluateLipinski(c);
            const r = isSelected ? 8.5 : isHovered ? 7.5 : ro5.compliant ? 6.5 : 5.5;

            return (
              <g
                key={c.id}
                className="scatter-node"
                role="button"
                tabIndex={0}
                aria-label={`${c.name}, ${c.pathway}, potency ${c.potency}, QED ${c.qed}`}
                onClick={() => onSelect(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(c);
                  }
                }}
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle cx={cx} cy={cy} r={16} fill="transparent" />
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={13}
                    fill="none"
                    stroke="#166534"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={color}
                  fillOpacity={ro5.compliant ? 0.9 : 0.42}
                  stroke={isSelected || isHovered ? '#111111' : '#ffffff'}
                  strokeWidth={isSelected || isHovered ? 2 : 1.5}
                />
                {(isSelected || isHovered || c.potency >= 8.2 || c.qed >= 0.74) && (
                  <text
                    x={cx + (cx > width - 140 ? -10 : 10)}
                    y={cy + 4}
                    textAnchor={cx > width - 140 ? 'end' : 'start'}
                    fontSize="12"
                    fontWeight={isSelected || isHovered ? '600' : '500'}
                    fill="#111111"
                    style={{ pointerEvents: 'none' }}
                  >
                    {c.name}
                  </text>
                )}
              </g>
            );
          })}

          {compounds.length === 0 && (
            <text
              x={pad.left + plotW / 2}
              y={pad.top + plotH / 2}
              textAnchor="middle"
              fontSize="13"
              fill="#555555"
            >
              No compounds match the current thresholds.
            </text>
          )}
        </svg>
      </div>

      <div className="chart-footer">
        <div className="legend-row" aria-label="Pathway color legend">
          {PATHWAYS.map((pw) => (
            <span key={pw} className="legend-item">
              <span
                className="legend-swatch"
                style={{ backgroundColor: PATHWAY_COLORS[pw].hex }}
                aria-hidden="true"
              />
              {pw}
            </span>
          ))}
          <span className="legend-item legend-muted">Faded = bRo5 (&gt;1 viol.)</span>
        </div>

        {hovered && (
          <div className="hover-banner mono-num" role="status">
            <strong>{hovered.name}</strong> ({hovered.chemblId}) &middot; Score{' '}
            {scoreMap[hovered.id]?.composite.toFixed(1)} &middot; {hovered.affinityMetric}{' '}
            {hovered.potency.toFixed(1)} &middot; QED {hovered.qed.toFixed(2)} &middot; MW{' '}
            {hovered.mw.toFixed(0)} Da
          </div>
        )}
      </div>
    </section>
  );
};
