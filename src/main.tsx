import React from 'react';
import ReactDOM from 'react-dom/client';
import './shell/shell.css';
import { Shell, type ShellConfig } from './shell/Shell';
import DefaultTab from './modules/engineering/Module';
import engineeringStory from './modules/engineering/story';
import gridStory from './modules/grid/story';
import orbitsStory from './modules/orbits/story';
import quantumStory from './modules/quantum/story';
import materialsStory from './modules/materials/story';
import moleculesStory from './modules/molecules/story';
import eegStory from './modules/eeg/story';
import neuroStory from './modules/neuro/story';

const T1 = 'engineering, energy & space';
const T2 = 'matter & quantum';
const T3 = 'bio & mind';

const config: ShellConfig = {
  pillar: 'worldview & physics',
  title: 'Applied Physics & Deep-Tech Labs',
  subtitle:
    'Eight hands-on simulators built from basic physics, chemistry and biology: rockets, power grids, satellites, quantum chips, new materials, anti-ageing molecules, brainwaves, and neurons and dopamine. Move a slider and the maths reruns in your browser.',
  footer: 'Applied Physics & Deep-Tech Labs · runs entirely in your browser · Mohammed KM',
  tabs: [
    {
      id: 'engineering', story: engineeringStory, track: T1, label: 'Engineering', sub: 'part prices · factory · rocket cost', scope: 'engineering',
      provenance: [{ kind: 'model', label: 'simple cost, factory-speed & rocket-fuel formulas' }, { kind: 'real', label: 'approximate public material prices' }],
      component: DefaultTab,
      load: () => import('./modules/engineering/Module'),
    },
    {
      id: 'grid', story: gridStory, track: T1, label: 'Power grid', sub: 'daily power mix · long-distance lines', scope: 'grid',
      provenance: [{ kind: 'model', label: 'hour-by-hour power plant model & wire heat-loss maths' }],
      load: () => import('./modules/grid/App'),
    },
    {
      id: 'orbits', story: orbitsStory, track: T1, label: 'Orbits & links', sub: 'how high · how fast · how far', scope: 'orbits',
      provenance: [{ kind: 'model', label: 'orbit physics (Kepler, vis-viva)' }, { kind: 'model', label: 'radio signal maths (Friis path loss, Shannon speed limit)' }],
      load: () => import('./modules/orbits/App'),
    },
    {
      id: 'quantum', story: quantumStory, track: T2, label: 'Quantum VQE', sub: 'tiny molecules · how much noise is too much', scope: 'quantum',
      provenance: [{ kind: 'real', label: 'published exact energies for H₂ and LiH' }, { kind: 'model', label: 'simulated 2-qubit quantum chip with noise' }],
      load: () => import('./modules/quantum/App'),
    },
    {
      id: 'materials', story: materialsStory, track: T2, label: 'Materials', sub: 'useful, stable, buildable', scope: 'materials',
      provenance: [{ kind: 'real', label: 'known crystals & published band gaps' }, { kind: 'synthetic', label: 'hand-estimated stability & supply scores' }, { kind: 'model', label: 'best trade-off (Pareto) picker' }],
      load: () => import('./modules/materials/App'),
    },
    {
      id: 'molecules', story: moleculesStory, track: T3, label: 'Longevity', sub: 'pill checklist · lifespan data', scope: 'molecules',
      provenance: [{ kind: 'real', label: 'measured values from ChEMBL, DrugAge and the NIA mouse program' }, { kind: 'model', label: 'pill checklist and your weighted score' }],
      load: () => import('./modules/molecules/App'),
    },
    {
      id: 'eeg', story: eegStory, track: T3, label: 'EEG decoder', sub: 'brainwaves · focus score', scope: 'eeg',
      provenance: [{ kind: 'synthetic', label: 'simulated brainwaves & accuracy curves' }, { kind: 'model', label: 'rhythm splitting (FFT) & noise filters' }],
      note: 'uploaded CSVs stay in your browser',
      load: () => import('./modules/eeg/App'),
    },
    {
      id: 'neuro', story: neuroStory, track: T3, label: 'Neurons & dopamine', sub: 'spikes · reward surprise', scope: 'neuro',
      provenance: [{ kind: 'model', label: 'Leaky Integrate-and-Fire neuron (textbook model)' }, { kind: 'model', label: 'Schultz reward prediction error & opponent-process baseline' }],
      note: 'teaching models, not clinical measurements',
      load: () => import('./modules/neuro/App'),
    },
  ],
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Shell config={config} />
  </React.StrictMode>,
);
