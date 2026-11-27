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
  { field: 'composite', label: 'Score /100', numeric: true },
  { field: 'name', label: 'Molecule' },
  { field: 'pathway', label: 'Acts on' },
  { field: 'potency', label: 'Strength', numeric: true },
  { field: 'qed', label: 'Drug-like /1', numeric: true },
  { field: 'mw', label: 'Weight (daltons)', numeric: true },
  { field: 'ro5Violations', label: 'Pill checklist', numeric: true },
  { field: 'clinicalPhase', label: 'Trial stage' },
  { field: 'drugAgeDeltaPct', label: 'Extra lifespan', numeric: true },
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
    <section className="card table-card" aria-label="Full ranked list of molecules">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">The full list</h2>
          <p className="panel-subtitle">
            Re-sorts as you move the sliders. Tap a column heading to sort by it, or a row for
            the full profile. Strength: each +1 is ten times stronger. Pill checklist: how many
            of the four rule-of-five boxes it fails.
          </p>
        </div>
        <span className="count-badge mono-num">{scoredCompounds.length} molecules</span>
      </div>

      <div className="table-scroll" role="region" aria-label="Scrollable table of molecules" tabIndex={0}>
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
              <th className="compare-col-head">Compare</th>
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
                        {ro5.violations === 0 ? 'Pass' : `${ro5.violations} failed`}
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
