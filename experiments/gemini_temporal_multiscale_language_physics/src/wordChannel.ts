/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Level 2: Word-Level Channel
 * Treats words as composite language molecules.
 * Zero POS taggers, zero syntactic parsers, zero lexical dictionaries.
 */

import { WordChannelStats } from './types';

export function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u017F\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function calibrateWordChannel(rawText: string): WordChannelStats {
  const sentences = splitIntoSentences(rawText);
  const allTokens: string[] = [];

  const counts: Record<string, number> = {};
  const forwardCounts: Record<string, Record<string, number>> = {};
  const backwardCounts: Record<string, Record<string, number>> = {};
  const skip2FwdCounts: Record<string, Record<string, number>> = {};
  const skip2BwdCounts: Record<string, Record<string, number>> = {};
  const pairCounts: Record<string, number> = {};

  const posSums: Record<string, number> = {};
  const posSqSums: Record<string, number> = {};
  const startCounts: Record<string, number> = {};
  const endCounts: Record<string, number> = {};

  const lastSeen: Record<string, number> = {};
  const recurrenceSums: Record<string, number> = {};
  const recurrenceCounts: Record<string, number> = {};

  let globalIndex = 0;

  for (const sent of sentences) {
    const tokens = tokenizeWords(sent);
    if (tokens.length === 0) continue;

    for (let i = 0; i < tokens.length; i++) {
      const w = tokens[i];
      allTokens.push(w);
      counts[w] = (counts[w] || 0) + 1;

      const relPos = tokens.length > 1 ? i / (tokens.length - 1) : 0.5;
      posSums[w] = (posSums[w] || 0) + relPos;
      posSqSums[w] = (posSqSums[w] || 0) + relPos * relPos;

      if (i === 0) startCounts[w] = (startCounts[w] || 0) + 1;
      if (i === tokens.length - 1) endCounts[w] = (endCounts[w] || 0) + 1;

      if (lastSeen[w] !== undefined) {
        const delta = globalIndex - lastSeen[w];
        recurrenceSums[w] = (recurrenceSums[w] || 0) + delta;
        recurrenceCounts[w] = (recurrenceCounts[w] || 0) + 1;
      }
      lastSeen[w] = globalIndex;

      if (i + 1 < tokens.length) {
        const next = tokens[i + 1];
        if (!forwardCounts[w]) forwardCounts[w] = {};
        forwardCounts[w][next] = (forwardCounts[w][next] || 0) + 1;

        if (!backwardCounts[next]) backwardCounts[next] = {};
        backwardCounts[next][w] = (backwardCounts[next][w] || 0) + 1;

        const pairKey = `${w}|${next}`;
        pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
      }

      if (i + 2 < tokens.length) {
        const next2 = tokens[i + 2];
        if (!skip2FwdCounts[w]) skip2FwdCounts[w] = {};
        skip2FwdCounts[w][next2] = (skip2FwdCounts[w][next2] || 0) + 1;

        if (!skip2BwdCounts[next2]) skip2BwdCounts[next2] = {};
        skip2BwdCounts[next2][w] = (skip2BwdCounts[next2][w] || 0) + 1;
      }

      globalIndex++;
    }
  }

  // Also include cross-sentence boundary transitions at reduced weight so cross-sentence anaphora has a physical trace
  for (let s = 0; s < sentences.length - 1; s++) {
    const tA = tokenizeWords(sentences[s]);
    const tB = tokenizeWords(sentences[s + 1]);
    if (tA.length > 0 && tB.length > 0) {
      const lastW = tA[tA.length - 1];
      const firstW = tB[0];
      if (!forwardCounts[lastW]) forwardCounts[lastW] = {};
      forwardCounts[lastW][firstW] = (forwardCounts[lastW][firstW] || 0) + 0.5;
      if (!backwardCounts[firstW]) backwardCounts[firstW] = {};
      backwardCounts[firstW][lastW] = (backwardCounts[firstW][lastW] || 0) + 0.5;
    }
  }

  const totalWords = Math.max(1, allTokens.length);
  const frequencies: Record<string, number> = {};
  for (const [w, c] of Object.entries(counts)) {
    frequencies[w] = c / totalWords;
  }

  const normalizeTransitionMap = (
    rawMap: Record<string, Record<string, number>>
  ): Record<string, Record<string, number>> => {
    const out: Record<string, Record<string, number>> = {};
    for (const [w, targets] of Object.entries(rawMap)) {
      const sum = Object.values(targets).reduce((a, b) => a + b, 0);
      out[w] = {};
      for (const [t, cnt] of Object.entries(targets)) {
        out[w][t] = cnt / Math.max(1e-9, sum);
      }
    }
    return out;
  };

  const forwardTransitions = normalizeTransitionMap(forwardCounts);
  const backwardTransitions = normalizeTransitionMap(backwardCounts);
  const skipgram2Forward = normalizeTransitionMap(skip2FwdCounts);
  const skipgram2Backward = normalizeTransitionMap(skip2BwdCounts);

  const computeShannonEntropy = (dist: Record<string, number> | undefined): number => {
    if (!dist) return 0;
    let h = 0;
    for (const p of Object.values(dist)) {
      if (p > 0) h -= p * Math.log2(p);
    }
    return h;
  };

  const forwardContinuationEntropy: Record<string, number> = {};
  const backwardConstraintEntropy: Record<string, number> = {};
  const meanSentencePosition: Record<string, number> = {};
  const varianceSentencePosition: Record<string, number> = {};
  const meanRecurrenceInterval: Record<string, number> = {};
  const clauseBoundaryAffinity: Record<string, { startProb: number; endProb: number }> = {};

  for (const [w, c] of Object.entries(counts)) {
    forwardContinuationEntropy[w] = computeShannonEntropy(forwardTransitions[w]);
    backwardConstraintEntropy[w] = computeShannonEntropy(backwardTransitions[w]);

    const meanPos = posSums[w] / c;
    meanSentencePosition[w] = meanPos;
    varianceSentencePosition[w] = Math.max(0, posSqSums[w] / c - meanPos * meanPos);

    meanRecurrenceInterval[w] =
      recurrenceCounts[w] > 0 ? recurrenceSums[w] / recurrenceCounts[w] : totalWords;

    clauseBoundaryAffinity[w] = {
      startProb: (startCounts[w] || 0) / c,
      endProb: (endCounts[w] || 0) / c,
    };
  }

  const totalPairs = Math.max(1, Object.values(pairCounts).reduce((a, b) => a + b, 0));
  const phraseBonding: Record<string, number> = {};
  for (const [pairKey, cnt] of Object.entries(pairCounts)) {
    const [w1, w2] = pairKey.split('|');
    const p12 = cnt / totalPairs;
    const p1 = frequencies[w1] || 1 / totalWords;
    const p2 = frequencies[w2] || 1 / totalWords;
    const pmi = Math.log2(p12 / Math.max(1e-12, p1 * p2));
    const denom = -Math.log2(Math.max(1e-12, p12));
    phraseBonding[pairKey] = denom > 0 ? Math.max(-1, Math.min(1, pmi / denom)) : 0;
  }

  const sentenceTemplates = sentences.map((sent, idx) => {
    const tokens = tokenizeWords(sent);
    const phaseSignature = tokens.map((w, i) => {
      const rec = Math.max(2, meanRecurrenceInterval[w] || 10);
      return Number(((2 * Math.PI * (i % rec)) / rec).toFixed(4));
    });
    const directionalTrajectory = tokens.map((w) => {
      const hF = forwardContinuationEntropy[w] || 0;
      const hB = backwardConstraintEntropy[w] || 0;
      return Number(((hF - hB) / (hF + hB + 0.5)).toFixed(4));
    });
    return {
      sentenceIndex: idx,
      rawText: sent,
      tokens,
      charSequence: sent.toLowerCase(),
      phaseSignature,
      directionalTrajectory,
    };
  });

  return {
    totalWords,
    uniqueWords: Object.keys(counts).length,
    frequencies,
    forwardTransitions,
    backwardTransitions,
    skipgram2Forward,
    skipgram2Backward,
    meanSentencePosition,
    varianceSentencePosition,
    meanRecurrenceInterval,
    forwardContinuationEntropy,
    backwardConstraintEntropy,
    phraseBonding,
    clauseBoundaryAffinity,
    sentenceTemplates,
  };
}
