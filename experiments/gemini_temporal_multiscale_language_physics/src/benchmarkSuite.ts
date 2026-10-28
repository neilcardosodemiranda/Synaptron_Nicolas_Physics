/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Full Benchmark & Ablation Suite for Gemini Temporal Multiscale Language Physics
 * Executes Pass 1 -> Reset -> Pass 2 across all 3 unseen corpora, 12 conditions (A-L),
 * and 10 ablations (1-10).
 */

import {
  AblationId,
  ConditionAggregateMetrics,
  ExperimentalConditionId,
  Pass1CalibrationArtifact,
  ProbeEvaluationResult,
} from './types';
import {
  HELD_OUT_PROBES,
  UNRELATED_CONTROL_CORPUS,
  UNSEEN_CORPORA,
} from './corpora';
import {
  EXPERIMENTAL_CONDITIONS,
  REQUIRED_ABLATIONS,
  aggregateConditionMetrics,
  evaluateProbePass2,
  resetRuntimeAndReloadArtifact,
  runPass1Calibration,
} from './engine';

export interface FullExperimentSuiteOutput {
  executedAtIso: string;
  pass1Artifacts: Record<string, Pass1CalibrationArtifact>;
  conditionResultsByCorpus: Record<
    string,
    Record<ExperimentalConditionId, ConditionAggregateMetrics>
  >;
  conditionMacroSummary: Record<ExperimentalConditionId, ConditionAggregateMetrics>;
  ablationResultsByCorpus: Record<string, Record<AblationId, ConditionAggregateMetrics>>;
  ablationMacroSummary: Record<AblationId, ConditionAggregateMetrics>;
  allProbeEvaluations: ProbeEvaluationResult[];
  failureCases: ProbeEvaluationResult[];
}

function computeMacroAverage(
  id: string,
  label: string,
  metricsList: ConditionAggregateMetrics[]
): ConditionAggregateMetrics {
  const n = Math.max(1, metricsList.length);
  const sum = <K extends keyof ConditionAggregateMetrics>(key: K): number =>
    metricsList.reduce((acc, m) => acc + (Number(m[key]) || 0), 0);

  return {
    conditionId: id,
    conditionLabel: label,
    corpusId: 'ALL_3_UNSEEN_CORPORA_MACRO',
    totalProbes: sum('totalProbes'),
    validProbesCount: sum('validProbesCount'),
    trapProbesCount: sum('trapProbesCount'),
    validRecall: Number((sum('validRecall') / n).toFixed(4)),
    trapRejection: Number((sum('trapRejection') / n).toFixed(4)),
    falseRejections: sum('falseRejections'),
    falsePositiveLeaks: sum('falsePositiveLeaks'),
    exactAnswerRecoveryRate: Number((sum('exactAnswerRecoveryRate') / n).toFixed(4)),
    anagramSensitivity: Number((sum('anagramSensitivity') / n).toFixed(4)),
    grammarOrderSensitivity: Number((sum('grammarOrderSensitivity') / n).toFixed(4)),
    backwardReconstructionAccuracy: Number(
      (sum('backwardReconstructionAccuracy') / n).toFixed(4)
    ),
    forwardConsequenceAccuracy: Number((sum('forwardConsequenceAccuracy') / n).toFixed(4)),
    meanMultiViewStability: Number((sum('meanMultiViewStability') / n).toFixed(4)),
    charWordAgreement: Number((sum('charWordAgreement') / n).toFixed(4)),
    attractorLoopRate: Number((sum('attractorLoopRate') / n).toFixed(4)),
    stutteringRate: Number((sum('stutteringRate') / n).toFixed(4)),
    meanLatencyMs: Number((sum('meanLatencyMs') / n).toFixed(3)),
    p95LatencyMs: Number((sum('p95LatencyMs') / n).toFixed(3)),
    memoryKb: Number((sum('memoryKb') / n).toFixed(2)),
    calibrationTimeMs: Number((sum('calibrationTimeMs') / n).toFixed(3)),
    deterministicReplayParity: Number((sum('deterministicReplayParity') / n).toFixed(4)),
  };
}

export function executeFullExperimentSuite(): FullExperimentSuiteOutput {
  const pass1Artifacts: Record<string, Pass1CalibrationArtifact> = {};
  const shuffledArtifacts: Record<string, Pass1CalibrationArtifact> = {};

  // Step 1: Pass 1 Calibration on raw corpus text only
  for (const corpus of UNSEEN_CORPORA) {
    const rawArtifact = runPass1Calibration(corpus, false);
    // Step 2: Runtime reset & reload from serialized JSON
    pass1Artifacts[corpus.id] = resetRuntimeAndReloadArtifact(rawArtifact);

    const rawShuffled = runPass1Calibration(corpus, true);
    shuffledArtifacts[corpus.id] = resetRuntimeAndReloadArtifact(rawShuffled);
  }

  const controlArtifact = resetRuntimeAndReloadArtifact(
    runPass1Calibration(UNRELATED_CONTROL_CORPUS, false)
  );

  const conditionResultsByCorpus: Record<
    string,
    Record<ExperimentalConditionId, ConditionAggregateMetrics>
  > = {};
  const ablationResultsByCorpus: Record<
    string,
    Record<AblationId, ConditionAggregateMetrics>
  > = {};
  const allProbeEvaluations: ProbeEvaluationResult[] = [];

  const conditionKeys = Object.keys(EXPERIMENTAL_CONDITIONS) as ExperimentalConditionId[];
  const ablationKeys = Object.keys(REQUIRED_ABLATIONS) as AblationId[];

  for (const corpus of UNSEEN_CORPORA) {
    const probes = HELD_OUT_PROBES.filter((p) => p.corpusId === corpus.id);
    conditionResultsByCorpus[corpus.id] = {} as Record<
      ExperimentalConditionId,
      ConditionAggregateMetrics
    >;
    ablationResultsByCorpus[corpus.id] = {} as Record<
      AblationId,
      ConditionAggregateMetrics
    >;

    // Evaluate Conditions A..L
    for (const condId of conditionKeys) {
      const config = EXPERIMENTAL_CONDITIONS[condId];
      const activeArtifact = config.useUnrelatedControlArtifact
        ? controlArtifact
        : config.shuffleTemporalOrder
        ? shuffledArtifacts[corpus.id]
        : config.freshProcessReplay
        ? resetRuntimeAndReloadArtifact(pass1Artifacts[corpus.id])
        : pass1Artifacts[corpus.id];

      const evals = probes.map((probe) =>
        evaluateProbePass2(probe, activeArtifact, config)
      );

      // Verify deterministic replay parity if Condition L
      let parity = 1.0;
      if (condId === 'L') {
        const baselineC = probes.map((probe) =>
          evaluateProbePass2(probe, pass1Artifacts[corpus.id], EXPERIMENTAL_CONDITIONS.C)
        );
        let matches = 0;
        for (let i = 0; i < evals.length; i++) {
          if (
            evals[i].compositeResonanceScore === baselineC[i].compositeResonanceScore &&
            evals[i].acceptedByPhysics === baselineC[i].acceptedByPhysics
          ) {
            matches++;
          }
        }
        parity = matches / Math.max(1, evals.length);
      }

      allProbeEvaluations.push(...evals);
      conditionResultsByCorpus[corpus.id][condId] = aggregateConditionMetrics(
        condId,
        config.label,
        corpus.id,
        evals,
        activeArtifact,
        parity
      );
    }

    // Evaluate Required Ablations 1..10
    for (const ablId of ablationKeys) {
      const config = REQUIRED_ABLATIONS[ablId];
      const activeArtifact = config.shuffleTemporalOrder
        ? shuffledArtifacts[corpus.id]
        : pass1Artifacts[corpus.id];

      const evals = probes.map((probe) =>
        evaluateProbePass2(probe, activeArtifact, config)
      );

      ablationResultsByCorpus[corpus.id][ablId] = aggregateConditionMetrics(
        ablId,
        config.label,
        corpus.id,
        evals,
        activeArtifact,
        1.0
      );
    }
  }

  const conditionMacroSummary = {} as Record<
    ExperimentalConditionId,
    ConditionAggregateMetrics
  >;
  for (const condId of conditionKeys) {
    const list = UNSEEN_CORPORA.map((c) => conditionResultsByCorpus[c.id][condId]);
    conditionMacroSummary[condId] = computeMacroAverage(
      condId,
      EXPERIMENTAL_CONDITIONS[condId].label,
      list
    );
  }

  const ablationMacroSummary = {} as Record<AblationId, ConditionAggregateMetrics>;
  for (const ablId of ablationKeys) {
    const list = UNSEEN_CORPORA.map((c) => ablationResultsByCorpus[c.id][ablId]);
    ablationMacroSummary[ablId] = computeMacroAverage(
      ablId,
      REQUIRED_ABLATIONS[ablId].label,
      list
    );
  }

  // Collect all failure cases across Conditions A..L for transparent reporting
  const failureCases = allProbeEvaluations.filter((e) => !e.isCorrectDecision);

  return {
    executedAtIso: '2026-10-23T00:00:00.000Z',
    pass1Artifacts,
    conditionResultsByCorpus,
    conditionMacroSummary,
    ablationResultsByCorpus,
    ablationMacroSummary,
    allProbeEvaluations,
    failureCases,
  };
}
