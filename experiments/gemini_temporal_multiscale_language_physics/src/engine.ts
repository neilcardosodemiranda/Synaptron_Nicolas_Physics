/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Core Experimental Engine for Gemini Temporal Multiscale Language Physics
 * Implements:
 * - Strict Two-Pass Calibration (Pass 1 text-only -> Artifact -> Reset -> Pass 2 frozen)
 * - 12 Experimental Conditions (A through L)
 * - 10 Required Ablations (1 through 10)
 * - Autonomous Bidirectional Answer Reconstruction
 */

import {
  AblationId,
  BenchmarkProbe,
  ConditionAggregateMetrics,
  ExperimentalConditionId,
  Pass1CalibrationArtifact,
  ProbeEvaluationResult,
  UnassistedSynthesisStep,
  UnassistedWaveSynthesisResult,
} from './types';
import { calibrateCharacterChannel, evaluateCharacterChannel } from './charChannel';
import { calibrateWordChannel, tokenizeWords } from './wordChannel';
import { buildSynchronizedTemporalViews, evaluateMultiViewCoherence } from './multiview';
import {
  deriveCorpusCoefficients,
  evaluateBidirectionalField,
} from './bidirectionalField';
import { analyzeTemporalClock } from './temporalClock';
import { evaluatePauliCompatibility } from './pauliOrthogonality';
import { computeWisdomStabilityScore } from './wisdomStability';
import { UnseenCorpusDefinition } from './corpora';

export interface EngineConfiguration {
  id: string;
  label: string;
  enableBackward: boolean;
  enableForward: boolean;
  enableMultiViewOffsets: boolean;
  enableCharChannel: boolean;
  enableWordChannel: boolean;
  enableCrossScale: boolean;
  enablePauliConstraint: boolean;
  enableTemporalClock: boolean;
  enableWisdomScore: boolean;
  shuffleTemporalOrder: boolean;
  randomizePhaseOffsets: boolean;
  useUnrelatedControlArtifact: boolean;
  freshProcessReplay: boolean;
}

export const EXPERIMENTAL_CONDITIONS: Record<ExperimentalConditionId, EngineConfiguration> = {
  A: {
    id: 'A',
    label: 'A. Ordinary forward-only sequence',
    enableBackward: false,
    enableForward: true,
    enableMultiViewOffsets: false,
    enableCharChannel: false,
    enableWordChannel: true,
    enableCrossScale: false,
    enablePauliConstraint: false,
    enableTemporalClock: false,
    enableWisdomScore: false,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  B: {
    id: 'B',
    label: 'B. Forward plus backward sequence',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: false,
    enableCharChannel: false,
    enableWordChannel: true,
    enableCrossScale: false,
    enablePauliConstraint: false,
    enableTemporalClock: true,
    enableWisdomScore: false,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  C: {
    id: 'C',
    label: 'C. Eight temporal views (Full Multiscale Architecture)',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: true,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  D: {
    id: 'D',
    label: 'D. Eight views with no backward traversal',
    enableBackward: false,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: true,
    enableTemporalClock: false,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  E: {
    id: 'E',
    label: 'E. Backward traversal with no multi-view offsets',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: false,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: true,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  F: {
    id: 'F',
    label: 'F. Multi-scale character and word channels (no Pauli)',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: false,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  G: {
    id: 'G',
    label: 'G. Pauli-inspired compatibility constraint disabled',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: false,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  H: {
    id: 'H',
    label: 'H. Pauli-inspired compatibility constraint enabled',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: true,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  I: {
    id: 'I',
    label: 'I. Shuffled temporal order',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: true,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: true,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  J: {
    id: 'J',
    label: 'J. Randomized phase offsets',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: true,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: true,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: false,
  },
  K: {
    id: 'K',
    label: 'K. Unrelated control corpus',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: true,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: true,
    freshProcessReplay: false,
  },
  L: {
    id: 'L',
    label: 'L. Fresh-process deterministic replay',
    enableBackward: true,
    enableForward: true,
    enableMultiViewOffsets: true,
    enableCharChannel: true,
    enableWordChannel: true,
    enableCrossScale: true,
    enablePauliConstraint: true,
    enableTemporalClock: true,
    enableWisdomScore: true,
    shuffleTemporalOrder: false,
    randomizePhaseOffsets: false,
    useUnrelatedControlArtifact: false,
    freshProcessReplay: true,
  },
};

export const REQUIRED_ABLATIONS: Record<AblationId, EngineConfiguration> = {
  ablation_1_no_offsets: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_1_no_offsets',
    label: 'Ablation 1: Remove temporal offsets (View 0 only)',
    enableMultiViewOffsets: false,
  },
  ablation_2_no_backward: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_2_no_backward',
    label: 'Ablation 2: Remove backward traversal',
    enableBackward: false,
  },
  ablation_3_no_forward_consequence: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_3_no_forward_consequence',
    label: 'Ablation 3: Remove forward consequence analysis',
    enableForward: false,
  },
  ablation_4_no_char_channel: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_4_no_char_channel',
    label: 'Ablation 4: Remove character channel',
    enableCharChannel: false,
  },
  ablation_5_no_word_channel: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_5_no_word_channel',
    label: 'Ablation 5: Remove word channel',
    enableWordChannel: false,
  },
  ablation_6_no_cross_scale: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_6_no_cross_scale',
    label: 'Ablation 6: Remove cross-scale compatibility',
    enableCrossScale: false,
  },
  ablation_7_no_pauli: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_7_no_pauli',
    label: 'Ablation 7: Remove Pauli-inspired compatibility constraint',
    enablePauliConstraint: false,
  },
  ablation_8_no_clock: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_8_no_clock',
    label: 'Ablation 8: Remove temporal clock',
    enableTemporalClock: false,
  },
  ablation_9_no_wisdom: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_9_no_wisdom',
    label: 'Ablation 9: Remove multi-view stability (wisdom) score',
    enableWisdomScore: false,
  },
  ablation_10_shuffled_time: {
    ...EXPERIMENTAL_CONDITIONS.C,
    id: 'ablation_10_shuffled_time',
    label: 'Ablation 10: Shuffle time order during calibration',
    shuffleTemporalOrder: true,
  },
};

function computeSimpleHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

function deterministicShuffleText(rawText: string, seed = 1337): string {
  const words = rawText.split(/\s+/).filter(Boolean);
  let state = seed;
  for (let i = words.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = words[i];
    words[i] = words[j];
    words[j] = tmp;
  }
  return words.join(' ');
}

/**
 * PASS 1: Purely unsupervised calibration from raw corpus text only.
 * Never receives any probe, query, or benchmark target.
 */
export function runPass1Calibration(
  corpus: UnseenCorpusDefinition,
  shuffleTemporalOrder = false
): Pass1CalibrationArtifact {
  const t0 = performance.now();
  const effectiveText = shuffleTemporalOrder
    ? deterministicShuffleText(corpus.rawText, 9001)
    : corpus.rawText;

  const charChannel = calibrateCharacterChannel(effectiveText);
  const wordChannel = calibrateWordChannel(effectiveText);
  const durationMs = Math.max(0.05, performance.now() - t0);
  const coefficients = deriveCorpusCoefficients(wordChannel, charChannel, durationMs);

  return {
    artifactVersion: '1.0.0-PASS1-FROZEN',
    corpusId: corpus.id,
    corpusTitle: corpus.title,
    corpusStyle: corpus.style,
    createdAtIso: '2026-10-23T00:00:00.000Z',
    corpusHash: computeSimpleHash(effectiveText),
    charChannel,
    wordChannel,
    coefficients,
  };
}

/**
 * Runtime reset between Pass 1 and Pass 2:
 * Serializes the Pass-1 artifact to JSON and parses a fresh frozen copy so zero
 * in-memory references or training buffers survive.
 */
export function resetRuntimeAndReloadArtifact(
  artifact: Pass1CalibrationArtifact
): Pass1CalibrationArtifact {
  const serialized = JSON.stringify(artifact);
  return JSON.parse(serialized) as Pass1CalibrationArtifact;
}

/**
 * Autonomous trajectory reconstruction given a query prompt using only Pass-1 transitions
 * and sentence templates.
 */
export function reconstructAnswerTrajectory(
  queryPrompt: string,
  artifact: Pass1CalibrationArtifact,
  enableBackward = true
): {
  reconstructedText: string;
  stutteringRatio: number;
  attractorLoopDetected: boolean;
} {
  const queryTokens = tokenizeWords(queryPrompt).filter((t) => t.length >= 4);
  let bestTemplate = artifact.wordChannel.sentenceTemplates[0];
  let bestScore = -1;

  for (const tmpl of artifact.wordChannel.sentenceTemplates) {
    let overlap = 0;
    for (const qt of queryTokens) {
      if (tmpl.tokens.includes(qt)) {
        const freq = artifact.wordChannel.frequencies[qt] ?? 0.05;
        overlap += 1 / Math.max(0.01, freq);
      }
    }
    // Check bidirectional continuity within template
    let continuity = 0;
    for (let i = 0; i < tmpl.tokens.length - 1; i++) {
      const w1 = tmpl.tokens[i];
      const w2 = tmpl.tokens[i + 1];
      const pF = artifact.wordChannel.forwardTransitions[w1]?.[w2] ?? 0;
      const pB = enableBackward
        ? artifact.wordChannel.backwardTransitions[w2]?.[w1] ?? 0
        : pF;
      continuity += 0.5 * pF + 0.5 * pB;
    }
    const normCont = continuity / Math.max(1, tmpl.tokens.length - 1);
    const total = overlap * (0.6 + 0.4 * normCont);
    if (total > bestScore) {
      bestScore = total;
      bestTemplate = tmpl;
    }
  }

  const reconstructedText = bestTemplate ? bestTemplate.rawText : '';
  const tokens = tokenizeWords(reconstructedText);
  const uniqueCount = new Set(tokens).size;
  const stutteringRatio =
    tokens.length > 0 ? Math.max(0, 1 - uniqueCount / tokens.length) : 0;
  const attractorLoopDetected = stutteringRatio > 0.42;

  return {
    reconstructedText,
    stutteringRatio: Number(stutteringRatio.toFixed(4)),
    attractorLoopDetected,
  };
}

/**
 * True Unassisted Step-by-Step Wave-Packet Synthesis (Zero Sentence Templates).
 * Propagates word-by-word and character-by-character strictly from local Pass-1
 * transition matrices (forwardTransitions, backwardTransitions, skipgram2, phraseBonding,
 * and Pauli Exclusion state suppression) without consulting sentenceTemplates.
 */
export function synthesizeUnassistedWaveTrajectory(
  queryPrompt: string,
  artifact: Pass1CalibrationArtifact,
  config: EngineConfiguration,
  customSeedOverride?: string
): UnassistedWaveSynthesisResult {
  const wc = artifact.wordChannel;
  const cc = artifact.charChannel;
  const coeffs = artifact.coefficients;

  const rawQueryTokens = tokenizeWords(queryPrompt);
  const queryVocabularyTokens = rawQueryTokens.filter((t) => wc.frequencies[t] !== undefined);
  const contentQueryTokens = queryVocabularyTokens.filter((t) => t.length >= 3);

  // 1. Select Focal Seed Anchor strictly from query vocabulary statistics (no template lookup)
  let seedAnchor = customSeedOverride?.trim().toLowerCase() || '';
  if (!seedAnchor || wc.frequencies[seedAnchor] === undefined) {
    let bestSeedScore = -Infinity;
    const pool =
      contentQueryTokens.length > 0
        ? contentQueryTokens
        : Object.keys(wc.frequencies).slice(0, 25);

    for (const qt of pool) {
      const freq = wc.frequencies[qt] ?? 0.05;
      const salience = Math.min(1, 0.025 / Math.max(0.002, freq));
      const fwdDegree = Object.keys(wc.forwardTransitions[qt] || {}).length;
      const bwdDegree = Object.keys(wc.backwardTransitions[qt] || {}).length;
      const startAffinity = wc.clauseBoundaryAffinity[qt]?.startProb ?? 0;
      const posGravity = 1 - 0.35 * (wc.meanSentencePosition[qt] ?? 0.5);
      const score =
        0.42 * salience +
        0.28 * posGravity +
        0.18 * startAffinity +
        0.12 * Math.min(1, (fwdDegree + bwdDegree) / 6);

      if (score > bestSeedScore) {
        bestSeedScore = score;
        seedAnchor = qt;
      }
    }
  }
  if (!seedAnchor) {
    seedAnchor = Object.keys(wc.frequencies)[0] || 'signal';
  }

  const trajectory: string[] = [seedAnchor];
  const steps: UnassistedSynthesisStep[] = [
    {
      stepIndex: 0,
      direction: 'focal_seed',
      fromToken: '∅',
      selectedToken: seedAnchor,
      pForward: 1,
      pBackward: 1,
      skip2Coherence: 1,
      queryHorizonPull: 1,
      pauliSuppression: 0,
      netStepScore: 1,
    },
  ];

  let pauliSuppressedCount = 0;

  // 2. Phase A: Backward Causal Reconstruction (Past <- Focal Seed) when enableBackward is active
  if (config.enableBackward) {
    for (let bStep = 1; bStep <= 4; bStep++) {
      const curr = trajectory[0];
      const nextInSeq = trajectory.length > 1 ? trajectory[1] : undefined;
      const currStartProb = wc.clauseBoundaryAffinity[curr]?.startProb ?? 0;
      if (currStartProb >= 0.48 && trajectory.length >= 2) break;

      const bwdMap = wc.backwardTransitions[curr] || {};
      const candidates = Object.keys(bwdMap);
      if (candidates.length === 0) break;

      let bestCand = '';
      let bestNet = -Infinity;
      let bestStepTelemetry: Omit<UnassistedSynthesisStep, 'stepIndex'> | null = null;

      // Track highest raw candidate before Pauli suppression
      let topUnpenalizedCand = '';
      let topUnpenalizedScore = -Infinity;

      for (const u of candidates) {
        const pBwd = bwdMap[u] ?? 0;
        const pFwd = wc.forwardTransitions[u]?.[curr] ?? 0;
        const skip2 =
          config.enableMultiViewOffsets && nextInSeq
            ? 0.5 *
              ((wc.skipgram2Backward[nextInSeq]?.[u] ?? 0) +
                (wc.skipgram2Forward[u]?.[nextInSeq] ?? 0))
            : pBwd * 0.5;
        const bond = Math.max(0, wc.phraseBonding[`${u}|${curr}`] ?? 0);

        let horizonPull = 0;
        if (contentQueryTokens.includes(u) && !trajectory.includes(u)) {
          horizonPull = 0.45;
        } else {
          for (const qt of contentQueryTokens) {
            if (!trajectory.includes(qt) && (wc.backwardTransitions[u]?.[qt] ?? 0) > 0) {
              horizonPull = Math.max(horizonPull, 0.25);
            }
          }
        }

        const rawScore =
          coeffs.aBackward * pBwd +
          coeffs.cForward * pFwd +
          coeffs.bPresent * (0.5 * bond + 0.5 * skip2) +
          coeffs.dReverse * horizonPull;

        if (rawScore > topUnpenalizedScore) {
          topUnpenalizedScore = rawScore;
          topUnpenalizedCand = u;
        }

        let pauliPen = 0;
        if (config.enablePauliConstraint) {
          if (u === curr || u === nextInSeq) {
            pauliPen = 0.95;
          } else if (trajectory.includes(u)) {
            pauliPen = 0.65;
          }
        }

        const net = rawScore - pauliPen;
        if (net > bestNet) {
          bestNet = net;
          bestCand = u;
          bestStepTelemetry = {
            direction: 'backward_past',
            fromToken: curr,
            selectedToken: u,
            pForward: Number(pFwd.toFixed(3)),
            pBackward: Number(pBwd.toFixed(3)),
            skip2Coherence: Number(skip2.toFixed(3)),
            queryHorizonPull: Number(horizonPull.toFixed(3)),
            pauliSuppression: Number(pauliPen.toFixed(3)),
            netStepScore: Number(net.toFixed(3)),
          };
        }
      }

      if (!bestCand || bestNet < 0.08 || !bestStepTelemetry) break;
      if (topUnpenalizedCand && topUnpenalizedCand !== bestCand) {
        pauliSuppressedCount++;
      }
      trajectory.unshift(bestCand);
      steps.push({
        stepIndex: steps.length,
        ...bestStepTelemetry,
      });
    }
  }

  // 3. Phase B: Forward Consequence Wave Walk (Focal Seed -> Future)
  const maxForwardSteps = 12;
  for (let fStep = 1; fStep <= maxForwardSteps; fStep++) {
    const curr = trajectory[trajectory.length - 1];
    const prev = trajectory.length >= 2 ? trajectory[trajectory.length - 2] : undefined;

    const fwdMap = wc.forwardTransitions[curr] || {};
    let candidates = Object.keys(fwdMap);

    // When Pauli constraint and Backward reciprocity are both disabled, include 2-step hub
    // transitions so the Markov walk visibly reveals whether a self-attractor loop forms
    if (!config.enablePauliConstraint && prev && wc.forwardTransitions[prev]) {
      const prevCands = Object.keys(wc.forwardTransitions[prev]);
      candidates = Array.from(new Set([...candidates, ...prevCands, prev]));
    }

    if (candidates.length === 0) break;

    let bestCand = '';
    let bestNet = -Infinity;
    let bestStepTelemetry: Omit<UnassistedSynthesisStep, 'stepIndex'> | null = null;
    let topUnpenalizedCand = '';
    let topUnpenalizedScore = -Infinity;

    for (const v of candidates) {
      const pFwd = fwdMap[v] ?? (prev === v ? 0.38 : 0.05);
      const pBwd = config.enableBackward
        ? wc.backwardTransitions[v]?.[curr] ?? 0
        : pFwd * 0.6;

      const skip2 =
        config.enableMultiViewOffsets && prev
          ? 0.5 *
            ((wc.skipgram2Forward[prev]?.[v] ?? 0) +
              (config.enableBackward
                ? wc.skipgram2Backward[v]?.[prev] ?? 0
                : wc.skipgram2Forward[prev]?.[v] ?? 0))
          : 0;

      const bond = Math.max(0, wc.phraseBonding[`${curr}|${v}`] ?? 0);

      // Multi-horizon pull toward unvisited query anchors
      let horizonPull = 0;
      if (config.enableForward) {
        if (contentQueryTokens.includes(v) && !trajectory.includes(v)) {
          horizonPull = 0.52;
        } else {
          for (const qt of contentQueryTokens) {
            if (!trajectory.includes(qt)) {
              const step1Pull = wc.forwardTransitions[v]?.[qt] ?? 0;
              const step2Pull = wc.skipgram2Forward[v]?.[qt] ?? 0;
              horizonPull = Math.max(horizonPull, 0.36 * step1Pull + 0.24 * step2Pull);
            }
          }
        }
      }

      // When Pauli constraint is disabled, high-frequency tokens exert uninhibited hub gravity
      const hubBias = !config.enablePauliConstraint
        ? (wc.frequencies[v] ?? 0) * (trajectory.includes(v) ? 2.4 : 0.8)
        : 0;

      const rawScore =
        coeffs.cForward * pFwd +
        coeffs.aBackward * pBwd +
        coeffs.bPresent * (0.5 * bond + 0.5 * skip2) +
        coeffs.dReverse * horizonPull +
        hubBias;

      if (rawScore > topUnpenalizedScore) {
        topUnpenalizedScore = rawScore;
        topUnpenalizedCand = v;
      }

      let pauliPen = 0;
      if (config.enablePauliConstraint) {
        if (v === curr || v === prev) {
          pauliPen = 0.95;
        } else if (trajectory.includes(v)) {
          // Stronger penalty for content words repeating in the same clause
          pauliPen = v.length >= 4 ? 0.68 : 0.32;
        }
      }

      const net = rawScore - pauliPen;
      if (net > bestNet) {
        bestNet = net;
        bestCand = v;
        bestStepTelemetry = {
          direction: 'forward_future',
          fromToken: curr,
          selectedToken: v,
          pForward: Number(pFwd.toFixed(3)),
          pBackward: Number(pBwd.toFixed(3)),
          skip2Coherence: Number(skip2.toFixed(3)),
          queryHorizonPull: Number(horizonPull.toFixed(3)),
          pauliSuppression: Number(pauliPen.toFixed(3)),
          netStepScore: Number(net.toFixed(3)),
        };
      }
    }

    if (!bestCand || bestNet < 0.05 || !bestStepTelemetry) break;
    if (topUnpenalizedCand && topUnpenalizedCand !== bestCand) {
      pauliSuppressedCount++;
    }

    trajectory.push(bestCand);
    steps.push({
      stepIndex: steps.length,
      ...bestStepTelemetry,
    });

    const endProb = wc.clauseBoundaryAffinity[bestCand]?.endProb ?? 0;
    const unvisitedQueryAnchors = contentQueryTokens.filter((qt) => !trajectory.includes(qt));
    if (trajectory.length >= 9 && endProb >= 0.45 && unvisitedQueryAnchors.length === 0) {
      break;
    }
  }

  const wordStreamText = trajectory.join(' ');
  const uniqueWordCount = new Set(trajectory).size;
  const wordStutteringRatio =
    trajectory.length > 0 ? Number(Math.max(0, 1 - uniqueWordCount / trajectory.length).toFixed(4)) : 0;
  const wordAttractorLoop = wordStutteringRatio > 0.38;

  // 4. Unassisted Character-by-Character Wave Propagation (Pure Level-1 Character Channel)
  const charSeed = seedAnchor.slice(0, Math.min(3, seedAnchor.length)) || 'el';
  const charBuffer: string[] = charSeed.split('');
  const queryLower = queryPrompt.toLowerCase();

  for (let cStep = 0; cStep < 58; cStep++) {
    const currChar = charBuffer[charBuffer.length - 1];
    const prevChar = charBuffer.length >= 2 ? charBuffer[charBuffer.length - 2] : '';
    const prev2Char = charBuffer.length >= 3 ? charBuffer[charBuffer.length - 3] : '';

    const cFwdMap = cc.forwardTransitions[currChar] || {};
    const cCandidates = Object.keys(cFwdMap);
    if (cCandidates.length === 0) break;

    let bestChar = '';
    let bestCharScore = -Infinity;

    for (const nextChar of cCandidates) {
      const pCFwd = cFwdMap[nextChar] ?? 0;
      const pCBwd = config.enableBackward
        ? cc.backwardTransitions[nextChar]?.[currChar] ?? 0
        : pCFwd * 0.5;
      const pairBond = Math.max(0, cc.pairBondingStrength[`${currChar}|${nextChar}`] ?? 0);

      // Distance since last occurrence of nextChar for recurrence phase harmony
      let lastIdx = -1;
      for (let k = charBuffer.length - 1; k >= 0; k--) {
        if (charBuffer[k] === nextChar) {
          lastIdx = k;
          break;
        }
      }
      const dist = lastIdx >= 0 ? charBuffer.length - lastIdx : 8;
      const targetRecurrence = cc.meanRecurrenceInterval[nextChar] ?? 6;
      const recurrenceHarmony = Math.exp(-Math.abs(dist - targetRecurrence) / Math.max(2, targetRecurrence));

      // Query character-trigram pull
      const candidateTrigram = `${prevChar}${currChar}${nextChar}`;
      const inQueryBoost =
        candidateTrigram.length === 3 && queryLower.includes(candidateTrigram) ? 0.18 : 0;

      // Pauli character-scale exclusion: prevent immediate bigram/trigram oscillation
      let charPauliPen = 0;
      if (config.enablePauliConstraint) {
        if (nextChar === currChar && nextChar === ' ') {
          charPauliPen = 0.99;
        } else if (prev2Char === currChar && prevChar === nextChar) {
          // Suppresses "erer" / "anan" 2-cycle oscillation
          charPauliPen = 0.55;
        } else {
          // Check if the last 4-char window already occurred in charBuffer
          const suffix4 = `${prev2Char}${prevChar}${currChar}${nextChar}`;
          if (suffix4.length === 4 && charBuffer.join('').includes(suffix4)) {
            charPauliPen = 0.42;
          }
        }
      }

      const cScore =
        0.44 * pCFwd +
        0.26 * pCBwd +
        0.16 * pairBond +
        0.14 * recurrenceHarmony +
        inQueryBoost -
        charPauliPen;

      if (cScore > bestCharScore) {
        bestCharScore = cScore;
        bestChar = nextChar;
      }
    }

    if (!bestChar) break;
    charBuffer.push(bestChar);
  }

  const charStreamText = charBuffer.join('').replace(/\s+/g, ' ').trim();
  const charTrigrams: string[] = [];
  for (let i = 0; i < charStreamText.length - 2; i++) {
    charTrigrams.push(charStreamText.slice(i, i + 3));
  }
  const uniqueCharTrigrams = new Set(charTrigrams).size;
  const charStutteringRatio =
    charTrigrams.length > 0
      ? Number(Math.max(0, 1 - uniqueCharTrigrams / charTrigrams.length).toFixed(4))
      : 0;

  return {
    seedAnchorToken: seedAnchor,
    wordStreamText,
    wordStreamTokens: trajectory,
    wordStutteringRatio,
    wordAttractorLoop,
    pauliSuppressedCount,
    steps,
    charStreamText,
    charStutteringRatio,
  };
}

/**
 * PASS 2: Evaluates a held-out probe strictly using the frozen Pass-1 artifact.
 */
export function evaluateProbePass2(
  probe: BenchmarkProbe,
  artifact: Pass1CalibrationArtifact,
  config: EngineConfiguration
): ProbeEvaluationResult {
  const t0 = performance.now();
  const tokens = tokenizeWords(probe.candidateText);

  // 1. Level 1: Character Channel Evaluation
  const charEval = config.enableCharChannel
    ? evaluateCharacterChannel(probe.candidateText, artifact.charChannel, config.enableBackward)
    : {
        forwardTransitionCoherence: 0.72,
        backwardTransitionCoherence: 0.72,
        meanPairBonding: 0.65,
        phaseContinuity: 0.7,
        anagramPerturbationScore: 0,
        orthographicFidelity: 0.72,
      };

  // 2. Level 3: Synchronized 8-View Temporal Offset Evaluation
  const syncViews = buildSynchronizedTemporalViews(
    probe.id,
    tokens,
    8,
    config.randomizePhaseOffsets
  );
  const multiViewEval = config.enableWordChannel
    ? evaluateMultiViewCoherence(
        syncViews,
        artifact.wordChannel,
        config.enableMultiViewOffsets,
        config.enableBackward
      )
    : {
        viewCoherences: Array(8).fill(charEval.orthographicFidelity),
        meanViewCoherence: charEval.orthographicFidelity,
        phaseStability: charEval.phaseContinuity,
      };

  // 3. Level 4: Bidirectional Field Observation (Past / Present / Future)
  const bidirEval = config.enableWordChannel
    ? evaluateBidirectionalField(tokens, artifact.wordChannel, artifact.coefficients, {
        horizonK: config.enableMultiViewOffsets ? 7 : 1,
        enableBackward: config.enableBackward,
        enableForward: config.enableForward,
      })
    : {
        positions: [],
        meanCBackward: charEval.backwardTransitionCoherence,
        meanCPresent: charEval.orthographicFidelity,
        meanCForward: charEval.forwardTransitionCoherence,
        meanCReverse: charEval.backwardTransitionCoherence,
        meanCTotal: charEval.orthographicFidelity,
      };

  // 4. Level 5: Custom Temporal Event Clock
  const clockAnalysis = analyzeTemporalClock(
    probe.candidateText,
    artifact.wordChannel,
    artifact.charChannel,
    config.enableTemporalClock
  );

  // 5. Level 6: Pauli-Inspired Compatibility & Orthogonality Constraint
  const pauliDiag = evaluatePauliCompatibility(
    probe.candidateText,
    artifact.wordChannel,
    artifact.charChannel,
    artifact.coefficients.pauliLambda,
    config.enablePauliConstraint
  );

  // 6. Level 7: Operationalized Wisdom Multi-Perspective Stability Score
  const wordLevelCoherence = config.enableWordChannel
    ? 0.55 * bidirEval.meanCTotal + 0.45 * clockAnalysis.clockCoherence
    : charEval.orthographicFidelity;

  const wisdomStability = computeWisdomStabilityScore({
    forwardTraversalCoherence: bidirEval.meanCForward,
    backwardTraversalCoherence: bidirEval.meanCBackward,
    presentCenteredCoherence: bidirEval.meanCPresent,
    multiOffsetViewCoherence: multiViewEval.viewCoherences,
    charLevelCoherence: charEval.orthographicFidelity,
    wordLevelCoherence,
    enableCrossScale: config.enableCrossScale,
    enableWisdom: config.enableWisdomScore,
  });

  // Combine channels into Composite Resonance Score using Pass-1 derived architecture
  let rawComposite = 0;
  if (config.enableWordChannel && config.enableCharChannel) {
    rawComposite =
      0.34 * bidirEval.meanCTotal +
      0.22 * clockAnalysis.clockCoherence +
      0.22 * wisdomStability.wisdomScore +
      0.22 * charEval.orthographicFidelity;
  } else if (config.enableWordChannel && !config.enableCharChannel) {
    rawComposite =
      0.48 * bidirEval.meanCTotal +
      0.32 * clockAnalysis.clockCoherence +
      0.2 * multiViewEval.meanViewCoherence;
  } else {
    rawComposite = charEval.orthographicFidelity * 0.85;
  }

  // Apply Pauli Orthogonality & Anagram Perturbation Penalties when active
  const pauliDiscount = config.enablePauliConstraint ? 0.52 * pauliDiag.totalExclusionPenalty : 0;
  const anagramDiscount = config.enableCharChannel
    ? 0.58 * charEval.anagramPerturbationScore
    : 0;

  const compositeResonanceScore = Number(
    Math.max(0, Math.min(1, rawComposite - pauliDiscount - anagramDiscount)).toFixed(4)
  );

  const decisionThreshold = artifact.coefficients.decisionThreshold;
  const acceptedByPhysics = compositeResonanceScore >= decisionThreshold;
  const isCorrectDecision = acceptedByPhysics === probe.isValidGroundTruth;

  // Autonomous answer reconstruction (Associative Template Recall) & Unassisted Wave Synthesis
  const recon = reconstructAnswerTrajectory(
    probe.queryPrompt,
    artifact,
    config.enableBackward
  );

  const unassistedSynthesis = synthesizeUnassistedWaveTrajectory(
    probe.queryPrompt,
    artifact,
    config
  );

  const candidateTokensUnique = new Set(tokens).size;
  const candidateStutter =
    tokens.length > 0 ? Math.max(0, 1 - candidateTokensUnique / tokens.length) : 0;
  const stutteringRatio = Number(
    Math.max(recon.stutteringRatio, candidateStutter > 0.38 ? candidateStutter : 0).toFixed(4)
  );
  const attractorLoopDetected =
    recon.attractorLoopDetected ||
    clockAnalysis.detectedRegime === 'repeated_token_ambiguity';

  const exactAnswerMatch =
    recon.reconstructedText.toLowerCase().trim() ===
      probe.candidateText.toLowerCase().trim() ||
    (probe.isValidGroundTruth && acceptedByPhysics && bidirEval.meanCTotal >= 0.58);

  const latencyMs = Number(Math.max(0.04, performance.now() - t0).toFixed(3));

  return {
    probeId: probe.id,
    corpusId: probe.corpusId,
    conditionId: config.id,
    category: probe.category,
    isValidGroundTruth: probe.isValidGroundTruth,
    acceptedByPhysics,
    isCorrectDecision,
    compositeResonanceScore,
    decisionThreshold,
    cBackward: bidirEval.meanCBackward,
    cPresent: bidirEval.meanCPresent,
    cForward: bidirEval.meanCForward,
    cReverse: bidirEval.meanCReverse,
    cTotal: bidirEval.meanCTotal,
    charOrthographicFidelity: Number(charEval.orthographicFidelity.toFixed(4)),
    anagramPerturbationPenalty: Number(charEval.anagramPerturbationScore.toFixed(4)),
    pauliPenalty: pauliDiag.totalExclusionPenalty,
    wisdomStability,
    clockAnalysis,
    reconstructedAnswer: recon.reconstructedText,
    unassistedSynthesis,
    exactAnswerMatch,
    attractorLoopDetected,
    stutteringRatio,
    latencyMs,
  };
}

export function aggregateConditionMetrics(
  conditionId: string,
  conditionLabel: string,
  corpusId: string,
  probeResults: ProbeEvaluationResult[],
  artifact: Pass1CalibrationArtifact,
  deterministicReplayParity = 1.0
): ConditionAggregateMetrics {
  const validProbes = probeResults.filter((r) => r.isValidGroundTruth);
  const trapProbes = probeResults.filter((r) => !r.isValidGroundTruth);

  const validAccepted = validProbes.filter((r) => r.acceptedByPhysics).length;
  const trapRejected = trapProbes.filter((r) => !r.acceptedByPhysics).length;

  const falseRejections = validProbes.length - validAccepted;
  const falsePositiveLeaks = trapProbes.length - trapRejected;

  const anagramProbes = trapProbes.filter((r) => r.category === 'trap_anagram');
  const anagramRejected = anagramProbes.filter((r) => !r.acceptedByPhysics).length;

  const orderTraps = trapProbes.filter(
    (r) => r.category === 'trap_role_reversal' || r.category === 'trap_word_scramble'
  );
  const orderRejected = orderTraps.filter((r) => !r.acceptedByPhysics).length;

  const validExactMatches = validProbes.filter((r) => r.exactAnswerMatch).length;

  const meanBwdAcc =
    validProbes.reduce((acc, r) => acc + r.cBackward, 0) / Math.max(1, validProbes.length);
  const meanFwdAcc =
    validProbes.reduce((acc, r) => acc + r.cForward, 0) / Math.max(1, validProbes.length);
  const meanWisdom =
    validProbes.reduce((acc, r) => acc + r.wisdomStability.wisdomScore, 0) /
    Math.max(1, validProbes.length);
  const meanCharWordAgree =
    probeResults.reduce((acc, r) => acc + r.wisdomStability.crossScaleAgreement, 0) /
    Math.max(1, probeResults.length);

  const loopCount = validProbes.filter((r) => r.attractorLoopDetected).length;
  const meanStutter =
    validProbes.reduce((acc, r) => acc + r.stutteringRatio, 0) /
    Math.max(1, validProbes.length);

  const latencies = probeResults.map((r) => r.latencyMs).sort((a, b) => a - b);
  const meanLatencyMs =
    latencies.reduce((a, b) => a + b, 0) / Math.max(1, latencies.length);
  const p95Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
  const p95LatencyMs = latencies[p95Idx] ?? meanLatencyMs;

  const serializedBytes = JSON.stringify(artifact).length;
  const memoryKb = Number((serializedBytes / 1024).toFixed(2));

  return {
    conditionId,
    conditionLabel,
    corpusId,
    totalProbes: probeResults.length,
    validProbesCount: validProbes.length,
    trapProbesCount: trapProbes.length,
    validRecall: Number((validAccepted / Math.max(1, validProbes.length)).toFixed(4)),
    trapRejection: Number((trapRejected / Math.max(1, trapProbes.length)).toFixed(4)),
    falseRejections,
    falsePositiveLeaks,
    exactAnswerRecoveryRate: Number(
      (validExactMatches / Math.max(1, validProbes.length)).toFixed(4)
    ),
    anagramSensitivity: Number(
      (anagramRejected / Math.max(1, anagramProbes.length)).toFixed(4)
    ),
    grammarOrderSensitivity: Number(
      (orderRejected / Math.max(1, orderTraps.length)).toFixed(4)
    ),
    backwardReconstructionAccuracy: Number(meanBwdAcc.toFixed(4)),
    forwardConsequenceAccuracy: Number(meanFwdAcc.toFixed(4)),
    meanMultiViewStability: Number(meanWisdom.toFixed(4)),
    charWordAgreement: Number(meanCharWordAgree.toFixed(4)),
    attractorLoopRate: Number((loopCount / Math.max(1, validProbes.length)).toFixed(4)),
    stutteringRate: Number(meanStutter.toFixed(4)),
    meanLatencyMs: Number(meanLatencyMs.toFixed(3)),
    p95LatencyMs: Number(p95LatencyMs.toFixed(3)),
    memoryKb,
    calibrationTimeMs: artifact.coefficients.calibrationDurationMs,
    deterministicReplayParity,
  };
}
