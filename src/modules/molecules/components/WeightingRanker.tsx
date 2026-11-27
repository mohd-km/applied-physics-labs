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
    label: 'Brain first',
    profile: { oralBioavailability: 20, bbbPermeability: 45, pathwayAffinity: 20, safety: 15 },
  },
  {
    id: 'oral-safe',
    label: 'Safe existing pills',
    profile: { oralBioavailability: 40, bbbPermeability: 10, pathwayAffinity: 15, safety: 35 },
  },
  {
    id: 'potency',
    label: 'Strongest on target',
    profile: { oralBioavailability: 15, bbbPermeability: 10, pathwayAffinity: 55, safety: 20 },
  },
];

const SLIDER_META: { key: keyof WeightProfile; label: string; short: string }[] = [
  { key: 'oralBioavailability', label: 'Works as a pill', short: 'survives the gut, gets into the blood' },
  { key: 'bbbPermeability', label: 'Reaches the brain', short: 'crosses the brain’s filter' },
  { key: 'pathwayAffinity', label: 'Hits its target hard', short: 'lab strength plus animal lifespan gains' },
  { key: 'safety', label: 'Safety and trial track record', short: 'how far it got in humans' },
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
          <h2 className="panel-title">Decide what matters, see the ranking change</h2>
          <p className="panel-subtitle">
            Four sliders set how much you care about each quality. The {rankedCompounds.length}{' '}
            molecules below re-sort as you drag. Percentages show each quality's share of the
            final score.
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
          <span className="field-label">Top molecules under your weights</span>
          <span className="leaderboard-caption">
            Tap a name for the full profile, or A / B to put it on the comparison chart
          </span>
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
        <summary>How each of the four scores is worked out</summary>
        <div className="details-body">
          <p>
            Every score is out of 100 and comes from published rules of thumb applied to the
            molecule's measured properties. Nothing here is trained or fitted.
          </p>
          <p>
            <strong>Works as a pill:</strong> 45% how well it passes the rule of five, a quick
            checklist of whether a molecule could work as a pill (weight under 500 daltons,
            greasiness under 5, few hydrogen-bond donors and acceptors) + 30% Veber's rules
            (water-friendly surface, or TPSA, at most 140 square angstroms and at most 10
            bendable bonds, so it is not too floppy) + 25% drug-likeness (QED), a 0 to 1 score
            for how much it resembles normal approved drugs.
          </p>
          <p>
            <strong>Reaches the brain:</strong> the Wager CNS MPO scoring, which rewards a small
            water-friendly surface (TPSA at most 60), light weight (at most 360 daltons),
            middling greasiness (logP 1 to 4) and at most one hydrogen-bond donor. Those are the
            traits of molecules that get past the brain's filter.
          </p>
          <p>
            <strong>Hits its target hard:</strong> 75% lab strength from the ChEMBL database of
            measured drug activity (pIC50, pKi or pEC50: each +1 means ten times stronger) + 25%
            the extra lifespan seen in treated animals, from the DrugAge database of published
            ageing studies.
          </p>
          <p>
            <strong>Safety and trial track record:</strong> 52% how far it got in human trials,
            from preclinical up to approved + 48% a chemistry safety margin from drug-likeness
            and the pill checklist.
          </p>
        </div>
      </details>
    </section>
  );
};
