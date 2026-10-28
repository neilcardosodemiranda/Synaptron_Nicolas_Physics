/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Types for Gemini Temporal Multiscale Language Physics (Isolated Research Branch)
 * Strictly separates:
 * 1. Implemented Computation
 * 2. Physical Analogy
 * 3. Experimentally Supported Result
 * 4. Hypothesis
 */

export type EpistemologicalCategory =
  | 'implemented_computation'
  | 'physical_analogy'
  | 'experimentally_supported_result'
  | 'hypothesis';

export type ExperimentalConditionId =
  | 'A' // Ordinary forward-only sequence
  | 'B' // Forward plus backward sequence
  | 'C' // Eight temporal views (Full baseline)
  | 'D' // Eight views with no backward traversal
  | 'E' // Backward traversal with no multi-view offsets
  | 'F' // Multi-scale character and word channels
  | 'G' // Pauli-inspired compatibility constraint disabled
  | 'H' // Pauli-inspired compatibility constraint enabled
  | 'I' // Shuffled temporal order
  | 'J' // Randomized phase offsets
  | 'K' // Unrelated control corpus
  | 'L'; // Fresh-process deterministic replay

export type AblationId =
  | 'ablation_1_no_offsets'
  | 'ablation_2_no_backward'
  | 'ablation_3_no_forward_consequence'
  | 'ablation_4_no_char_channel'
  | 'ablation_5_no_word_channel'
  | 'ablation_6_no_cross_scale'
  | 'ablation_7_no_pauli'
  | 'ablation_8_no_clock'
  | 'ablation_9_no_wisdom'
  | 'ablation_10_shuffled_time';

export type TemporalClockRegime =
  | 'normal_word_order'
  | 'role_reversal'
  | 'repeated_token_ambiguity'
  | 'sentence_boundary_transition'
  | 'cross_sentence_anaphora'
  | 'valid_paraphrase'
  | 'unrelated_recombination';

export interface CharacterChannelStats {
  totalChars: number;
  uniqueChars: number;
  frequencies: Record<string, number>; // P(c)
  forwardTransitions: Record<string, Record<string, number>>; // P(c_{t+1} | c_t)
  backwardTransitions: Record<string, Record<string, number>>; // P(c_{t-1} | c_t)
  meanRecurrenceInterval: Record<string, number>; // Δτ_c
  pairBondingStrength: Record<string, number>; // B(c_i, c_j) NPMI in [-1, 1]
  wordSignatureIndex: Record<string, { charHistogram: string; exactOrder: string }>;
}

export interface WordChannelStats {
  totalWords: number;
  uniqueWords: number;
  frequencies: Record<string, number>; // P(w)
  forwardTransitions: Record<string, Record<string, number>>; // P(w_{t+1} | w_t)
  backwardTransitions: Record<string, Record<string, number>>; // P(w_{t-1} | w_t)
  skipgram2Forward: Record<string, Record<string, number>>; // P(w_{t+2} | w_t)
  skipgram2Backward: Record<string, Record<string, number>>; // P(w_{t-2} | w_t)
  meanSentencePosition: Record<string, number>; // s_pos in [0, 1]
  varianceSentencePosition: Record<string, number>;
  meanRecurrenceInterval: Record<string, number>; // Δτ_w
  forwardContinuationEntropy: Record<string, number>; // H_fwd(w)
  backwardConstraintEntropy: Record<string, number>; // H_bwd(w)
  phraseBonding: Record<string, number>; // NPMI of word pairs "w1|w2"
  clauseBoundaryAffinity: Record<string, { startProb: number; endProb: number }>;
  sentenceTemplates: Array<{
    sentenceIndex: number;
    rawText: string;
    tokens: string[];
    charSequence: string;
    phaseSignature: number[];
    directionalTrajectory: number[];
  }>;
}

export interface TemporalViewPoint {
  viewIndex: number; // k in 0..7
  originalIndex: number; // t - k
  token: string;
  phaseRad: number; // θ_k(t) = 2π((t - k) mod T) / T
  isBoundaryPadded: boolean;
}

export interface SynchronizedTemporalViews {
  sequenceId: string;
  length: number;
  views: TemporalViewPoint[][]; // 8 views (View 0 .. View 7), each aligned to original index
}

export interface BidirectionalFieldAtPosition {
  focalIndex: number;
  focalToken: string;
  pastField: string[]; // x(t-k)...x(t-1)
  presentField: string; // x(t)
  futureField: string[]; // x(t+1)...x(t+k)
  cBackward: number;
  cPresent: number;
  cForward: number;
  cReverse: number;
  cTotal: number;
}

export interface CorpusDerivedCoefficients {
  aBackward: number;
  bPresent: number;
  cForward: number;
  dReverse: number;
  rawMutualInformation: {
    iBackward: number;
    iPresent: number;
    iForward: number;
    iReverse: number;
  };
  decisionThreshold: number;
  pauliLambda: number;
  calibrationDurationMs: number;
}

export interface Pass1CalibrationArtifact {
  artifactVersion: string;
  corpusId: string;
  corpusTitle: string;
  corpusStyle: 'narrative' | 'scientific_philosophical' | 'dialogue_multilingual';
  createdAtIso: string;
  corpusHash: string;
  charChannel: CharacterChannelStats;
  wordChannel: WordChannelStats;
  coefficients: CorpusDerivedCoefficients;
}

export interface PauliStateVector {
  token: string;
  temporalCoordinate: number;
  directionalRole: number; // Asymmetry ratio (H_fwd - H_bwd) / (H_fwd + H_bwd + eps)
  phaseSignature: number;
  contextualLineageHash: number;
  scaleRatio: number; // charBonding / (wordBonding + eps)
}

export interface PauliExclusionDiagnostic {
  candidateSequence: string;
  maxStateOverlap: number; // Ω(Ψ_a, Ψ_b) in [0, 1]
  totalExclusionPenalty: number;
  conflictingPairs: Array<{
    tokenA: string;
    tokenB: string;
    posA: number;
    posB: number;
    overlap: number;
    reason: string;
  }>;
}

export interface TemporalClockAnalysisResult {
  sequence: string;
  detectedRegime: TemporalClockRegime;
  clockCoherence: number;
  forwardFlux: number;
  backwardFlux: number;
  directionalityAsymmetry: number;
  recurrenceAnomaly: number;
  boundaryPhaseJump: number;
  crossSentenceAnaphoraScore: number;
  paraphraseResonance: number;
}

export interface WisdomStabilityBreakdown {
  forwardTraversalCoherence: number;
  backwardTraversalCoherence: number;
  presentCenteredCoherence: number;
  multiOffsetViewCoherence: number[]; // length 8 for Views 0..7
  charLevelCoherence: number;
  wordLevelCoherence: number;
  crossScaleAgreement: number;
  varianceAcrossPerspectives: number;
  wisdomScore: number; // W(candidate) in [0, 1]
}

export type ProbeCategory =
  | 'valid_exact'
  | 'valid_paraphrase'
  | 'valid_anaphora'
  | 'trap_role_reversal'
  | 'trap_anagram'
  | 'trap_word_scramble'
  | 'trap_chimeric'
  | 'trap_random_noise';

export interface BenchmarkProbe {
  id: string;
  corpusId: string;
  category: ProbeCategory;
  isValidGroundTruth: boolean;
  queryPrompt: string;
  candidateText: string;
  expectedRegime: TemporalClockRegime;
  description: string;
}

export interface UnassistedSynthesisStep {
  stepIndex: number;
  direction: 'backward_past' | 'focal_seed' | 'forward_future';
  fromToken: string;
  selectedToken: string;
  pForward: number;
  pBackward: number;
  skip2Coherence: number;
  queryHorizonPull: number;
  pauliSuppression: number;
  netStepScore: number;
}

export interface UnassistedWaveSynthesisResult {
  seedAnchorToken: string;
  wordStreamText: string;
  wordStreamTokens: string[];
  wordStutteringRatio: number;
  wordAttractorLoop: boolean;
  pauliSuppressedCount: number;
  steps: UnassistedSynthesisStep[];
  charStreamText: string;
  charStutteringRatio: number;
}

export interface ProbeEvaluationResult {
  probeId: string;
  corpusId: string;
  conditionId: string;
  category: ProbeCategory;
  isValidGroundTruth: boolean;
  acceptedByPhysics: boolean;
  isCorrectDecision: boolean;
  compositeResonanceScore: number;
  decisionThreshold: number;
  cBackward: number;
  cPresent: number;
  cForward: number;
  cReverse: number;
  cTotal: number;
  charOrthographicFidelity: number;
  anagramPerturbationPenalty: number;
  pauliPenalty: number;
  wisdomStability: WisdomStabilityBreakdown;
  clockAnalysis: TemporalClockAnalysisResult;
  reconstructedAnswer: string;
  unassistedSynthesis: UnassistedWaveSynthesisResult;
  exactAnswerMatch: boolean;
  attractorLoopDetected: boolean;
  stutteringRatio: number;
  latencyMs: number;
}

export interface ConditionAggregateMetrics {
  conditionId: string;
  conditionLabel: string;
  corpusId: string;
  totalProbes: number;
  validProbesCount: number;
  trapProbesCount: number;
  validRecall: number; // [0, 1]
  trapRejection: number; // [0, 1]
  falseRejections: number;
  falsePositiveLeaks: number;
  exactAnswerRecoveryRate: number;
  anagramSensitivity: number;
  grammarOrderSensitivity: number;
  backwardReconstructionAccuracy: number;
  forwardConsequenceAccuracy: number;
  meanMultiViewStability: number;
  charWordAgreement: number;
  attractorLoopRate: number;
  stutteringRate: number;
  meanLatencyMs: number;
  p95LatencyMs: number;
  memoryKb: number;
  calibrationTimeMs: number;
  deterministicReplayParity: number; // 1.0 = 100% bit-exact
}
