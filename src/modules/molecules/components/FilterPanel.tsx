import React from 'react';
import { FilterState, Pathway, ClinicalPhase } from '../types';
import { PATHWAYS, CLINICAL_PHASES, PATHWAY_COLORS } from '../data/compounds';
import { RO5_LIMITS } from '../utils/cheminformatics';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
  pathwayCounts: Record<string, number>;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
  pathwayCounts,
}) => {
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const applyPreset = (preset: 'ro5' | 'potent' | 'clinical') => {
    if (preset === 'ro5') {
      onChange({
        ...filters,
        maxMw: 500,
        maxLogP: 5,
        maxHbd: 5,
        maxHba: 10,
        strictRo5Only: true,
      });
    } else if (preset === 'potent') {
      onChange({
        ...filters,
        minPotency: 7.0,
        maxMw: 1000,
        maxLogP: 8,
        maxHbd: 15,
        maxHba: 20,
        strictRo5Only: false,
      });
    } else if (preset === 'clinical') {
      onChange({
        ...filters,
        phase: 'Approved',
      });
    }
  };

  return (
    <section className="card filter-panel" aria-label="Screening Filters">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Narrow the shortlist</h2>
          <p className="panel-subtitle">
            Showing <strong className="mono-num">{filteredCount}</strong> of{' '}
            <span className="mono-num">{totalCount}</span> molecules. Each filter below rules out
            molecules whose chemistry fails that limit.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={onReset}
          aria-label="Reset all filters"
        >
          Reset
        </button>
      </div>

      {/* Search */}
      <div className="field-group">
        <label htmlFor="compound-search" className="field-label">
          Search by name, biological target, or database ID
        </label>
        <div className="search-input-wrap">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="compound-search"
            type="search"
            className="text-input"
            placeholder="e.g. Rapamycin, mTOR, CHEMBL1431..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="field-group">
        <span className="field-label">One-click shortcuts</span>
        <div className="preset-row">
          <button
            type="button"
            className="btn-preset"
            onClick={() => applyPreset('ro5')}
          >
            Passes the pill checklist
          </button>
          <button
            type="button"
            className="btn-preset"
            onClick={() => applyPreset('potent')}
          >
            Strong on target
          </button>
          <button
            type="button"
            className="btn-preset"
            onClick={() => applyPreset('clinical')}
          >
            Already an approved medicine
          </button>
        </div>
      </div>

      {/* Target Pathway Pills */}
      <div className="field-group">
        <span className="field-label">
          Biological system it acts on (pathway)
          <small className="field-hint">
            The body process the molecule nudges, for example mTOR, the growth switch that
            fasting and rapamycin dial down, or senolytics, which clear worn-out cells.
          </small>
        </span>
        <div className="pill-grid" role="group" aria-label="Filter by target pathway">
          <button
            type="button"
            className={`pathway-pill ${filters.pathway === 'All' ? 'active' : ''}`}
            onClick={() => update('pathway', 'All')}
          >
            <span>All</span>
            <span className="pill-count">{totalCount}</span>
          </button>
          {PATHWAYS.map((pw: Pathway) => {
            const active = filters.pathway === pw;
            const color = PATHWAY_COLORS[pw];
            return (
              <button
                key={pw}
                type="button"
                className={`pathway-pill ${active ? 'active' : ''}`}
                style={
                  active
                    ? {
                        backgroundColor: color.hex,
                        borderColor: color.hex,
                        color: '#ffffff',
                      }
                    : undefined
                }
                onClick={() => update('pathway', pw)}
              >
                <span
                  className="pathway-dot"
                  style={{ backgroundColor: active ? '#ffffff' : color.hex }}
                  aria-hidden="true"
                />
                <span>{pw}</span>
                <span className="pill-count">{pathwayCounts[pw] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clinical Phase Select */}
      <div className="field-group">
        <label htmlFor="phase-select" className="field-label">
          How far it got in human trials
          <small className="field-hint">
            Preclinical means animals only. Phase 1 to 3 are human trials of rising size.
            Approved means in use as a medicine.
          </small>
        </label>
        <select
          id="phase-select"
          className="select-input"
          value={filters.phase}
          onChange={(e) => update('phase', e.target.value as ClinicalPhase | 'All')}
        >
          <option value="All">Any stage</option>
          {CLINICAL_PHASES.map((phase) => (
            <option key={phase} value={phase}>
              {phase}
            </option>
          ))}
        </select>
      </div>

      <hr className="divider" />

      {/* Lipinski Rule-of-5 Sliders */}
      <div className="sliders-header">
        <span className="field-label">
          Pill checklist limits (Lipinski rule of five)
          <small className="field-hint">
            Four quick limits on size, greasiness and stickiness that most successful pills
            respect. Molecules over a limit are usually hard to swallow and absorb.
          </small>
        </span>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={filters.strictRo5Only}
            onChange={(e) => update('strictRo5Only', e.target.checked)}
          />
          <span>Only molecules failing at most one of the four</span>
        </label>
      </div>

      <div className="slider-list">
        <div className="slider-item">
          <div className="slider-meta">
            <label htmlFor="slider-mw">
              Biggest molecule allowed (molecular weight)
              <small className="field-hint">
                Weight of one molecule in daltons. Heavier molecules get absorbed less well.
              </small>
            </label>
            <span className="mono-num slider-val">
              &le; {filters.maxMw} Da
              {filters.maxMw <= RO5_LIMITS.mw ? ' (checklist limit)' : ''}
            </span>
          </div>
          <input
            id="slider-mw"
            type="range"
            min={100}
            max={1000}
            step={10}
            value={filters.maxMw}
            onChange={(e) => update('maxMw', Number(e.target.value))}
          />
          <div className="slider-ticks">
            <span>100</span>
            <span className="ro5-tick">checklist: 500 Da</span>
            <span>1000</span>
          </div>
        </div>

        <div className="slider-item">
          <div className="slider-meta">
            <label htmlFor="slider-logp">
              Greasiest allowed (logP)
              <small className="field-hint">
                How much it prefers oil over water. Too low and it cannot cross cell membranes,
                too high and it sticks in fat.
              </small>
            </label>
            <span className="mono-num slider-val">
              &le; {filters.maxLogP.toFixed(1)}
              {filters.maxLogP <= RO5_LIMITS.logP ? ' (checklist limit)' : ''}
            </span>
          </div>
          <input
            id="slider-logp"
            type="range"
            min={-4}
            max={8}
            step={0.2}
            value={filters.maxLogP}
            onChange={(e) => update('maxLogP', Number(e.target.value))}
          />
          <div className="slider-ticks">
            <span>-4.0</span>
            <span className="ro5-tick">checklist: 5.0</span>
            <span>8.0</span>
          </div>
        </div>

        <div className="slider-item">
          <div className="slider-meta">
            <label htmlFor="slider-hbd">
              Most sticky hydrogens allowed (H-bond donors)
              <small className="field-hint">
                Spots that can hand a hydrogen to water. Many of them make the molecule too
                water-loving to cross membranes.
              </small>
            </label>
            <span className="mono-num slider-val">
              &le; {filters.maxHbd}
              {filters.maxHbd <= RO5_LIMITS.hbd ? ' (checklist limit)' : ''}
            </span>
          </div>
          <input
            id="slider-hbd"
            type="range"
            min={0}
            max={15}
            step={1}
            value={filters.maxHbd}
            onChange={(e) => update('maxHbd', Number(e.target.value))}
          />
          <div className="slider-ticks">
            <span>0</span>
            <span className="ro5-tick">checklist: 5</span>
            <span>15</span>
          </div>
        </div>

        <div className="slider-item">
          <div className="slider-meta">
            <label htmlFor="slider-hba">
              Most water-grabbing spots allowed (H-bond acceptors)
              <small className="field-hint">
                The matching spots that accept a hydrogen from water. Same trade-off as above.
              </small>
            </label>
            <span className="mono-num slider-val">
              &le; {filters.maxHba}
              {filters.maxHba <= RO5_LIMITS.hba ? ' (checklist limit)' : ''}
            </span>
          </div>
          <input
            id="slider-hba"
            type="range"
            min={1}
            max={20}
            step={1}
            value={filters.maxHba}
            onChange={(e) => update('maxHba', Number(e.target.value))}
          />
          <div className="slider-ticks">
            <span>1</span>
            <span className="ro5-tick">checklist: 10</span>
            <span>20</span>
          </div>
        </div>

        <div className="slider-item">
          <div className="slider-meta">
            <label htmlFor="slider-potency">
              Weakest strength allowed (lab potency)
              <small className="field-hint">
                Each +1 means ten times stronger, so a ten times smaller dose does the same job.
              </small>
            </label>
            <span className="mono-num slider-val">
              &ge; {filters.minPotency.toFixed(1)}
            </span>
          </div>
          <input
            id="slider-potency"
            type="range"
            min={3.5}
            max={9.5}
            step={0.1}
            value={filters.minPotency}
            onChange={(e) => update('minPotency', Number(e.target.value))}
          />
          <div className="slider-ticks">
            <span>3.5 weak</span>
            <span>6.5 strong</span>
            <span>9.5 very strong</span>
          </div>
        </div>
      </div>
    </section>
  );
};
