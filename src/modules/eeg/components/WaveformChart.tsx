import React from 'react';
import { CHANNEL_META } from '../eeg/presets';
import { ChannelId, SignalSnapshot } from '../eeg/types';

interface WaveformChartProps {
  snapshot: SignalSnapshot;
  visibleChannels: Record<ChannelId, boolean>;
  onToggleChannel: (id: ChannelId) => void;
  uvScale: number;
  onCycleScale: () => void;
  onTriggerBlink: () => void;
}

export const WaveformChart: React.FC<WaveformChartProps> = ({
  snapshot,
  visibleChannels,
  onToggleChannel,
  uvScale,
  onCycleScale,
  onTriggerBlink,
}) => {
  const activeChannels = CHANNEL_META.filter((c) => visibleChannels[c.id]);
  const channelsToRender = activeChannels.length > 0 ? activeChannels : CHANNEL_META;

  const width = 760;
  const rowHeight = 72;
  const padTop = 18;
  const padBottom = 28;
  const padLeft = 62;
  const padRight = 18;
  const height = padTop + channelsToRender.length * rowHeight + padBottom;
  const plotW = width - padLeft - padRight;
  const stride = 2;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Live brainwaves from 4 sensors</h2>
          <p className="panel-subtitle">
            {snapshot.sampleRateHz} readings per second (sampling rate) &middot; last{' '}
            {snapshot.windowSec.toFixed(1)} s &middot; each row spans &plusmn;{uvScale} &micro;V
            (microvolts, millionths of a volt)
          </p>
          <p className="eeg-hint">
            AF7 and AF8 sit on the forehead, TP9 and TP10 behind the ears. The number under each
            name is the average wave size.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="chip-btn"
            onClick={onTriggerBlink}
            title="Inject a single 115 uV frontal eye-blink pulse on AF7/AF8"
          >
            Add a blink
          </button>
          <button type="button" className="chip-btn" onClick={onCycleScale}>
            &plusmn;{uvScale} &micro;V
          </button>
        </div>
      </div>

      <div className="channel-pills" role="group" aria-label="Toggle EEG channels">
        {CHANNEL_META.map((ch) => {
          const active = visibleChannels[ch.id];
          return (
            <button
              key={ch.id}
              type="button"
              className={`pill-btn ${active ? 'pill-btn-active' : ''}`}
              onClick={() => onToggleChannel(ch.id)}
              aria-pressed={active}
            >
              <span
                className="dot"
                style={{ backgroundColor: active ? ch.inkColor : '#a8a29e' }}
              />
              <span>{ch.id}</span>
              <span className="pill-sub">{ch.region.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Framed dark scientific oscilloscope figure box */}
      <div className="figure-dark">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="fluid-svg"
          role="img"
          aria-label="Four channel EEG time-series oscilloscope"
        >
          {[0, 0.5, 1.0, 1.5, 2.0].map((sec) => {
            const x = padLeft + (sec / 2.0) * plotW;
            return (
              <g key={sec}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={height - padBottom}
                  stroke="rgba(148, 163, 184, 0.16)"
                  strokeDasharray="3 4"
                />
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="12"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {sec.toFixed(1)}s
                </text>
              </g>
            );
          })}

          {channelsToRender.map((ch, idx) => {
            const frame = snapshot.channels[ch.id];
            const centerY = padTop + idx * rowHeight + rowHeight / 2;
            const halfSpan = rowHeight * 0.42;

            const pts: string[] = [];
            const n = frame.samples.length;
            for (let i = 0; i < n; i += stride) {
              const x = padLeft + (i / (n - 1)) * plotW;
              const clamped = Math.max(-uvScale * 1.15, Math.min(uvScale * 1.15, frame.samples[i]));
              const y = centerY - (clamped / uvScale) * halfSpan;
              pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
            }

            return (
              <g key={ch.id}>
                <line
                  x1={padLeft}
                  y1={centerY}
                  x2={width - padRight}
                  y2={centerY}
                  stroke="rgba(148, 163, 184, 0.14)"
                />
                <text
                  x={10}
                  y={centerY - 4}
                  fill={ch.color}
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {ch.id}
                </text>
                <text
                  x={10}
                  y={centerY + 13}
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {frame.rmsUv.toFixed(1)} &micro;V
                </text>
                <polyline
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                  points={pts.join(' ')}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
