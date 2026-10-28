/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Level 6: Pauli-Exclusion-Inspired Compatibility & Orthogonality Constraint
 *
 * SCIENTIFIC DISTINCTION:
 * - Implemented Computation: State-vector orthogonality & lineage-conflict penalty across
 *   5 coordinates (temporal coordinate, directional role, phase signature, contextual lineage,
 *   and word/character scale).
 * - Physical Analogy: Inspired by the Pauli exclusion principle preventing incompatible
 *   fermionic states from occupying the same quantum state. Language tokens do NOT literally
 *   obey quantum fermionic statistics.
 */

import {
  CharacterChannelStats,
  PauliExclusionDiagnostic,
  PauliStateVector,
  WordChannelStats,
} from './types';
import { tokenizeWords } from './wordChannel';

export function evaluatePauliCompatibility(
  candidateText: string,
  wordStats: WordChannelStats,
  charStats: CharacterChannelStats,
  pauliLambda = 0.35,
  enabled = true
): PauliExclusionDiagnostic {
  const tokens = tokenizeWords(candidateText);
  if (!enabled || tokens.length < 2) {
    return {
      candidateSequence: candidateText,
      maxStateOverlap: 0,
      totalExclusionPenalty: 0,
      conflictingPairs: [],
    };
  }

  // Construct 5D representational state vector Ψ_i for each token position
  const states: PauliStateVector[] = tokens.map((w, idx) => {
    const hFwd = wordStats.forwardContinuationEntropy[w] ?? 0;
    const hBwd = wordStats.backwardConstraintEntropy[w] ?? 0;
    const directionalRole = (hFwd - hBwd) / (hFwd + hBwd + 0.25);

    const rec = Math.max(2, wordStats.meanRecurrenceInterval[w] ?? 10);
    const phaseSignature = (2 * Math.PI * (idx % rec)) / rec;

    // Identify primary contextual lineage (which corpus sentence templates contain w)
    let lineageMask = 0;
    for (const tmpl of wordStats.sentenceTemplates) {
      if (tmpl.tokens.includes(w)) {
        lineageMask |= 1 << (tmpl.sentenceIndex % 16);
      }
    }

    // Word/character scale ratio
    let charBond = 0;
    if (w.length >= 2) {
      for (let c = 0; c < w.length - 1; c++) {
        charBond += (charStats.pairBondingStrength[`${w[c]}|${w[c + 1]}`] ?? 0) + 1;
      }
      charBond /= 2 * (w.length - 1);
    }
    const nextW = tokens[idx + 1] ?? w;
    const wordBond = ((wordStats.phraseBonding[`${w}|${nextW}`] ?? -0.5) + 1) / 2;
    const scaleRatio = charBond / Math.max(0.15, wordBond + 0.15);

    return {
      token: w,
      temporalCoordinate: tokens.length > 1 ? idx / (tokens.length - 1) : 0.5,
      directionalRole: Number(directionalRole.toFixed(4)),
      phaseSignature: Number(phaseSignature.toFixed(4)),
      contextualLineageHash: lineageMask,
      scaleRatio: Number(scaleRatio.toFixed(4)),
    };
  });

  const conflictingPairs: PauliExclusionDiagnostic['conflictingPairs'] = [];
  let maxStateOverlap = 0;
  let rawPenaltySum = 0;

  for (let i = 0; i < states.length - 1; i++) {
    const sA = states[i];
    const sB = states[i + 1];

    // 1. Degenerate identical state collision (adjacent or near-adjacent identical content words)
    if (sA.token === sB.token && sA.token.length > 2) {
      const overlap = 0.95;
      maxStateOverlap = Math.max(maxStateOverlap, overlap);
      rawPenaltySum += overlap;
      conflictingPairs.push({
        tokenA: sA.token,
        tokenB: sB.token,
        posA: i,
        posB: i + 1,
        overlap,
        reason: 'Identical token occupying adjacent temporal phase coordinate',
      });
      continue;
    }

    // 2. Directional role inversion collision:
    // Both sA and sB exist in the same corpus sentence template, but in inverted causal order
    const fwdProb = wordStats.forwardTransitions[sA.token]?.[sB.token] ?? 0;
    const revProb = wordStats.forwardTransitions[sB.token]?.[sA.token] ?? 0;
    const revSkip = wordStats.skipgram2Forward[sB.token]?.[sA.token] ?? 0;

    if (fwdProb === 0 && (revProb > 0 || revSkip > 0)) {
      const overlap = 0.85;
      maxStateOverlap = Math.max(maxStateOverlap, overlap);
      rawPenaltySum += overlap;
      conflictingPairs.push({
        tokenA: sA.token,
        tokenB: sB.token,
        posA: i,
        posB: i + 1,
        overlap,
        reason: 'Inverted directional role relative to calibrated forward trajectory',
      });
      continue;
    }

    // 3. Contextual lineage exclusion (chimeric recombination):
    // Two content tokens (low frequency / high specificity) with disjoint contextual lineages
    // placed in direct transition with zero observed bonding
    const freqA = wordStats.frequencies[sA.token] ?? 0;
    const freqB = wordStats.frequencies[sB.token] ?? 0;
    const sharedLineage = sA.contextualLineageHash & sB.contextualLineageHash;

    if (
      sA.contextualLineageHash > 0 &&
      sB.contextualLineageHash > 0 &&
      sharedLineage === 0 &&
      fwdProb === 0 &&
      freqA < 0.045 &&
      freqB < 0.045
    ) {
      const overlap = 0.72;
      maxStateOverlap = Math.max(maxStateOverlap, overlap);
      rawPenaltySum += overlap;
      conflictingPairs.push({
        tokenA: sA.token,
        tokenB: sB.token,
        posA: i,
        posB: i + 1,
        overlap,
        reason: 'Incompatible contextual lineage collision (chimeric state occupation)',
      });
    }
  }

  // Also check medium-range role inversion across window [i, i+4]
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 2; j < Math.min(states.length, i + 5); j++) {
      const wA = states[i].token;
      const wB = states[j].token;
      if (wA === wB && wA.length >= 5) {
        const corpusRec = wordStats.meanRecurrenceInterval[wA] ?? 20;
        if (corpusRec > 8) {
          const overlap = 0.68;
          maxStateOverlap = Math.max(maxStateOverlap, overlap);
          rawPenaltySum += overlap * 0.6;
          conflictingPairs.push({
            tokenA: wA,
            tokenB: wB,
            posA: i,
            posB: j,
            overlap,
            reason: 'Premature phase-space state re-occupation within exclusion horizon',
          });
        }
      }
    }
  }

  const normalizedPenalty = Math.min(
    1,
    (pauliLambda * rawPenaltySum) / Math.max(1, (states.length - 1) * 0.22)
  );

  return {
    candidateSequence: candidateText,
    maxStateOverlap: Number(maxStateOverlap.toFixed(4)),
    totalExclusionPenalty: Number(normalizedPenalty.toFixed(4)),
    conflictingPairs,
  };
}
