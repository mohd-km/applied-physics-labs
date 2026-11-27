import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronRight, Download, Check } from 'lucide-react';
import { MaterialRecord } from '../types';

interface MaterialsTableProps {
  materials: MaterialRecord[];
  paretoIds: Set<string>;
  selectedId: string | null;
  onSelect: (material: MaterialRecord) => void;
  onExportCsv: () => void;
  csvExported: boolean;
}

type SortKey =
  | 'formula'
  | 'bandGap'
  | 'energyAboveHull'
  | 'earthAbundanceScore'
  | 'trl';

export const MaterialsTable: React.FC<MaterialsTableProps> = ({
  materials,
  paretoIds,
  selectedId,
  onSelect,
  onExportCsv,
  csvExported,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('energyAboveHull');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'earthAbundanceScore' || key === 'trl' ? 'desc' : 'asc');
    }
  };

  const sorted = useMemo(() => {
    return [...materials].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'formula') {
        cmp = a.formula.localeCompare(b.formula);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [materials, sortKey, sortDir]);

  return (
    <section className="card table-card" aria-label="Shortlisted Crystal Structures Table">
      <div className="card-header">
        <div>
          <h2 className="card-title">Shortlisted Crystals ({materials.length})</h2>
          <p className="card-subtitle">
            Click any row for band-gap and hull details, abundant substitutes, and commercialization lag.
          </p>
        </div>
        <button
          type="button"
          className="btn-export-csv"
          onClick={onExportCsv}
          disabled={materials.length === 0}
        >
          {csvExported ? (
            <>
              <Check size={15} aria-hidden="true" />
              <span>Exported CSV</span>
            </>
          ) : (
            <>
              <Download size={15} aria-hidden="true" />
              <span>Export Shortlist CSV</span>
            </>
          )}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          No crystals match the current spec. Widen the band gap range or raise the E_hull cutoff.
        </div>
      ) : (
        <div
          className="table-scroll-container"
          role="region"
          aria-label="Scrollable crystal shortlist"
          tabIndex={0}
        >
          <table className="materials-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="th-sort" onClick={() => handleSort('formula')}>
                    <span>Crystal</span>
                    <ArrowUpDown size={13} aria-hidden="true" />
                  </button>
                </th>
                <th>MP ID</th>
                <th className="num-col">
                  <button
                    type="button"
                    className="th-sort th-sort-num"
                    onClick={() => handleSort('bandGap')}
                  >
                    <span>E_g (eV)</span>
                    <ArrowUpDown size={13} aria-hidden="true" />
                  </button>
                </th>
                <th className="num-col">
                  <button
                    type="button"
                    className="th-sort th-sort-num"
                    onClick={() => handleSort('energyAboveHull')}
                  >
                    <span>E_hull</span>
                    <ArrowUpDown size={13} aria-hidden="true" />
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => handleSort('earthAbundanceScore')}
                  >
                    <span>Abundance / Risk</span>
                    <ArrowUpDown size={13} aria-hidden="true" />
                  </button>
                </th>
                <th className="num-col">
                  <button
                    type="button"
                    className="th-sort th-sort-num"
                    onClick={() => handleSort('trl')}
                  >
                    <span>TRL</span>
                    <ArrowUpDown size={13} aria-hidden="true" />
                  </button>
                </th>
                <th aria-label="Inspect" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const isSelected = m.id === selectedId;
                const isPareto = paretoIds.has(m.id);
                return (
                  <tr
                    key={m.id}
                    className={`${isSelected ? 'row-selected' : ''} ${isPareto ? 'row-pareto' : ''}`}
                    onClick={() => onSelect(m)}
                  >
                    <td>
                      <div className="cell-formula-row">
                        <span className="cell-formula">{m.formula}</span>
                        {isPareto && <span className="pareto-badge">Pareto</span>}
                      </div>
                      <div className="cell-sub">{m.name}</div>
                    </td>
                    <td>
                      <span className="mono-badge">{m.mpId}</span>
                    </td>
                    <td className="num-col mono-cell">
                      <strong>{m.bandGap.toFixed(2)}</strong>
                      <span className="cell-sub-inline"> {m.bandGapType}</span>
                    </td>
                    <td className="num-col mono-cell">
                      <span
                        className={
                          m.energyAboveHull === 0
                            ? 'hull-pill hull-stable'
                            : m.energyAboveHull <= 0.025
                              ? 'hull-pill hull-near'
                              : 'hull-pill hull-meta'
                        }
                      >
                        {m.energyAboveHull.toFixed(3)}
                      </span>
                    </td>
                    <td>
                      <div className="risk-cell">
                        <span className={`risk-badge risk-${m.supplyRisk.toLowerCase()}`}>
                          {m.earthAbundanceScore} · {m.supplyRisk}
                        </span>
                        {m.bottleneckElements.length > 0 && (
                          <span className="bottleneck-note">
                            {m.bottleneckElements.join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="num-col mono-cell">{m.trl}/9</td>
                    <td className="action-col">
                      <ChevronRight size={16} aria-hidden="true" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
