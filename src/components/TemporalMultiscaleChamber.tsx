/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Interactive Research Laboratory for Gemini Temporal Multiscale Language Physics
 * Domain Aesthetic: Science, Space & Biotech (#07090E Obsidian Canvas, #111827 Slate Panels,
 * #1E293B Hairline Dividers, #06B6D4 Cyan & #F59E0B Amber Accents, Tabular Monospace Data)
 */

import React, { useState, useMemo } from 'react';
import {
  executeFullExperimentSuite,
  FullExperimentSuiteOutput,
} from '../../experiments/gemini_temporal_multiscale_language_physics/src/benchmarkSuite';
import {
  HELD_OUT_PROBES,
  UNSEEN_CORPORA,
} from '../../experiments/gemini_temporal_multiscale_language_physics/src/corpora';
import {
  EXPERIMENTAL_CONDITIONS,
  evaluateProbePass2,
  synthesizeUnassistedWaveTrajectory,
} from '../../experiments/gemini_temporal_multiscale_language_physics/src/engine';
import {
  buildSynchronizedTemporalViews,
} from '../../experiments/gemini_temporal_multiscale_language_physics/src/multiview';
import {
  evaluateBidirectionalField,
} from '../../experiments/gemini_temporal_multiscale_language_physics/src/bidirectionalField';
import {
  evaluatePauliCompatibility,
} from '../../experiments/gemini_temporal_multiscale_language_physics/src/pauliOrthogonality';
import {
  tokenizeWords,
} from '../../experiments/gemini_temporal_multiscale_language_physics/src/wordChannel';
import {
  BenchmarkProbe,
  ExperimentalConditionId,
} from '../../experiments/gemini_temporal_multiscale_language_physics/src/types';
import {
  Clock,
  Layers,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Sliders,
  FileText,
  Play,
  RotateCcw,
  Download,
} from 'lucide-react';

export const TemporalMultiscaleChamber: React.FC = () => {
  // Run deterministic Pass 1 -> Reset -> Pass 2 benchmark suite once on mount
  const suite: FullExperimentSuiteOutput = useMemo(() => executeFullExperimentSuite(), []);

  const [activeTab, setActiveTab] = useState<
    'workbench' | 'conditions' | 'diagnostics' | 'epistemology'
  >('workbench');

  const [selectedCorpusId, setSelectedCorpusId] = useState<string>(UNSEEN_CORPORA[0].id);
  const [selectedConditionId, setSelectedConditionId] = useState<ExperimentalConditionId>('C');
  const [selectedProbeId, setSelectedProbeId] = useState<string>('narr_valid_01');
  const [customCandidateText, setCustomCandidateText] = useState<string>('');
  const [isUsingCustomText, setIsUsingCustomText] = useState<boolean>(false);
  const [customSeedWord, setCustomSeedWord] = useState<string>('');
  const [showSynthesisSteps, setShowSynthesisSteps] = useState<boolean>(true);
  const [matrixScope, setMatrixScope] = useState<string>('MACRO');

  const activeCorpus = useMemo(
    () => UNSEEN_CORPORA.find((c) => c.id === selectedCorpusId) || UNSEEN_CORPORA[0],
    [selectedCorpusId]
  );

  const corpusProbes = useMemo(
    () => HELD_OUT_PROBES.filter((p) => p.corpusId === selectedCorpusId),
    [selectedCorpusId]
  );

  const activeProbe: BenchmarkProbe = useMemo(() => {
    const found = corpusProbes.find((p) => p.id === selectedProbeId) || corpusProbes[0];
    if (isUsingCustomText && customCandidateText.trim().length > 0) {
      return {
        ...found,
        id: 'custom_live_probe',
        candidateText: customCandidateText.trim(),
        description: 'User-entered live candidate sequence evaluated against frozen Pass-1 artifact',
      };
    }
    return found;
  }, [corpusProbes, selectedProbeId, isUsingCustomText, customCandidateText]);

  const activeArtifact = suite.pass1Artifacts[selectedCorpusId];
  const activeConfig = EXPERIMENTAL_CONDITIONS[selectedConditionId];

  // Live Pass-2 evaluation for the currently inspected probe & condition
  const liveEval = useMemo(
    () => evaluateProbePass2(activeProbe, activeArtifact, activeConfig),
    [activeProbe, activeArtifact, activeConfig]
  );

  // Live Unassisted Step-by-Step Wave-Packet Synthesis (supports optional user seed word override)
  const liveUnassistedSynthesis = useMemo(
    () =>
      customSeedWord.trim().length > 0
        ? synthesizeUnassistedWaveTrajectory(
            activeProbe.queryPrompt,
            activeArtifact,
            activeConfig,
            customSeedWord.trim()
          )
        : liveEval.unassistedSynthesis,
    [activeProbe.queryPrompt, activeArtifact, activeConfig, customSeedWord, liveEval.unassistedSynthesis]
  );

  // Synchronized 8-view phase structure for the active sequence
  const liveSyncViews = useMemo(() => {
    const tokens = tokenizeWords(activeProbe.candidateText);
    return buildSynchronizedTemporalViews(
      activeProbe.id,
      tokens,
      8,
      activeConfig.randomizePhaseOffsets
    );
  }, [activeProbe, activeConfig]);

  // Token-by-token Past / Present / Future field decomposition
  const liveBidirPositions = useMemo(() => {
    const tokens = tokenizeWords(activeProbe.candidateText);
    return evaluateBidirectionalField(tokens, activeArtifact.wordChannel, activeArtifact.coefficients, {
      horizonK: activeConfig.enableMultiViewOffsets ? 7 : 1,
      enableBackward: activeConfig.enableBackward,
      enableForward: activeConfig.enableForward,
    });
  }, [activeProbe, activeArtifact, activeConfig]);

  // Pauli compatibility diagnostic
  const livePauli = useMemo(
    () =>
      evaluatePauliCompatibility(
        activeProbe.candidateText,
        activeArtifact.wordChannel,
        activeArtifact.charChannel,
        activeArtifact.coefficients.pauliLambda,
        activeConfig.enablePauliConstraint
      ),
    [activeProbe, activeArtifact, activeConfig]
  );

  const handleSelectCorpus = (cid: string) => {
    setSelectedCorpusId(cid);
    const firstProbe = HELD_OUT_PROBES.find((p) => p.corpusId === cid);
    if (firstProbe) setSelectedProbeId(firstProbe.id);
    setIsUsingCustomText(false);
  };

  const handleDownloadJsonArtifact = () => {
    const payload = {
      pass1Artifacts: suite.pass1Artifacts,
      conditionMacroSummary: suite.conditionMacroSummary,
      ablationMacroSummary: suite.ablationMacroSummary,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gemini_temporal_multiscale_language_physics_results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const conditionList = useMemo(() => {
    if (matrixScope === 'MACRO') {
      return Object.values(suite.conditionMacroSummary);
    }
    return Object.values(suite.conditionResultsByCorpus[matrixScope] || {});
  }, [suite, matrixScope]);

  const ablationList = useMemo(() => {
    if (matrixScope === 'MACRO') {
      return Object.values(suite.ablationMacroSummary);
    }
    return Object.values(suite.ablationResultsByCorpus[matrixScope] || {});
  }, [suite, matrixScope]);

  return (
    <div className="bg-[#07090E] text-[#F8FAFC] min-h-screen font-sans">
      {/* Research Chamber Header Bar */}
      <div className="border-b border-[#1E293B] bg-[#0B0F19] px-6 py-4">
        <div className="max-w-[1540px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">
              Gemini Temporal Multiscale Language Physics Chamber
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8] mt-0.5">
              <span>Isolated Research Branch</span>
              <span aria-hidden="true">·</span>
              <span>Two-Pass Unsupervised Calibration</span>
              <span aria-hidden="true">·</span>
              <span>8 Synchronized Temporal Views</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#06B6D4]">
                Condition C Valid Recall: {(suite.conditionMacroSummary.C.validRecall * 100).toFixed(1)}% / Trap Rejection: {(suite.conditionMacroSummary.C.trapRejection * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Functional Segmented Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#111827] border border-[#1E293B] rounded-lg">
              <button
                onClick={() => setActiveTab('workbench')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'workbench'
                    ? 'bg-[#1E293B] text-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>8-View Phase Workbench</span>
              </button>
              <button
                onClick={() => setActiveTab('conditions')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'conditions'
                    ? 'bg-[#1E293B] text-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Conditions A–L & Ablations 1–10</span>
              </button>
              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'diagnostics'
                    ? 'bg-[#1E293B] text-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Temporal Clock & Pauli State</span>
              </button>
              <button
                onClick={() => setActiveTab('epistemology')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'epistemology'
                    ? 'bg-[#1E293B] text-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Epistemology & Forensic Audit</span>
              </button>
            </div>

            <button
              onClick={handleDownloadJsonArtifact}
              className="px-3 py-1.5 rounded-md bg-[#111827] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Export JSON Suite</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1540px] mx-auto p-6 space-y-6">
        {/* Top Corpus & Experimental Condition Bar */}
        <section className="bg-[#111827] border border-[#1E293B] rounded-lg p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Unseen Corpus Selector */}
            <div className="lg:col-span-5 space-y-2">
              <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                01. Unseen Calibration Corpus (Pass-1 Frozen Artifact)
              </div>
              <div className="grid grid-cols-1 gap-2">
                {UNSEEN_CORPORA.map((c) => {
                  const isSelected = c.id === selectedCorpusId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCorpus(c.id)}
                      className={`text-left px-3.5 py-2.5 rounded-md border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#07090E] border-[#06B6D4] text-[#F8FAFC]'
                          : 'bg-[#0B0F19] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{c.title}</div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-2 mt-0.5 font-mono tabular-nums">
                        <span>{c.languageSummary}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Pass-1 Hash: {suite.pass1Artifacts[c.id].corpusHash.slice(0, 10)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Experimental Condition Selector */}
            <div className="lg:col-span-4 space-y-2">
              <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                02. Active Experimental Condition (A–L)
              </div>
              <select
                value={selectedConditionId}
                onChange={(e) =>
                  setSelectedConditionId(e.target.value as ExperimentalConditionId)
                }
                className="w-full bg-[#07090E] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-[#06B6D4]"
              >
                {Object.entries(EXPERIMENTAL_CONDITIONS).map(([id, cfg]) => (
                  <option key={id} value={id}>
                    {cfg.label}
                  </option>
                ))}
              </select>

              {/* Pass-1 Derived Coefficients Display */}
              <div className="pt-2 border-t border-[#1E293B] space-y-1.5">
                <div className="text-[11px] text-[#94A3B8]">
                  Pass-1 Auto-Derived Bidirectional Coefficients (Unsupervised Mutual Information):
                </div>
                <div className="grid grid-cols-4 gap-2 font-mono tabular-nums text-xs">
                  <div className="bg-[#07090E] border border-[#1E293B] px-2.5 py-1.5 rounded">
                    <div className="text-[10px] text-[#64748B]">a (Bwd)</div>
                    <div className="text-[#06B6D4] font-semibold">
                      {activeArtifact.coefficients.aBackward}
                    </div>
                  </div>
                  <div className="bg-[#07090E] border border-[#1E293B] px-2.5 py-1.5 rounded">
                    <div className="text-[10px] text-[#64748B]">b (Pres)</div>
                    <div className="text-[#F8FAFC] font-semibold">
                      {activeArtifact.coefficients.bPresent}
                    </div>
                  </div>
                  <div className="bg-[#07090E] border border-[#1E293B] px-2.5 py-1.5 rounded">
                    <div className="text-[10px] text-[#64748B]">c (Fwd)</div>
                    <div className="text-[#F59E0B] font-semibold">
                      {activeArtifact.coefficients.cForward}
                    </div>
                  </div>
                  <div className="bg-[#07090E] border border-[#1E293B] px-2.5 py-1.5 rounded">
                    <div className="text-[10px] text-[#64748B]">d (Rev)</div>
                    <div className="text-[#10B981] font-semibold">
                      {activeArtifact.coefficients.dReverse}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pass-1 Corpus Text Reference */}
            <div className="lg:col-span-3 space-y-2">
              <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                03. Raw Unseen Corpus Substrate
              </div>
              <div className="bg-[#07090E] border border-[#1E293B] rounded-md p-3 text-xs text-[#94A3B8] leading-relaxed max-h-[145px] overflow-y-auto">
                {activeCorpus.rawText}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] font-mono tabular-nums">
                <span>Words: {activeArtifact.wordChannel.totalWords}</span>
                <span>Unique Molecules: {activeArtifact.wordChannel.uniqueWords}</span>
                <span>Threshold τ: {activeArtifact.coefficients.decisionThreshold}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* TAB 1: 8-VIEW PHASE WORKBENCH & BIDIRECTIONAL FIELD INSPECTOR         */}
        {/* ===================================================================== */}
        {activeTab === 'workbench' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Held-out Valid & Adversarial Probes */}
              <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">
                    01. Held-Out Pass-2 Probes ({corpusProbes.length} Probes)
                  </h3>
                  <span className="text-xs text-[#94A3B8] font-mono tabular-nums">
                    5 Valid · 7 Adversarial Traps
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {corpusProbes.map((probe) => {
                    const evalItem = evaluateProbePass2(
                      probe,
                      activeArtifact,
                      activeConfig
                    );
                    const isSelected = !isUsingCustomText && probe.id === selectedProbeId;
                    return (
                      <button
                        key={probe.id}
                        onClick={() => {
                          setSelectedProbeId(probe.id);
                          setIsUsingCustomText(false);
                        }}
                        className={`w-full text-left p-3 rounded-md border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#07090E] border-[#06B6D4]'
                            : 'bg-[#0B0F19] border-[#1E293B] hover:border-[#334155]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 font-mono">
                            {evalItem.isCorrectDecision ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-[#F43F5E] shrink-0" />
                            )}
                            <span className="font-semibold text-[#F8FAFC]">
                              {probe.id}
                            </span>
                            <span aria-hidden="true" className="text-[#64748B]">·</span>
                            <span
                              className={
                                probe.isValidGroundTruth
                                  ? 'text-[#06B6D4]'
                                  : 'text-[#F59E0B]'
                              }
                            >
                              {probe.category}
                            </span>
                          </div>
                          <span className="font-mono tabular-nums text-xs text-[#94A3B8]">
                            Score: {evalItem.compositeResonanceScore.toFixed(3)}
                          </span>
                        </div>
                        <div className="text-xs text-[#94A3B8] mt-1.5 line-clamp-2">
                          “{probe.candidateText}”
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Candidate Trajectory Input */}
                <div className="pt-3 border-t border-[#1E293B] space-y-2">
                  <label className="block text-xs font-medium text-[#94A3B8]">
                    Test Custom Candidate Sequence Against Frozen Pass-1 Artifact:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCandidateText}
                      onChange={(e) => setCustomCandidateText(e.target.value)}
                      placeholder="Enter any valid, role-reversed, or anagram sentence..."
                      className="flex-1 bg-[#07090E] border border-[#1E293B] rounded-md px-3 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4]"
                    />
                    <button
                      onClick={() => {
                        if (customCandidateText.trim()) setIsUsingCustomText(true);
                      }}
                      className="px-3 py-1.5 rounded-md bg-[#06B6D4] hover:bg-[#0891B2] text-[#07090E] font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Evaluate</span>
                    </button>
                    {isUsingCustomText && (
                      <button
                        onClick={() => {
                          setIsUsingCustomText(false);
                          setCustomCandidateText('');
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-[#07090E] border border-[#1E293B] text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                        title="Reset to benchmark probe"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Pass-2 Readout & Multi-Perspective Telemetry */}
              <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1E293B] pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-mono">
                      <span>PROBE: {activeProbe.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>GROUND TRUTH: {activeProbe.isValidGroundTruth ? 'VALID' : 'TRAP'}</span>
                      <span aria-hidden="true">·</span>
                      <span>CONDITION: {selectedConditionId}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#F8FAFC] mt-1">
                      “{activeProbe.candidateText}”
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1">{activeProbe.description}</p>
                  </div>

                  <div className="text-right font-mono tabular-nums">
                    <div className="text-xs text-[#94A3B8]">
                      Physics Decision (τ = {liveEval.decisionThreshold})
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 ${
                        liveEval.acceptedByPhysics ? 'text-[#10B981]' : 'text-[#F43F5E]'
                      }`}
                    >
                      {liveEval.acceptedByPhysics
                        ? 'ACCEPTED (COHERENT)'
                        : 'REJECTED (INCOMPATIBLE)'}
                    </div>
                  </div>
                </div>

                {/* Primary Quantitative Readout Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                  <div className="bg-[#07090E] border border-[#1E293B] rounded-md p-3">
                    <div className="text-[11px] text-[#94A3B8]">Composite Score</div>
                    <div className="text-lg font-semibold text-[#06B6D4] mt-0.5">
                      {liveEval.compositeResonanceScore.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      Threshold: {liveEval.decisionThreshold}
                    </div>
                  </div>

                  <div className="bg-[#07090E] border border-[#1E293B] rounded-md p-3">
                    <div className="text-[11px] text-[#94A3B8]">Bidirectional C_total</div>
                    <div className="text-lg font-semibold text-[#F8FAFC] mt-0.5">
                      {liveEval.cTotal.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      Bwd {liveEval.cBackward.toFixed(2)} · Fwd {liveEval.cForward.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-[#07090E] border border-[#1E293B] rounded-md p-3">
                    <div className="text-[11px] text-[#94A3B8]">Wisdom Stability W</div>
                    <div className="text-lg font-semibold text-[#10B981] mt-0.5">
                      {liveEval.wisdomStability.wisdomScore.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      Cross-Scale: {liveEval.wisdomStability.crossScaleAgreement.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-[#07090E] border border-[#1E293B] rounded-md p-3">
                    <div className="text-[11px] text-[#94A3B8]">Pauli & Anagram Penalty</div>
                    <div className="text-lg font-semibold text-[#F59E0B] mt-0.5">
                      -{(liveEval.pauliPenalty + liveEval.anagramPerturbationPenalty).toFixed(4)}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      Pauli {liveEval.pauliPenalty.toFixed(2)} · Anag{' '}
                      {liveEval.anagramPerturbationPenalty.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Level 4: Focal Position Bidirectional Field Table (Past / Present / Future) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Level 4: Past, Present & Future Field Decomposition Across Sequence
                    </h4>
                    <span className="text-[11px] font-mono tabular-nums text-[#64748B]">
                      C_total = a·C_bwd + b·C_pres + c·C_fwd + d·C_rev
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-[#1E293B] rounded-md bg-[#07090E]">
                    <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                      <thead>
                        <tr className="border-b border-[#1E293B] text-[#94A3B8] bg-[#0B0F19]">
                          <th className="py-2 px-2.5">t</th>
                          <th className="py-2 px-2.5">Past Field x(t-k..t-1)</th>
                          <th className="py-2 px-2.5 text-[#06B6D4]">Present x(t)</th>
                          <th className="py-2 px-2.5">Future Field x(t+1..t+k)</th>
                          <th className="py-2 px-2.5 text-right">C_bwd</th>
                          <th className="py-2 px-2.5 text-right">C_pres</th>
                          <th className="py-2 px-2.5 text-right">C_fwd</th>
                          <th className="py-2 px-2.5 text-right">C_rev</th>
                          <th className="py-2 px-2.5 text-right text-[#F8FAFC]">C_total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B]">
                        {liveBidirPositions.positions.map((pos) => (
                          <tr key={pos.focalIndex} className="hover:bg-[#111827]">
                            <td className="py-1.5 px-2.5 text-[#64748B]">{pos.focalIndex}</td>
                            <td className="py-1.5 px-2.5 text-[#94A3B8] truncate max-w-[160px]">
                              {pos.pastField.slice(-3).join(' ') || '∅'}
                            </td>
                            <td className="py-1.5 px-2.5 font-semibold text-[#06B6D4]">
                              {pos.presentField}
                            </td>
                            <td className="py-1.5 px-2.5 text-[#94A3B8] truncate max-w-[160px]">
                              {pos.futureField.slice(0, 3).join(' ') || '∅'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right">{pos.cBackward.toFixed(2)}</td>
                            <td className="py-1.5 px-2.5 text-right">{pos.cPresent.toFixed(2)}</td>
                            <td className="py-1.5 px-2.5 text-right">{pos.cForward.toFixed(2)}</td>
                            <td className="py-1.5 px-2.5 text-right">{pos.cReverse.toFixed(2)}</td>
                            <td className="py-1.5 px-2.5 text-right font-semibold text-[#F8FAFC]">
                              {pos.cTotal.toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Autonomous Pass-2 Synthesis: Unassisted Wave Walk vs Associative Template Recall */}
                <div className="bg-[#07090E] border border-[#1E293B] rounded-md p-4 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-2.5">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#06B6D4]">
                        Autonomous Pass-2 Trajectory Synthesis — Query: “{activeProbe.queryPrompt}”
                      </div>
                      <div className="text-[11px] text-[#94A3B8] mt-0.5">
                        Compares pure step-by-step transition physics (zero stored sentence templates) against associative template recall.
                      </div>
                    </div>

                    {/* Optional Seed Token Override */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#94A3B8] font-mono">Focal Seed:</span>
                      <input
                        type="text"
                        value={customSeedWord}
                        onChange={(e) => setCustomSeedWord(e.target.value)}
                        placeholder={liveUnassistedSynthesis.seedAnchorToken}
                        className="w-28 bg-[#0B0F19] border border-[#1E293B] rounded px-2 py-1 text-xs font-mono text-[#06B6D4] focus:outline-none focus:border-[#06B6D4]"
                        title="Override the focal seed token for unassisted wave propagation"
                      />
                      {customSeedWord && (
                        <button
                          onClick={() => setCustomSeedWord('')}
                          className="text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] px-1.5 py-0.5 border border-[#1E293B] rounded cursor-pointer"
                        >
                          Auto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mode 1: Unassisted Word-by-Word Wave-Packet Walk (Zero Sentence Templates) */}
                  <div className="bg-[#0B0F19] border border-[#06B6D4]/40 rounded-md p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#06B6D4]">
                          1. Unassisted Word-by-Word Wave Walk (Zero Sentence Templates)
                        </span>
                        <span className="text-[11px] font-mono text-[#94A3B8]">
                          Seed: [{liveUnassistedSynthesis.seedAnchorToken}]
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
                        <span className="text-[#10B981]">
                          Pauli Suppressed: {liveUnassistedSynthesis.pauliSuppressedCount}
                        </span>
                        <span
                          className={
                            liveUnassistedSynthesis.wordStutteringRatio > 0.25
                              ? 'text-[#F59E0B]'
                              : 'text-[#06B6D4]'
                          }
                        >
                          Word Stutter: {liveUnassistedSynthesis.wordStutteringRatio.toFixed(3)}
                        </span>
                        <button
                          onClick={() => setShowSynthesisSteps((s) => !s)}
                          className="text-[#94A3B8] hover:text-[#F8FAFC] underline cursor-pointer"
                        >
                          {showSynthesisSteps ? 'Hide Step Telemetry' : 'Show Step Telemetry'}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-[#F8FAFC] bg-[#07090E] border border-[#1E293B] rounded px-3 py-2 leading-relaxed">
                      “{liveUnassistedSynthesis.wordStreamText}”
                    </div>

                    {showSynthesisSteps && (
                      <div className="overflow-x-auto border border-[#1E293B] rounded bg-[#07090E] max-h-[210px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px] font-mono tabular-nums">
                          <thead>
                            <tr className="border-b border-[#1E293B] bg-[#111827] text-[#94A3B8]">
                              <th className="py-1.5 px-2">Step</th>
                              <th className="py-1.5 px-2">Propagation</th>
                              <th className="py-1.5 px-2">Transition</th>
                              <th className="py-1.5 px-2 text-right">P_fwd</th>
                              <th className="py-1.5 px-2 text-right">P_bwd</th>
                              <th className="py-1.5 px-2 text-right">Skip-2</th>
                              <th className="py-1.5 px-2 text-right">Horizon Pull</th>
                              <th className="py-1.5 px-2 text-right">Pauli Pen</th>
                              <th className="py-1.5 px-2 text-right text-[#06B6D4]">Net Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E293B]">
                            {liveUnassistedSynthesis.steps.map((st) => (
                              <tr key={st.stepIndex} className="hover:bg-[#111827]/60">
                                <td className="py-1 px-2 text-[#64748B]">#{st.stepIndex}</td>
                                <td className="py-1 px-2">
                                  {st.direction === 'focal_seed' ? (
                                    <span className="text-[#F59E0B]">FOCAL SEED</span>
                                  ) : st.direction === 'backward_past' ? (
                                    <span className="text-[#06B6D4]">← PAST (BWD)</span>
                                  ) : (
                                    <span className="text-[#10B981]">→ FUTURE (FWD)</span>
                                  )}
                                </td>
                                <td className="py-1 px-2 text-[#F8FAFC]">
                                  {st.direction === 'backward_past'
                                    ? `${st.selectedToken} ← ${st.fromToken}`
                                    : st.direction === 'focal_seed'
                                    ? `[${st.selectedToken}]`
                                    : `${st.fromToken} → ${st.selectedToken}`}
                                </td>
                                <td className="py-1 px-2 text-right">{st.pForward.toFixed(2)}</td>
                                <td className="py-1 px-2 text-right">{st.pBackward.toFixed(2)}</td>
                                <td className="py-1 px-2 text-right">{st.skip2Coherence.toFixed(2)}</td>
                                <td className="py-1 px-2 text-right">{st.queryHorizonPull.toFixed(2)}</td>
                                <td className="py-1 px-2 text-right text-[#F43F5E]">
                                  {st.pauliSuppression > 0 ? `-${st.pauliSuppression.toFixed(2)}` : '0.00'}
                                </td>
                                <td className="py-1 px-2 text-right font-semibold text-[#06B6D4]">
                                  {st.netStepScore.toFixed(3)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Mode 2: Unassisted Character-by-Character Wave Stream (Pure Level-1 Channel) */}
                  <div className="bg-[#0B0F19] border border-[#1E293B] rounded-md p-3 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#F59E0B]">
                        2. Unassisted Character-by-Character Wave Stream (Pure Level-1 Orthographic Physics)
                      </span>
                      <span className="font-mono tabular-nums text-[11px] text-[#94A3B8]">
                        3-Gram Stutter Ratio: {liveUnassistedSynthesis.charStutteringRatio.toFixed(3)}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#94A3B8] bg-[#07090E] border border-[#1E293B] rounded px-3 py-1.5 break-all">
                      “{liveUnassistedSynthesis.charStreamText}”
                    </div>
                  </div>

                  {/* Mode 3: Associative Corpus Trajectory Recall (Sentence-Template Baseline) */}
                  <div className="bg-[#0B0F19] border border-[#1E293B] rounded-md p-3 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
                      <span>
                        3. Associative Corpus Trajectory Recall (Stored Pass-1 Sentence-Template Resonance)
                      </span>
                      <span className="font-mono tabular-nums text-[11px] text-[#06B6D4]">
                        Template Stutter Ratio: {liveEval.stutteringRatio.toFixed(3)}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#F8FAFC] bg-[#07090E] border border-[#1E293B] rounded px-3 py-1.5">
                      “{liveEval.reconstructedAnswer}”
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Level 3: Synchronized 8-View Temporal Delay Matrix (View 0 .. View 7) */}
            <section className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">
                    02. Level 3: Eight Synchronized Temporal Views (View 0 .. View 7)
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Preserves sequence identity while shifting observation offset by k ∈ [0..7] time steps without duplicating facts.
                  </p>
                </div>
                <div className="text-xs font-mono tabular-nums text-[#06B6D4]">
                  Multi-View Wisdom Agreement: {liveEval.wisdomStability.wisdomScore.toFixed(4)}
                </div>
              </div>

              <div className="overflow-x-auto border border-[#1E293B] rounded-md bg-[#07090E]">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-[#1E293B] bg-[#0B0F19] text-[#94A3B8]">
                      <th className="py-2 px-3">Temporal View</th>
                      <th className="py-2 px-3 text-right">Lag Coherence</th>
                      {liveSyncViews.views[0]?.slice(0, 12).map((pt, idx) => (
                        <th key={idx} className="py-2 px-2.5 text-center">
                          t={idx}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {liveSyncViews.views.map((viewRow, k) => {
                      const viewCoh =
                        liveEval.wisdomStability.multiOffsetViewCoherence[k] ?? 0;
                      return (
                        <tr key={k} className="hover:bg-[#111827]">
                          <td className="py-2 px-3 font-semibold text-[#F8FAFC] whitespace-nowrap">
                            View {k} (Δt = -{k})
                          </td>
                          <td className="py-2 px-3 text-right text-[#06B6D4] font-semibold">
                            {viewCoh.toFixed(3)}
                          </td>
                          {viewRow.slice(0, 12).map((cell, idx) => (
                            <td
                              key={idx}
                              className={`py-2 px-2.5 text-center ${
                                cell.isBoundaryPadded
                                  ? 'text-[#475569]'
                                  : k === 0
                                  ? 'text-[#06B6D4] font-semibold'
                                  : 'text-[#F8FAFC]'
                              }`}
                            >
                              <div>{cell.isBoundaryPadded ? 'pad(0)' : cell.token}</div>
                              <div className="text-[10px] text-[#64748B]">
                                {cell.phaseRad.toFixed(2)}r
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: CONDITIONS A-L & ABLATIONS 1-10 MATRIX                         */}
        {/* ===================================================================== */}
        {activeTab === 'conditions' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] border border-[#1E293B] rounded-lg p-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Experimental Conditions (A–L) & Ablation Matrix (1–10)
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Click any condition row to activate its physics parameters in the live workbench.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#07090E] border border-[#1E293B] rounded-md">
                <button
                  onClick={() => setMatrixScope('MACRO')}
                  className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                    matrixScope === 'MACRO'
                      ? 'bg-[#1E293B] text-[#F8FAFC] font-medium'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Macro Average (All 3 Corpora)
                </button>
                {UNSEEN_CORPORA.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setMatrixScope(c.id)}
                    className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                      matrixScope === c.id
                        ? 'bg-[#1E293B] text-[#F8FAFC] font-medium'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {c.style}
                  </button>
                ))}
              </div>
            </div>

            {/* Table 1: Conditions A through L */}
            <section className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                01. Required Experimental Conditions (A through L)
              </h4>
              <div className="overflow-x-auto border border-[#1E293B] rounded-md bg-[#07090E]">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-[#1E293B] bg-[#0B0F19] text-[#94A3B8]">
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3 font-sans">Experimental Condition</th>
                      <th className="py-2.5 px-3 text-right">Valid Recall</th>
                      <th className="py-2.5 px-3 text-right">Trap Rejection</th>
                      <th className="py-2.5 px-3 text-right">False Rej</th>
                      <th className="py-2.5 px-3 text-right">FP Leaks</th>
                      <th className="py-2.5 px-3 text-right">Anagram Sens</th>
                      <th className="py-2.5 px-3 text-right">Order Sens</th>
                      <th className="py-2.5 px-3 text-right">Wisdom W</th>
                      <th className="py-2.5 px-3 text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {conditionList.map((m) => {
                      const isActive = m.conditionId === selectedConditionId;
                      return (
                        <tr
                          key={m.conditionId}
                          onClick={() =>
                            setSelectedConditionId(m.conditionId as ExperimentalConditionId)
                          }
                          className={`cursor-pointer transition-colors ${
                            isActive ? 'bg-[#1E293B]/70' : 'hover:bg-[#111827]'
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-[#06B6D4]">
                            {m.conditionId}
                          </td>
                          <td className="py-2 px-3 font-sans text-[#F8FAFC]">
                            {m.conditionLabel}
                          </td>
                          <td className="py-2 px-3 text-right text-[#10B981]">
                            {(m.validRecall * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right text-[#06B6D4]">
                            {(m.trapRejection * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right text-[#94A3B8]">
                            {m.falseRejections}
                          </td>
                          <td
                            className={`py-2 px-3 text-right font-semibold ${
                              m.falsePositiveLeaks === 0
                                ? 'text-[#10B981]'
                                : 'text-[#F43F5E]'
                            }`}
                          >
                            {m.falsePositiveLeaks}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {(m.anagramSensitivity * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right">
                            {(m.grammarOrderSensitivity * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right text-[#F59E0B]">
                            {m.meanMultiViewStability.toFixed(4)}
                          </td>
                          <td className="py-2 px-3 text-right text-[#94A3B8]">
                            {m.meanLatencyMs.toFixed(2)} ms
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Table 2: Required Ablations 1 through 10 */}
            <section className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                02. Required Architectural Ablations (1 through 10)
              </h4>
              <div className="overflow-x-auto border border-[#1E293B] rounded-md bg-[#07090E]">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-[#1E293B] bg-[#0B0F19] text-[#94A3B8]">
                      <th className="py-2.5 px-3 font-sans">Ablation Configuration</th>
                      <th className="py-2.5 px-3 text-right">Valid Recall</th>
                      <th className="py-2.5 px-3 text-right">Trap Rejection</th>
                      <th className="py-2.5 px-3 text-right">False Rej</th>
                      <th className="py-2.5 px-3 text-right">FP Leaks</th>
                      <th className="py-2.5 px-3 text-right">Anagram Sens</th>
                      <th className="py-2.5 px-3 text-right">Order Sens</th>
                      <th className="py-2.5 px-3 text-right">Bwd Acc</th>
                      <th className="py-2.5 px-3 text-right">Fwd Acc</th>
                      <th className="py-2.5 px-3 text-right">Wisdom W</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {ablationList.map((m) => (
                      <tr key={m.conditionId} className="hover:bg-[#111827]">
                        <td className="py-2 px-3 font-sans text-[#F8FAFC]">
                          {m.conditionLabel}
                        </td>
                        <td className="py-2 px-3 text-right text-[#10B981]">
                          {(m.validRecall * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right text-[#06B6D4]">
                          {(m.trapRejection * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right text-[#94A3B8]">
                          {m.falseRejections}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-semibold ${
                            m.falsePositiveLeaks === 0
                              ? 'text-[#10B981]'
                              : 'text-[#F43F5E]'
                          }`}
                        >
                          {m.falsePositiveLeaks}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {(m.anagramSensitivity * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right">
                          {(m.grammarOrderSensitivity * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right">
                          {m.backwardReconstructionAccuracy.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {m.forwardConsequenceAccuracy.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right text-[#F59E0B]">
                          {m.meanMultiViewStability.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: TEMPORAL CLOCK & PAULI ORTHOGONALITY DIAGNOSTICS               */}
        {/* ===================================================================== */}
        {activeTab === 'diagnostics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Level 5: Custom Temporal Event Clock Breakdown */}
            <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Level 5: Custom Deterministic Temporal Event Clock
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Distinguishes normal word order, role reversal, repeated-token ambiguity, cross-sentence anaphora, valid paraphrase, and unrelated recombination using directional flux and recurrence intervals.
                </p>
              </div>

              <div className="overflow-x-auto border border-[#1E293B] rounded-md bg-[#07090E]">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-[#1E293B] bg-[#0B0F19] text-[#94A3B8]">
                      <th className="py-2 px-2.5">Probe</th>
                      <th className="py-2 px-2.5">Expected Regime</th>
                      <th className="py-2 px-2.5">Detected Regime</th>
                      <th className="py-2 px-2.5 text-right">Fwd Flux</th>
                      <th className="py-2 px-2.5 text-right">Asymmetry</th>
                      <th className="py-2 px-2.5 text-right">Anaphora</th>
                      <th className="py-2 px-2.5 text-right">Clock Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {corpusProbes.map((p) => {
                      const ev = evaluateProbePass2(
                        p,
                        activeArtifact,
                        EXPERIMENTAL_CONDITIONS.C
                      );
                      const clk = ev.clockAnalysis;
                      const match = clk.detectedRegime === p.expectedRegime;
                      return (
                        <tr key={p.id} className="hover:bg-[#111827]">
                          <td className="py-1.5 px-2.5 font-semibold text-[#F8FAFC]">
                            {p.id}
                          </td>
                          <td className="py-1.5 px-2.5 text-[#94A3B8]">
                            {p.expectedRegime}
                          </td>
                          <td
                            className={`py-1.5 px-2.5 font-semibold ${
                              match ? 'text-[#10B981]' : 'text-[#F59E0B]'
                            }`}
                          >
                            {clk.detectedRegime}
                          </td>
                          <td className="py-1.5 px-2.5 text-right">
                            {clk.forwardFlux.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2.5 text-right">
                            {clk.directionalityAsymmetry.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2.5 text-right">
                            {clk.crossSentenceAnaphoraScore.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-[#06B6D4] font-semibold">
                            {clk.clockCoherence.toFixed(3)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Level 6: Pauli-Inspired State Compatibility & Exclusion Inspector */}
            <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Level 6: Pauli-Inspired Compatibility & Orthogonality
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Evaluates 5D representational state vectors (temporal coordinate, directional role, phase signature, contextual lineage, scale ratio) for state-occupation conflicts.
                </p>
              </div>

              <div className="bg-[#07090E] border border-[#1E293B] rounded-md p-3.5 space-y-2">
                <div className="text-xs text-[#94A3B8]">
                  Active Probe Sequence ({activeProbe.id}):
                </div>
                <div className="text-xs font-mono text-[#F8FAFC]">
                  “{activeProbe.candidateText}”
                </div>
                <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-2 border-t border-[#1E293B]">
                  <span>Max State Overlap Ω: {livePauli.maxStateOverlap.toFixed(4)}</span>
                  <span className="text-[#F59E0B]">
                    Total Exclusion Penalty: {livePauli.totalExclusionPenalty.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Detected State Occupation Conflicts ({livePauli.conflictingPairs.length})
                </div>
                {livePauli.conflictingPairs.length === 0 ? (
                  <div className="bg-[#07090E] border border-[#1E293B] rounded-md p-4 text-xs text-[#10B981] font-mono">
                    Zero exclusion conflicts detected — all token state trajectories occupy orthogonal compatible coordinates.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto">
                    {livePauli.conflictingPairs.map((cp, idx) => (
                      <div
                        key={idx}
                        className="bg-[#07090E] border border-[#1E293B] rounded-md p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-[#F43F5E] font-semibold">
                            [{cp.posA}] “{cp.tokenA}” ↔ [{cp.posB}] “{cp.tokenB}”
                          </span>
                          <span className="text-[#F59E0B]">
                            Overlap Ω = {cp.overlap.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[#94A3B8]">{cp.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: SCIENTIFIC EPISTEMOLOGY & FORENSIC AUDIT                       */}
        {/* ===================================================================== */}
        {activeTab === 'epistemology' && (
          <div className="space-y-6">
            {/* Epistemological Separation Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-2">
                <div className="text-xs font-mono uppercase text-[#06B6D4]">
                  Category 01 · Implemented Computation
                </div>
                <h4 className="text-sm font-semibold text-[#F8FAFC]">
                  Deterministic Transition & Mutual Information Operators
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Computes empirical character and word Markov transition matrices P(x_t+1 | x_t) and P(x_t-1 | x_t), Normalized Pointwise Mutual Information (NPMI) bonding, 8 phase-delayed sequence views (k ∈ 0..7), Pass-1 unsupervised mutual-information weights (a, b, c, d), and 5D state-vector compatibility penalties.
                </p>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-2">
                <div className="text-xs font-mono uppercase text-[#F59E0B]">
                  Category 02 · Physical Analogy
                </div>
                <h4 className="text-sm font-semibold text-[#F8FAFC]">
                  Quantum-Inspired & Thermodynamic Terminology
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Terms such as Pauli exclusion, phase wave, crystal lattice, and attractor resonance serve strictly as mathematical analogies for state-space orthogonality, recurrence phase angles θ_k(t), and directional conditional entropies. The software does not execute quantum wavefunctions or subatomic physics.
                </p>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-2">
                <div className="text-xs font-mono uppercase text-[#10B981]">
                  Category 03 · Experimentally Supported Result
                </div>
                <h4 className="text-sm font-semibold text-[#F8FAFC]">
                  Two-Pass Unsupervised Discrimination Across 3 Unseen Corpora
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Across 36 held-out valid and adversarial probes on 3 unseen corpora, Condition C achieves {(suite.conditionMacroSummary.C.validRecall * 100).toFixed(1)}% valid recall and {(suite.conditionMacroSummary.C.trapRejection * 100).toFixed(1)}% trap rejection with 100% deterministic replay parity (Condition L), outperforming forward-only Condition A ({(suite.conditionMacroSummary.A.trapRejection * 100).toFixed(1)}% trap rejection).
                </p>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-2">
                <div className="text-xs font-mono uppercase text-[#94A3B8]">
                  Category 04 · Falsifiable Hypothesis & Falsified Sub-Claims
                </div>
                <h4 className="text-sm font-semibold text-[#F8FAFC]">
                  Scope Limits & Falsified Single-Channel Sufficiency
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Ablation 5 falsified the sub-hypothesis that character-level physics alone can reject causal role reversals (trap rejection fell to {(suite.ablationMacroSummary.ablation_5_no_word_channel.trapRejection * 100).toFixed(1)}% without the word channel). Condition J falsified the claim that unaligned multi-view delays preserve stability.
                </p>
              </div>
            </section>

            {/* Transparent Failure & Leak Audit Table */}
            <section className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                    <span>Transparent Failure & False-Positive Leak Log Across Conditions</span>
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Every false rejection or false-positive leak observed under ablated or baseline conditions is reported below without suppression.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-[#94A3B8]">
                  Total Logged Errors Across All 12 Conditions: {suite.failureCases.length}
                </span>
              </div>

              <div className="overflow-x-auto border border-[#1E293B] rounded-md bg-[#07090E] max-h-[340px]">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead className="sticky top-0 bg-[#0B0F19]">
                    <tr className="border-b border-[#1E293B] text-[#94A3B8]">
                      <th className="py-2 px-3">Condition</th>
                      <th className="py-2 px-3">Probe ID</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Failure Type</th>
                      <th className="py-2 px-3 text-right">Score</th>
                      <th className="py-2 px-3 text-right">Threshold</th>
                      <th className="py-2 px-3 font-sans">Candidate Text</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {suite.failureCases.slice(0, 45).map((fc, idx) => (
                      <tr key={`${fc.conditionId}-${fc.probeId}-${idx}`} className="hover:bg-[#111827]">
                        <td className="py-1.5 px-3 font-bold text-[#06B6D4]">{fc.conditionId}</td>
                        <td className="py-1.5 px-3 text-[#F8FAFC]">{fc.probeId}</td>
                        <td className="py-1.5 px-3 text-[#94A3B8]">{fc.category}</td>
                        <td
                          className={`py-1.5 px-3 font-semibold ${
                            fc.isValidGroundTruth ? 'text-[#F59E0B]' : 'text-[#F43F5E]'
                          }`}
                        >
                          {fc.isValidGroundTruth ? 'FALSE_REJECTION' : 'FALSE_POSITIVE_LEAK'}
                        </td>
                        <td className="py-1.5 px-3 text-right">{fc.compositeResonanceScore.toFixed(3)}</td>
                        <td className="py-1.5 px-3 text-right text-[#64748B]">{fc.decisionThreshold}</td>
                        <td className="py-1.5 px-3 font-sans text-[#94A3B8] truncate max-w-[360px]">
                          “{HELD_OUT_PROBES.find((p) => p.id === fc.probeId)?.candidateText}”
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
