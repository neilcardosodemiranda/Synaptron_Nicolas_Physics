/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Level 5: Custom Deterministic Temporal Event Clock
 * Uses sequence position, recurrence interval, and phase offset to distinguish:
 * - normal_word_order
 * - role_reversal
 * - repeated_token_ambiguity
 * - sentence_boundary_transition
 * - cross_sentence_anaphora
 * - valid_paraphrase
 * - unrelated_recombination
 */

import {
  CharacterChannelStats,
  TemporalClockAnalysisResult,
  TemporalClockRegime,
  WordChannelStats,
} from './types';
import { tokenizeWords } from './wordChannel';

export function analyzeTemporalClock(
  candidateText: string,
  wordStats: WordChannelStats,
  charStats: CharacterChannelStats,
  enableClock = true
): TemporalClockAnalysisResult {
  const tokens = tokenizeWords(candidateText);
  const n = tokens.length;

  if (n < 2) {
    return {
      sequence: candidateText,
      detectedRegime: 'unrelated_recombination',
      clockCoherence: 0,
      forwardFlux: 0,
      backwardFlux: 0,
      directionalityAsymmetry: 0,
      recurrenceAnomaly: 1,
      boundaryPhaseJump: 0,
      crossSentenceAnaphoraScore: 0,
      paraphraseResonance: 0,
    };
  }

  // 1. Measure Forward Flux vs Reverse-Order Flux
  let forwardHits = 0;
  let reverseOrderHits = 0;
  let skipgramHits = 0;
  let boundaryPhaseJump = 0;

  for (let i = 0; i < n - 1; i++) {
    const w1 = tokens[i];
    const w2 = tokens[i + 1];

    const pFwd = wordStats.forwardTransitions[w1]?.[w2] ?? 0;
    const pRevOrder = wordStats.forwardTransitions[w2]?.[w1] ?? 0;

    if (pFwd > 0) forwardHits += Math.min(1, Math.pow(pFwd, 0.35));
    if (pRevOrder > 0 && pFwd === 0) reverseOrderHits += 1;

    if (i + 2 < n) {
      const w3 = tokens[i + 2];
      const pSkip = wordStats.skipgram2Forward[w1]?.[w3] ?? 0;
      if (pSkip > 0) skipgramHits += 1;
      if (wordStats.forwardTransitions[w3]?.[w1] > 0 && pSkip === 0) {
        reverseOrderHits += 0.6;
      }
    }

    // Sentence-boundary phase jump: end-of-sentence token immediately followed by start-of-sentence token
    const endProb = wordStats.clauseBoundaryAffinity[w1]?.endProb ?? 0;
    const startProb = wordStats.clauseBoundaryAffinity[w2]?.startProb ?? 0;
    if (endProb > 0.45 && startProb > 0.45) {
      boundaryPhaseJump += 1;
    }
  }

  // Also check macro-scale positional monotonicity across sentence templates
  let invertedPairCount = 0;
  let alignedPairCount = 0;
  for (const tmpl of wordStats.sentenceTemplates) {
    const matchedIndices: number[] = [];
    for (const tok of tokens) {
      const idx = tmpl.tokens.indexOf(tok);
      if (idx !== -1) matchedIndices.push(idx);
    }
    if (matchedIndices.length >= 4) {
      for (let a = 0; a < matchedIndices.length - 1; a++) {
        if (matchedIndices[a] < matchedIndices[a + 1]) alignedPairCount++;
        else if (matchedIndices[a] > matchedIndices[a + 1]) invertedPairCount++;
      }
    }
  }

  const forwardFlux = forwardHits / (n - 1);
  const backwardFlux = reverseOrderHits / (n - 1);

  const directionalityAsymmetry =
    alignedPairCount + invertedPairCount > 0
      ? (alignedPairCount - invertedPairCount) / (alignedPairCount + invertedPairCount)
      : forwardFlux - backwardFlux;

  // 2. Recurrence Interval Anomaly (detects repeated-token ambiguity / stuttering)
  const seenPositions: Record<string, number[]> = {};
  let shortRecurrenceViolations = 0;
  for (let i = 0; i < n; i++) {
    const w = tokens[i];
    if (!seenPositions[w]) seenPositions[w] = [];
    const prevList = seenPositions[w];
    if (prevList.length > 0) {
      const observedDelta = i - prevList[prevList.length - 1];
      const corpusDelta = wordStats.meanRecurrenceInterval[w] ?? 20;
      if (observedDelta <= 3 && corpusDelta > 6) {
        shortRecurrenceViolations += 1;
      }
    }
    prevList.push(i);
  }
  const recurrenceAnomaly = Math.min(1, shortRecurrenceViolations / Math.max(1, n * 0.2));

  // 3. Cross-Sentence Anaphora & Multi-Template Bridge Score
  // Checks how strongly the candidate bridges two distinct consecutive corpus sentences
  let bestSingleTemplateCoverage = 0;
  let exactTemplateMatch = false;
  const templateOverlaps: Array<{ index: number; ratio: number }> = [];

  for (const tmpl of wordStats.sentenceTemplates) {
    const setTmpl = new Set(tmpl.tokens);
    let hits = 0;
    for (const t of tokens) {
      if (setTmpl.has(t)) hits++;
    }
    const ratio = hits / n;
    if (ratio > bestSingleTemplateCoverage) {
      bestSingleTemplateCoverage = ratio;
    }
    if (tmpl.tokens.join(' ') === tokens.join(' ')) {
      exactTemplateMatch = true;
    }
    if (ratio >= 0.25) {
      templateOverlaps.push({ index: tmpl.sentenceIndex, ratio });
    }
  }

  let crossSentenceAnaphoraScore = 0;
  if (templateOverlaps.length >= 2 && !exactTemplateMatch) {
    // Check if the top two overlapping templates are temporally ordered in the corpus
    const sorted = [...templateOverlaps].sort((a, b) => b.ratio - a.ratio);
    const firstPartTokens = tokens.slice(0, Math.floor(n / 2));
    const secondPartTokens = tokens.slice(Math.floor(n / 2));

    const tmplA = wordStats.sentenceTemplates[sorted[0].index];
    const tmplB = wordStats.sentenceTemplates[sorted[1].index];

    if (tmplA && tmplB) {
      const aInFirst = firstPartTokens.filter((t) => tmplA.tokens.includes(t)).length;
      const bInSecond = secondPartTokens.filter((t) => tmplB.tokens.includes(t)).length;
      const bInFirst = firstPartTokens.filter((t) => tmplB.tokens.includes(t)).length;
      const aInSecond = secondPartTokens.filter((t) => tmplA.tokens.includes(t)).length;

      const directionalBridge = Math.max(aInFirst + bInSecond, bInFirst + aInSecond) / n;
      if (Math.abs(tmplA.sentenceIndex - tmplB.sentenceIndex) <= 3 && forwardFlux >= 0.55) {
        crossSentenceAnaphoraScore = Number(Math.min(1, directionalBridge * 1.25).toFixed(4));
      }
    }
  }

  // 4. Paraphrase Resonance: high forward flux + monotonic template alignment, but not bit-identical to template
  const paraphraseResonance =
    !exactTemplateMatch &&
    bestSingleTemplateCoverage >= 0.78 &&
    directionalityAsymmetry >= 0.5 &&
    forwardFlux >= 0.65
      ? Number((0.5 * bestSingleTemplateCoverage + 0.5 * forwardFlux).toFixed(4))
      : 0;

  // 5. Deterministic Regime Classification
  let detectedRegime: TemporalClockRegime = 'normal_word_order';
  if (recurrenceAnomaly >= 0.45) {
    detectedRegime = 'repeated_token_ambiguity';
  } else if (directionalityAsymmetry < 0.15 && bestSingleTemplateCoverage >= 0.6) {
    detectedRegime = 'role_reversal';
  } else if (crossSentenceAnaphoraScore >= 0.65 && forwardFlux >= 0.6) {
    detectedRegime = 'cross_sentence_anaphora';
  } else if (paraphraseResonance >= 0.68) {
    detectedRegime = 'valid_paraphrase';
  } else if (boundaryPhaseJump >= 1 && forwardFlux >= 0.6) {
    detectedRegime = 'sentence_boundary_transition';
  } else if (exactTemplateMatch || (forwardFlux >= 0.72 && directionalityAsymmetry >= 0.55)) {
    detectedRegime = 'normal_word_order';
  } else {
    detectedRegime = 'unrelated_recombination';
  }

  // Compute unified Clock Coherence score in [0, 1]
  let rawClockCoherence =
    0.45 * forwardFlux +
    0.35 * Math.max(0, directionalityAsymmetry) +
    0.2 * bestSingleTemplateCoverage;

  if (recurrenceAnomaly >= 0.35) {
    rawClockCoherence *= 1 - 0.8 * recurrenceAnomaly;
  }
  if (detectedRegime === 'role_reversal') {
    rawClockCoherence *= 0.22;
  } else if (detectedRegime === 'unrelated_recombination') {
    rawClockCoherence *= 0.35;
  }

  const clockCoherence = enableClock
    ? Number(Math.max(0, Math.min(1, rawClockCoherence)).toFixed(4))
    : Number(Math.max(0, Math.min(1, forwardFlux)).toFixed(4));

  return {
    sequence: candidateText,
    detectedRegime,
    clockCoherence,
    forwardFlux: Number(forwardFlux.toFixed(4)),
    backwardFlux: Number(backwardFlux.toFixed(4)),
    directionalityAsymmetry: Number(directionalityAsymmetry.toFixed(4)),
    recurrenceAnomaly: Number(recurrenceAnomaly.toFixed(4)),
    boundaryPhaseJump: Number(boundaryPhaseJump.toFixed(4)),
    crossSentenceAnaphoraScore: Number(crossSentenceAnaphoraScore.toFixed(4)),
    paraphraseResonance: Number(paraphraseResonance.toFixed(4)),
  };
}
