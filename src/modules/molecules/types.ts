export type Pathway =
  | 'mTOR'
  | 'AMPK'
  | 'Senolytic'
  | 'NAD+'
  | 'Autophagy'
  | 'Metabolic'
  | 'Anti-Inflammatory';

export type ClinicalPhase =
  | 'Approved'
  | 'Phase 3'
  | 'Phase 2'
  | 'Phase 1'
  | 'Preclinical';

export interface Compound {
  id: string;
  name: string;
  synonyms: string;
  chemblId: string;
  casNumber: string;
  pathway: Pathway;
  primaryTarget: string;
  affinityMetric: 'pIC50' | 'pKi' | 'pEC50';
  potency: number; // pIC50 / pKi / pEC50
  mw: number; // Daltons
  logP: number; // cLogP
  hbd: number; // Hydrogen bond donors
  hba: number; // Hydrogen bond acceptors
  tpsa: number; // Topological Polar Surface Area (A^2)
  rotatableBonds: number;
  qed: number; // Quantitative Estimate of Drug-Likeness (0.0 - 1.0)
  clinicalPhase: ClinicalPhase;
  drugAgeDeltaPct: number; // Median lifespan delta % in benchmark model
  modelOrganism: string;
  benchmarkSource: string;
  smiles: string;
  mechanism: string;
  safetyNotes: string;
}

export interface WeightProfile {
  oralBioavailability: number; // 0 - 100
  bbbPermeability: number; // 0 - 100
  pathwayAffinity: number; // 0 - 100
  safety: number; // 0 - 100
}

export interface CompoundScores {
  oralBioavailability: number; // 0 - 100
  bbbPermeability: number; // 0 - 100
  pathwayAffinity: number; // 0 - 100
  safety: number; // 0 - 100
  qedNorm: number; // 0 - 100
  drugAgeNorm: number; // 0 - 100
  composite: number; // 0 - 100 weighted composite
}

export interface ScoredCompound {
  compound: Compound;
  scores: CompoundScores;
  rank: number;
}

export interface FilterState {
  search: string;
  pathway: Pathway | 'All';
  phase: ClinicalPhase | 'All';
  maxMw: number;
  maxLogP: number;
  maxHbd: number;
  maxHba: number;
  minPotency: number;
  strictRo5Only: boolean;
}

export type SortField =
  | 'composite'
  | 'name'
  | 'pathway'
  | 'potency'
  | 'qed'
  | 'mw'
  | 'logP'
  | 'ro5Violations'
  | 'clinicalPhase'
  | 'drugAgeDeltaPct';

export type SortDirection = 'asc' | 'desc';

export interface EconomicsInput {
  librarySize: number;
  wetLabCostPerCompound: number;
  inSilicoCostPerCompound: number;
  triageRetentionPct: number;
  confirmatoryAssayCost: number;
  enrichmentFactor: number;
}
