// Textbook teaching models (not clinical measurements).
// Lab 1: Leaky Integrate-and-Fire neuron. Lab 2: Schultz reward prediction error + opponent-process baseline adaptation.

const clamp = (x: number, lo: number, hi: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : lo);

/* ---------------- Lab 1: Leaky Integrate-and-Fire ---------------- */

export type LifInputs = {
  currentPA: number; // input current, picoamps (0-1000)
  thresholdMV: number; // firing threshold, millivolts (-60 to -40)
  leakNS: number; // leak conductance, nanosiemens (5-40)
};

export const LIF_CONST = {
  restMV: -70, // resting voltage
  resetMV: -75, // voltage right after a spike
  peakMV: 30, // drawn top of the spike
  capPF: 200, // membrane capacitance, picofarads
  refractoryMS: 2, // dead time after a spike
  durationMS: 300,
  stimOnMS: 20,
  stimOffMS: 280,
  dtMS: 0.1,
};

export type LifResult = {
  t: number[];
  v: number[];
  spikes: number[]; // spike times, ms
  rateHz: number; // spikes per second during the input window
  firstSpikeMS: number | null; // from input onset
  tauMS: number; // membrane time constant (how long charge lingers)
  steadyMV: number; // voltage the cell would settle at with no threshold
  rheobasePA: number; // smallest current that ever makes it fire
};

export const LIF_PRESETS: { id: string; label: string; inputs: LifInputs }[] = [
  { id: 'sub', label: 'Sub-threshold — no spike', inputs: { currentPA: 150, thresholdMV: -50, leakNS: 10 } },
  { id: 'steady', label: 'Steady firing', inputs: { currentPA: 300, thresholdMV: -50, leakNS: 10 } },
  { id: 'burst', label: 'High-frequency burst', inputs: { currentPA: 900, thresholdMV: -50, leakNS: 10 } },
];

export function simulateLif(raw: LifInputs): LifResult {
  const c = LIF_CONST;
  const I = clamp(raw.currentPA, 0, 1000);
  const vth = clamp(raw.thresholdMV, -60, -40);
  const g = clamp(raw.leakNS, 5, 40);
  const steps = Math.round(c.durationMS / c.dtMS);
  const t: number[] = [];
  const v: number[] = [];
  const spikes: number[] = [];
  let V = c.restMV;
  let refUntil = -1;
  const every = 5; // keep 1 in 5 points for drawing (0.5 ms resolution) plus every spike peak
  for (let i = 0; i <= steps; i++) {
    const time = i * c.dtMS;
    const input = time >= c.stimOnMS && time < c.stimOffMS ? I : 0;
    let drawV = V;
    if (time < refUntil) {
      V = c.resetMV;
      drawV = V;
    } else {
      // C dV/dt = -g (V - E_rest) + I   (pA / pF = mV / ms)
      V += (c.dtMS * (-g * (V - c.restMV) + input)) / c.capPF;
      if (V >= vth) {
        spikes.push(time);
        drawV = c.peakMV;
        V = c.resetMV;
        refUntil = time + c.refractoryMS;
      } else drawV = V;
    }
    if (i % every === 0 || drawV === c.peakMV) {
      if (drawV === c.peakMV) {
        // vertical spike: threshold -> peak -> reset
        t.push(time, time, time);
        v.push(vth, c.peakMV, c.resetMV);
      } else {
        t.push(time);
        v.push(drawV);
      }
    }
  }
  const inWindow = spikes.filter((s) => s >= c.stimOnMS && s < c.stimOffMS);
  const windowS = (c.stimOffMS - c.stimOnMS) / 1000;
  const rateHz = inWindow.length / windowS;
  return {
    t,
    v,
    spikes,
    rateHz: Number.isFinite(rateHz) ? rateHz : 0,
    firstSpikeMS: inWindow.length ? inWindow[0] - c.stimOnMS : null,
    tauMS: c.capPF / g,
    steadyMV: c.restMV + I / g,
    rheobasePA: g * (vth - c.restMV),
  };
}

/* ---------------- Lab 2: Dopamine and Reward Prediction Error ---------------- */

export type DaInputs = {
  expected: number; // 0-100
  actual: number; // 0-100
  days: number; // 1-30 repetitions of the same high-dopamine habit
};

export const DA_CONST = {
  baselineHz: 5, // typical resting (tonic) firing of a dopamine neuron
  gainHzPerPoint: 0.2, // extra spikes per second per point of surprise
  cueS: 1,
  rewardS: 3,
  durationS: 8,
  dtS: 0.02,
  maxBaselineDrop: 0.45, // after long, intense repetition the resting level can fall up to 45%
  adaptDays: 8, // how quickly tolerance builds
};

export const DA_PRESETS: { id: string; label: string; inputs: DaInputs }[] = [
  { id: 'unexpected', label: 'Unexpected reward (first time)', inputs: { expected: 0, actual: 80, days: 1 } },
  { id: 'expected', label: 'Expected reward (after learning)', inputs: { expected: 80, actual: 80, days: 1 } },
  { id: 'missing', label: 'Promised reward missing (disappointment dip)', inputs: { expected: 80, actual: 0, days: 1 } },
  { id: 'habit', label: 'Repeated high-dopamine habit (baseline drop / tolerance)', inputs: { expected: 90, actual: 90, days: 30 } },
];

export type DaResult = {
  t: number[];
  rate: number[];
  rpe: number; // actual - expected
  baselineToday: number;
  baselineDay1: number;
  cuePeak: number;
  rewardPeakOrDip: number; // firing at the moment of reward
  afterDip: number; // lowest firing in the 2 s after reward
  tolerancePct: number; // how far the resting level has fallen
  days: { day: number; baseline: number }[];
};

function adaptation(intensity: number, days: number) {
  // Opponent process: each repetition strengthens a slow counter-reaction (the "pain" side of the seesaw).
  return intensity * (1 - Math.exp(-(days - 1) / DA_CONST.adaptDays));
}

export function simulateDopamine(raw: DaInputs): DaResult {
  const c = DA_CONST;
  const E = clamp(raw.expected, 0, 100);
  const R = clamp(raw.actual, 0, 100);
  const N = Math.round(clamp(raw.days, 1, 30));
  const intensity = Math.max(E, R) / 100; // how strong the habit's reward is
  const adapt = adaptation(intensity, N);
  const baselineToday = c.baselineHz * (1 - c.maxBaselineDrop * adapt);
  const rpe = R - E;
  // After the reward, the counter-reaction pulls firing below the resting level for a while.
  const bAmp = c.baselineHz * 0.8 * adapt * (R / 100);
  const gauss = (x: number, mu: number, s: number) => Math.exp(-((x - mu) ** 2) / (2 * s * s));
  const t: number[] = [];
  const rate: number[] = [];
  const steps = Math.round(c.durationS / c.dtS);
  for (let i = 0; i <= steps; i++) {
    const x = i * c.dtS;
    let r = baselineToday;
    r += c.gainHzPerPoint * E * gauss(x, c.cueS + 0.15, 0.12); // the cue now predicts the reward
    if (rpe >= 0) r += c.gainHzPerPoint * rpe * gauss(x, c.rewardS + 0.15, 0.12);
    else r += c.gainHzPerPoint * rpe * gauss(x, c.rewardS + 0.25, 0.25); // a pause, slightly longer than a burst
    if (x > c.rewardS + 0.3) r -= bAmp * (1 - Math.exp(-(x - c.rewardS - 0.3) / 0.4)) * Math.exp(-(x - c.rewardS - 0.3) / 2.5);
    rate.push(Math.max(0, Number.isFinite(r) ? r : 0));
    t.push(x);
  }
  const at = (s: number) => rate[Math.min(rate.length - 1, Math.max(0, Math.round(s / c.dtS)))];
  const windowAfter = rate.filter((_, i) => t[i] > c.rewardS + 0.6 && t[i] < c.rewardS + 2.6);
  const days: { day: number; baseline: number }[] = [];
  for (let d = 1; d <= 30; d++) days.push({ day: d, baseline: c.baselineHz * (1 - c.maxBaselineDrop * adaptation(intensity, d)) });
  return {
    t,
    rate,
    rpe,
    baselineToday,
    baselineDay1: c.baselineHz,
    cuePeak: at(c.cueS + 0.15),
    rewardPeakOrDip: rpe >= 0 ? at(c.rewardS + 0.15) : at(c.rewardS + 0.25),
    afterDip: windowAfter.length ? Math.min(...windowAfter) : baselineToday,
    tolerancePct: (1 - baselineToday / c.baselineHz) * 100,
    days,
  };
}

export function daTakeaway(inp: DaInputs, r: DaResult): string {
  const E = Math.round(inp.expected);
  const A = Math.round(inp.actual);
  const parts: string[] = [];
  if (r.rpe > 10)
    parts.push(`The reward (${A}) beat what was expected (${E}), so the prediction error is +${r.rpe} and dopamine cells burst to about ${r.rewardPeakOrDip.toFixed(0)} spikes per second. That burst is a teaching signal: "this was better than I thought, remember what led here."`);
  else if (r.rpe < -10)
    parts.push(`A reward of ${E} was promised but ${A === 0 ? 'nothing' : `only ${A}`} arrived, so the prediction error is ${r.rpe}. Dopamine firing drops below its resting level (to about ${r.rewardPeakOrDip.toFixed(1)} spikes per second): the brain's version of disappointment.`);
  else
    parts.push(`The reward (${A}) matched the expectation (${E}), so there is almost no prediction error and almost no dopamine burst at the reward. The excitement has moved earlier, to the cue that predicts it.`);
  if (inp.days > 1 && r.tolerancePct >= 3)
    parts.push(`After ${Math.round(inp.days)} days of repeating it, the resting (tonic) level has fallen about ${r.tolerancePct.toFixed(0)}% below day 1, and firing sinks to about ${r.afterDip.toFixed(1)} spikes per second after the reward wears off. Same reward, smaller net lift, deeper low afterwards: tolerance.`);
  return parts.join(' ');
}

/* ---------------- Exports ---------------- */

export function daCsv(inp: DaInputs, r: DaResult): string {
  const head = `# expected=${inp.expected},actual=${inp.actual},days=${inp.days},rpe=${r.rpe}\ntime_s,dopamine_firing_hz,tonic_baseline_hz\n`;
  return head + r.t.map((x, i) => `${x.toFixed(2)},${r.rate[i].toFixed(3)},${r.baselineToday.toFixed(3)}`).join('\n') + '\n';
}

export function daMarkdown(inp: DaInputs, r: DaResult): string {
  return [
    '# Dopamine and reward prediction error: run summary',
    '',
    'Textbook teaching model (Schultz reward prediction error plus opponent-process baseline adaptation), not a clinical measurement.',
    '',
    '| Setting | Value |',
    '|---|---|',
    `| Expected reward (0-100) | ${inp.expected} |`,
    `| Actual reward received (0-100) | ${inp.actual} |`,
    `| Days the habit was repeated | ${inp.days} |`,
    `| Reward prediction error (actual minus expected) | ${r.rpe > 0 ? '+' : ''}${r.rpe} |`,
    `| Resting (tonic) firing today, spikes per second | ${r.baselineToday.toFixed(2)} |`,
    `| Resting firing on day 1, spikes per second | ${r.baselineDay1.toFixed(2)} |`,
    `| Firing at the cue, spikes per second | ${r.cuePeak.toFixed(2)} |`,
    `| Firing at the reward, spikes per second | ${r.rewardPeakOrDip.toFixed(2)} |`,
    `| Lowest firing after the reward, spikes per second | ${r.afterDip.toFixed(2)} |`,
    '',
    '## Takeaway',
    '',
    daTakeaway(inp, r),
    '',
  ].join('\n');
}

export function lifCsv(inp: LifInputs, r: LifResult): string {
  const head = `# current_pA=${inp.currentPA},threshold_mV=${inp.thresholdMV},leak_nS=${inp.leakNS},rate_hz=${r.rateHz.toFixed(1)}\ntime_ms,voltage_mV\n`;
  return head + r.t.map((x, i) => `${x.toFixed(1)},${r.v[i].toFixed(2)}`).join('\n') + '\n';
}

export function download(name: string, text: string, type: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* downloads blocked: nothing to do */
  }
}
