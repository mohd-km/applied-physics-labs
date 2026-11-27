export type ChannelId = 'AF7' | 'AF8' | 'TP9' | 'TP10';

export type BandKey = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export type CognitiveStateId =
  | 'deep-flow'
  | 'mind-wandering'
  | 'high-load'
  | 'fatigue';

export interface BandDefinition {
  key: BandKey;
  label: string;
  rangeLabel: string;
  minHz: number;
  maxHz: number;
  color: string;
  inkColor: string;
  shortDesc: string;
}

export interface ChannelMeta {
  id: ChannelId;
  region: string;
  role: string;
  color: string;
  inkColor: string;
  artifactSensitivity: 'eog' | 'emg';
}

export interface BandWeights {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface CognitivePreset {
  id: CognitiveStateId;
  name: string;
  shortName: string;
  subtitle: string;
  signature: string;
  referenceSource: string;
  bandAmplitudes: BandWeights;
  channelGains: Record<ChannelId, Partial<BandWeights>>;
  blinkRateHz: number;
  emgBurstLevel: number;
  alphaPeakHz: number;
}

export interface PsdBin {
  freqHz: number;
  powerUv2Hz: number;
  powerDb: number;
}

export interface ChannelFrame {
  id: ChannelId;
  samples: number[];
  rawSamples: number[];
  rmsUv: number;
  bandPower: BandWeights;
}

export interface UploadedCsvDataset {
  fileName: string;
  sampleRateHz: number;
  sampleCount: number;
  channels: Record<ChannelId, number[]>;
  detectedColumns: string[];
}

export interface SignalSnapshot {
  sampleRateHz: number;
  windowSec: number;
  channels: Record<ChannelId, ChannelFrame>;
  averagePsd: PsdBin[];
  rawAveragePsd: PsdBin[];
  channelPsd: Record<ChannelId, PsdBin[]>;
  meanBandPower: BandWeights;
  relativeBandPct: BandWeights;
  engagementIndex: number;
  thetaBetaRatio: number;
  frontalAlphaAsymmetry: number;
  focusIndex: number;
  estimatedSnrDb: number;
  mains50HzDb: number;
  mains50HzRawDb: number;
  predictedState: CognitiveStateId;
  stateProbabilities: Record<CognitiveStateId, number>;
  sourceMode: 'synthetic' | 'csv';
}

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface RocCurveSeries {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  auc: number;
  points: RocPoint[];
}

export interface ConfusionMetrics {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  sensitivity: number;
  specificity: number;
  precision: number;
  f1: number;
  balancedAccuracy: number;
  falseAlarmsPer90Min: number;
}

export interface BenchmarkStudy {
  id: string;
  dataset: string;
  citation: string;
  montage: string;
  electrodeType: string;
  taskParadigm: string;
  publishedAuc: string;
  snrBottleneck: string;
}
