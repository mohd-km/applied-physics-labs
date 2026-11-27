import React, { useState } from 'react';
import { Compound, CompoundScores } from '../types';
import { evaluateLipinski } from '../utils/cheminformatics';

interface MoleculeComparatorProps {
  compounds: Compound[];
  scoreMap: Record<string, CompoundScores>;
  compareAId: string;
  compareBId: string;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
  onSwap: () => void;
  onInspect: (compound: Compound) => void;
}

const COMPARE_PRESETS: { label: string; a: string; b: string }[] = [
  { label: 'Rapamycin vs Metformin', a: 'rapamycin', b: 'metformin' },
  { label: 'Canagliflozin vs Acarbose', a: 'canagliflozin', b: 'acarbose' },
  { label: 'Dasatinib vs Fisetin', a: 'dasatinib', b: 'fisetin' },
  { label: '78c vs NMN', a: 'compound-78c', b: 'nmn' },
];

interface RadarAxis {
  key: keyof Pick<
    CompoundScores,
    | 'oralBioavailability'
    | 'bbbPermeability'
    | 'pathwayAffinity'
    | 'safety'
    | 'qedNorm'
    | 'drugAgeNorm'
  >;
  label: string;
  shortLabel: string;
}

const RADAR_AXES: RadarAxis[] = [
  { key: 'oralBioavailability', label: 'Oral Bioavailability', shortLabel: 'Oral' },
  { key: 'bbbPermeability', label: 'BBB Permeability', shortLabel: 'BBB' },
  { key: 'pathwayAffinity', label: 'Pathway Affinity', shortLabel: 'Affinity' },
  { key: 'safety', label: 'Safety & Maturity', shortLabel: 'Safety' },
  { key: 'qedNorm', label: 'Drug-Likeness (QED)', shortLabel: 'QED' },
  { key: 'drugAgeNorm', label: 'DrugAge Signal', shortLabel: 'DrugAge' },
];

export const MoleculeComparator: React.FC<MoleculeComparatorProps> = ({
  compounds,
  scoreMap,
  compareAId,
  compareBId,
  onChangeA,
  onChangeB,
  onSwap,
  onInspect,
}) => {
  const [activeAxisIdx, setActiveAxisIdx] = useState<number | null>(null);

  const molA = compounds.find((c) => c.id === compareAId) ?? compounds[0];
  const molB = compounds.find((c) => c.id === compareBId) ?? compounds[1] ?? compounds[0];

  if (!molA || !molB) return null;

  const scoresA = scoreMap[molA.id];
  const scoresB = scoreMap[molB.id];
  const ro5A = evaluateLipinski(molA);
  const ro5B = evaluateLipinski(molB);

  // Radar geometry (SVG viewBox 440 x 340)
  const cx = 220;
  const cy = 172;
  const maxR = 114;
  const rings = [25, 50, 75, 100];

  const polarToXY = (index: number, valuePct: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / RADAR_AXES.length;
    const r = (valuePct / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const buildPolygonPoints = (scores: CompoundScores) =>
    RADAR_AXES.map((axis, idx) => {
      const pt = polarToXY(idx, scores[axis.key]);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');

  const polyA = buildPolygonPoints(scoresA);
  const polyB = buildPolygonPoints(scoresB);

  const highlightedAxis = activeAxisIdx !== null ? RADAR_AXES[activeAxisIdx] : null;

  const metricRows: {
    label: string;
    aVal: string;
    bVal: string;
    winner: 'a' | 'b' | 'tie';
  }[] = [
    {
      label: 'Composite Score',
      aVal: scoresA.composite.toFixed(1),
      bVal: scoresB.composite.toFixed(1),
      winner:
        scoresA.composite > scoresB.composite
          ? 'a'
          : scoresB.composite > scoresA.composite
          ? 'b'
          : 'tie',
    },
    {
      label: 'Oral Bioavail.',
      aVal: `${scoresA.oralBioavailability}`,
      bVal: `${scoresB.oralBioavailability}`,
      winner:
        scoresA.oralBioavailability > scoresB.oralBioavailability
          ? 'a'
          : scoresB.oralBioavailability > scoresA.oralBioavailability
          ? 'b'
          : 'tie',
    },
    {
      label: 'BBB Perm.',
      aVal: `${scoresA.bbbPermeability}`,
      bVal: `${scoresB.bbbPermeability}`,
      winner:
        scoresA.bbbPermeability > scoresB.bbbPermeability
          ? 'a'
          : scoresB.bbbPermeability > scoresA.bbbPermeability
          ? 'b'
          : 'tie',
    },
    {
      label: 'Potency',
      aVal: `${molA.potency.toFixed(1)} ${molA.affinityMetric}`,
      bVal: `${molB.potency.toFixed(1)} ${molB.affinityMetric}`,
      winner: molA.potency > molB.potency ? 'a' : molB.potency > molA.potency ? 'b' : 'tie',
    },
    {
      label: 'MW / TPSA',
      aVal: `${molA.mw.toFixed(0)} Da · ${molA.tpsa.toFixed(0)} A²`,
      bVal: `${molB.mw.toFixed(0)} Da · ${molB.tpsa.toFixed(0)} A²`,
      winner: 'tie',
    },
    {
      label: 'Ro5 / Phase',
      aVal: `${ro5A.violations} viol · ${molA.clinicalPhase}`,
      bVal: `${ro5B.violations} viol · ${molB.clinicalPhase}`,
      winner: 'tie',
    },
    {
      label: 'DrugAge Delta',
      aVal: `+${molA.drugAgeDeltaPct}%`,
      bVal: `+${molB.drugAgeDeltaPct}%`,
      winner:
        molA.drugAgeDeltaPct > molB.drugAgeDeltaPct
          ? 'a'
          : molB.drugAgeDeltaPct > molA.drugAgeDeltaPct
          ? 'b'
          : 'tie',
    },
  ];

  return (
    <section className="card comparator-card" aria-label="Side-by-Side 2-Molecule Radar Comparator">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">2-Molecule Radar Comparator</h2>
          <p className="panel-subtitle">
            Overlay ADMET, potency, and DrugAge profiles side by side.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={onSwap}
          aria-label="Swap Molecule A and Molecule B"
        >
          Swap A &harr; B
        </button>
      </div>

      {/* Quick Pair Presets */}
      <div className="preset-row comparator-presets" role="group" aria-label="Comparison presets">
        {COMPARE_PRESETS.map((preset) => {
          const active = compareAId === preset.a && compareBId === preset.b;
          return (
            <button
              key={preset.label}
              type="button"
              className={`btn-preset ${active ? 'active' : ''}`}
              onClick={() => {
                onChangeA(preset.a);
                onChangeB(preset.b);
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Dual Molecule Selectors */}
      <div className="comparator-selectors">
        <div className="mol-select-box mol-a">
          <label htmlFor="select-mol-a" className="mol-tag">
            <span className="mol-swatch swatch-a" aria-hidden="true" />
            Molecule A
          </label>
          <select
            id="select-mol-a"
            className="select-input"
            value={molA.id}
            onChange={(e) => onChangeA(e.target.value)}
          >
            {compounds.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.pathway})
              </option>
            ))}
          </select>
        </div>

        <div className="mol-select-box mol-b">
          <label htmlFor="select-mol-b" className="mol-tag">
            <span className="mol-swatch swatch-b" aria-hidden="true" />
            Molecule B
          </label>
          <select
            id="select-mol-b"
            className="select-input"
            value={molB.id}
            onChange={(e) => onChangeB(e.target.value)}
          >
            {compounds.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.pathway})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive SVG Radar Chart */}
      <div className="radar-wrap">
        <svg
          viewBox="0 0 440 340"
          className="radar-svg"
          role="img"
          aria-label={`Radar chart comparing ${molA.name} and ${molB.name} across six longevity drug-likeness axes`}
        >
          {/* Concentric hexagonal grid rings */}
          {rings.map((ring) => {
            const pts = RADAR_AXES.map((_, idx) => {
              const p = polarToXY(idx, ring);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            }).join(' ');
            return (
              <polygon
                key={ring}
                points={pts}
                fill={ring === 100 ? '#fafaf9' : 'none'}
                stroke="#e5e5e3"
                strokeWidth="1"
              />
            );
          })}

          {/* Ring scale numbers on top vertical spoke */}
          {rings.map((ring) => {
            const p = polarToXY(0, ring);
            return (
              <text
                key={`lbl-${ring}`}
                x={p.x + 6}
                y={p.y + 4}
                fontSize="12"
                fill="#777777"
                className="svg-num"
              >
                {ring}
              </text>
            );
          })}

          {/* Radial axis spokes and interactive labels */}
          {RADAR_AXES.map((axis, idx) => {
            const outer = polarToXY(idx, 100);
            const labelPt = polarToXY(idx, 124);
            const isHighlighted = activeAxisIdx === idx;
            const anchor =
              Math.abs(labelPt.x - cx) < 10
                ? 'middle'
                : labelPt.x > cx
                ? 'start'
                : 'end';

            return (
              <g
                key={axis.key}
                className="radar-axis-group"
                onMouseEnter={() => setActiveAxisIdx(idx)}
                onMouseLeave={() => setActiveAxisIdx(null)}
                onClick={() => setActiveAxisIdx(isHighlighted ? null : idx)}
              >
                <line
                  x1={cx}
                  y1={cy}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={isHighlighted ? '#1d4ed8' : '#e5e5e3'}
                  strokeWidth={isHighlighted ? '1.5' : '1'}
                />
                <text
                  x={labelPt.x}
                  y={labelPt.y + 4}
                  textAnchor={anchor}
                  fontSize="12.5"
                  fontWeight={isHighlighted ? '600' : '500'}
                  fill={isHighlighted ? '#1d4ed8' : '#111111'}
                >
                  {axis.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Molecule B Polygon (Slate Charcoal Dashed) */}
          <polygon
            points={polyB}
            fill="#52525b"
            fillOpacity="0.12"
            stroke="#52525b"
            strokeWidth="2"
            strokeDasharray="6 3"
            className="radar-poly"
          />

          {/* Molecule A Polygon (Domain Accent Deep Forest Green) */}
          <polygon
            points={polyA}
            fill="#1d4ed8"
            fillOpacity="0.16"
            stroke="#1d4ed8"
            strokeWidth="2.5"
            className="radar-poly"
          />

          {/* Molecule B Vertices */}
          {RADAR_AXES.map((axis, idx) => {
            const pt = polarToXY(idx, scoresB[axis.key]);
            const isHi = activeAxisIdx === idx;
            return (
              <circle
                key={`b-${axis.key}`}
                cx={pt.x}
                cy={pt.y}
                r={isHi ? 6 : 4}
                fill="#ffffff"
                stroke="#52525b"
                strokeWidth="2"
                onMouseEnter={() => setActiveAxisIdx(idx)}
                onMouseLeave={() => setActiveAxisIdx(null)}
              />
            );
          })}

          {/* Molecule A Vertices */}
          {RADAR_AXES.map((axis, idx) => {
            const pt = polarToXY(idx, scoresA[axis.key]);
            const isHi = activeAxisIdx === idx;
            return (
              <circle
                key={`a-${axis.key}`}
                cx={pt.x}
                cy={pt.y}
                r={isHi ? 6.5 : 4.5}
                fill="#1d4ed8"
                stroke="#ffffff"
                strokeWidth="1.5"
                onMouseEnter={() => setActiveAxisIdx(idx)}
                onMouseLeave={() => setActiveAxisIdx(null)}
              />
            );
          })}
        </svg>

        {/* Interactive Axis Focus Readout */}
        <div className="radar-status-bar" role="status">
          {highlightedAxis ? (
            <>
              <strong>{highlightedAxis.label}:</strong>{' '}
              <span className="mono-num accent-ink">
                {molA.name} {scoresA[highlightedAxis.key]}
              </span>{' '}
              vs.{' '}
              <span className="mono-num">
                {molB.name} {scoresB[highlightedAxis.key]}
              </span>
            </>
          ) : (
            <>
              <span className="mono-num accent-ink">
                A: {molA.name} ({scoresA.composite.toFixed(1)})
              </span>
              <span className="radar-sep">&middot;</span>
              <span className="mono-num">
                B: {molB.name} ({scoresB.composite.toFixed(1)})
              </span>
            </>
          )}
        </div>
      </div>

      {/* Side-by-Side Numeric Comparison Table */}
      <div className="compare-grid-table">
        <div className="compare-head-row">
          <span>Metric</span>
          <button type="button" className="compare-mol-btn accent-ink" onClick={() => onInspect(molA)}>
            {molA.name}
          </button>
          <button type="button" className="compare-mol-btn" onClick={() => onInspect(molB)}>
            {molB.name}
          </button>
        </div>
        {metricRows.map((row) => (
          <div key={row.label} className="compare-row">
            <span className="compare-metric">{row.label}</span>
            <span className={`compare-val mono-num ${row.winner === 'a' ? 'win-a' : ''}`}>
              {row.aVal}
            </span>
            <span className={`compare-val mono-num ${row.winner === 'b' ? 'win-b' : ''}`}>
              {row.bVal}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
