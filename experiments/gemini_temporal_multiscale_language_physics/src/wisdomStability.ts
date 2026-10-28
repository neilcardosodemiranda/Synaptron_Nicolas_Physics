/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Level 7: Perspective & Wisdom Hypothesis (Operationalized Multi-View Stability Score)
 * Defines Wisdom W(candidate) in [0, 1] as mathematical agreement across:
 * 1. Forward traversal
 * 2. Backward traversal
 * 3. Present-centered traversal
 * 4. All available temporal offsets (Views 0..7)
 * 5. Character-level observation
 * 6. Word-level observation
 */

import { WisdomStabilityBreakdown } from './types';

export function computeWisdomStabilityScore(params: {
  forwardTraversalCoherence: number;
  backwardTraversalCoherence: number;
  presentCenteredCoherence: number;
  multiOffsetViewCoherence: number[]; // length 8
  charLevelCoherence: number;
  wordLevelCoherence: number;
  enableCrossScale?: boolean;
  enableWisdom?: boolean;
}): WisdomStabilityBreakdown {
  const {
    forwardTraversalCoherence,
    backwardTraversalCoherence,
    presentCenteredCoherence,
    multiOffsetViewCoherence,
    charLevelCoherence,
    wordLevelCoherence,
    enableCrossScale = true,
    enableWisdom = true,
  } = params;

  const meanOffsetCoherence =
    multiOffsetViewCoherence.length > 0
      ? multiOffsetViewCoherence.reduce((a, b) => a + b, 0) / multiOffsetViewCoherence.length
      : 0;

  // Cross-scale agreement between character-level orthographic fidelity and word-level trajectory
  const crossScaleAgreement = enableCrossScale
    ? Math.max(0, 1 - Math.abs(charLevelCoherence - wordLevelCoherence))
    : 0.75;

  const perspectives = [
    forwardTraversalCoherence,
    backwardTraversalCoherence,
    presentCenteredCoherence,
    meanOffsetCoherence,
    charLevelCoherence,
    wordLevelCoherence,
  ];

  const meanPerspective =
    perspectives.reduce((a, b) => a + b, 0) / Math.max(1, perspectives.length);

  const varianceAcrossPerspectives =
    perspectives.reduce((acc, v) => acc + Math.pow(v - meanPerspective, 2), 0) /
    Math.max(1, perspectives.length);

  // Operationalized Wisdom Score:
  // Rewards candidates that are simultaneously coherent across all 6 perspectives
  // and penalizes variance across perspectives (e.g., high character coherence but low word-order coherence)
  const rawWisdom =
    meanPerspective *
    (1 - Math.min(0.65, Math.sqrt(varianceAcrossPerspectives) * 1.15)) *
    (0.7 + 0.3 * crossScaleAgreement);

  const wisdomScore = enableWisdom
    ? Number(Math.max(0, Math.min(1, rawWisdom)).toFixed(4))
    : Number(Math.max(0, Math.min(1, meanPerspective)).toFixed(4));

  return {
    forwardTraversalCoherence: Number(forwardTraversalCoherence.toFixed(4)),
    backwardTraversalCoherence: Number(backwardTraversalCoherence.toFixed(4)),
    presentCenteredCoherence: Number(presentCenteredCoherence.toFixed(4)),
    multiOffsetViewCoherence: multiOffsetViewCoherence.map((v) => Number(v.toFixed(4))),
    charLevelCoherence: Number(charLevelCoherence.toFixed(4)),
    wordLevelCoherence: Number(wordLevelCoherence.toFixed(4)),
    crossScaleAgreement: Number(crossScaleAgreement.toFixed(4)),
    varianceAcrossPerspectives: Number(varianceAcrossPerspectives.toFixed(4)),
    wisdomScore,
  };
}
