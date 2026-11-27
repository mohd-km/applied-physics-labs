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
    label: 'Academic Core (5K)',
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
    label: 'Biotech Seed (50K)',
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
    label: 'Pharma Scale (250K)',
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
    <section className="card econ-card" aria-label="R&D Unit-Economics Calculator">
      <div className="panel-header econ-header">
        <div>
          <h2 className="panel-title">R&amp;D Unit-Economics Simulator</h2>
          <p className="panel-subtitle">
            Model wet-lab HTS spend versus virtual triage plus confirmatory assays.
          </p>
        </div>
        <div className="preset-row" role="group" aria-label="Unit economics scenario presets">
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
              <label htmlFor="econ-lib">Screening Library Size</label>
              <span className="mono-num slider-val">
                {input.librarySize.toLocaleString()} cmpds
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
              <label htmlFor="econ-wet">Wet-Lab HTS Cost / Cmpd</label>
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
              <label htmlFor="econ-compute">In-Silico Compute / Cmpd</label>
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
              <label htmlFor="econ-retain">Triage Retention Rate</label>
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
              <label htmlFor="econ-confirm">Confirmatory Assay / Hit</label>
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
              <label htmlFor="econ-enrich">Hit Enrichment Factor</label>
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
              <span className="kpi-label">Net Capital Saved</span>
              <span className="kpi-big mono-num">
                {output.netSavings >= 0
                  ? formatCurrency(output.netSavings)
                  : `-${formatCurrency(Math.abs(output.netSavings))}`}
              </span>
              <span className="kpi-note mono-num">
                {output.costReductionPct.toFixed(1)}% cost reduction
              </span>
            </div>

            <div className="econ-kpi">
              <span className="kpi-label">Timeline Saved</span>
              <span className="kpi-big mono-num">{output.weeksSaved} wks</span>
              <span className="kpi-note mono-num">
                {output.traditionalWeeks}w vs {output.hybridWeeks}w hybrid
              </span>
            </div>

            <div className="econ-kpi">
              <span className="kpi-label">Cost / Validated Lead</span>
              <span className="kpi-big mono-num">
                {formatCurrency(output.costPerLeadHybrid)}
              </span>
              <span className="kpi-note mono-num">
                vs {formatCurrency(output.costPerLeadTraditional)} HTS
              </span>
            </div>

            <div className="econ-kpi">
              <span className="kpi-label">Validated Leads</span>
              <span className="kpi-big mono-num">{output.hybridLeads}</span>
              <span className="kpi-note mono-num">
                from {output.retainedCompounds.toLocaleString()} assayed
              </span>
            </div>
          </div>

          <div className="econ-chart-box">
            <h3 className="drawer-section-title">Campaign Spend Comparison</h3>
            <svg
              viewBox="0 0 600 156"
              className="econ-svg"
              role="img"
              aria-label={`Cost comparison: Traditional HTS ${formatExactCurrency(
                output.traditionalTotalCost
              )} versus Hybrid In-Silico ${formatExactCurrency(output.hybridTotalCost)}`}
            >
              <text x="0" y="20" fontSize="12.5" fontWeight="600" fill="#111111">
                Traditional Wet-Lab HTS ({input.librarySize.toLocaleString()} assays)
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
                Hybrid In-Silico Triage + Confirmatory Wet-Lab
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
                  In-Silico Compute Triage
                </span>
                <span className="mono-num">{formatExactCurrency(output.inSilicoComputeCost)}</span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">
                  <span className="legend-swatch" style={{ backgroundColor: '#166534' }} />
                  Confirmatory Wet-Lab ({output.retainedCompounds.toLocaleString()} hits)
                </span>
                <span className="mono-num">
                  {formatExactCurrency(output.confirmatoryWetLabCost)}
                </span>
              </div>
              <div className="breakdown-row total">
                <span>Traditional Full HTS Baseline</span>
                <span className="mono-num">
                  {formatExactCurrency(output.traditionalTotalCost)}
                </span>
              </div>
            </div>
          </div>

          <details className="editorial-details">
            <summary>Throughput &amp; enrichment model assumptions</summary>
            <div className="details-body">
              <p>
                Traditional HTS throughput assumes 2,500 compounds/week (min 4 weeks) at a 0.25%
                random hit rate. Hybrid triage models 1.5 weeks virtual docking/ADMET plus 400
                confirmatory assays/week, with enriched hit rate capped at 35%.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
};
