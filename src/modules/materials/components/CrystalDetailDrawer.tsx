import React, { useEffect } from 'react';
import { X, ArrowRight, AlertTriangle, CheckCircle2, Clock, Layers } from 'lucide-react';
import { MaterialRecord } from '../types';

interface CrystalDetailDrawerProps {
  material: MaterialRecord | null;
  isPareto: boolean;
  allMaterials: MaterialRecord[];
  onClose: () => void;
  onSelectAlternative: (material: MaterialRecord) => void;
}

export const CrystalDetailDrawer: React.FC<CrystalDetailDrawerProps> = ({
  material,
  isPareto,
  allMaterials,
  onClose,
  onSelectAlternative,
}) => {
  useEffect(() => {
    if (!material) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [material, onClose]);

  if (!material) return null;

  const alternatives = material.abundantAlternativeIds
    .map((id) => allMaterials.find((m) => m.id === id))
    .filter((m): m is MaterialRecord => Boolean(m));

  const stabilityLabel =
    material.energyAboveHull === 0
      ? 'Ground State'
      : material.energyAboveHull <= 0.025
        ? 'Near-Hull'
        : 'Metastable';

  const stabilityClass =
    material.energyAboveHull === 0
      ? 'hull-stable'
      : material.energyAboveHull <= 0.025
        ? 'hull-near'
        : 'hull-meta';

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-crystal-title"
      >
        <div className="drawer-header">
          <div className="drawer-title-block">
            <div className="drawer-badges">
              <span className="mono-badge">{material.mpId}</span>
              <span className="family-badge">{material.family}</span>
              {isPareto && <span className="pareto-badge">Pareto Frontier</span>}
            </div>
            <h2 id="drawer-crystal-title" className="drawer-formula">
              {material.formula}
            </h2>
            <p className="drawer-name">{material.name}</p>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close crystal detail drawer"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-body">
          {/* Core DFT Properties */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">
              <Layers size={15} aria-hidden="true" />
              <span>Electronic & stability properties</span>
            </h3>
            <div className="metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Band Gap</span>
                <span className="metric-val mono-cell">{material.bandGap.toFixed(2)} eV</span>
                <span className="metric-sub">
                  {material.bandGapType} · PBE {material.pbeBandGap.toFixed(2)} eV
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Hull Stability</span>
                <span className="metric-val mono-cell">
                  {material.energyAboveHull.toFixed(3)} eV/at
                </span>
                <span className={`hull-pill ${stabilityClass}`}>{stabilityLabel}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Formation Energy</span>
                <span className="metric-val mono-cell">
                  {material.formationEnergy.toFixed(2)} eV/at
                </span>
                <span className="metric-sub">{material.spaceGroup}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Density</span>
                <span className="metric-val mono-cell">{material.density.toFixed(2)} g/cm^3</span>
                <span className="metric-sub">{material.crystalSystem}</span>
              </div>
            </div>
          </section>

          {/* Supply Chain & Earth Abundance */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">
              {material.bottleneckElements.length > 0 ? (
                <AlertTriangle size={15} className="icon-danger" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={15} className="icon-success" aria-hidden="true" />
              )}
              <span>Abundance ({material.earthAbundanceScore}/100)</span>
            </h3>

            <div className="abundance-bar-wrap">
              <div className="abundance-bar-track">
                <div
                  className={`abundance-bar-fill risk-fill-${material.supplyRisk.toLowerCase()}`}
                  style={{ width: `${material.earthAbundanceScore}%` }}
                />
              </div>
            </div>

            {material.bottleneckElements.length > 0 ? (
              <div className="callout callout-danger">
                <strong>Bottleneck elements:</strong> {material.bottleneckElements.join(', ')} ({material.supplyRisk} risk).
              </div>
            ) : (
              <div className="callout callout-success">
                <strong>Earth-abundant:</strong> Free of Co, Te, In, Ge, Ga, La bottlenecks.
              </div>
            )}

            {alternatives.length > 0 && (
              <div className="alternatives-block">
                <span className="alternatives-label">Abundant alternatives:</span>
                <div className="alternatives-list">
                  {alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      className="alt-chip"
                      onClick={() => onSelectAlternative(alt)}
                    >
                      <span>
                        <strong>{alt.formula}</strong> ({alt.bandGap.toFixed(2)} eV)
                      </span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Commercialization Lag */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">
              <Clock size={15} aria-hidden="true" />
              <span>Commercialization &amp; TRL</span>
            </h3>

            <div className="lag-meta-grid">
              <div className="lag-meta-item">
                <span className="metric-label">Milestone</span>
                <strong className="mono-cell">{material.milestoneYear}</strong>
              </div>
              <div className="lag-meta-item">
                <span className="metric-label">TRL</span>
                <strong className="mono-cell">{material.trl} / 9</strong>
              </div>
              <div className="lag-meta-item">
                <span className="metric-label">Observed Lag</span>
                <strong>{material.commercializationLag}</strong>
              </div>
              <div className="lag-meta-item">
                <span className="metric-label">Status</span>
                <strong>{material.commercialStatus}</strong>
              </div>
            </div>

            <div className="trl-meter" aria-label={`Technology Readiness Level ${material.trl} of 9`}>
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  key={i}
                  className={`trl-segment ${i < material.trl ? 'trl-segment-filled' : ''}`}
                />
              ))}
            </div>

            <div className="barrier-box">
              <span className="barrier-label">Primary Barrier</span>
              <p className="barrier-text">{material.primaryBarrier}</p>
            </div>

            <details className="editorial-details">
              <summary className="details-summary">Read full commercialization analysis</summary>
              <div className="details-body">
                <p className="analysis-paragraph">{material.commercializationAnalysis}</p>
              </div>
            </details>
          </section>
        </div>
      </aside>
    </div>
  );
};
