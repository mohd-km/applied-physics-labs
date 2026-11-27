import React from 'react';
import { RocCurveSeries } from '../eeg/types';

interface NeurotechBriefProps {
  impedanceKohm: number;
  onImpedanceChange: (value: number) => void;
  estimatedSnrDb: number;
  rocSeries: RocCurveSeries[];
}

const MODALITY_VISUALS = [
  { name: '4-Ch Dry Headband', bitrateLabel: '0.1 - 0.5 b/s', pct: 8, bom: '$35 BOM / $250-$400', friction: '< 30 sec' },
  { name: '14-Ch Saline Headset', bitrateLabel: '0.5 - 1.5 b/s', pct: 18, bom: '$90 BOM / $850-$1.2k', friction: '3 - 5 min' },
  { name: '19-64 Ch Wet Gel Cap', bitrateLabel: '1.5 - 4.0 b/s', pct: 34, bom: '$600 BOM / $5k-$35k', friction: '15 - 30 min' },
  { name: 'Invasive ECoG / Stentrode', bitrateLabel: '30 - 100+ b/s', pct: 100, bom: 'Surgical / $50k+', friction: 'Clinical' },
];

export const NeurotechBrief: React.FC<NeurotechBriefProps> = ({
  impedanceKohm,
  onImpedanceChange,
  estimatedSnrDb,
  rocSeries,
}) => {
  const consumerSeries = rocSeries.find((s) => s.id === 'consumer-4ch-lda');
  const clinicalSeries = rocSeries.find((s) => s.id === 'clinical-19ch');
  const aucGap =
    clinicalSeries && consumerSeries
      ? ((clinicalSeries.auc - consumerSeries.auc) * 100).toFixed(1)
      : '6.0';

  const marketViabilityNote =
    impedanceKohm <= 30
      ? 'Wet-gel regime: strong AUC, but 15-min gel prep kills daily consumer retention.'
      : impedanceKohm <= 100
        ? 'Consumer headband sweet spot: viable for coarse focus-drift cues and sleep staging.'
        : 'High-impedance dry regime: EMG and thermal noise inflate false alarms, driving Day-14 churn.';

  return (
    <section id="mmi-brief" className="panel brief-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Neurotech &amp; MMI Economics</h2>
          <p className="panel-subtitle">
            How skull-attenuation physics and electrode impedance dictate consumer BCI retention.
          </p>
        </div>
      </div>

      {/* Live Physics-to-Economics Callout + Interactive Impedance Slider */}
      <div className="callout-strip">
        <div className="callout-metric">
          <span className="kpi-label">Contact Regime</span>
          <span className="mono-strong">{impedanceKohm} kOhm</span>
        </div>
        <div className="callout-metric">
          <span className="kpi-label">Scalp SNR</span>
          <span className="mono-strong">{estimatedSnrDb.toFixed(1)} dB</span>
        </div>
        <div className="callout-metric">
          <span className="kpi-label">AUC Gap vs Gel</span>
          <span className="mono-strong">-{aucGap} pts</span>
        </div>
        <div className="callout-copy">
          <span className="text-strong">Verdict: </span>
          <span className="muted-sm">{marketViabilityNote}</span>
        </div>
      </div>

      <div className="impedance-inline-bar">
        <div className="slider-meta">
          <span className="slider-name">Stress-test electrode impedance</span>
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
          aria-label="Stress-test electrode contact impedance"
        />
      </div>

      {/* Visual Bitrate vs Friction Comparison */}
      <div className="sub-section">
        <div className="sub-section-head">
          <h3 className="sub-title">Effective BCI Bitrate by Modality</h3>
          <span className="muted-sm">Log-scale channel capacity vs hardware BOM</span>
        </div>
        <div className="modality-bars">
          {MODALITY_VISUALS.map((m) => (
            <div key={m.name} className="modality-row">
              <div className="posterior-label-row">
                <span className="text-strong">{m.name}</span>
                <span className="mono-strong">{m.bitrateLabel}</span>
              </div>
              <div className="bar-track bar-track-md">
                <div
                  className="bar-fill"
                  style={{ width: `${m.pct}%`, backgroundColor: '#1d4ed8' }}
                />
              </div>
              <div className="band-stat-foot">
                <span>{m.bom}</span>
                <span>Setup: {m.friction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Three Concise Summary Cards with Collapsible Full Analysis */}
      <div className="brief-grid">
        <article className="brief-card">
          <h3 className="brief-card-title">1. Skull Attenuation &amp; SNR Wall</h3>
          <p className="brief-summary">
            Scalp EEG drops to 10-50 &micro;V while eye blinks (200-500 &micro;V) and jaw EMG
            dominate; physical SNR bounds capacity, not model depth.
          </p>
          <details className="editorial-details">
            <summary>Read more</summary>
            <div className="details-body">
              <p className="brief-body">
                Cortical local field potentials reach 100 - 500 &micro;V at the pial surface, but
                cerebrospinal fluid, skull bone (roughly 10 - 20x higher resistivity than soft
                tissue), and scalp act as a spatial low-pass filter. At scalp electrodes, neural
                voltage drops to 10 - 50 &micro;V while non-neural confounders remain an order of
                magnitude larger: ocular blinks inject 200 - 500 &micro;V into AF7/AF8, and jaw
                clenching floods 30 - 100 Hz gamma bands with 100 - 1000 &micro;V temporalis EMG.
              </p>
              <p className="brief-body">
                Consequently, channel capacity in non-invasive scalp EEG is bounded by physical SNR,
                not neural network depth. Deeper models trained on noisy dry headsets overfit muscle
                micro-twitches rather than true cortical intent.
              </p>
            </div>
          </details>
        </article>

        <article className="brief-card">
          <h3 className="brief-card-title">2. Consumer BOM &amp; Retention Trap</h3>
          <p className="brief-summary">
            A 4-ch headband costs $32-$48 BOM ($250-$400 retail); the real failure mode is Day-30
            churn from dry-electrode false alerts.
          </p>
          <details className="editorial-details">
            <summary>Read more</summary>
            <div className="details-body">
              <p className="brief-body">
                Hardware bill of materials for a 4-channel consumer headband is modest: a 24-bit
                low-noise analog front-end (e.g., ADS1299-class or custom AFE), BLE SoC, LiPo cell,
                and conductive polymer/silver dry electrodes total roughly $32 - $48 at mid-volume,
                retailing at $250 - $400 (a 6x - 8x price-to-BOM markup).
              </p>
              <p className="brief-body">
                The economic failure mode is not COGS; it is Day-30 retention. Wet-gel caps solve
                SNR but impose intolerable setup friction. Dry headbands solve setup friction but
                push contact impedance above 100 kOhm through hair, inflating false-alarm rates
                during normal work. Once a focus wearable interrupts deep work with false alerts,
                users abandon it and recurring software ARR collapses.
              </p>
            </div>
          </details>
        </article>

        <article className="brief-card">
          <h3 className="brief-card-title">3. Viable Products vs Hype</h3>
          <p className="brief-summary">
            Dry EEG wins on coarse 5-15 s macro-states (sleep, drowsiness, focus drift); fine
            control requires invasive ECoG or sensor fusion.
          </p>
          <details className="editorial-details">
            <summary>Read more</summary>
            <div className="details-body">
              <p className="brief-body">
                Non-invasive consumer EEG wins only where coarse, multi-second spectral shifts carry
                high utility and tolerate 5 - 15 second smoothing windows: sleep architecture
                staging, driver/operator drowsiness alarms, meditation biofeedback, and 90-minute
                deep-work block drift detection.
              </p>
              <p className="brief-body">
                High-bandwidth mind-machine interfaces (imagined speech, rapid cursor typing, fine
                motor control) require overcoming the skull filter via invasive ECoG, endovascular
                stentrodes, or multimodal sensor fusion (EEG + eye-tracking + wrist EMG) rather than
                adding more channels to a dry forehead strap.
              </p>
            </div>
          </details>
        </article>
      </div>

      {/* Collapsible Full Modality Economics Table */}
      <details className="editorial-details">
        <summary>Full MMI modality tradeoff table (SNR, bitrate, BOM, commercial wedge)</summary>
        <div className="details-body">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Modality</th>
                  <th>Typical Impedance / SNR</th>
                  <th>Effective Bitrate</th>
                  <th>Est. Hardware BOM / Retail</th>
                  <th>Setup Friction</th>
                  <th>Viable Commercial Wedge</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-strong">4-Ch Dry Headband</td>
                  <td className="mono-cell">50 - 200 kOhm / Low</td>
                  <td className="mono-cell">0.1 - 0.5 bits/s</td>
                  <td className="mono-cell">$35 / $250 - $400</td>
                  <td>Under 30 sec</td>
                  <td>Sleep staging, focus-drift cues, meditation</td>
                </tr>
                <tr>
                  <td className="text-strong">14-Ch Saline Headset</td>
                  <td className="mono-cell">15 - 60 kOhm / Med</td>
                  <td className="mono-cell">0.5 - 1.5 bits/s</td>
                  <td className="mono-cell">$90 / $850 - $1,200</td>
                  <td>3 - 5 min (dries in 45m)</td>
                  <td>UX research, neuroergonomics, academic labs</td>
                </tr>
                <tr>
                  <td className="text-strong">19-64 Ch Clinical Wet Gel</td>
                  <td className="mono-cell">&lt; 10 kOhm / High</td>
                  <td className="mono-cell">1.5 - 4.0 bits/s</td>
                  <td className="mono-cell">$600 / $5k - $35k</td>
                  <td>15 - 30 min + wash</td>
                  <td>Epilepsy diagnostics, clinical ERP, benchmark ground truth</td>
                </tr>
                <tr>
                  <td className="text-strong">Invasive ECoG / Endovascular</td>
                  <td className="mono-cell">Sub-dural / Very High</td>
                  <td className="mono-cell">30 - 100+ bits/s</td>
                  <td className="mono-cell">Medical device / $50k+</td>
                  <td>Surgical / Reimbursed</td>
                  <td>Paralysis speech &amp; motor restoration (clinical BCI)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </section>
  );
};
