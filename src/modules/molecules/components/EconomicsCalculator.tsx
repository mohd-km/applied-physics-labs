import React, { useMemo, useState } from 'react';
import { EconomicsInput } from '../types';
import {
  calculateUnitEconomics,
  formatCurrency,
  formatExactCurrency,
} from '../utils/cheminformatics';

const PRESETS: { id: string; label: string; config: EconomicsInput }[] = [
  {
    id: 'academic',
    label: 'University lab, 5,000 molecules',
    config: {
      librarySize: 5000,
      wetLabCostPerCompound: 35,
      inSilicoCostPerCompound: 0.04,
      triageRetentionPct: 3.0,
      confirmatoryAssayCost: 250,
      enrichmentFactor: 10,
    },
  },
  {
    id: 'biotech',
    label: 'Small biotech, 50,000 molecules',
    config: {
      librarySize: 50000,
      wetLabCostPerCompound: 45,
      inSilicoCostPerCompound: 0.05,
      triageRetentionPct: 2.0,
      confirmatoryAssayCost: 350,
      enrichmentFactor: 12,
    },
  },
  {
    id: 'pharma',
    label: 'Big pharma, 250,000 molecules',
    config: {
      librarySize: 250000,
      wetLabCostPerCompound: 32,
      inSilicoCostPerCompound: 0.03,
      triageRetentionPct: 1.0,
      confirmatoryAssayCost: 420,
      enrichmentFactor: 15,
    },
  },
];

export const EconomicsCalculator: React.FC = () => {
  const [input, setInput] = useState<EconomicsInput>(PRESETS[1].config);

  const output = useMemo(() => calculateUnitEconomics(input), [input]);

  const update = <K extends keyof EconomicsInput>(key: K, value: EconomicsInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const maxCost = Math.max(output.traditionalTotalCost, output.hybridTotalCost, 1);
  const tradBarW = (output.traditionalTotalCost / maxCost) * 420;
  const computeBarW = Math.max(3, (output.inSilicoComputeCost / maxCost) * 420);
  const confirmBarW = Math.max(4, (output.confirmatoryWetLabCost / maxCost) * 420);

  return (
    <section className="card econ-card" aria-label="What screening costs, two ways">
      <div className="panel-header econ-header">
        <div>
          <h2 className="panel-title">What screening costs, two ways</h2>
          <p className="panel-subtitle">
            Testing every molecule in a lab is slow and expensive. The other way is to score them
            all on a computer first, then test only the best in the lab. These sliders price both
            routes with your own assumptions.
          </p>
        </div>
        <div className="preset-row" role="group" aria-label="Example screening budgets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn-preset ${
                input.librarySize === p.config.librarySize &&
                input.wetLabCostPerCompound === p.config.wetLabCostPerCompound
                  ? 'active'
                  : ''
              }`}
              onClick={() => setInput(p.config)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="econ-grid">
        <div className="econ-controls">
          <div className="slider-item">
            <div className="slider-meta">
              <label htmlFor="econ-lib">
                How many molecules to screen
              </label>
              <span className="mono-num slider-val">
                {input.librarySize.toLocaleString()}
              </span>
            </div>
            <input
              id="econ-lib"
              type="range"
              min={1000}
              max={500000}
              step={1000}
              value={input.librarySize}
              onChange={(e) => update('librarySize', Number(e.target.value))}
            />
            <div className="slider-ticks mono-num">
              <span>1K</span>
              <span>250K</span>
              <span>500K</span>
            </div>
          </div>

          <div className="slider-item">
            <div className="slider-meta">
              <label htmlFor="econ-wet">
                Lab cost to test one molecule
              </label>
              <span className="mono-num slider-val">${input.wetLabCostPerCompound}</span>
            </div>
            <input
              id="econ-wet"
              type="range"
              min={15}
              max={150}
              step={1}
              value={input.wetLabCostPerCompound}
              onChange={(e) => update('wetLabCostPerCompound', Number(e.target.value))}
            />
            <div className="slider-ticks mono-num">
              <span>$15</span>
              <span>$75</span>
              <span>$150</span>
            </div>
          </div>

          <div className="slider-item">
            <div className="slider-meta">
              <label htmlFor="econ-compute">
                Computer cost to score one molecule
              </label>
              <span className="mono-num slider-val">
                ${input.inSilicoCostPerCompound.toFixed(2)}
              </span>
            </div>
            <input
              id="econ-compute"
              type="range"
              min={0.01}
              max={0.5}
              step={0.01}
              value={input.inSilicoCostPerCompound}
              onChange={(e) => update('inSilicoCostPerCompound', Number(e.target.value))}
            />
            <div className="slider-ticks mono-num">
              <span>$0.01</span>
              <span>$0.25</span>
              <span>$0.50</span>
            </div>
          </div>

          <div className="slider-item">
            <div className="slider-meta">
              <label htmlFor="econ-retain">
                Share the computer keeps for lab testing
              </label>
              <span className="mono-num slider-val">
                {input.triageRetentionPct.toFixed(1)}% ({output.retainedCompounds.toLocaleString()})
              </span>
            </div>
            <input
              id="econ-retain"
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={input.triageRetentionPct}
              onChange={(e) => update('triageRetentionPct', Number(e.target.value))}
            />
            <div className="slider-ticks mono-num">
              <span>0.5%</span>
              <span>5.0%</span>
              <span>10.0%</span>
            </div>
          </div>

          <div className="slider-item">
            <div className="slider-meta">
              <label htmlFor="econ-confirm">
                Lab cost to confirm one promising molecule
              </label>
              <span className="mono-num slider-val">${input.confirmatoryAssayCost}</span>
            </div>
            <input
              id="econ-confirm"
              type="range"
              min={100}
              max={1200}
              step={25}
              value={input.confirmatoryAssayCost}
              onChange={(e) => update('confirmatoryAssayCost', Number(e.target.value))}
            />
            <div className="slider-ticks mono-num">
              <span>$100</span>
              <span>$600</span>
              <span>$1,200</span>
            </div>
          </div>

          <div className="slider-item">
            <div className="slider-meta">
              <label htmlFor="econ-enrich">
                How much better than guesswork the computer is
                <small className="field-hint">
                  10x means the shortlist contains ten times as many real hits as a random pick
                  would.
                </small>
              </label>
              <span className="mono-num slider-val">{input.enrichmentFactor}x</span>
            </div>
            <input
              id="econ-enrich"
              type="range"
              min={4}
              max={25}
              step={1}
              value={input.enrichmentFactor}
              onChange={(e) => update('enrichmentFactor', Number(e.target.value))}
            />
            <div className="slider-ticks mono-num">
              <span>4x</span>
              <span>15x</span>
              <span>25x</span>
            </div>
          </div>
        </div>

        <div className="econ-results">
          <div className="econ-kpi-grid">
            <div className="econ-kpi highlight">
              <span className="kpi-label">Money saved</span>
              <span className="kpi-big mono-num">
                {output.netSavings >= 0
                  ? formatCurrency(output.netSavings)
                  : `-${formatCurrency(Math.abs(output.netSavings))}`}
              </span>
              <span className="kpi-note mono-num">
                {output.costReductionPct.toFixed(1)}% cheaper than lab-only
              </span>
            </div>

            <div className="econ-kpi">
              <span className="kpi-label">Time saved</span>
              <span className="kpi-big mono-num">{output.weeksSaved} weeks</span>
              <span className="kpi-note mono-num">
                {output.traditionalWeeks} weeks lab-only, {output.hybridWeeks} weeks with the
                computer first
              </span>
            </div>

            <div className="econ-kpi">
              <span className="kpi-label">Cost per confirmed hit</span>
              <span className="kpi-big mono-num">
                {formatCurrency(output.costPerLeadHybrid)}
              </span>
              <span className="kpi-note mono-num">
                against {formatCurrency(output.costPerLeadTraditional)} lab-only
              </span>
            </div>

            <div className="econ-kpi">
              <span className="kpi-label">Confirmed hits found</span>
              <span className="kpi-big mono-num">{output.hybridLeads}</span>
              <span className="kpi-note mono-num">
                out of {output.retainedCompounds.toLocaleString()} tested in the lab
              </span>
            </div>
          </div>

          <div className="econ-chart-box">
            <h3 className="drawer-section-title">Where the money goes</h3>
            <svg
              viewBox="0 0 600 156"
              className="econ-svg"
              role="img"
              aria-label={`Cost comparison: lab-only ${formatExactCurrency(
                output.traditionalTotalCost
              )} against computer first ${formatExactCurrency(output.hybridTotalCost)}`}
            >
              <text x="0" y="20" fontSize="12.5" fontWeight="600" fill="#111111">
                Lab-only: test all {input.librarySize.toLocaleString()} molecules
              </text>
              <rect x="0" y="30" width="420" height="28" rx="4" fill="#fafaf9" stroke="#e5e5e3" />
              <rect x="0" y="30" width={tradBarW} height="28" rx="4" fill="#71717a" />
              <text
                x="432"
                y="49"
                fontSize="13"
                fontWeight="600"
                fill="#111111"
                className="svg-num"
              >
                {formatCurrency(output.traditionalTotalCost)}
              </text>

              <text x="0" y="92" fontSize="12.5" fontWeight="600" fill="#166534">
                Computer first, then confirm the shortlist in the lab
              </text>
              <rect x="0" y="102" width="420" height="28" rx="4" fill="#fafaf9" stroke="#e5e5e3" />
              <rect x="0" y="102" width={computeBarW} height="28" rx="3" fill="#52525b" />
              <rect
                x={computeBarW}
                y="102"
                width={Math.min(420 - computeBarW, confirmBarW)}
                height="28"
                rx="3"
                fill="#166534"
              />
              <text
                x="432"
                y="121"
                fontSize="13"
                fontWeight="600"
                fill="#166534"
                className="svg-num"
              >
                {formatCurrency(output.hybridTotalCost)}
              </text>
            </svg>

            <div className="econ-breakdown-list">
              <div className="breakdown-row">
                <span className="breakdown-label">
                  <span className="legend-swatch" style={{ backgroundColor: '#52525b' }} />
                  Computer scoring
                </span>
                <span className="mono-num">{formatExactCurrency(output.inSilicoComputeCost)}</span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">
                  <span className="legend-swatch" style={{ backgroundColor: '#166534' }} />
                  Lab tests on the shortlist ({output.retainedCompounds.toLocaleString()})
                </span>
                <span className="mono-num">
                  {formatExactCurrency(output.confirmatoryWetLabCost)}
                </span>
              </div>
              <div className="breakdown-row total">
                <span>Lab-only route, for comparison</span>
                <span className="mono-num">
                  {formatExactCurrency(output.traditionalTotalCost)}
                </span>
              </div>
            </div>
          </div>

          <details className="editorial-details">
            <summary>The speed and hit-rate assumptions behind these numbers</summary>
            <div className="details-body">
              <p>
                Lab-only route: 2,500 molecules tested per week, never less than 4 weeks in
                total, and 1 in 400 of them turns out to be a real hit. That 0.25% is the usual
                figure for picking molecules blind.
              </p>
              <p>
                Computer-first route: about 1.5 weeks of scoring, then 400 lab confirmations per
                week. The shortlist's hit rate is 0.25% multiplied by the slider above, capped at
                35%, because no shortlist is ever better than about one hit in three.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
};
