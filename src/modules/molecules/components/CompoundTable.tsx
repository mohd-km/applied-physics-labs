import React from 'react';
import { Compound, ScoredCompound, SortDirection, SortField } from '../types';
import { PATHWAY_COLORS } from '../data/compounds';
import { evaluateLipinski } from '../utils/cheminformatics';

interface CompoundTableProps {
  scoredCompounds: ScoredCompound[];
  selectedId: string | null;
  compareAId: string;
  compareBId: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelect: (compound: Compound) => void;
  onSetCompareA: (id: string) => void;
  onSetCompareB: (id: string) => void;
}

const COLUMNS: { field: SortField; label: string; numeric?: boolean }[] = [
  { field: 'composite', label: 'Score', numeric: true },
  { field: 'name', label: 'Compound' },
  { field: 'pathway', label: 'Pathway' },
  { field: 'potency', label: 'Potency', numeric: true },
  { field: 'qed', label: 'QED', numeric: true },
  { field: 'mw', label: 'MW (Da)', numeric: true },
  { field: 'ro5Violations', label: 'Ro5', numeric: true },
  { field: 'clinicalPhase', label: 'Phase' },
  { field: 'drugAgeDeltaPct', label: 'DrugAge', numeric: true },
];

export const CompoundTable: React.FC<CompoundTableProps> = ({
  scoredCompounds,
  selectedId,
  compareAId,
  compareBId,
  sortField,
  sortDirection,
  onSort,
  onSelect,
  onSetCompareA,
  onSetCompareB,
}) => {
  return (
    <section className="card table-card" aria-label="Live-Ranked Compound Library">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Live-Ranked Compound Library</h2>
          <p className="panel-subtitle">
            Re-ranks automatically with your weights. Tap a row for its full profile.
          </p>
        </div>
        <span className="count-badge mono-num">{scoredCompounds.length} compounds</span>
      </div>

      <div className="table-scroll" role="region" aria-label="Scrollable compound table" tabIndex={0}>
        <table className="data-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const isActive = sortField === col.field;
                return (
                  <th
                    key={col.field}
                    className={col.numeric ? 'num-col' : undefined}
                    aria-sort={
                      isActive
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      className={`sort-btn ${isActive ? 'active' : ''} ${
                        col.numeric ? 'num-align' : ''
                      }`}
                      onClick={() => onSort(col.field)}
                    >
                      <span>{col.label}</span>
                      <span className="sort-arrow" aria-hidden="true">
                        {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th className="compare-col-head">Radar</th>
            </tr>
          </thead>
          <tbody>
            {scoredCompounds.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="empty-cell">
                  No compounds match the active filters.
                </td>
              </tr>
            ) : (
              scoredCompounds.map(({ compound: c, scores, rank }) => {
                const ro5 = evaluateLipinski(c);
                const pwColor = PATHWAY_COLORS[c.pathway];
                const isSelected = c.id === selectedId;
                const isA = c.id === compareAId;
                const isB = c.id === compareBId;

                return (
                  <tr
                    key={c.id}
                    className={`compound-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelect(c)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(c);
                      }
                    }}
                  >
                    <td className="num-col mono-num score-cell">
                      <span className="rank-num">#{rank}</span>
                      <strong className="score-val">{scores.composite.toFixed(1)}</strong>
                    </td>
                    <td className="compound-name-cell">
                      <div className="compound-primary">{c.name}</div>
                      <div className="compound-sub mono-text">
                        {c.chemblId} &middot; {c.primaryTarget}
                      </div>
                    </td>
                    <td>
                      <span
                        className="tag-badge"
                        style={{
                          backgroundColor: pwColor.bg,
                          borderColor: pwColor.border,
                          color: pwColor.text,
                        }}
                      >
                        {c.pathway}
                      </span>
                    </td>
                    <td className="num-col mono-num">
                      <strong>{c.potency.toFixed(1)}</strong>{' '}
                      <span className="muted-unit">{c.affinityMetric}</span>
                    </td>
                    <td className="num-col mono-num">{c.qed.toFixed(2)}</td>
                    <td className="num-col mono-num">{c.mw.toFixed(0)}</td>
                    <td className="num-col">
                      <span
                        className={`ro5-pill ${
                          ro5.violations === 0
                            ? 'ro5-pass'
                            : ro5.violations === 1
                            ? 'ro5-warn'
                            : 'ro5-fail'
                        }`}
                      >
                        {ro5.violations === 0 ? 'Pass' : `${ro5.violations} viol.`}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`phase-pill phase-${c.clinicalPhase
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                      >
                        {c.clinicalPhase}
                      </span>
                    </td>
                    <td className="num-col mono-num">
                      <span className="delta-pos">+{c.drugAgeDeltaPct}%</span>
                    </td>
                    <td
                      className="compare-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="table-cmp-actions">
                        <button
                          type="button"
                          className={`cmp-chip ${isA ? 'active-a' : ''}`}
                          onClick={() => onSetCompareA(c.id)}
                          aria-label={`Set ${c.name} as Molecule A`}
                          aria-pressed={isA}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          className={`cmp-chip ${isB ? 'active-b' : ''}`}
                          onClick={() => onSetCompareB(c.id)}
                          aria-label={`Set ${c.name} as Molecule B`}
                          aria-pressed={isB}
                        >
                          B
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
