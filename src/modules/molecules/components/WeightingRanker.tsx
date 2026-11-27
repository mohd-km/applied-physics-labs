import React from 'react';
import { Compound, ScoredCompound, WeightProfile } from '../types';
import { PATHWAY_COLORS } from '../data/compounds';

interface WeightingRankerProps {
  weights: WeightProfile;
  onChangeWeights: (next: WeightProfile) => void;
  rankedCompounds: ScoredCompound[];
  compareAId: string;
  compareBId: string;
  onSetCompareA: (id: string) => void;
  onSetCompareB: (id: string) => void;
  onInspect: (compound: Compound) => void;
}

const WEIGHT_PRESETS: { id: string; label: string; profile: WeightProfile }[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    profile: { oralBioavailability: 30, bbbPermeability: 15, pathwayAffinity: 30, safety: 25 },
  },
  {
    id: 'cns',
    label: 'CNS / Brain',
    profile: { oralBioavailability: 20, bbbPermeability: 45, pathwayAffinity: 20, safety: 15 },
  },
  {
    id: 'oral-safe',
    label: 'Oral Repurposing',
    profile: { oralBioavailability: 40, bbbPermeability: 10, pathwayAffinity: 15, safety: 35 },
  },
  {
    id: 'potency',
    label: 'Max Affinity',
    profile: { oralBioavailability: 15, bbbPermeability: 10, pathwayAffinity: 55, safety: 20 },
  },
];

const SLIDER_META: { key: keyof WeightProfile; label: string; short: string }[] = [
  { key: 'oralBioavailability', label: 'Oral Bioavailability', short: 'Ro5 + Veber' },
  { key: 'bbbPermeability', label: 'BBB Permeability', short: 'CNS MPO' },
  { key: 'pathwayAffinity', label: 'Pathway Affinity', short: 'pIC50 + DrugAge' },
  { key: 'safety', label: 'Safety & Maturity', short: 'Phase + QED' },
];

export const WeightingRanker: React.FC<WeightingRankerProps> = ({
  weights,
  onChangeWeights,
  rankedCompounds,
  compareAId,
  compareBId,
  onSetCompareA,
  onSetCompareB,
  onInspect,
}) => {
  const totalW =
    weights.oralBioavailability +
    weights.bbbPermeability +
    weights.pathwayAffinity +
    weights.safety;

  const pct = (val: number) => (totalW > 0 ? Math.round((val / totalW) * 100) : 25);

  const isPresetActive = (p: WeightProfile) =>
    p.oralBioavailability === weights.oralBioavailability &&
    p.bbbPermeability === weights.bbbPermeability &&
    p.pathwayAffinity === weights.pathwayAffinity &&
    p.safety === weights.safety;

  const topRanked = rankedCompounds.slice(0, 8);

  return (
    <section className="card ranker-card" aria-label="Custom Weighting Sliders and Live Ranking">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Custom Weighting Ranker</h2>
          <p className="panel-subtitle">
            Drag sliders to re-rank all {rankedCompounds.length} compounds live.
          </p>
        </div>
        <div className="preset-row" role="group" aria-label="Weighting profile presets">
          {WEIGHT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`btn-preset ${isPresetActive(preset.profile) ? 'active' : ''}`}
              onClick={() => onChangeWeights(preset.profile)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Custom Weighting Sliders */}
      <div className="weight-sliders-grid">
        {SLIDER_META.map((item) => {
          const val = weights[item.key];
          return (
            <div key={item.key} className="weight-slider-box">
              <div className="slider-meta">
                <label htmlFor={`weight-${item.key}`} className="weight-label">
                  <span>{item.label}</span>
                  <span className="weight-hint">{item.short}</span>
                </label>
                <span className="mono-num slider-val">
                  {pct(val)}%
                </span>
              </div>
              <input
                id={`weight-${item.key}`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={val}
                onChange={(e) =>
                  onChangeWeights({ ...weights, [item.key]: Number(e.target.value) })
                }
              />
            </div>
          );
        })}
      </div>

      {/* Live Top-8 Visual Leaderboard */}
      <div className="leaderboard-block">
        <div className="leaderboard-head">
          <span className="field-label">Live Top Ranked Candidates</span>
          <span className="leaderboard-caption">Tap A / B to load radar</span>
        </div>

        <div className="leaderboard-list" role="list">
          {topRanked.map(({ compound, scores, rank }) => {
            const isA = compound.id === compareAId;
            const isB = compound.id === compareBId;
            const pwColor = PATHWAY_COLORS[compound.pathway].hex;

            return (
              <div
                key={compound.id}
                className={`leader-row ${isA || isB ? 'is-compared' : ''}`}
                role="listitem"
              >
                <span className="leader-rank mono-num">#{rank}</span>

                <button
                  type="button"
                  className="leader-main"
                  onClick={() => onInspect(compound)}
                  aria-label={`Inspect ${compound.name}, score ${scores.composite}`}
                >
                  <div className="leader-top">
                    <span className="leader-name">
                      <span
                        className="pathway-dot"
                        style={{ backgroundColor: pwColor }}
                        aria-hidden="true"
                      />
                      {compound.name}
                    </span>
                    <span className="leader-score mono-num">{scores.composite.toFixed(1)}</span>
                  </div>
                  <div className="leader-bar-track" aria-hidden="true">
                    <div
                      className="leader-bar-fill"
                      style={{ width: `${Math.min(100, scores.composite)}%` }}
                    />
                  </div>
                </button>

                <div className="leader-actions">
                  <button
                    type="button"
                    className={`cmp-chip ${isA ? 'active-a' : ''}`}
                    onClick={() => onSetCompareA(compound.id)}
                    aria-label={`Set ${compound.name} as Molecule A`}
                    aria-pressed={isA}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    className={`cmp-chip ${isB ? 'active-b' : ''}`}
                    onClick={() => onSetCompareB(compound.id)}
                    aria-label={`Set ${compound.name} as Molecule B`}
                    aria-pressed={isB}
                  >
                    B
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collapsible Scoring Methodology Drawer */}
      <details className="editorial-details">
        <summary>Scoring formulas &amp; ADMET criteria</summary>
        <div className="details-body">
          <p>
            <strong>Oral Bioavailability:</strong> 45% Lipinski Ro5 margin + 30% Veber rules
            (TPSA &le; 140 A&sup2;, rotatable bonds &le; 10) + 25% QED.
          </p>
          <p>
            <strong>BBB Permeability:</strong> Wager CNS MPO weighting across TPSA (&le; 60 A&sup2;
            optimal), MW (&le; 360 Da), cLogP (1.0&ndash;4.0), and HBD (&le; 1).
          </p>
          <p>
            <strong>Pathway Affinity:</strong> 75% normalized ChEMBL potency (pIC50/pKi/pEC50) +
            25% DrugAge median lifespan delta.
          </p>
          <p>
            <strong>Safety &amp; Maturity:</strong> 52% human clinical development phase + 48%
            physicochemical safety margin (QED and Ro5 compliance).
          </p>
        </div>
      </details>
    </section>
  );
};
