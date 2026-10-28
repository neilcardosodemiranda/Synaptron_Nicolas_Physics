/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Level 1: Character-Level Channel
 * Treats characters (including case and punctuation) as elementary language units.
 * Zero dictionaries, zero spellcheckers, zero hand-authored orthographic rules.
 */

import { CharacterChannelStats } from './types';

export function calibrateCharacterChannel(rawText: string): CharacterChannelStats {
  const chars = Array.from(rawText);
  const totalChars = Math.max(1, chars.length);

  const counts: Record<string, number> = {};
  const forwardCounts: Record<string, Record<string, number>> = {};
  const backwardCounts: Record<string, Record<string, number>> = {};
  const pairCounts: Record<string, number> = {};
  const lastSeen: Record<string, number> = {};
  const recurrenceSums: Record<string, number> = {};
  const recurrenceCounts: Record<string, number> = {};

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    counts[c] = (counts[c] || 0) + 1;

    if (lastSeen[c] !== undefined) {
      const delta = i - lastSeen[c];
      recurrenceSums[c] = (recurrenceSums[c] || 0) + delta;
      recurrenceCounts[c] = (recurrenceCounts[c] || 0) + 1;
    }
    lastSeen[c] = i;

    if (i + 1 < chars.length) {
      const next = chars[i + 1];
      if (!forwardCounts[c]) forwardCounts[c] = {};
      forwardCounts[c][next] = (forwardCounts[c][next] || 0) + 1;

      if (!backwardCounts[next]) backwardCounts[next] = {};
      backwardCounts[next][c] = (backwardCounts[next][c] || 0) + 1;

      const pairKey = `${c}|${next}`;
      pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
    }
  }

  const frequencies: Record<string, number> = {};
  for (const [c, count] of Object.entries(counts)) {
    frequencies[c] = count / totalChars;
  }

  const forwardTransitions: Record<string, Record<string, number>> = {};
  for (const [c, nextMap] of Object.entries(forwardCounts)) {
    const rowSum = Object.values(nextMap).reduce((a, b) => a + b, 0);
    forwardTransitions[c] = {};
    for (const [next, cnt] of Object.entries(nextMap)) {
      forwardTransitions[c][next] = cnt / Math.max(1, rowSum);
    }
  }

  const backwardTransitions: Record<string, Record<string, number>> = {};
  for (const [c, prevMap] of Object.entries(backwardCounts)) {
    const rowSum = Object.values(prevMap).reduce((a, b) => a + b, 0);
    backwardTransitions[c] = {};
    for (const [prev, cnt] of Object.entries(prevMap)) {
      backwardTransitions[c][prev] = cnt / Math.max(1, rowSum);
    }
  }

  const meanRecurrenceInterval: Record<string, number> = {};
  for (const c of Object.keys(counts)) {
    meanRecurrenceInterval[c] =
      recurrenceCounts[c] > 0 ? recurrenceSums[c] / recurrenceCounts[c] : totalChars;
  }

  // Normalized Pointwise Mutual Information (NPMI) for character-pair bonding
  const totalPairs = Math.max(1, chars.length - 1);
  const pairBondingStrength: Record<string, number> = {};
  for (const [pairKey, pairCnt] of Object.entries(pairCounts)) {
    const [c1, c2] = pairKey.split('|');
    const p12 = pairCnt / totalPairs;
    const p1 = frequencies[c1] || 1 / totalChars;
    const p2 = frequencies[c2] || 1 / totalChars;
    const pmi = Math.log2(p12 / Math.max(1e-12, p1 * p2));
    const negLogP12 = -Math.log2(Math.max(1e-12, p12));
    pairBondingStrength[pairKey] = negLogP12 > 0 ? Math.max(-1, Math.min(1, pmi / negLogP12)) : 0;
  }

  // Build purely statistical character-bag to directional-order index from observed words
  const wordSignatureIndex: Record<string, { charHistogram: string; exactOrder: string }> = {};
  const rawTokens = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u017F\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const tok of rawTokens) {
    if (tok.length >= 3) {
      const sortedSig = Array.from(tok).sort().join('');
      wordSignatureIndex[sortedSig] = {
        charHistogram: sortedSig,
        exactOrder: tok,
      };
    }
  }

  return {
    totalChars,
    uniqueChars: Object.keys(counts).length,
    frequencies,
    forwardTransitions,
    backwardTransitions,
    meanRecurrenceInterval,
    pairBondingStrength,
    wordSignatureIndex,
  };
}

export interface CharacterSequenceEvaluation {
  forwardTransitionCoherence: number;
  backwardTransitionCoherence: number;
  meanPairBonding: number;
  phaseContinuity: number;
  anagramPerturbationScore: number; // 0 = clean, >0 = anagram/transposition detected
  orthographicFidelity: number; // [0, 1]
}

export function evaluateCharacterChannel(
  candidateText: string,
  stats: CharacterChannelStats,
  enableBackward = true
): CharacterSequenceEvaluation {
  const chars = Array.from(candidateText);
  if (chars.length < 2) {
    return {
      forwardTransitionCoherence: 0,
      backwardTransitionCoherence: 0,
      meanPairBonding: 0,
      phaseContinuity: 0,
      anagramPerturbationScore: 0,
      orthographicFidelity: 0,
    };
  }

  let fwdSum = 0;
  let bwdSum = 0;
  let bondSum = 0;
  let phaseSum = 0;
  const nPairs = chars.length - 1;

  for (let i = 0; i < nPairs; i++) {
    const c1 = chars[i];
    const c2 = chars[i + 1];

    const pFwd = stats.forwardTransitions[c1]?.[c2] ?? 0;
    const pBwd = stats.backwardTransitions[c2]?.[c1] ?? 0;
    const bond = stats.pairBondingStrength[`${c1}|${c2}`] ?? -0.5;

    fwdSum += pFwd > 0 ? Math.min(1, Math.pow(pFwd, 0.35)) : 0;
    bwdSum += pBwd > 0 ? Math.min(1, Math.pow(pBwd, 0.35)) : 0;
    bondSum += (bond + 1) / 2; // normalize [-1,1] to [0,1]

    // Character phase θ_c(i) = 2π (i mod Δτ_c) / Δτ_c
    const rec1 = Math.max(2, stats.meanRecurrenceInterval[c1] || 12);
    const rec2 = Math.max(2, stats.meanRecurrenceInterval[c2] || 12);
    const theta1 = (2 * Math.PI * (i % rec1)) / rec1;
    const theta2 = (2 * Math.PI * ((i + 1) % rec2)) / rec2;
    const phaseDiff = Math.abs(Math.cos(theta2 - theta1));
    phaseSum += phaseDiff;
  }

  const forwardTransitionCoherence = fwdSum / nPairs;
  const backwardTransitionCoherence = enableBackward ? bwdSum / nPairs : forwardTransitionCoherence;
  const meanPairBonding = bondSum / nPairs;
  const phaseContinuity = phaseSum / nPairs;

  // Anagram & Orthographic Perturbation Response:
  // Detect words that have identical character frequency histograms (same sorted characters)
  // to an observed corpus molecule, yet diverge in directional character transitions.
  const tokens = candidateText
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u017F\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4);

  let anagramViolations = 0;
  for (const tok of tokens) {
    const sortedSig = Array.from(tok).sort().join('');
    const known = stats.wordSignatureIndex[sortedSig];
    if (known && known.exactOrder !== tok) {
      anagramViolations += 1;
    } else if (!known) {
      // Check internal character bigram transitions within token
      let zeroTransitions = 0;
      for (let k = 0; k < tok.length - 1; k++) {
        const p = stats.forwardTransitions[tok[k]]?.[tok[k + 1]] ?? 0;
        if (p === 0) zeroTransitions++;
      }
      if (zeroTransitions / Math.max(1, tok.length - 1) > 0.45) {
        anagramViolations += 0.6;
      }
    }
  }

  const anagramPerturbationScore =
    tokens.length > 0 ? Math.min(1, anagramViolations / Math.max(1, tokens.length * 0.35)) : 0;

  const rawFidelity =
    0.35 * forwardTransitionCoherence +
    0.35 * backwardTransitionCoherence +
    0.2 * meanPairBonding +
    0.1 * phaseContinuity;

  const orthographicFidelity = Math.max(
    0,
    Math.min(1, rawFidelity * (1 - 0.85 * anagramPerturbationScore))
  );

  return {
    forwardTransitionCoherence,
    backwardTransitionCoherence,
    meanPairBonding,
    phaseContinuity,
    anagramPerturbationScore,
    orthographicFidelity,
  };
}
