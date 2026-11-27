import React from 'react';
import { RotateCcw, Search, ShieldAlert, Leaf } from 'lucide-react';
import { ABUNDANT_ELEMENTS, BOTTLENECK_ELEMENTS } from '../data/materials';

export type RiskFilterMode = 'all' | 'abundant-only' | 'exclude-critical' | 'critical-only';

interface FilterPanelProps {
  bandGapMin: number;
  bandGapMax: number;
  onBandGapMinChange: (value: number) => void;
  onBandGapMaxChange: (value: number) => void;
  maxHull: number;
  onMaxHullChange: (value: number) => void;
  minAbundance: number;
  onMinAbundanceChange: (value: number) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  riskMode: RiskFilterMode;
  onRiskModeChange: (mode: RiskFilterMode) => void;
  excludedBottlenecks: string[];
  onToggleBottleneck: (symbol: string) => void;
  requiredAbundant: string[];
  onToggleAbundant: (symbol: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const RISK_MODES: { id: RiskFilterMode; label: string }[] = [
  { id: 'all', label: 'All Tiers' },
  { id: 'abundant-only', label: 'Abundant Only' },
  { id: 'exclude-critical', label: 'No Critical' },
  { id: 'critical-only', label: 'Critical Only' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  bandGapMin,
  bandGapMax,
  onBandGapMinChange,
  onBandGapMaxChange,
  maxHull,
  onMaxHullChange,
  minAbundance,
  onMinAbundanceChange,
  searchQuery,
  onSearchChange,
  riskMode,
  onRiskModeChange,
  excludedBottlenecks,
  onToggleBottleneck,
  requiredAbundant,
  onToggleAbundant,
  onReset,
  hasActiveFilters,
}) => {
  return (
    <aside className="card filter-card" aria-label="Pareto Spec Screener Controls">
      <div className="filter-header">
        <h2 className="card-title">Spec Screener</h2>
        {hasActiveFilters && (
          <button type="button" className="btn-reset" onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Target Band Gap Range */}
      <div className="filter-group">
        <div className="slider-header">
          <span className="filter-label">Target Band Gap (E_g)</span>
          <span className="mono-value accent-mono">
            {bandGapMin.toFixed(1)}–{bandGapMax.toFixed(1)} eV
          </span>
        </div>

        <div className="dual-slider-stack">
          <label className="sub-slider-row" htmlFor="bg-min-slider">
            <span className="sub-slider-tag">Min</span>
            <input
              id="bg-min-slider"
              type="range"
              min={0}
              max={7.5}
              step={0.1}
              value={bandGapMin}
              onChange={(e) => {
                const next = parseFloat(e.target.value);
                onBandGapMinChange(Math.min(next, bandGapMax));
              }}
              className="range-slider"
            />
            <span className="mono-readout">{bandGapMin.toFixed(1)}</span>
          </label>
          <label className="sub-slider-row" htmlFor="bg-max-slider">
            <span className="sub-slider-tag">Max</span>
            <input
              id="bg-max-slider"
              type="range"
              min={0.1}
              max={7.6}
              step={0.1}
              value={bandGapMax}
              onChange={(e) => {
                const next = parseFloat(e.target.value);
                onBandGapMaxChange(Math.max(next, bandGapMin));
              }}
              className="range-slider"
            />
            <span className="mono-readout">{bandGapMax.toFixed(1)}</span>
          </label>
        </div>
      </div>

      {/* Max Energy Above Hull */}
      <div className="filter-group">
        <div className="slider-header">
          <label htmlFor="hull-slider" className="filter-label">
            Stability Cutoff (E_hull)
          </label>
          <span className="mono-value">&le; {maxHull.toFixed(3)} eV/at</span>
        </div>
        <input
          id="hull-slider"
          type="range"
          min={0}
          max={0.065}
          step={0.005}
          value={maxHull}
          onChange={(e) => onMaxHullChange(parseFloat(e.target.value))}
          className="range-slider"
        />
        <div className="slider-scale">
          <span>0.000</span>
          <span>0.025 (synth.)</span>
          <span>0.065</span>
        </div>
      </div>

      {/* Min Earth Abundance Score */}
      <div className="filter-group">
        <div className="slider-header">
          <label htmlFor="abundance-slider" className="filter-label">
            Min Earth Abundance
          </label>
          <span className="mono-value">&ge; {minAbundance} / 100</span>
        </div>
        <input
          id="abundance-slider"
          type="range"
          min={0}
          max={95}
          step={5}
          value={minAbundance}
          onChange={(e) => onMinAbundanceChange(parseInt(e.target.value, 10))}
          className="range-slider"
        />
        <div className="slider-scale">
          <span>0 (Any)</span>
          <span>50</span>
          <span>95 (Abundant)</span>
        </div>
      </div>

      {/* Supply Risk Tier */}
      <div className="filter-group">
        <span className="filter-label">Supply Risk Tier</span>
        <div className="pill-grid">
          {RISK_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`filter-pill ${riskMode === m.id ? 'filter-pill-active' : ''}`}
              onClick={() => onRiskModeChange(m.id)}
              aria-pressed={riskMode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="filter-group">
        <label htmlFor="material-search" className="filter-label">
          Search Formula or MP ID
        </label>
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            id="material-search"
            type="search"
            className="search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="e.g. Si, LiFePO4, mp-149..."
          />
        </div>
      </div>

      {/* Element Filters tucked in clean collapsible drawer */}
      <details className="editorial-details filter-details">
        <summary className="details-summary">
          <span>
            Element Constraints
            {excludedBottlenecks.length + requiredAbundant.length > 0
              ? ` (${excludedBottlenecks.length + requiredAbundant.length} active)`
              : ''}
          </span>
        </summary>
        <div className="details-body">
          <div className="sub-filter-block">
            <span className="filter-label filter-label-icon">
              <ShieldAlert size={14} className="icon-danger" aria-hidden="true" />
              <span>Exclude Bottlenecks</span>
            </span>
            <div className="element-chip-row">
              {BOTTLENECK_ELEMENTS.map((el) => {
                const active = excludedBottlenecks.includes(el.symbol);
                return (
                  <button
                    key={el.symbol}
                    type="button"
                    className={`element-chip ${active ? 'element-chip-danger-active' : ''}`}
                    onClick={() => onToggleBottleneck(el.symbol)}
                    aria-pressed={active}
                    title={el.note}
                  >
                    <span className="el-symbol">{el.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sub-filter-block">
            <span className="filter-label filter-label-icon">
              <Leaf size={14} className="icon-success" aria-hidden="true" />
              <span>Require Abundant</span>
            </span>
            <div className="element-chip-row">
              {ABUNDANT_ELEMENTS.map((el) => {
                const active = requiredAbundant.includes(el.symbol);
                return (
                  <button
                    key={el.symbol}
                    type="button"
                    className={`element-chip ${active ? 'element-chip-abundant-active' : ''}`}
                    onClick={() => onToggleAbundant(el.symbol)}
                    aria-pressed={active}
                  >
                    <span className="el-symbol">{el.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </details>
    </aside>
  );
};
