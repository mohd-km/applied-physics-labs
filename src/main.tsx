import React from 'react';
import ReactDOM from 'react-dom/client';
import './shell/shell.css';
import { Shell, type ShellConfig } from './shell/Shell';

const T1 = 'engineering, energy & space';
const T2 = 'matter & quantum';
const T3 = 'bio & mind';

const config: ShellConfig = {
  pillar: 'worldview & physics',
  title: 'Applied Physics & Deep-Tech Labs',
  subtitle:
    'Seven first-principles simulators across engineering, energy, space, quantum chemistry, materials, longevity and neurotech, each one live and editable in your browser.',
  footer: 'Applied Physics & Deep-Tech Labs · runs entirely in your browser · Mohammed KM',
  tabs: [
    {
      id: 'engineering', track: T1, label: 'Engineering', sub: 'BOM · factory · rocket $/kg', scope: 'engineering',
      provenance: [{ kind: 'model', label: 'BOM, line-throughput & Tsiolkovsky equations' }, { kind: 'real', label: 'approximate public commodity prices' }],
      load: () => import('./modules/engineering/Module'),
    },
    {
      id: 'grid', track: T1, label: 'Power grid', sub: 'duck curve · HVDC loss', scope: 'grid',
      provenance: [{ kind: 'model', label: 'hourly dispatch & I²R loss equations' }],
      load: () => import('./modules/grid/App'),
    },
    {
      id: 'orbits', track: T1, label: 'Orbits & links', sub: 'LEO → GEO · Shannon', scope: 'orbits',
      provenance: [{ kind: 'model', label: 'Kepler, vis-viva, Friis & Shannon' }],
      load: () => import('./modules/orbits/App'),
    },
    {
      id: 'quantum', track: T2, label: 'Quantum VQE', sub: 'H₂ / LiH · noise wall', scope: 'quantum',
      provenance: [{ kind: 'real', label: 'published STO-3G reference energies' }, { kind: 'model', label: 'simulated 2-qubit circuit & noise' }],
      load: () => import('./modules/quantum/App'),
    },
    {
      id: 'materials', track: T2, label: 'Materials', sub: 'band gap × hull Pareto', scope: 'materials',
      provenance: [{ kind: 'real', label: 'known crystals & literature band gaps' }, { kind: 'synthetic', label: 'hand-curated hull & supply scores' }, { kind: 'model', label: 'Pareto frontier' }],
      load: () => import('./modules/materials/App'),
    },
    {
      id: 'molecules', track: T3, label: 'Longevity', sub: 'molecule triage · radar', scope: 'molecules',
      provenance: [{ kind: 'real', label: 'curated ChEMBL / DrugAge / ITP values' }, { kind: 'model', label: 'Lipinski & weighted triage score' }],
      load: () => import('./modules/molecules/App'),
    },
    {
      id: 'eeg', track: T3, label: 'EEG decoder', sub: 'FFT · filters · CSV', scope: 'eeg',
      provenance: [{ kind: 'synthetic', label: 'generated EEG & ROC benchmarks' }, { kind: 'model', label: 'radix-2 FFT & IIR filters' }],
      note: 'uploaded CSVs stay in your browser',
      load: () => import('./modules/eeg/App'),
    },
  ],
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Shell config={config} />
  </React.StrictMode>,
);
