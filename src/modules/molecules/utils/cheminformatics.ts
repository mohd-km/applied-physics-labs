import {
  Compound,
  ClinicalPhase,
  CompoundScores,
  EconomicsInput,
  WeightProfile,
} from '../types';

export interface LipinskiEvaluation {
  mwPass: boolean;
  logPPass: boolean;
  hbdPass: boolean;
  hbaPass: boolean;
  violations: number;
  compliant: boolean; // <= 1 violation per Lipinski Ro5
}

export const RO5_LIMITS = {
  mw: 500,
  logP: 5,
  hbd: 5,
  hba: 10,
} as const;

export const DEFAULT_WEIGHTS: WeightProfile = {
  oralBioavailability: 30,
  bbbPermeability: 15,
  pathwayAffinity: 30,
  safety: 25,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function evaluateLipinski(c: Compound): LipinskiEvaluation {
  const mwPass = c.mw <= RO5_LIMITS.mw;
  const logPPass = c.logP <= RO5_LIMITS.logP;
  const hbdPass = c.hbd <= RO5_LIMITS.hbd;
  const hbaPass = c.hba <= RO5_LIMITS.hba;
  const violations = [mwPass, logPPass, hbdPass, hbaPass].filter((p) => !p).length;
  return {
    mwPass,
    logPPass,
    hbdPass,
    hbaPass,
    violations,
    compliant: violations <= 1,
  };
}

export function computeLigandEfficiencyIndex(c: Compound): number {
  // BEI (Binding Efficiency Index) = pIC50 / (MW in kDa)
  return Number((c.potency / (c.mw / 1000)).toFixed(1));
}

export const PHASE_RANK: Record<ClinicalPhase, number> = {
  Approved: 5,
  'Phase 3': 4,
  'Phase 2': 3,
  'Phase 1': 2,
  Preclinical: 1,
};

const PHASE_SAFETY_SCORE: Record<ClinicalPhase, number> = {
  Approved: 94,
  'Phase 3': 74,
  'Phase 2': 64,
  'Phase 1': 44,
  Preclinical: 26,
};

/**
 * Deterministic client-side ADMET + efficacy profile derived from
 * Lipinski Ro5, Veber oral criteria, Wager CNS MPO (BBB), ChEMBL potency,
 * DrugAge lifespan delta, and clinical development maturity.
 */
export function computeCompoundScores(
  c: Compound,
  weights: WeightProfile = DEFAULT_WEIGHTS
): CompoundScores {
  const ro5 = evaluateLipinski(c);

  // 1. Oral Bioavailability (Lipinski Ro5 + Veber TPSA<=140 & RotB<=10 + QED)
  const ro5Score = Math.max(0, 100 - ro5.violations * 22);
  const tpsaOral =
    c.tpsa <= 140 ? 100 : clamp(100 - ((c.tpsa - 140) / 160) * 85, 10, 100);
  const rotbOral =
    c.rotatableBonds <= 10 ? 100 : clamp(100 - (c.rotatableBonds - 10) * 10, 20, 100);
  const veberScore = 0.65 * tpsaOral + 0.35 * rotbOral;
  const qedNorm = clamp(c.qed * 100, 0, 100);
  const oralBioavailability = Math.round(
    clamp(0.45 * ro5Score + 0.3 * veberScore + 0.25 * qedNorm, 5, 99)
  );

  // 2. BBB Permeability (Wager CNS MPO & Clark/Kelder TPSA/MW/cLogP/HBD rules)
  let tpsaBbb = 100;
  if (c.tpsa > 60 && c.tpsa <= 90) {
    tpsaBbb = 100 - ((c.tpsa - 60) / 30) * 35;
  } else if (c.tpsa > 90 && c.tpsa <= 140) {
    tpsaBbb = 65 - ((c.tpsa - 90) / 50) * 50;
  } else if (c.tpsa > 140) {
    tpsaBbb = clamp(15 - ((c.tpsa - 140) / 180) * 12, 3, 15);
  }

  let mwBbb = 100;
  if (c.mw > 360 && c.mw <= 500) {
    mwBbb = 100 - ((c.mw - 360) / 140) * 50;
  } else if (c.mw > 500) {
    mwBbb = clamp(50 - ((c.mw - 500) / 500) * 45, 5, 50);
  }

  let logPBbb = 100;
  if (c.logP < 1.0) {
    logPBbb = clamp(100 - (1.0 - c.logP) * 18, 5, 100);
  } else if (c.logP > 4.0) {
    logPBbb = clamp(100 - (c.logP - 4.0) * 22, 10, 100);
  }

  const hbdBbb =
    c.hbd <= 1
      ? 100
      : c.hbd === 2
      ? 85
      : c.hbd === 3
      ? 62
      : c.hbd === 4
      ? 38
      : clamp(22 - (c.hbd - 5) * 4, 4, 22);

  const bbbPermeability = Math.round(
    clamp(0.38 * tpsaBbb + 0.24 * mwBbb + 0.2 * logPBbb + 0.18 * hbdBbb, 5, 99)
  );

  // 3. Pathway Affinity (ChEMBL pIC50/pKi/pEC50 + DrugAge efficacy signal)
  const potencyNorm = clamp(((c.potency - 3.5) / 6.0) * 100, 0, 100);
  const drugAgeNorm = clamp((c.drugAgeDeltaPct / 35) * 100, 0, 100);
  const pathwayAffinity = Math.round(
    clamp(0.75 * potencyNorm + 0.25 * drugAgeNorm, 5, 99)
  );

  // 4. Safety & Clinical Maturity (Human phase track record + physicochemical safety margin)
  const phaseScore = PHASE_SAFETY_SCORE[c.clinicalPhase];
  const chemSafety = clamp(0.55 * qedNorm + 0.45 * Math.max(0, 100 - ro5.violations * 25), 10, 100);
  const safety = Math.round(clamp(0.52 * phaseScore + 0.48 * chemSafety, 10, 99));

  // Weighted Composite Score (0 - 100)
  const totalWeight =
    weights.oralBioavailability +
    weights.bbbPermeability +
    weights.pathwayAffinity +
    weights.safety;

  const composite =
    totalWeight > 0
      ? Number(
          (
            (oralBioavailability * weights.oralBioavailability +
              bbbPermeability * weights.bbbPermeability +
              pathwayAffinity * weights.pathwayAffinity +
              safety * weights.safety) /
            totalWeight
          ).toFixed(1)
        )
      : Number(
          ((oralBioavailability + bbbPermeability + pathwayAffinity + safety) / 4).toFixed(1)
        );

  return {
    oralBioavailability,
    bbbPermeability,
    pathwayAffinity,
    safety,
    qedNorm: Math.round(qedNorm),
    drugAgeNorm: Math.round(drugAgeNorm),
    composite,
  };
}

export interface EconomicsOutput {
  traditionalTotalCost: number;
  inSilicoComputeCost: number;
  retainedCompounds: number;
  confirmatoryWetLabCost: number;
  hybridTotalCost: number;
  netSavings: number;
  costReductionPct: number;
  traditionalWeeks: number;
  hybridWeeks: number;
  weeksSaved: number;
  traditionalLeads: number;
  hybridLeads: number;
  costPerLeadTraditional: number;
  costPerLeadHybrid: number;
}

export function calculateUnitEconomics(input: EconomicsInput): EconomicsOutput {
  const traditionalTotalCost = input.librarySize * input.wetLabCostPerCompound;
  const inSilicoComputeCost = input.librarySize * input.inSilicoCostPerCompound;
  const retainedCompounds = Math.max(
    1,
    Math.round((input.librarySize * input.triageRetentionPct) / 100)
  );
  const confirmatoryWetLabCost = retainedCompounds * input.confirmatoryAssayCost;
  const hybridTotalCost = inSilicoComputeCost + confirmatoryWetLabCost;

  const netSavings = traditionalTotalCost - hybridTotalCost;
  const costReductionPct =
    traditionalTotalCost > 0 ? (netSavings / traditionalTotalCost) * 100 : 0;

  // Deterministic throughput model:
  // Traditional HTS: ~2,500 compounds/week including plate prep & QC, min 4 weeks
  const traditionalWeeks = Math.max(4, Math.round(4 + input.librarySize / 2500));
  // Hybrid: 1 week virtual docking/ADMET + confirmatory assay throughput (~400/week), min 2 weeks
  const hybridWeeks = Math.max(2, Math.round(1.5 + retainedCompounds / 400));
  const weeksSaved = Math.max(0, traditionalWeeks - hybridWeeks);

  // Baseline random HTS hit rate = 0.25%
  const baseHitRate = 0.0025;
  const traditionalLeads = Math.max(1, Math.round(input.librarySize * baseHitRate));
  // Enriched hit rate in retained virtual pool, capped at 35% physical assay ceiling
  const enrichedHitRate = Math.min(0.35, baseHitRate * input.enrichmentFactor);
  const hybridLeads = Math.max(1, Math.round(retainedCompounds * enrichedHitRate));

  const costPerLeadTraditional = traditionalTotalCost / traditionalLeads;
  const costPerLeadHybrid = hybridTotalCost / hybridLeads;

  return {
    traditionalTotalCost,
    inSilicoComputeCost,
    retainedCompounds,
    confirmatoryWetLabCost,
    hybridTotalCost,
    netSavings,
    costReductionPct,
    traditionalWeeks,
    hybridWeeks,
    weeksSaved,
    traditionalLeads,
    hybridLeads,
    costPerLeadTraditional,
    costPerLeadHybrid,
  };
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 10_000) {
    return `$${Math.round(value / 1_000).toLocaleString()}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatExactCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}
