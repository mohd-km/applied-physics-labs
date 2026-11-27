import React from 'react';
import { BAND_DEFINITIONS, COGNITIVE_PRESETS, PRESET_ORDER } from '../eeg/presets';
import { BandKey, BandWeights, SignalSnapshot } from '../eeg/types';

interface FocusClassifierPanelProps {
  snapshot: SignalSnapshot;
  bandMultipliers: BandWeights;
  onBandMultiplierChange: (band: BandKey, value: number) => void;
  onResetMultipliers: () => void;
  impedanceKohm: number;
  onImpedanceChange: (value: number) => void;
  isCsvMode: boolean;
}

export const FocusClassifierPanel: React.FC<FocusClassifierPanelProps> = ({
  snapshot,
  bandMultipliers,
  onBandMultiplierChange,
  onResetMultipliers,
  impedanceKohm,
  onImpedanceChange,
  isCsvMode,
}) => {
  const predictedPreset = COGNITIVE_PRESETS[snapshot.predictedState];

  const focusTone =
    snapshot.focusIndex >= 70
      ? '#047857'
      : snapshot.focusIndex >= 48
        ? '#b45309'
        : '#be123c';

  const impedanceTier =
    impedanceKohm <= 20
      ? 'Clinical Wet Gel (5 - 20 kOhm)'
      : impedanceKohm <= 80
        ? 'Saline / Seated Dry (20 - 80 kOhm)'
        : 'High-Impedance Dry (> 80 kOhm)';

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Live Focus Index &amp; Controls</h2>
          <p className="panel-subtitle">
            Real-time spectral ratios &amp; 4-state softmax classifier
          </p>
        </div>
        {!isCsvMode && (
          <button type="button" className="chip-btn" onClick={onResetMultipliers}>
            Reset Gains
          </button>
        )}
      </div>

      {/* Primary KPI Strip */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-card-accent" style={{ borderColor: focusTone }}>
          <span className="kpi-label">Focus Index</span>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: focusTone }}>
              {snapshot.focusIndex}
            </span>
            <span className="kpi-unit">/ 100</span>
          </div>
          <span className="kpi-meta">{predictedPreset.shortName}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Engagement</span>
          <div className="kpi-value-row">
            <span className="kpi-value">{snapshot.engagementIndex.toFixed(2)}</span>
          </div>
          <span className="kpi-meta">&beta; / (&alpha; + &theta;)</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Theta / Beta</span>
          <div className="kpi-value-row">
            <span className="kpi-value">{snapshot.thetaBetaRatio.toFixed(2)}</span>
          </div>
          <span className="kpi-meta">Lower = tighter focus</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Frontal FAA</span>
          <div className="kpi-value-row">
            <span className="kpi-value">
              {snapshot.frontalAlphaAsymmetry >= 0 ? '+' : ''}
              {snapshot.frontalAlphaAsymmetry.toFixed(2)}
            </span>
          </div>
          <span className="kpi-meta">SNR {snapshot.estimatedSnrDb.toFixed(1)} dB</span>
        </div>
      </div>

      {/* 4-State Posterior Classifier */}
      <div className="sub-section">
        <div className="sub-section-head">
          <h3 className="sub-title">4-State Posterior</h3>
          <span className="muted-sm">Softmax confidence</span>
        </div>
        <div className="posterior-list">
          {PRESET_ORDER.map((id) => {
            const p = snapshot.stateProbabilities[id] * 100;
            const isTop = id === snapshot.predictedState;
            return (
              <div key={id} className="posterior-row">
                <div className="posterior-label-row">
                  <span className={isTop ? 'text-strong' : 'muted-sm'}>
                    {COGNITIVE_PRESETS[id].shortName}
                  </span>
                  <span className="mono-strong">{p.toFixed(1)}%</span>
                </div>
                <div className="bar-track bar-track-md">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.max(2, p)}%`,
                      backgroundColor: isTop ? '#1d4ed8' : '#d6d3d1',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Band Sliders (disabled in CSV playback mode) */}
      {!isCsvMode && (
        <div className="sub-section">
          <div className="sub-section-head">
            <h3 className="sub-title">Band Gain Modulators</h3>
            <span className="muted-sm">0.2x - 2.5x</span>
          </div>
          <div className="sliders-stack">
            {BAND_DEFINITIONS.map((band) => {
              const val = bandMultipliers[band.key];
              return (
                <label key={band.key} className="slider-row">
                  <div className="slider-meta">
                    <span className="slider-name">
                      <span className="dot-inline" style={{ backgroundColor: band.inkColor }} />
                      {band.label} <span className="muted-sm">({band.rangeLabel})</span>
                    </span>
                    <span className="mono-strong">{val.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={2.5}
                    step={0.05}
                    value={val}
                    onChange={(e) =>
                      onBandMultiplierChange(band.key, parseFloat(e.target.value))
                    }
                    className="range-input"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Dry-Electrode Impedance / SNR Stress Slider */}
      <div className="sub-section impedance-box">
        <div className="slider-meta">
          <span className="slider-name">Electrode Contact Impedance</span>
          <span className="mono-strong">{impedanceKohm} kOhm</span>
        </div>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={impedanceKohm}
          onChange={(e) => onImpedanceChange(parseInt(e.target.value, 10))}
          className="range-input"
          aria-label="Electrode contact impedance in kilo-ohms"
        />
        <div className="impedance-foot">
          <span className="muted-sm">{impedanceTier}</span>
          <span className="mono-sm">SNR {snapshot.estimatedSnrDb.toFixed(1)} dB</span>
        </div>
      </div>

      {/* Collapsible DSP Equations & Method Drawer */}
      <details className="editorial-details">
        <summary>DSP equations &amp; digital filter specs</summary>
        <div className="details-body">
          <p className="formula-line">
            <code>Engagement = P(Beta) / (P(Alpha) + P(Theta))</code> (Pope / NASA index)
          </p>
          <p className="formula-line">
            <code>FAA = ln(P_AF8(Alpha)) - ln(P_AF7(Alpha))</code> (approach vs withdrawal)
          </p>
          <p className="formula-line">
            <code>Notch 50 Hz:</code> Zero-phase forward-backward 2nd-order IIR biquad (Q = 8.0)
          </p>
          <p className="formula-line">
            <code>Bandpass 1.5-40 Hz:</code> Zero-phase Butterworth HP (1.5 Hz) + LP (40 Hz)
            cascade
          </p>
          <p className="formula-line">
            <code>PSD:</code> 512-point Hann-windowed Radix-2 Cooley-Tukey FFT (0.5 Hz bin width at
            256 Hz)
          </p>
        </div>
      </details>
    </div>
  );
};
