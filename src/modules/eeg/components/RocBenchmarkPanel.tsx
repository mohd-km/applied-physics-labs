import React, { useState } from 'react';
import { BENCHMARK_STUDIES } from '../eeg/presets';
import { computeConfusionAtThreshold } from '../eeg/signalMath';
import { RocCurveSeries } from '../eeg/types';

interface RocBenchmarkPanelProps {
  rocSeries: RocCurveSeries[];
  threshold: number;
  onThresholdChange: (value: number) => void;
  impedanceKohm: number;
  onImpedanceChange: (value: number) => void;
}

export const RocBenchmarkPanel: React.FC<RocBenchmarkPanelProps> = ({
  rocSeries,
  threshold,
  onThresholdChange,
  impedanceKohm,
  onImpedanceChange,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>('consumer-4ch-lda');

  const activeSeries =
    rocSeries.find((s) => s.id === selectedModelId) ?? rocSeries[1] ?? rocSeries[0];

  const { operatingPoint, matrix } = computeConfusionAtThreshold(
    activeSeries,
    threshold,
    200,
    0.55
  );

  const size = 380;
  const padL = 48;
  const padR = 20;
  const padT = 20;
  const padB = 42;
  const plotW = size - padL - padR;
  const plotH = size - padT - padB;

  const xOf = (fpr: number) => padL + fpr * plotW;
  const yOf = (tpr: number) => padT + (1 - tpr) * plotH;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">ROC Curve &amp; Confusion Matrix Lab</h2>
          <p className="panel-subtitle">
            Sweep the decision threshold (&tau;) and impedance to see false-alarm tradeoffs vs
            EEGMAT / OpenNeuro benchmarks.
          </p>
        </div>
        <div className="model-selector" role="group" aria-label="Select ROC model">
          {rocSeries.map((series) => {
            const active = series.id === activeSeries.id;
            return (
              <button
                key={series.id}
                type="button"
                className={`pill-btn ${active ? 'pill-btn-active' : ''}`}
                onClick={() => setSelectedModelId(series.id)}
                aria-pressed={active}
              >
                <span className="dot" style={{ backgroundColor: series.color }} />
                <span>
                  {series.shortLabel} ({series.auc.toFixed(2)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="roc-grid">
        {/* Left: Crisp White Editorial ROC Curve SVG */}
        <div className="roc-chart-col">
          <div className="svg-wrap-light">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="fluid-svg roc-svg"
              role="img"
              aria-label="Receiver Operating Characteristic curve comparing clinical 19-channel and consumer 4-channel EEG focus classifiers"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((v) => {
                const x = xOf(v);
                const y = yOf(v);
                return (
                  <g key={v}>
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={padT + plotH}
                      stroke="#e5e5e3"
                    />
                    <line
                      x1={padL}
                      y1={y}
                      x2={padL + plotW}
                      y2={y}
                      stroke="#e5e5e3"
                    />
                    <text
                      x={x}
                      y={size - 22}
                      textAnchor="middle"
                      fill="#555555"
                      fontSize="12"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {v.toFixed(2)}
                    </text>
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#555555"
                      fontSize="12"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {v.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Chance diagonal */}
              <line
                x1={xOf(0)}
                y1={yOf(0)}
                x2={xOf(1)}
                y2={yOf(1)}
                stroke="#a8a29e"
                strokeDasharray="4 4"
              />

              {/* ROC curves */}
              {rocSeries.map((series) => {
                const isSelected = series.id === activeSeries.id;
                const pts = series.points
                  .map((p) => `${xOf(p.fpr).toFixed(1)},${yOf(p.tpr).toFixed(1)}`)
                  .join(' ');
                return (
                  <polyline
                    key={series.id}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={isSelected ? 2.8 : 1.6}
                    strokeOpacity={isSelected ? 1 : 0.5}
                    strokeDasharray={series.id === 'clinical-19ch' ? '5 4' : undefined}
                    points={pts}
                  />
                );
              })}

              {/* Operating point crosshair */}
              <line
                x1={xOf(operatingPoint.fpr)}
                y1={yOf(operatingPoint.tpr)}
                x2={xOf(operatingPoint.fpr)}
                y2={padT + plotH}
                stroke={activeSeries.color}
                strokeOpacity="0.45"
                strokeDasharray="3 3"
              />
              <line
                x1={padL}
                y1={yOf(operatingPoint.tpr)}
                x2={xOf(operatingPoint.fpr)}
                y2={yOf(operatingPoint.tpr)}
                stroke={activeSeries.color}
                strokeOpacity="0.45"
                strokeDasharray="3 3"
              />
              <circle
                cx={xOf(operatingPoint.fpr)}
                cy={yOf(operatingPoint.tpr)}
                r={6.5}
                fill={activeSeries.color}
                stroke="#ffffff"
                strokeWidth="2.2"
              />

              <text
                x={padL + plotW / 2}
                y={size - 4}
                textAnchor="middle"
                fill="#111111"
                fontSize="12"
                fontFamily="Inter, sans-serif"
              >
                False Positive Rate (1 - Specificity)
              </text>
              <text
                x={14}
                y={padT + plotH / 2}
                textAnchor="middle"
                fill="#111111"
                fontSize="12"
                fontFamily="Inter, sans-serif"
                transform={`rotate(-90 14 ${padT + plotH / 2})`}
              >
                True Positive Rate (Sensitivity)
              </text>
            </svg>
          </div>
        </div>

        {/* Right: Threshold + Impedance Sliders + Confusion Matrix */}
        <div className="confusion-col">
          <div className="threshold-box">
            <div className="slider-meta">
              <span className="slider-name">Decision Threshold (&tau;)</span>
              <span className="mono-strong">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.02}
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="range-input"
              aria-label="Classifier decision threshold"
            />
            <div className="slider-meta" style={{ marginTop: 8 }}>
              <span className="slider-name">Electrode Impedance</span>
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
          </div>

          <div className="cm-heading-row">
            <h3 className="sub-title">2x2 Confusion Matrix (200 Epochs)</h3>
            <span className="mono-strong" style={{ color: activeSeries.color }}>
              AUC {activeSeries.auc.toFixed(3)}
            </span>
          </div>

          <div className="cm-grid" role="table" aria-label="Classifier confusion matrix">
            <div className="cm-corner" />
            <div className="cm-col-head">Pred: Focused</div>
            <div className="cm-col-head">Pred: Drift</div>

            <div className="cm-row-head">Actual: Focused</div>
            <div className="cm-cell cm-tp">
              <span className="cm-tag">TP</span>
              <span className="cm-num">{matrix.tp}</span>
            </div>
            <div className="cm-cell cm-fn">
              <span className="cm-tag">FN</span>
              <span className="cm-num">{matrix.fn}</span>
            </div>

            <div className="cm-row-head">Actual: Drift</div>
            <div className="cm-cell cm-fp">
              <span className="cm-tag">FP</span>
              <span className="cm-num">{matrix.fp}</span>
            </div>
            <div className="cm-cell cm-tn">
              <span className="cm-tag">TN</span>
              <span className="cm-num">{matrix.tn}</span>
            </div>
          </div>

          <div className="metrics-mini-grid">
            <div className="mini-metric">
              <span className="kpi-label">Sensitivity</span>
              <span className="mono-strong">{(matrix.sensitivity * 100).toFixed(1)}%</span>
            </div>
            <div className="mini-metric">
              <span className="kpi-label">Specificity</span>
              <span className="mono-strong">{(matrix.specificity * 100).toFixed(1)}%</span>
            </div>
            <div className="mini-metric">
              <span className="kpi-label">F1 Score</span>
              <span className="mono-strong">{(matrix.f1 * 100).toFixed(1)}%</span>
            </div>
            <div className="mini-metric">
              <span className="kpi-label">False Alerts / 90m</span>
              <span
                className="mono-strong"
                style={{ color: matrix.falseAlarmsPer90Min > 12 ? '#be123c' : '#047857' }}
              >
                {matrix.falseAlarmsPer90Min}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Public EEG Benchmark Reference Table */}
      <details className="editorial-details">
        <summary>Public mental-workload EEG benchmarks (EEGMAT, OpenNeuro, STEW, SEED-VIG)</summary>
        <div className="details-body">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Cohort</th>
                  <th>Montage</th>
                  <th>Electrode</th>
                  <th>Task Paradigm</th>
                  <th>Published AUC</th>
                  <th>Primary SNR Bottleneck</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARK_STUDIES.map((study) => (
                  <tr key={study.id}>
                    <td className="text-strong">{study.dataset}</td>
                    <td>{study.citation}</td>
                    <td className="mono-cell">{study.montage}</td>
                    <td>{study.electrodeType}</td>
                    <td>{study.taskParadigm}</td>
                    <td className="mono-cell">{study.publishedAuc}</td>
                    <td>{study.snrBottleneck}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
};
