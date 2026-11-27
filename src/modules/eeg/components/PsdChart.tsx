import React from 'react';
import { BAND_DEFINITIONS } from '../eeg/presets';
import { PSD_MAX_HZ } from '../eeg/signalMath';
import { SignalSnapshot } from '../eeg/types';

interface PsdChartProps {
  snapshot: SignalSnapshot;
  notchFilter50Hz: boolean;
  bandpassFilter: boolean;
}

export const PsdChart: React.FC<PsdChartProps> = ({
  snapshot,
  notchFilter50Hz,
  bandpassFilter,
}) => {
  const width = 760;
  const height = 264;
  const padLeft = 52;
  const padRight = 18;
  const padTop = 26;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minFreq = 0.5;
  const maxFreq = PSD_MAX_HZ; // 60 Hz so 50 Hz mains hum is clearly visible
  const minDb = -18;
  const maxDb = 30;

  const xOf = (f: number) =>
    padLeft + ((Math.max(minFreq, Math.min(maxFreq, f)) - minFreq) / (maxFreq - minFreq)) * plotW;
  const yOf = (db: number) =>
    padTop + ((maxDb - Math.max(minDb, Math.min(maxDb, db))) / (maxDb - minDb)) * plotH;

  const avgPoints = snapshot.averagePsd
    .map((b) => `${xOf(b.freqHz).toFixed(1)},${yOf(b.powerDb).toFixed(1)}`)
    .join(' ');

  const rawPoints = snapshot.rawAveragePsd
    .map((b) => `${xOf(b.freqHz).toFixed(1)},${yOf(b.powerDb).toFixed(1)}`)
    .join(' ');

  const areaPoints = `${xOf(minFreq).toFixed(1)},${(padTop + plotH).toFixed(1)} ${avgPoints} ${xOf(
    snapshot.averagePsd[snapshot.averagePsd.length - 1]?.freqHz ?? maxFreq
  ).toFixed(1)},${(padTop + plotH).toFixed(1)}`;

  const anyFilterOn = notchFilter50Hz || bandpassFilter;
  const humDropDb = snapshot.mains50HzRawDb - snapshot.mains50HzDb;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Live Power Spectral Density (Hann FFT)</h2>
          <p className="panel-subtitle">
            0.5 - {maxFreq} Hz Radix-2 FFT &middot; Toggle 50 Hz Notch or Bandpass to watch the
            spectrum clean up
          </p>
        </div>

        <div className="inline-legend">
          <span className="legend-chip">
            <span className="legend-line" style={{ backgroundColor: '#111111' }} />
            Filtered PSD
          </span>
          {anyFilterOn && (
            <span className="legend-chip">
              <span className="legend-line legend-line-dashed" />
              Pre-Filter
            </span>
          )}
          <span className="mono-badge">
            50 Hz: {snapshot.mains50HzDb.toFixed(1)} dB
            {notchFilter50Hz && humDropDb > 2 ? ` (-${humDropDb.toFixed(0)} dB)` : ''}
          </span>
        </div>
      </div>

      {/* Framed dark scientific spectrum figure box */}
      <div className="figure-dark">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="fluid-svg"
          role="img"
          aria-label="Power Spectral Density chart from 0.5 to 60 Hz showing EEG bands and 50 Hz mains line"
        >
          {/* Shaded EEG frequency bands */}
          {BAND_DEFINITIONS.map((band) => {
            const x1 = xOf(band.minHz);
            const x2 = xOf(band.maxHz);
            const midX = (x1 + x2) / 2;
            return (
              <g key={band.key}>
                <rect
                  x={x1}
                  y={padTop}
                  width={Math.max(1, x2 - x1)}
                  height={plotH}
                  fill={band.color}
                  fillOpacity="0.09"
                />
                <line
                  x1={x2}
                  y1={padTop}
                  x2={x2}
                  y2={padTop + plotH}
                  stroke={band.color}
                  strokeOpacity="0.24"
                  strokeDasharray="2 3"
                />
                <text
                  x={midX}
                  y={padTop - 8}
                  textAnchor="middle"
                  fill={band.color}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {band.label}
                </text>
              </g>
            );
          })}

          {/* 50 Hz Mains Hum marker */}
          <g>
            <line
              x1={xOf(50)}
              y1={padTop}
              x2={xOf(50)}
              y2={padTop + plotH}
              stroke={notchFilter50Hz ? '#34d399' : '#f87171'}
              strokeOpacity="0.55"
              strokeDasharray="4 3"
            />
            <text
              x={xOf(50)}
              y={padTop - 8}
              textAnchor="middle"
              fill={notchFilter50Hz ? '#34d399' : '#fca5a5'}
              fontSize="11"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              50 Hz
            </text>
          </g>

          {/* Horizontal dB grid */}
          {[-10, 0, 10, 20].map((db) => {
            const y = yOf(db);
            return (
              <g key={db}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.16)"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="12"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {db}
                </text>
              </g>
            );
          })}

          {/* Y axis unit */}
          <text
            x={14}
            y={padTop + plotH / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
            transform={`rotate(-90 14 ${padTop + plotH / 2})`}
          >
            dB (uV^2/Hz)
          </text>

          {/* Frequency axis labels */}
          {[1, 4, 8, 13, 20, 30, 40, 50, 60].map((hz) => {
            const x = xOf(hz);
            return (
              <text
                key={hz}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="12"
                fontFamily="JetBrains Mono, monospace"
              >
                {hz}
              </text>
            );
          })}

          {/* Pre-filter ghost curve when any digital filter is active */}
          {anyFilterOn && (
            <polyline
              fill="none"
              stroke="#fb7185"
              strokeOpacity="0.52"
              strokeWidth="1.4"
              strokeDasharray="4 3"
              points={rawPoints}
            />
          )}

          {/* Filtered PSD area & crisp main curve */}
          <polygon points={areaPoints} fill="rgba(248, 250, 252, 0.09)" />
          <polyline
            fill="none"
            stroke="#f8fafc"
            strokeWidth="2.15"
            strokeLinejoin="round"
            points={avgPoints}
          />
        </svg>
      </div>

      {/* Relative band power distribution */}
      <div className="band-summary-grid">
        {BAND_DEFINITIONS.map((band) => {
          const pct = snapshot.relativeBandPct[band.key];
          const absPower = snapshot.meanBandPower[band.key];
          return (
            <div key={band.key} className="band-stat-card">
              <div className="band-stat-top">
                <span className="band-label" style={{ color: band.inkColor }}>
                  {band.label}
                </span>
                <span className="mono-strong">{pct.toFixed(1)}%</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.min(100, pct * 1.4)}%`,
                    backgroundColor: band.inkColor,
                  }}
                />
              </div>
              <div className="band-stat-foot">
                <span>{band.rangeLabel}</span>
                <span>{absPower.toFixed(1)} &micro;V&sup2;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
