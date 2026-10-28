/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Level 3: Multi-Scale Temporal Views (View 0 .. View 7)
 * Preserves the original sequence identity while changing only temporal phase
 * or observation offset k in {0, 1, 2, 3, 4, 5, 6, 7}.
 * Does NOT duplicate semantic content as eight independent facts.
 */

import { SynchronizedTemporalViews, TemporalViewPoint, WordChannelStats } from './types';

export function buildSynchronizedTemporalViews(
  sequenceId: string,
  tokens: string[],
  maxViews = 8,
  randomizePhaseOffsets = false,
  deterministicSeed = 42
): SynchronizedTemporalViews {
  const length = tokens.length;
  const views: TemporalViewPoint[][] = [];

  for (let k = 0; k < maxViews; k++) {
    // Under Condition J (Randomized phase offsets), scramble the delay offset deterministically
    const effectiveDelay = randomizePhaseOffsets
      ? ((k * 5 + deterministicSeed) % 13) + 1
      : k;

    const viewPoints: TemporalViewPoint[] = [];
    for (let t = 0; t < length; t++) {
      const delayedIdx = t - effectiveDelay;
      const isBoundaryPadded = delayedIdx < 0;
      const clampedIdx = isBoundaryPadded ? 0 : delayedIdx;
      const token = tokens[clampedIdx] ?? '';
      const period = Math.max(1, length);
      const rawPhasePos = ((t - effectiveDelay) % period + period) % period;
      const phaseRad = (2 * Math.PI * rawPhasePos) / period;

      viewPoints.push({
        viewIndex: k,
        originalIndex: delayedIdx,
        token,
        phaseRad: Number(phaseRad.toFixed(4)),
        isBoundaryPadded,
      });
    }
    views.push(viewPoints);
  }

  return {
    sequenceId,
    length,
    views,
  };
}

/**
 * Evaluates cross-view phase-locked coherence across Views 0..7 for a candidate sequence.
 * View 0 is the reference frame; View k (k = 1..7) tests whether token x(t) maintains
 * empirically supported lag-k transition/skip-gram coherence with x(t - k).
 */
export function evaluateMultiViewCoherence(
  syncViews: SynchronizedTemporalViews,
  wordStats: WordChannelStats,
  enableMultiViewOffsets = true,
  enableBackward = true
): {
  viewCoherences: number[];
  meanViewCoherence: number;
  phaseStability: number;
} {
  const numViews = enableMultiViewOffsets ? syncViews.views.length : 1;
  const view0 = syncViews.views[0] || [];
  const length = view0.length;

  if (length <= 1) {
    return {
      viewCoherences: Array(syncViews.views.length).fill(0),
      meanViewCoherence: 0,
      phaseStability: 0,
    };
  }

  const viewCoherences: number[] = [];

  for (let k = 0; k < syncViews.views.length; k++) {
    if (!enableMultiViewOffsets && k > 0) {
      viewCoherences.push(viewCoherences[0]);
      continue;
    }

    const currentView = syncViews.views[k];
    let scoreSum = 0;
    let validPairs = 0;

    for (let t = 0; t < length; t++) {
      const presentToken = view0[t].token;
      const delayedPoint = currentView[t];

      if (k === 0) {
        // View 0: immediate local coherence at t -> t+1
        if (t + 1 < length) {
          const nextToken = view0[t + 1].token;
          const pFwd = wordStats.forwardTransitions[presentToken]?.[nextToken] ?? 0;
          const pBwd = enableBackward
            ? wordStats.backwardTransitions[nextToken]?.[presentToken] ?? 0
            : pFwd;
          const bond = ((wordStats.phraseBonding[`${presentToken}|${nextToken}`] ?? -0.4) + 1) / 2;
          scoreSum += 0.45 * Math.pow(pFwd, 0.4) + 0.35 * Math.pow(pBwd, 0.4) + 0.2 * bond;
          validPairs++;
        }
      } else if (!delayedPoint.isBoundaryPadded) {
        const lagToken = delayedPoint.token;
        // Check lag-k causal coupling between lagToken at (t-k) and presentToken at t
        let coupling = 0;
        if (k === 1) {
          const pFwd = wordStats.forwardTransitions[lagToken]?.[presentToken] ?? 0;
          const pBwd = enableBackward
            ? wordStats.backwardTransitions[presentToken]?.[lagToken] ?? 0
            : pFwd;
          coupling = 0.55 * Math.pow(pFwd, 0.4) + 0.45 * Math.pow(pBwd, 0.4);
        } else if (k === 2) {
          const pSkipFwd = wordStats.skipgram2Forward[lagToken]?.[presentToken] ?? 0;
          const pSkipBwd = enableBackward
            ? wordStats.skipgram2Backward[presentToken]?.[lagToken] ?? 0
            : pSkipFwd;
          coupling = 0.55 * Math.pow(pSkipFwd, 0.4) + 0.45 * Math.pow(pSkipBwd, 0.4);
        } else {
          // For larger offsets k in 3..7, measure sentence-template horizon co-occurrence & positional ordering
          let horizonMatch = 0;
          for (const tmpl of wordStats.sentenceTemplates) {
            const idxLag = tmpl.tokens.indexOf(lagToken);
            const idxPres = tmpl.tokens.indexOf(presentToken);
            if (idxLag !== -1 && idxPres !== -1) {
              const dist = idxPres - idxLag;
              if (dist > 0 && Math.abs(dist - k) <= 2) {
                horizonMatch = Math.max(horizonMatch, 1 - Math.abs(dist - k) * 0.25);
              } else if (enableBackward && dist < 0) {
                // Inverted order penalty
                horizonMatch = Math.max(horizonMatch, 0.05);
              }
            }
          }
          coupling = horizonMatch;
        }
        scoreSum += coupling;
        validPairs++;
      }
    }

    const viewScore = validPairs > 0 ? Math.min(1, scoreSum / validPairs) : 0;
    viewCoherences.push(Number(viewScore.toFixed(4)));
  }

  const activeScores = viewCoherences.slice(0, numViews);
  const meanViewCoherence =
    activeScores.reduce((a, b) => a + b, 0) / Math.max(1, activeScores.length);

  const variance =
    activeScores.reduce((acc, v) => acc + Math.pow(v - meanViewCoherence, 2), 0) /
    Math.max(1, activeScores.length);
  const phaseStability = Math.max(0, Math.min(1, 1 - Math.sqrt(variance) * 1.5));

  return {
    viewCoherences,
    meanViewCoherence: Number(meanViewCoherence.toFixed(4)),
    phaseStability: Number(phaseStability.toFixed(4)),
  };
}
