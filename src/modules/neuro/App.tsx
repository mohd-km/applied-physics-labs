import './styles.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DA_CONST,
  DA_PRESETS,
  DaInputs,
  LIF_CONST,
  LIF_PRESETS,
  LifInputs,
  daCsv,
  daMarkdown,
  daTakeaway,
  download,
  lifCsv,
  simulateDopamine,
  simulateLif,
} from './model';

const num = (s: string, fallback: number) => {
  const x = parseFloat(s);
  return Number.isFinite(x) ? x : fallback;
};

type SliderProps = {
  id: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
};

function Slider({ id, label, hint, value, min, max, step, unit, onChange }: SliderProps) {
  return (
    <div className="nr-slider">
      <label htmlFor={id}>
        <span>{label}</span>
        <span className="nr-val">
          {value} {unit}
        </span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(num(e.target.value, value))} />
      <span className="nr-hint">{hint}</span>
    </div>
  );
}

/* Chart width follows its container so labels stay readable on phones (listener removed on unmount). */
function useWidth(fallback: number) {
  const ref = useRef<HTMLElement | null>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw && Number.isFinite(cw) && cw > 0) setW(Math.max(280, Math.min(1000, Math.round(cw))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* Sweep the newly drawn trace from left to right (cancelled on unmount or when a new run starts). */
function useSweep(key: string) {
  const [p, setP] = useState(1);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setP(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 700);
      setP(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    setP(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key]);
  return p;
}

/* ---------------- Lab 1 ---------------- */

function LifLab() {
  const [inp, setInp] = useState<LifInputs>(LIF_PRESETS[1].inputs);
  const [preset, setPreset] = useState<string>('steady');
  const r = useMemo(() => simulateLif(inp), [inp]);
  const sweep = useSweep(`${inp.currentPA}|${inp.thresholdMV}|${inp.leakNS}`);
  const set = (k: keyof LifInputs) => (v: number) => {
    setPreset('');
    setInp((s) => ({ ...s, [k]: v }));
  };

  const [figRef, W] = useWidth(720);
  const H = W < 520 ? 240 : 300;
  const m = { l: 48, r: 14, t: 14, b: 36 };
  const vMin = -80;
  const vMax = 40;
  const x = (ms: number) => m.l + (ms / LIF_CONST.durationMS) * (W - m.l - m.r);
  const y = (mv: number) => m.t + ((vMax - mv) / (vMax - vMin)) * (H - m.t - m.b);
  const path = r.t.map((ms, i) => `${i ? 'L' : 'M'}${x(ms).toFixed(1)},${y(r.v[i]).toFixed(1)}`).join('');
  const clipW = Math.max(0, (W - m.l - m.r) * sweep);

  const firing = r.spikes.length > 0;
  const summary = firing
    ? `The input pushes the cell towards ${r.steadyMV.toFixed(0)} mV, above the ${inp.thresholdMV} mV threshold, so it fires again and again. Stronger input charges it faster, so the spikes come closer together, but every spike is the same height: that is what all-or-nothing means.`
    : `The input only pushes the cell up to ${r.steadyMV.toFixed(0)} mV, which never reaches the ${inp.thresholdMV} mV threshold, so it never fires. ${r.rheobasePA < 1000 ? `It needs a little more than ${Math.ceil(r.rheobasePA)} pA (the smallest current that can make it fire) to spike.` : `With this much leak and this high a threshold it would need more than ${Math.ceil(r.rheobasePA)} pA, beyond this slider's range: lower the leak or the threshold.`}`;

  return (
    <section className="nr-card" aria-labelledby="nr-lif-h">
      <h2 id="nr-lif-h">Lab 1 · Spiking neuron simulator</h2>
      <p className="nr-lede">
        Leaky Integrate-and-Fire (LIF — a standard mathematical model of a single neuron). The cell membrane is a leaky bucket for
        electric charge: input current fills it, the leak drains it, and when the voltage crosses the threshold it fires an action
        potential (an all-or-nothing electrical spike), drops back below rest and sits out a 2 ms refractory period (a short pause
        when it cannot fire again).
      </p>
      <div className="nr-presets" role="group" aria-label="Neuron presets">
        {LIF_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`nr-btn ${preset === p.id ? 'on' : ''}`}
            aria-pressed={preset === p.id}
            onClick={() => {
              setPreset(p.id);
              setInp(p.inputs);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="nr-grid">
        <div className="nr-controls">
          <Slider id="nr-i" label="Input current" hint="pA, picoamps (trillionths of an amp): how hard other cells are pushing charge in" value={inp.currentPA} min={0} max={1000} step={10} unit="pA" onChange={set('currentPA')} />
          <Slider id="nr-th" label="Firing threshold" hint="mV, millivolts (thousandths of a volt): the voltage at which the cell fires" value={inp.thresholdMV} min={-60} max={-40} step={1} unit="mV" onChange={set('thresholdMV')} />
          <Slider id="nr-leak" label="Membrane leak" hint="nS, nanosiemens: how easily charge escapes; more leak means it forgets input faster" value={inp.leakNS} min={5} max={40} step={1} unit="nS" onChange={set('leakNS')} />
          <div className="nr-stats">
            <div>
              <span className="nr-k">Firing rate</span>
              <span className="nr-v">{r.rateHz.toFixed(0)} Hz</span>
              <span className="nr-hint">Hz, hertz: spikes per second</span>
            </div>
            <div>
              <span className="nr-k">Time to first spike</span>
              <span className="nr-v">{r.firstSpikeMS === null ? 'none' : `${r.firstSpikeMS.toFixed(1)} ms`}</span>
              <span className="nr-hint">ms, milliseconds, after the input switches on</span>
            </div>
            <div>
              <span className="nr-k">Charge memory</span>
              <span className="nr-v">{r.tauMS.toFixed(0)} ms</span>
              <span className="nr-hint">time constant: how long charge lingers before leaking away</span>
            </div>
          </div>
        </div>
        <figure className="nr-fig" ref={figRef as React.RefObject<HTMLElement>}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Membrane voltage over time: ${r.spikes.length} spikes`}>
            <defs>
              <clipPath id="nr-lif-clip">
                <rect x={m.l} y={0} width={clipW} height={H} />
              </clipPath>
            </defs>
            <rect x={x(LIF_CONST.stimOnMS)} y={m.t} width={x(LIF_CONST.stimOffMS) - x(LIF_CONST.stimOnMS)} height={H - m.t - m.b} className="nr-stim" />
            {[-80, -60, -40, -20, 0, 20, 40].map((v) => (
              <g key={v}>
                <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} className="nr-gridline" />
                <text x={m.l - 6} y={y(v) + 4} textAnchor="end" className="nr-tick">{v}</text>
              </g>
            ))}
            {(W < 520 ? [0, 100, 200, 300] : [0, 50, 100, 150, 200, 250, 300]).map((ms) => (
              <text key={ms} x={x(ms)} y={H - m.b + 16} textAnchor="middle" className="nr-tick">{ms}</text>
            ))}
            <text x={(W + m.l) / 2} y={H - 4} textAnchor="middle" className="nr-axis">time (ms)</text>
            <text x={12} y={(H - m.b) / 2} textAnchor="middle" className="nr-axis" transform={`rotate(-90 12 ${(H - m.b) / 2})`}>voltage (mV)</text>
            <line x1={m.l} x2={W - m.r} y1={y(inp.thresholdMV)} y2={y(inp.thresholdMV)} className="nr-thresh" />
            <text x={W - m.r - 4} y={y(inp.thresholdMV) - 5} textAnchor="end" className="nr-label-th">threshold {inp.thresholdMV} mV</text>
            <line x1={m.l} x2={W - m.r} y1={y(LIF_CONST.restMV)} y2={y(LIF_CONST.restMV)} className="nr-rest" />
            <text x={W - m.r - 4} y={y(LIF_CONST.restMV) + 14} textAnchor="end" className="nr-label">rest −70 mV</text>
            <path d={path} className="nr-trace" clipPath="url(#nr-lif-clip)" />
          </svg>
          <figcaption>Shaded band: input current switched on (20 to 280 ms). Each vertical line is one action potential.</figcaption>
        </figure>
      </div>
      <p className="nr-takeaway">{summary}</p>
      <div className="nr-actions">
        <button type="button" className="nr-btn" onClick={() => download('neuron-voltage-trace.csv', lifCsv(inp, r), 'text/csv')}>
          Download voltage trace (CSV)
        </button>
      </div>
    </section>
  );
}

/* ---------------- Lab 2 ---------------- */

function DopamineLab() {
  const [inp, setInp] = useState<DaInputs>(DA_PRESETS[0].inputs);
  const [preset, setPreset] = useState<string>('unexpected');
  const r = useMemo(() => simulateDopamine(inp), [inp]);
  const sweep = useSweep(`${inp.expected}|${inp.actual}|${inp.days}`);
  const set = (k: keyof DaInputs) => (v: number) => {
    setPreset('');
    setInp((s) => ({ ...s, [k]: v }));
  };

  const [figRef, W] = useWidth(720);
  const H = W < 520 ? 240 : 300;
  const m = { l: 48, r: 14, t: 18, b: 36 };
  const yMax = 30;
  const x = (s: number) => m.l + (s / DA_CONST.durationS) * (W - m.l - m.r);
  const y = (hz: number) => m.t + ((yMax - Math.min(yMax, hz)) / yMax) * (H - m.t - m.b);
  const path = r.t.map((s, i) => `${i ? 'L' : 'M'}${x(s).toFixed(1)},${y(r.rate[i]).toFixed(1)}`).join('');
  const clipW = Math.max(0, (W - m.l - m.r) * sweep);

  // Small chart: resting level across 30 days
  const SW = W;
  const SH = 150;
  const sm = { l: 48, r: 14, t: 14, b: 32 };
  const sx = (d: number) => sm.l + ((d - 1) / 29) * (SW - sm.l - sm.r);
  const sy = (hz: number) => sm.t + ((6 - hz) / 6) * (SH - sm.t - sm.b);
  const spath = r.days.map((d, i) => `${i ? 'L' : 'M'}${sx(d.day).toFixed(1)},${sy(d.baseline).toFixed(1)}`).join('');
  const dayNow = Math.round(inp.days);

  const takeaway = daTakeaway(inp, r);
  const rpeLabel = `${r.rpe > 0 ? '+' : ''}${r.rpe}`;

  return (
    <section className="nr-card" aria-labelledby="nr-da-h">
      <h2 id="nr-da-h">Lab 2 · Dopamine and reward prediction error</h2>
      <p className="nr-lede">
        Reward Prediction Error (RPE — the gap between expected and actual reward). Dopamine cells deep in the brain fire about 5 times
        a second at rest; this steady background is the tonic level. On top of it come phasic responses (brief bursts or pauses):
        a burst when a reward is better than expected, nothing extra when it is exactly as expected, and a pause below rest when a
        promised reward does not arrive. Repeating the same strong reward every day slowly lowers the tonic level itself: the pleasure
        side of the seesaw is matched by a growing pain side.
      </p>
      <div className="nr-presets" role="group" aria-label="Dopamine presets">
        {DA_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`nr-btn ${preset === p.id ? 'on' : ''}`}
            aria-pressed={preset === p.id}
            onClick={() => {
              setPreset(p.id);
              setInp(p.inputs);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="nr-grid">
        <div className="nr-controls">
          <Slider id="nr-exp" label="Expected reward" hint="what the cue promised, 0 (nothing) to 100 (the best possible)" value={inp.expected} min={0} max={100} step={1} unit="" onChange={set('expected')} />
          <Slider id="nr-act" label="Actual reward received" hint="what really arrived, on the same 0 to 100 scale" value={inp.actual} min={0} max={100} step={1} unit="" onChange={set('actual')} />
          <Slider id="nr-days" label="Habit repetition count" hint="how many days in a row the same strong reward has been repeated" value={inp.days} min={1} max={30} step={1} unit={inp.days === 1 ? 'day' : 'days'} onChange={set('days')} />
          <div className="nr-stats">
            <div>
              <span className="nr-k">Prediction error</span>
              <span className="nr-v">{rpeLabel}</span>
              <span className="nr-hint">actual minus expected</span>
            </div>
            <div>
              <span className="nr-k">Firing at the reward</span>
              <span className="nr-v">{r.rewardPeakOrDip.toFixed(1)} Hz</span>
              <span className="nr-hint">spikes per second (rest is about 5)</span>
            </div>
            <div>
              <span className="nr-k">Resting level vs day 1</span>
              <span className="nr-v">{r.tolerancePct < 0.5 ? 'unchanged' : `−${r.tolerancePct.toFixed(0)}%`}</span>
              <span className="nr-hint">how far tolerance has lowered the tonic level</span>
            </div>
          </div>
        </div>
        <figure className="nr-fig" ref={figRef as React.RefObject<HTMLElement>}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Dopamine firing over one trial, prediction error ${rpeLabel}`}>
            <defs>
              <clipPath id="nr-da-clip">
                <rect x={m.l} y={0} width={clipW} height={H} />
              </clipPath>
            </defs>
            {[0, 5, 10, 15, 20, 25, 30].map((v) => (
              <g key={v}>
                <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} className="nr-gridline" />
                <text x={m.l - 6} y={y(v) + 4} textAnchor="end" className="nr-tick">{v}</text>
              </g>
            ))}
            {(W < 520 ? [0, 2, 4, 6, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8]).map((s) => (
              <text key={s} x={x(s)} y={H - m.b + 16} textAnchor="middle" className="nr-tick">{s}</text>
            ))}
            <text x={(W + m.l) / 2} y={H - 4} textAnchor="middle" className="nr-axis">time in one trial (seconds)</text>
            <text x={12} y={(H - m.b) / 2} textAnchor="middle" className="nr-axis" transform={`rotate(-90 12 ${(H - m.b) / 2})`}>firing (Hz)</text>
            <line x1={x(DA_CONST.cueS)} x2={x(DA_CONST.cueS)} y1={m.t} y2={H - m.b} className="nr-event" />
            <text x={x(DA_CONST.cueS) + 4} y={m.t + 10} className="nr-label">{W < 520 ? 'cue' : 'cue (promise)'}</text>
            <line x1={x(DA_CONST.rewardS)} x2={x(DA_CONST.rewardS)} y1={m.t} y2={H - m.b} className="nr-event" />
            <text x={x(DA_CONST.rewardS) + 4} y={m.t + 10} className="nr-label">{W < 520 ? 'reward' : 'reward arrives'}</text>
            {r.baselineToday < r.baselineDay1 - 0.05 ? (
              <>
                <line x1={m.l} x2={W - m.r} y1={y(r.baselineDay1)} y2={y(r.baselineDay1)} className="nr-rest" />
                <text x={W - m.r - 4} y={y(r.baselineDay1) - 5} textAnchor="end" className="nr-label">day 1 resting level</text>
              </>
            ) : null}
            <line x1={m.l} x2={W - m.r} y1={y(r.baselineToday)} y2={y(r.baselineToday)} className="nr-tonic" />
            <text x={W - m.r - 4} y={y(r.baselineToday) + 14} textAnchor="end" className="nr-label-tonic">tonic (resting) level today</text>
            <path d={path} className="nr-trace nr-trace-da" clipPath="url(#nr-da-clip)" />
          </svg>
          <figcaption>Solid line: phasic dopamine firing during one trial. Dashed blue: tonic baseline today.</figcaption>
          <svg viewBox={`0 0 ${SW} ${SH}`} role="img" aria-label="Resting dopamine level across 30 days of repetition" className="nr-small">
            {[0, 2, 4, 6].map((v) => (
              <g key={v}>
                <line x1={sm.l} x2={SW - sm.r} y1={sy(v)} y2={sy(v)} className="nr-gridline" />
                <text x={sm.l - 6} y={sy(v) + 4} textAnchor="end" className="nr-tick">{v}</text>
              </g>
            ))}
            {(SW < 520 ? [1, 10, 20, 30] : [1, 5, 10, 15, 20, 25, 30]).map((d) => (
              <text key={d} x={sx(d)} y={SH - sm.b + 16} textAnchor="middle" className="nr-tick">{d}</text>
            ))}
            <text x={(SW + sm.l) / 2} y={SH - 2} textAnchor="middle" className="nr-axis">day of repetition</text>
            <path d={spath} className="nr-tonic-curve" />
            <circle cx={sx(dayNow)} cy={sy(r.baselineToday)} r={5} className="nr-dot" />
          </svg>
          <figcaption>Tonic resting level (Hz) across 30 days of the same reward; the dot is today.</figcaption>
        </figure>
      </div>
      <p className="nr-takeaway">{takeaway}</p>
      <div className="nr-actions">
        <button type="button" className="nr-btn" onClick={() => download('dopamine-run-summary.md', daMarkdown(inp, r), 'text/markdown')}>
          Download summary (Markdown)
        </button>
        <button type="button" className="nr-btn" onClick={() => download('dopamine-firing.csv', daCsv(inp, r), 'text/csv')}>
          Download firing data (CSV)
        </button>
      </div>
    </section>
  );
}

export const App: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="nr-page" ref={rootRef}>
      <LifLab />
      <DopamineLab />
      <p className="nr-note">
        These are standard textbook neuroscience models: the Leaky Integrate-and-Fire neuron, and Wolfram Schultz's reward prediction
        error with opponent-process baseline adaptation. Numbers are illustrative teaching values, not clinical measurements of any
        person's brain.
      </p>
    </div>
  );
};

export default App;
