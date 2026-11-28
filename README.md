# Applied Physics & Deep-Tech Labs

Live: https://labs.mohammed-km.in (now redirects)

> Split on 28 November 2026 into three single-subject labs: [Engineering, Energy & Space Lab](https://engineering.mohammed-km.in) (repo first-principles-lab), [Quantum & Materials Lab](https://quantum.mohammed-km.in) (repo quantum-molecule-benchmark) and [Neuroscience & Bio Lab](https://neuro.mohammed-km.in) (repo neuroscience-bio-lab). labs.mohammed-km.in now redirects to the engineering lab. This repo keeps the eight-module history.

Eight first-principles simulators in one workbench across three tracks: engineering, energy and space; matter and quantum; bio and mind.

Merges eight labs: engineering, power grid, orbital mechanics, quantum molecule benchmark, AI materials screener, longevity molecules, EEG focus decoder and neurons & dopamine. Each old subdomain redirects to its tab.

## Modules

- **engineering · grid · orbits**: Idiot Index BOM, an 8-station factory game and Tsiolkovsky rocket $/kg; a 24-hour duck curve with AC vs HVDC I²R losses; animated LEO/MEO/GEO orbits with a Shannon link budget.
- **quantum · materials**: Live 2-qubit VQE optimiser on H2 and LiH with a noise threshold; crystal band-gap and energy-above-hull Pareto screener with CSV export.
- **molecules · eeg**: Small-molecule longevity triage with a 2-molecule radar diff; 4-channel EEG waveforms with live FFT bandpass and notch filters and local CSV upload.
- **neuro**: Leaky Integrate-and-Fire spiking neuron (current, threshold, leak; live voltage trace, firing rate, time to first spike) and a dopamine reward-prediction-error lab (phasic bursts and dips, tonic baseline tolerance over 30 days, Markdown/CSV export). Textbook teaching models, not clinical measurements.

Tabs are deep-linkable, e.g. `https://labs.mohammed-km.in/`.

## Real vs modelled

Published reference energies, constants and public prices are real; simulations, synthetic EEG signals and screening datasets are labelled in each module.

## Run locally

```bash
npm install
npm run dev
npm run build
```

Built by [Mohammed KM](https://mohammed-km.in).
