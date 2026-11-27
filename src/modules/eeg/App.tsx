import './styles.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FocusClassifierPanel } from './components/FocusClassifierPanel';
import { NeurotechBrief } from './components/NeurotechBrief';
import { PsdChart } from './components/PsdChart';
import { RocBenchmarkPanel } from './components/RocBenchmarkPanel';
import { WaveformChart } from './components/WaveformChart';
import { COGNITIVE_PRESETS, PRESET_ORDER } from './eeg/presets';
import {
  buildRocBenchmarks,
  createSampleCsvDataset,
  parseEegCsv,
  synthesizeSnapshot,
} from './eeg/signalMath';
import {
  BandKey,
  BandWeights,
  ChannelId,
  CognitiveStateId,
  UploadedCsvDataset,
} from './eeg/types';

type ActiveTab = 'lab' | 'roc' | 'mmi';

const DEFAULT_MULTIPLIERS: BandWeights = {
  delta: 1.0,
  theta: 1.0,
  alpha: 1.0,
  beta: 1.0,
  gamma: 1.0,
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('lab');
  const [presetId, setPresetId] = useState<CognitiveStateId>('deep-flow');
  const [bandMultipliers, setBandMultipliers] = useState<BandWeights>(DEFAULT_MULTIPLIERS);
  const [impedanceKohm, setImpedanceKohm] = useState<number>(45);
  const [injectEyeBlink, setInjectEyeBlink] = useState<boolean>(true);
  const [injectMainsHum, setInjectMainsHum] = useState<boolean>(true);
  const [notchFilter50Hz, setNotchFilter50Hz] = useState<boolean>(false);
  const [bandpassFilter, setBandpassFilter] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [uvScale, setUvScale] = useState<number>(60);
  const [threshold, setThreshold] = useState<number>(0.48);
  const [timeOffsetSec, setTimeOffsetSec] = useState<number>(0);
  const [manualBlinkAtSec, setManualBlinkAtSec] = useState<number | null>(null);
  const [csvDataset, setCsvDataset] = useState<UploadedCsvDataset | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [visibleChannels, setVisibleChannels] = useState<Record<ChannelId, boolean>>({
    AF7: true,
    AF8: true,
    TP9: true,
    TP10: true,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Only animate while this panel is actually on screen (hidden tabs stay idle).
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [onScreen, setOnScreen] = useState<boolean>(true);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((en) => en.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!isPlaying || !onScreen) return;
    const interval = window.setInterval(() => {
      setTimeOffsetSec((prev) => prev + 0.08);
    }, 80);
    return () => window.clearInterval(interval);
  }, [isPlaying, onScreen]);

  const snapshot = useMemo(
    () =>
      synthesizeSnapshot({
        presetId,
        bandMultipliers,
        impedanceKohm,
        injectEyeBlink,
        injectMainsHum,
        notchFilter50Hz,
        bandpassFilter,
        timeOffsetSec,
        manualBlinkAtSec,
        csvDataset,
      }),
    [
      presetId,
      bandMultipliers,
      impedanceKohm,
      injectEyeBlink,
      injectMainsHum,
      notchFilter50Hz,
      bandpassFilter,
      timeOffsetSec,
      manualBlinkAtSec,
      csvDataset,
    ]
  );

  const rocSeries = useMemo(
    () =>
      buildRocBenchmarks(
        impedanceKohm,
        injectEyeBlink,
        injectMainsHum,
        notchFilter50Hz,
        bandpassFilter
      ),
    [impedanceKohm, injectEyeBlink, injectMainsHum, notchFilter50Hz, bandpassFilter]
  );

  const handleToggleChannel = (id: ChannelId) => {
    setVisibleChannels((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const anyVisible = Object.values(next).some(Boolean);
      return anyVisible ? next : prev;
    });
  };

  const handleBandMultiplierChange = (band: BandKey, value: number) => {
    setBandMultipliers((prev) => ({ ...prev, [band]: value }));
  };

  const handleSelectPreset = (id: CognitiveStateId) => {
    setCsvDataset(null);
    setCsvError(null);
    setPresetId(id);
    setBandMultipliers(DEFAULT_MULTIPLIERS);
  };

  const handleTriggerBlink = () => {
    setManualBlinkAtSec(timeOffsetSec + 1.0);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const parsed = parseEegCsv(text, file.name);
        setCsvDataset(parsed);
        setCsvError(null);
        setTimeOffsetSec(0);
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSampleCsv = () => {
    setCsvDataset(createSampleCsvDataset());
    setCsvError(null);
    setTimeOffsetSec(0);
  };

  return (
    <div className="app-shell" ref={rootRef}>
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="brand-block">
            <h2 className="app-title">4-sensor brainwave focus decoder (EEG)</h2>
            <p className="app-byline">
              EEG (electroencephalography) is the tiny electrical buzz of your brain, picked up by sensors on the head.
              The waves here are simulated until you upload your own spreadsheet of readings (CSV); it is read in your
              browser and never leaves it.
            </p>
          </div>

          <nav className="tab-nav" role="tablist" aria-label="Workspace views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'lab'}
              className={`tab-btn ${activeTab === 'lab' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('lab')}
            >
              Rhythms &amp; filters (FFT)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'roc'}
              className={`tab-btn ${activeTab === 'roc' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('roc')}
            >
              How accurate? (ROC)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'mmi'}
              className={`tab-btn ${activeTab === 'mmi' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('mmi')}
            >
              Headset economics
            </button>
          </nav>
        </div>
      </header>

      <main className="main-container">
        {activeTab === 'lab' && (
          <>
            {/* Compact Playable Signal & Filter Toolbar */}
            <section className="control-strip" aria-label="Signal source, noise injection, and digital filters">
              <div className="toolbar-row">
                <div className="toolbar-group">
                  <span className="strip-label">Mental state to simulate</span>
                  <div className="preset-buttons">
                    {PRESET_ORDER.map((id) => {
                      const preset = COGNITIVE_PRESETS[id];
                      const active = !csvDataset && id === presetId;
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`preset-btn ${active ? 'preset-btn-active' : ''}`}
                          onClick={() => handleSelectPreset(id)}
                          aria-pressed={active}
                        >
                          {preset.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="toolbar-group">
                  <span className="strip-label">Add real-world noise, then clean it (filters)</span>
                  <div className="dsp-toggles">
                    <button
                      type="button"
                      className={`action-btn ${injectEyeBlink ? 'action-btn-warn' : ''}`}
                      onClick={() => setInjectEyeBlink((v) => !v)}
                      aria-pressed={injectEyeBlink}
                    >
                      Blinks &amp; muscle noise (EMG): {injectEyeBlink ? 'On' : 'Off'}
                    </button>

                    <button
                      type="button"
                      className={`action-btn ${injectMainsHum ? 'action-btn-warn' : ''}`}
                      onClick={() => setInjectMainsHum((v) => !v)}
                      aria-pressed={injectMainsHum}
                    >
                      Mains hum, 50 Hz: {injectMainsHum ? 'On' : 'Off'}
                    </button>

                    <button
                      type="button"
                      className={`action-btn ${notchFilter50Hz ? 'action-btn-active' : ''}`}
                      onClick={() => setNotchFilter50Hz((v) => !v)}
                      aria-pressed={notchFilter50Hz}
                    >
                      Hum remover (50 Hz notch): {notchFilter50Hz ? 'On' : 'Off'}
                    </button>

                    <button
                      type="button"
                      className={`action-btn ${bandpassFilter ? 'action-btn-active' : ''}`}
                      onClick={() => setBandpassFilter((v) => !v)}
                      aria-pressed={bandpassFilter}
                    >
                      Keep only 1.5-40 Hz (bandpass): {bandpassFilter ? 'On' : 'Off'}
                    </button>
                  </div>
                  <p className="eeg-hint">
                    Orange buttons add noise a real headset picks up. Blue buttons are filters (simple
                    maths that strips out a range of frequencies) that clean it back up.
                  </p>
                </div>
              </div>

              <div className="csv-bar">
                <div className="csv-actions">
                  <button
                    type="button"
                    className={`chip-btn ${isPlaying ? 'chip-btn-accent' : ''}`}
                    onClick={() => setIsPlaying((p) => !p)}
                  >
                    {isPlaying ? 'Pause Stream' : 'Resume Stream'}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvUpload}
                    className="sr-only"
                    aria-label="Upload local EEG CSV snippet"
                  />
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload your EEG (CSV file)
                  </button>

                  {!csvDataset ? (
                    <button type="button" className="chip-btn" onClick={handleLoadSampleCsv}>
                      Try a sample file
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="chip-btn chip-btn-accent"
                      onClick={() => setCsvDataset(null)}
                    >
                      Back to simulated waves
                    </button>
                  )}
                </div>

                <div className="csv-status">
                  {csvDataset ? (
                    <span className="mono-sm">
                      CSV: {csvDataset.fileName} ({csvDataset.sampleCount} readings &middot; {csvDataset.sampleRateHz} per second &middot;{' '}
                      {csvDataset.detectedColumns.join(', ')})
                    </span>
                  ) : (
                    <span className="muted-sm">
                      {COGNITIVE_PRESETS[presetId].subtitle}
                    </span>
                  )}
                </div>
              </div>

              {csvError && (
                <div className="error-banner" role="alert">
                  {csvError}
                </div>
              )}
            </section>

            {/* Primary Instrumentation Grid: Desktop 2-col, Mobile 1-col */}
            <section className="primary-grid">
              <div className="col-stack">
                <WaveformChart
                  snapshot={snapshot}
                  visibleChannels={visibleChannels}
                  onToggleChannel={handleToggleChannel}
                  uvScale={uvScale}
                  onCycleScale={() => setUvScale((s) => (s === 60 ? 120 : s === 120 ? 35 : 60))}
                  onTriggerBlink={handleTriggerBlink}
                />
                <PsdChart
                  snapshot={snapshot}
                  notchFilter50Hz={notchFilter50Hz}
                  bandpassFilter={bandpassFilter}
                />
              </div>

              <div className="col-stack">
                <FocusClassifierPanel
                  snapshot={snapshot}
                  bandMultipliers={bandMultipliers}
                  onBandMultiplierChange={handleBandMultiplierChange}
                  onResetMultipliers={() => setBandMultipliers(DEFAULT_MULTIPLIERS)}
                  impedanceKohm={impedanceKohm}
                  onImpedanceChange={setImpedanceKohm}
                  isCsvMode={Boolean(csvDataset)}
                />
              </div>
            </section>
          </>
        )}

        {activeTab === 'roc' && (
          <section className="full-section">
            <RocBenchmarkPanel
              rocSeries={rocSeries}
              threshold={threshold}
              onThresholdChange={setThreshold}
              impedanceKohm={impedanceKohm}
              onImpedanceChange={setImpedanceKohm}
            />
          </section>
        )}

        {activeTab === 'mmi' && (
          <NeurotechBrief
            impedanceKohm={impedanceKohm}
            onImpedanceChange={setImpedanceKohm}
            estimatedSnrDb={snapshot.estimatedSnrDb}
            rocSeries={rocSeries}
          />
        )}
      </main>

    </div>
  );
};

export default App;
