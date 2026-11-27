import './styles.css';
import React, { useMemo, useState } from 'react';
import { COMPOUNDS, PATHWAYS } from './data/compounds';
import {
  Compound,
  CompoundScores,
  FilterState,
  ScoredCompound,
  SortDirection,
  SortField,
  WeightProfile,
} from './types';
import {
  computeCompoundScores,
  DEFAULT_WEIGHTS,
  evaluateLipinski,
  PHASE_RANK,
} from './utils/cheminformatics';
import { WeightingRanker } from './components/WeightingRanker';
import { MoleculeComparator } from './components/MoleculeComparator';
import { FilterPanel } from './components/FilterPanel';
import { ScatterPlot } from './components/ScatterPlot';
import { CompoundTable } from './components/CompoundTable';
import { CompoundDrawer } from './components/CompoundDrawer';
import { EconomicsCalculator } from './components/EconomicsCalculator';

type WorkspaceTab = 'ranker' | 'space' | 'economics';

const INITIAL_FILTERS: FilterState = {
  search: '',
  pathway: 'All',
  phase: 'All',
  maxMw: 1000,
  maxLogP: 8.0,
  maxHbd: 15,
  maxHba: 20,
  minPotency: 3.5,
  strictRo5Only: false,
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('ranker');
  const [weights, setWeights] = useState<WeightProfile>(DEFAULT_WEIGHTS);
  const [compareAId, setCompareAId] = useState<string>('rapamycin');
  const [compareBId, setCompareBId] = useState<string>('canagliflozin');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sortField, setSortField] = useState<SortField>('composite');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCompound, setSelectedCompound] = useState<Compound | null>(null);

  const pathwayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pw of PATHWAYS) counts[pw] = 0;
    for (const c of COMPOUNDS) {
      counts[c.pathway] = (counts[c.pathway] ?? 0) + 1;
    }
    return counts;
  }, []);

  const scoreMap = useMemo(() => {
    const map: Record<string, CompoundScores> = {};
    for (const c of COMPOUNDS) {
      map[c.id] = computeCompoundScores(c, weights);
    }
    return map;
  }, [weights]);

  const filteredCompounds = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return COMPOUNDS.filter((c) => {
      if (filters.pathway !== 'All' && c.pathway !== filters.pathway) return false;
      if (filters.phase !== 'All' && c.clinicalPhase !== filters.phase) return false;
      if (c.mw > filters.maxMw) return false;
      if (c.logP > filters.maxLogP) return false;
      if (c.hbd > filters.maxHbd) return false;
      if (c.hba > filters.maxHba) return false;
      if (c.potency < filters.minPotency) return false;
      if (filters.strictRo5Only && !evaluateLipinski(c).compliant) return false;
      if (q) {
        const hay = `${c.name} ${c.synonyms} ${c.chemblId} ${c.primaryTarget} ${c.pathway} ${c.mechanism}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters]);

  // Live-ranked by composite score
  const rankedCompounds: ScoredCompound[] = useMemo(() => {
    const list = filteredCompounds.map((compound) => ({
      compound,
      scores: scoreMap[compound.id],
      rank: 0,
    }));
    list.sort((a, b) => {
      if (b.scores.composite !== a.scores.composite) {
        return b.scores.composite - a.scores.composite;
      }
      return b.compound.potency - a.compound.potency;
    });
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [filteredCompounds, scoreMap]);

  // Sorted for CompoundTable
  const sortedScoredCompounds: ScoredCompound[] = useMemo(() => {
    if (sortField === 'composite' && sortDirection === 'desc') {
      return rankedCompounds;
    }
    const list = [...rankedCompounds];
    const dir = sortDirection === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      switch (sortField) {
        case 'composite':
          return (a.scores.composite - b.scores.composite) * dir;
        case 'name':
          return a.compound.name.localeCompare(b.compound.name) * dir;
        case 'pathway':
          return a.compound.pathway.localeCompare(b.compound.pathway) * dir;
        case 'potency':
          return (a.compound.potency - b.compound.potency) * dir;
        case 'qed':
          return (a.compound.qed - b.compound.qed) * dir;
        case 'mw':
          return (a.compound.mw - b.compound.mw) * dir;
        case 'logP':
          return (a.compound.logP - b.compound.logP) * dir;
        case 'ro5Violations':
          return (
            (evaluateLipinski(a.compound).violations -
              evaluateLipinski(b.compound).violations) *
            dir
          );
        case 'clinicalPhase':
          return (
            (PHASE_RANK[a.compound.clinicalPhase] - PHASE_RANK[b.compound.clinicalPhase]) *
            dir
          );
        case 'drugAgeDeltaPct':
          return (a.compound.drugAgeDeltaPct - b.compound.drugAgeDeltaPct) * dir;
        default:
          return 0;
      }
    });
    return list;
  }, [rankedCompounds, sortField, sortDirection]);

  const kpis = useMemo(() => {
    const n = rankedCompounds.length;
    if (n === 0) {
      return {
        topName: '--',
        topScore: 0,
        ro5Pct: 0,
        ro5Count: 0,
        medianPotency: 0,
        meanDelta: 0,
      };
    }
    const top = rankedCompounds[0];
    const ro5Count = filteredCompounds.filter((c) => evaluateLipinski(c).compliant).length;
    const potencies = filteredCompounds.map((c) => c.potency).sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    const medianPotency =
      n % 2 === 0 ? (potencies[mid - 1] + potencies[mid]) / 2 : potencies[mid];
    const meanDelta =
      filteredCompounds.reduce((acc, c) => acc + c.drugAgeDeltaPct, 0) / n;

    return {
      topName: top.compound.name,
      topScore: top.scores.composite,
      ro5Count,
      ro5Pct: Math.round((ro5Count / n) * 100),
      medianPotency,
      meanDelta,
    };
  }, [rankedCompounds, filteredCompounds]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' || field === 'pathway' ? 'asc' : 'desc');
    }
  };

  const handleSwapCompare = () => {
    setCompareAId(compareBId);
    setCompareBId(compareAId);
  };

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="container header-inner">
          <div className="brand-block">
            <h2 className="brand-title">Shortlisting molecules that may slow ageing</h2>
            <p className="brand-note">
              {COMPOUNDS.length} real compounds already studied for ageing. Their size, strength
              and animal lifespan results are hand-copied, rounded values from three public
              sources: ChEMBL (a database of measured drug activity), DrugAge (published
              lifespan studies) and the US National Institute on Aging's Interventions Testing
              Program (ITP), which retests promising compounds in mice. Research shortlisting
              only, not medical advice.
            </p>
          </div>

          <nav className="tab-bar" role="tablist" aria-label="Workspace views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ranker'}
              className={`tab-btn ${activeTab === 'ranker' ? 'active' : ''}`}
              onClick={() => setActiveTab('ranker')}
            >
              Rank and compare
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'space'}
              className={`tab-btn ${activeTab === 'space' ? 'active' : ''}`}
              onClick={() => setActiveTab('space')}
            >
              Explore the chemistry
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'economics'}
              className={`tab-btn ${activeTab === 'economics' ? 'active' : ''}`}
              onClick={() => setActiveTab('economics')}
            >
              Cost of screening
            </button>
          </nav>
        </div>
      </header>

      <main className="container main-content">
        {/* Compact KPI Strip */}
        <section className="kpi-strip" aria-label="Live cohort metrics">
          <div className="kpi-card">
            <span className="kpi-label">Top pick right now</span>
            <span className="kpi-figure kpi-name">{kpis.topName}</span>
            <span className="kpi-sub mono-num">
              Score {kpis.topScore > 0 ? kpis.topScore.toFixed(1) : '--'} out of 100
            </span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Molecules left after filters</span>
            <span className="kpi-figure mono-num">
              {filteredCompounds.length}{' '}
              <small className="kpi-denom">/ {COMPOUNDS.length}</small>
            </span>
            <span className="kpi-sub">
              {kpis.ro5Pct}% pass the pill checklist (Lipinski rule of five)
            </span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Typical strength on target</span>
            <span className="kpi-figure mono-num">
              {kpis.medianPotency > 0 ? kpis.medianPotency.toFixed(2) : '--'}
            </span>
            <span className="kpi-sub">
              Middle value of the lab potency score (pIC50 / pKi / pEC50): each +1 means ten
              times stronger
            </span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Average extra lifespan in animals</span>
            <span className="kpi-figure mono-num accent-ink">
              {kpis.meanDelta > 0 ? `+${kpis.meanDelta.toFixed(1)}%` : '--'}
            </span>
            <span className="kpi-sub">
              Median lifespan gain reported in published animal studies, across the molecules
              shown
            </span>
          </div>
        </section>

        {/* Tab 1: Custom Weighting Ranker + 2-Molecule Radar Comparator + Live Ranked Library */}
        {activeTab === 'ranker' && (
          <>
            <div className="ranker-compare-grid">
              <WeightingRanker
                weights={weights}
                onChangeWeights={setWeights}
                rankedCompounds={rankedCompounds}
                compareAId={compareAId}
                compareBId={compareBId}
                onSetCompareA={setCompareAId}
                onSetCompareB={setCompareBId}
                onInspect={setSelectedCompound}
              />
              <MoleculeComparator
                compounds={COMPOUNDS}
                scoreMap={scoreMap}
                compareAId={compareAId}
                compareBId={compareBId}
                onChangeA={setCompareAId}
                onChangeB={setCompareBId}
                onSwap={handleSwapCompare}
                onInspect={setSelectedCompound}
              />
            </div>

            <div className="section-block">
              <CompoundTable
                scoredCompounds={sortedScoredCompounds}
                selectedId={selectedCompound?.id ?? null}
                compareAId={compareAId}
                compareBId={compareBId}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onSelect={setSelectedCompound}
                onSetCompareA={setCompareAId}
                onSetCompareB={setCompareBId}
              />
            </div>
          </>
        )}

        {/* Tab 2: Chemical Space Filters + Interactive Scatter Plot */}
        {activeTab === 'space' && (
          <div className="workspace-grid">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(INITIAL_FILTERS)}
              totalCount={COMPOUNDS.length}
              filteredCount={filteredCompounds.length}
              pathwayCounts={pathwayCounts}
            />
            <ScatterPlot
              compounds={filteredCompounds}
              scoreMap={scoreMap}
              selectedId={selectedCompound?.id ?? null}
              onSelect={setSelectedCompound}
            />
          </div>
        )}

        {/* Tab 3: R&D Unit-Economics Simulator */}
        {activeTab === 'economics' && (
          <div className="section-block">
            <EconomicsCalculator />
          </div>
        )}
      </main>


      <CompoundDrawer
        compound={selectedCompound}
        scores={selectedCompound ? scoreMap[selectedCompound.id] : null}
        compareAId={compareAId}
        compareBId={compareBId}
        onSetCompareA={(id) => {
          setCompareAId(id);
          setActiveTab('ranker');
          setSelectedCompound(null);
        }}
        onSetCompareB={(id) => {
          setCompareBId(id);
          setActiveTab('ranker');
          setSelectedCompound(null);
        }}
        onClose={() => setSelectedCompound(null)}
      />
    </div>
  );
};

export default App;
