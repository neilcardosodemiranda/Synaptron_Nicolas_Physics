/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Level 4: Forward, Present, and Backward Observation & Corpus-Derived Coefficients
 * Constructs Past field x(t-k)...x(t-1), Present field x(t), Future field x(t+1)...x(t+k)
 * and computes C_total = a * C_backward + b * C_present + c * C_forward + d * C_reverse.
 * Coefficients (a, b, c, d) are derived strictly in Pass 1 from corpus mutual information.
 */

import {
  BidirectionalFieldAtPosition,
  CharacterChannelStats,
  CorpusDerivedCoefficients,
  WordChannelStats,
} from './types';

export function deriveCorpusCoefficients(
  wordStats: WordChannelStats,
  charStats: CharacterChannelStats,
  calibrationDurationMs: number
): CorpusDerivedCoefficients {
  const words = Object.keys(wordStats.frequencies);
  const maxWordEntropy = Math.max(1, Math.log2(Math.max(2, wordStats.uniqueWords)));

  let sumBwdConcentration = 0;
  let sumFwdConcentration = 0;
  let sumPresentPositionalInfo = 0;
  let sumReverseSymmetryInfo = 0;

  for (const w of words) {
    const pW = wordStats.frequencies[w] || 0;
    const hBwd = wordStats.backwardConstraintEntropy[w] || 0;
    const hFwd = wordStats.forwardContinuationEntropy[w] || 0;
    const posVar = wordStats.varianceSentencePosition[w] || 0.08;

    // Information concentration: lower conditional entropy = stronger predictive field
    const bwdInfo = Math.max(0.1, 1 - hBwd / maxWordEntropy);
    const fwdInfo = Math.max(0.1, 1 - hFwd / maxWordEntropy);
    const presInfo = Math.max(0.1, 1 - Math.min(1, posVar * 3.0));

    // Bidirectional reversibility info across outgoing transitions
    const fwdMap = wordStats.forwardTransitions[w] || {};
    let revConsistency = 0;
    for (const [nextW, pFwd] of Object.entries(fwdMap)) {
      const pBwd = wordStats.backwardTransitions[nextW]?.[w] || 0;
      revConsistency += pFwd * Math.sqrt(pFwd * pBwd);
    }

    sumBwdConcentration += pW * bwdInfo;
    sumFwdConcentration += pW * fwdInfo;
    sumPresentPositionalInfo += pW * presInfo;
    sumReverseSymmetryInfo += pW * Math.max(0.15, revConsistency);
  }

  const totalInfo =
    sumBwdConcentration +
    sumPresentPositionalInfo +
    sumFwdConcentration +
    sumReverseSymmetryInfo;

  const aBackward = Number((sumBwdConcentration / Math.max(1e-9, totalInfo)).toFixed(4));
  const bPresent = Number((sumPresentPositionalInfo / Math.max(1e-9, totalInfo)).toFixed(4));
  const cForward = Number((sumFwdConcentration / Math.max(1e-9, totalInfo)).toFixed(4));
  const dReverse = Number(
    (1 - (aBackward + bPresent + cForward)).toFixed(4)
  );

  // Derive corpus-intrinsic decision threshold from Pass-1 self-consistency across corpus sentences
  let sentenceScoreSum = 0;
  let sentenceScoreSqSum = 0;
  const nSent = Math.max(1, wordStats.sentenceTemplates.length);

  for (const sent of wordStats.sentenceTemplates) {
    let localCoherence = 0;
    const len = sent.tokens.length;
    for (let i = 0; i < len - 1; i++) {
      const w1 = sent.tokens[i];
      const w2 = sent.tokens[i + 1];
      const pF = wordStats.forwardTransitions[w1]?.[w2] ?? 0;
      const pB = wordStats.backwardTransitions[w2]?.[w1] ?? 0;
      localCoherence += 0.5 * Math.pow(pF, 0.35) + 0.5 * Math.pow(pB, 0.35);
    }
    const meanSent = len > 1 ? localCoherence / (len - 1) : 0.6;
    sentenceScoreSum += meanSent;
    sentenceScoreSqSum += meanSent * meanSent;
  }

  const meanSelfCoherence = sentenceScoreSum / nSent;
  const stdSelfCoherence = Math.sqrt(
    Math.max(0.002, sentenceScoreSqSum / nSent - meanSelfCoherence * meanSelfCoherence)
  );

  // Threshold set at corpus mean minus 2.35 standard deviations (bounded in [0.46, 0.62])
  const decisionThreshold = Number(
    Math.max(0.46, Math.min(0.62, meanSelfCoherence - 2.35 * stdSelfCoherence)).toFixed(4)
  );

  // Pauli coupling constant λ derived from average character+word bonding density
  const charBondValues = Object.values(charStats.pairBondingStrength);
  const meanCharBond =
    charBondValues.reduce((a, b) => a + Math.abs(b), 0) / Math.max(1, charBondValues.length);
  const pauliLambda = Number((0.28 + 0.25 * meanCharBond).toFixed(4));

  return {
    aBackward,
    bPresent,
    cForward,
    dReverse,
    rawMutualInformation: {
      iBackward: Number(sumBwdConcentration.toFixed(4)),
      iPresent: Number(sumPresentPositionalInfo.toFixed(4)),
      iForward: Number(sumFwdConcentration.toFixed(4)),
      iReverse: Number(sumReverseSymmetryInfo.toFixed(4)),
    },
    decisionThreshold,
    pauliLambda,
    calibrationDurationMs: Number(calibrationDurationMs.toFixed(3)),
  };
}

export function evaluateBidirectionalField(
  tokens: string[],
  wordStats: WordChannelStats,
  coeffs: CorpusDerivedCoefficients,
  options: {
    horizonK?: number;
    enableBackward?: boolean;
    enableForward?: boolean;
  } = {}
): {
  positions: BidirectionalFieldAtPosition[];
  meanCBackward: number;
  meanCPresent: number;
  meanCForward: number;
  meanCReverse: number;
  meanCTotal: number;
} {
  const horizonK = options.horizonK ?? 7;
  const enableBackward = options.enableBackward ?? true;
  const enableForward = options.enableForward ?? true;

  if (tokens.length === 0) {
    return {
      positions: [],
      meanCBackward: 0,
      meanCPresent: 0,
      meanCForward: 0,
      meanCReverse: 0,
      meanCTotal: 0,
    };
  }

  const positions: BidirectionalFieldAtPosition[] = [];
  let sumBwd = 0;
  let sumPres = 0;
  let sumFwd = 0;
  let sumRev = 0;
  let sumTot = 0;

  for (let t = 0; t < tokens.length; t++) {
    const focalToken = tokens[t];
    const pastField = tokens.slice(Math.max(0, t - horizonK), t);
    const futureField = tokens.slice(t + 1, Math.min(tokens.length, t + 1 + horizonK));

    // 1. C_present: lexical identity & sentence-position resonance at focal index t
    const freq = wordStats.frequencies[focalToken] ?? 0;
    const isKnown = freq > 0 ? 1.0 : 0.05;
    const relPos = tokens.length > 1 ? t / (tokens.length - 1) : 0.5;
    const expectedPos = wordStats.meanSentencePosition[focalToken] ?? 0.5;
    const posAlignment = Math.max(0, 1 - Math.abs(relPos - expectedPos) * 0.9);
    const cPresent = isKnown * (0.65 + 0.35 * posAlignment);

    // 2. C_backward: continuity from past field x(t-k)...x(t-1) -> x(t)
    let cBackward = 0;
    if (!enableBackward) {
      cBackward = cPresent * 0.6;
    } else if (t === 0) {
      const startAff = wordStats.clauseBoundaryAffinity[focalToken]?.startProb ?? 0.25;
      cBackward = Math.min(1, 0.55 + 0.45 * Math.pow(startAff, 0.35));
    } else {
      const prev1 = tokens[t - 1];
      const pBwd1 = wordStats.backwardTransitions[focalToken]?.[prev1] ?? 0;
      const pFwdFromPrev = wordStats.forwardTransitions[prev1]?.[focalToken] ?? 0;
      const directBwd = 0.55 * Math.pow(pBwd1, 0.35) + 0.45 * Math.pow(pFwdFromPrev, 0.35);

      let skipSupport = directBwd;
      if (t >= 2) {
        const prev2 = tokens[t - 2];
        const pSkipBwd = wordStats.skipgram2Backward[focalToken]?.[prev2] ?? 0;
        skipSupport = Math.max(directBwd, 0.7 * directBwd + 0.3 * Math.pow(pSkipBwd, 0.35));
      }

      // Check if any reversed transition exists (role reversal detection)
      const invertedTransition = wordStats.forwardTransitions[focalToken]?.[prev1] ?? 0;
      const reversalPenalty =
        directBwd === 0 && invertedTransition > 0 ? 0.04 : 1.0;

      cBackward = Math.min(1, skipSupport * reversalPenalty);
    }

    // 3. C_forward: consequence continuity from x(t) -> x(t+1)...x(t+k)
    let cForward = 0;
    if (!enableForward) {
      cForward = cPresent * 0.6;
    } else if (t === tokens.length - 1) {
      const endAff = wordStats.clauseBoundaryAffinity[focalToken]?.endProb ?? 0.25;
      cForward = Math.min(1, 0.55 + 0.45 * Math.pow(endAff, 0.35));
    } else {
      const next1 = tokens[t + 1];
      const pFwd1 = wordStats.forwardTransitions[focalToken]?.[next1] ?? 0;
      const bond = ((wordStats.phraseBonding[`${focalToken}|${next1}`] ?? -0.4) + 1) / 2;
      let directFwd = 0.75 * Math.pow(pFwd1, 0.35) + 0.25 * bond;

      if (t + 2 < tokens.length) {
        const next2 = tokens[t + 2];
        const pSkipFwd = wordStats.skipgram2Forward[focalToken]?.[next2] ?? 0;
        directFwd = Math.max(directFwd, 0.75 * directFwd + 0.25 * Math.pow(pSkipFwd, 0.35));
      }

      // Check if transition is inverted in time
      const reverseOnly = wordStats.forwardTransitions[next1]?.[focalToken] ?? 0;
      if (pFwd1 === 0 && reverseOnly > 0) {
        directFwd *= 0.08;
      }

      cForward = Math.min(1, directFwd);
    }

    // 4. C_reverse: consistency when the relation is traversed backward (harmonic agreement)
    const cReverse = enableBackward
      ? (2 * cBackward * cForward) / Math.max(1e-6, cBackward + cForward)
      : cForward;

    const cTotal =
      coeffs.aBackward * cBackward +
      coeffs.bPresent * cPresent +
      coeffs.cForward * cForward +
      coeffs.dReverse * cReverse;

    positions.push({
      focalIndex: t,
      focalToken,
      pastField,
      presentField: focalToken,
      futureField,
      cBackward: Number(cBackward.toFixed(4)),
      cPresent: Number(cPresent.toFixed(4)),
      cForward: Number(cForward.toFixed(4)),
      cReverse: Number(cReverse.toFixed(4)),
      cTotal: Number(cTotal.toFixed(4)),
    });

    sumBwd += cBackward;
    sumPres += cPresent;
    sumFwd += cForward;
    sumRev += cReverse;
    sumTot += cTotal;
  }

  const n = tokens.length;
  return {
    positions,
    meanCBackward: Number((sumBwd / n).toFixed(4)),
    meanCPresent: Number((sumPres / n).toFixed(4)),
    meanCForward: Number((sumFwd / n).toFixed(4)),
    meanCReverse: Number((sumRev / n).toFixed(4)),
    meanCTotal: Number((sumTot / n).toFixed(4)),
  };
}
