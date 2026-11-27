import React, { useEffect, useState } from 'react';
import { Compound, CompoundScores } from '../types';
import { PATHWAY_COLORS } from '../data/compounds';
import {
  computeLigandEfficiencyIndex,
  evaluateLipinski,
  RO5_LIMITS,
} from '../utils/cheminformatics';

interface CompoundDrawerProps {
  compound: Compound | null;
  scores: CompoundScores | null;
  compareAId: string;
  compareBId: string;
  onSetCompareA: (id: string) => void;
  onSetCompareB: (id: string) => void;
  onClose: () => void;
}

export const CompoundDrawer: React.FC<CompoundDrawerProps> = ({
  compound,
  scores,
  compareAId,
  compareBId,
  onSetCompareA,
  onSetCompareB,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [compound?.id]);

  useEffect(() => {
    if (!compound) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [compound, onClose]);

  if (!compound) return null;

  const ro5 = evaluateLipinski(compound);
  const bei = computeLigandEfficiencyIndex(compound);
  const pwColor = PATHWAY_COLORS[compound.pathway];

  const handleCopySmiles = async () => {
    try {
      await navigator.clipboard.writeText(compound.smiles);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const ro5Rows = [
    {
      label: 'Weight of one molecule (daltons)',
      value: `${compound.mw.toFixed(1)} Da`,
      limit: `limit ${RO5_LIMITS.mw}`,
      pct: Math.min(100, (compound.mw / 1000) * 100),
      pass: ro5.mwPass,
    },
    {
      label: 'Greasiness (logP)',
      value: compound.logP.toFixed(2),
      limit: `limit ${RO5_LIMITS.logP.toFixed(1)}`,
      pct: Math.min(100, Math.max(5, ((compound.logP + 7) / 15) * 100)),
      pass: ro5.logPPass,
    },
    {
      label: 'Sticky hydrogens it gives away (H-bond donors)',
      value: `${compound.hbd}`,
      limit: `limit ${RO5_LIMITS.hbd}`,
      pct: Math.min(100, (compound.hbd / 15) * 100),
      pass: ro5.hbdPass,
    },
    {
      label: 'Spots that grab hydrogens (H-bond acceptors)',
      value: `${compound.hba}`,
      limit: `limit ${RO5_LIMITS.hba}`,
      pct: Math.min(100, (compound.hba / 20) * 100),
      pass: ro5.hbaPass,
    },
  ];

  return (
    <div
      className="drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="drawer-panel">
        <div className="drawer-header">
          <div>
            <div className="drawer-badges">
              <span
                className="tag-badge"
                style={{
                  backgroundColor: pwColor.bg,
                  borderColor: pwColor.border,
                  color: pwColor.text,
                }}
              >
                {compound.pathway}
              </span>
              <span
                className={`phase-pill phase-${compound.clinicalPhase
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
              >
                {compound.clinicalPhase}
              </span>
            </div>
            <h2 id="drawer-title" className="drawer-title">
              {compound.name}
            </h2>
            <p className="drawer-sub">
              {compound.synonyms} &middot; <span className="mono-text">{compound.chemblId}</span>
            </p>
          </div>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close this molecule's profile"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {/* Quick Load into Comparator */}
          <div className="drawer-compare-bar">
            <button
              type="button"
              className={`btn-preset ${compareAId === compound.id ? 'active' : ''}`}
              onClick={() => onSetCompareA(compound.id)}
            >
              Load as Molecule A
            </button>
            <button
              type="button"
              className={`btn-preset ${compareBId === compound.id ? 'active' : ''}`}
              onClick={() => onSetCompareB(compound.id)}
            >
              Load as Molecule B
            </button>
          </div>

          {/* Core metrics grid */}
          <div className="drawer-kpi-grid">
            <div className="drawer-kpi">
              <span className="kpi-label">Overall score /100</span>
              <span className="kpi-value mono-num accent-ink">
                {scores ? scores.composite.toFixed(1) : '--'}
              </span>
            </div>
            <div className="drawer-kpi">
              <span className="kpi-label">Strength on target (+1 is 10x)</span>
              <span className="kpi-value mono-num">
                {compound.potency.toFixed(1)} <small>{compound.affinityMetric}</small>
              </span>
            </div>
            <div className="drawer-kpi">
              <span className="kpi-label">Extra lifespan in animals</span>
              <span className="kpi-value mono-num accent-ink">
                +{compound.drugAgeDeltaPct}%
              </span>
            </div>
            <div className="drawer-kpi">
              <span className="kpi-label">Drug-like /1 and strength per weight</span>
              <span className="kpi-value mono-num">
                {compound.qed.toFixed(2)} <small>/ {bei}</small>
              </span>
            </div>
          </div>

          {/* 4 ADMET Sub-scores */}
          {scores && (
            <div className="drawer-admet-strip">
              <div className="admet-pill">
                <span>Works as a pill</span>
                <strong className="mono-num">{scores.oralBioavailability}</strong>
              </div>
              <div className="admet-pill">
                <span>Reaches the brain</span>
                <strong className="mono-num">{scores.bbbPermeability}</strong>
              </div>
              <div className="admet-pill">
                <span>Hits its target</span>
                <strong className="mono-num">{scores.pathwayAffinity}</strong>
              </div>
              <div className="admet-pill">
                <span>Safety and trials</span>
                <strong className="mono-num">{scores.safety}</strong>
              </div>
            </div>
          )}

          {/* Lipinski Rule of 5 Scorecard */}
          <div className="drawer-section">
            <div className="section-row">
              <h3 className="drawer-section-title">
                Pill checklist (Lipinski rule of five)
                <small className="field-hint">
                  Four limits most swallowable drugs respect. Failing one is common, failing two
                  or more usually means trouble getting it absorbed.
                </small>
              </h3>
              <span
                className={`ro5-pill ${
                  ro5.violations === 0
                    ? 'ro5-pass'
                    : ro5.violations === 1
                    ? 'ro5-warn'
                    : 'ro5-fail'
                }`}
              >
                {ro5.violations === 0
                  ? 'All four passed'
                  : `${ro5.violations} of 4 failed`}
              </span>
            </div>

            <div className="ro5-meter-list">
              {ro5Rows.map((row) => (
                <div key={row.label} className="ro5-meter-item">
                  <div className="ro5-meter-top">
                    <span>{row.label}</span>
                    <span className="mono-num">
                      <strong>{row.value}</strong>{' '}
                      <span className="muted-unit">({row.limit})</span>
                    </span>
                  </div>
                  <div className="meter-track">
                    <div
                      className={`meter-fill ${row.pass ? 'pass' : 'fail'}`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="extra-descriptors mono-num">
              <span>Water-friendly surface (TPSA): {compound.tpsa} A&sup2;</span>
              <span>Bendable bonds: {compound.rotatableBonds}</span>
              <span>Chemical registry number (CAS): {compound.casNumber}</span>
            </div>
          </div>

          {/* Collapsible Deep Notes & SMILES */}
          <details className="editorial-details" open>
            <summary>What it does in the body, and the study behind the number</summary>
            <div className="details-body">
              <p>
                <strong>Protein it acts on:</strong> {compound.primaryTarget}. Lifespan result
                measured in {compound.modelOrganism}, reported by {compound.benchmarkSource}.
              </p>
              <p>{compound.mechanism}</p>
            </div>
          </details>

          <details className="editorial-details">
            <summary>Safety notes and what is still unknown in humans</summary>
            <div className="details-body">
              <p>{compound.safetyNotes}</p>
            </div>
          </details>

          <details className="editorial-details">
            <summary>Chemical structure as text (SMILES)</summary>
            <div className="details-body">
              <button type="button" className="btn-ghost" onClick={handleCopySmiles}>
                {copied ? 'Copied' : 'Copy the structure text'}
              </button>
              <code className="smiles-box">{compound.smiles}</code>
            </div>
          </details>
        </div>
      </aside>
    </div>
  );
};
