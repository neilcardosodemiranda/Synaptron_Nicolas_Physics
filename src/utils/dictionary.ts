/**
 * Linguistic particle physics standard model database
 * Contains vocabulary dictionary, letter quark/lepton classification,
 * bigram binding affinities, and antimatter annihilation pairs.
 */

import { ParticleType, SemanticColor } from '../types/physics';

// Core vocabulary lexicon recognized by the neuromorphic collider
export const STABLE_LEXICON = new Set([
  'ATOM', 'MASS', 'WAVE', 'SPIN', 'FLUX', 'BEAM', 'CORE', 'DATA', 'CHIP',
  'BYTE', 'CODE', 'NODE', 'LOOP', 'MIND', 'SOUL', 'TIME', 'FIRE', 'VOID',
  'ZERO', 'PLUS', 'TRUE', 'MATH', 'STAR', 'DARK', 'LIFE', 'ACID', 'BASE',
  'HEAT', 'COLD', 'FAST', 'SLOW', 'HIGH', 'FLOW', 'REST', 'JUMP', 'SYNC',
  'NEURON', 'SYNAPSE', 'QUANTUM', 'HADRON', 'LEPTON', 'BOSON', 'QUARK',
  'PHOTON', 'GLUON', 'PLASMA', 'ENERGY', 'CHARGE', 'LOGIC', 'MEMORY',
  'CIRCUIT', 'MATRIX', 'TENSOR', 'VECTOR', 'SCALAR', 'ENTROPY', 'GRAVITY',
  'INERTIA', 'VELOCITY', 'COLLIDER', 'CHAMBER', 'FIELD', 'FORCE', 'PULSE',
  'SIGNAL', 'SPIKE', 'POTENTIAL', 'THRESHOLD', 'LATTICE', 'CRYSTAL', 'LIGHT',
  'BRAIN', 'THOUGHT', 'REASON', 'ACTION', 'SYSTEM', 'COSMOS', 'WORLD', 'POWER',
  'SPACE', 'SPEED', 'AXON', 'SOMA', 'REST', 'VOLT', 'AMP', 'HERTZ',
  'YES', 'NO', 'AND', 'OR', 'NOT', 'XOR', 'NAND', 'BIT', 'FIT', 'RUN', 'SET',
  'GET', 'PUT', 'NEW', 'OLD', 'ALL', 'ONE', 'TWO', 'TEN', 'END', 'TOP', 'BOT'
]);

// Antonym / complementary annihilation pairs
export const ANTIMATTER_PAIRS: Record<string, string> = {
  'MATTER': 'ANTIMATTER',
  'ANTIMATTER': 'MATTER',
  'LIGHT': 'DARK',
  'DARK': 'LIGHT',
  'ORDER': 'CHAOS',
  'CHAOS': 'ORDER',
  'TRUE': 'FALSE',
  'FALSE': 'TRUE',
  'POSITIVE': 'NEGATIVE',
  'NEGATIVE': 'POSITIVE',
  'PLUS': 'MINUS',
  'MINUS': 'PLUS',
  'LIFE': 'VOID',
  'VOID': 'LIFE',
  'FIRE': 'ICE',
  'ICE': 'FIRE',
  'ZERO': 'ONE',
  'ONE': 'ZERO',
  'NORTH': 'SOUTH',
  'SOUTH': 'NORTH'
};

// High affinity bigrams that exert Strong Nuclear (Linguistic) attraction
export const STRONG_BINDING_BIGRAMS = new Set([
  'QU', 'TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ND', 'AT', 'ON', 'NT', 'HA', 'ES',
  'ST', 'EN', 'ED', 'TO', 'IT', 'OU', 'EA', 'HI', 'IS', 'OR', 'TI', 'AS', 'TE',
  'ET', 'NG', 'OF', 'AL', 'DE', 'SE', 'LE', 'SA', 'SI', 'AR', 'VE', 'RA', 'LD',
  'UR', 'RO', 'ON', 'NE', 'EU', 'SY', 'YN', 'NA', 'AP', 'SE', 'QU', 'AN', 'NT',
  'UM', 'BO', 'SO', 'MA', 'SS', 'SP', 'PI', 'IN', 'LU', 'UX', 'AM', 'PL', 'AS'
]);

export function getLetterParticleProperties(char: string, isAntimatter: boolean = false) {
  const upper = char.toUpperCase();
  const isUppercaseLetter = char >= 'A' && char <= 'Z';
  const isLowercaseLetter = char >= 'a' && char <= 'z';
  const isVowel = 'AEIOUY'.includes(upper);
  const isSpace = char === ' ';
  const isPunctuation = '!?.#*-+=/\\:;~^,\'"()[]'.includes(char);
  const isDigit = '0123456789'.includes(char);

  let type: ParticleType = 'quark';
  let color: SemanticColor = 'green';
  let mass = 2.0;
  let charge = 1.0;
  // Spin polarization: +0.5 for Uppercase, -0.5 for Lowercase, 1.0 for Bosons (punctuation/space)
  let spin = isUppercaseLetter ? 0.5 : isLowercaseLetter ? -0.5 : 1.0;

  if (isAntimatter) {
    type = 'antimatter';
    color = 'violet';
    charge = isVowel ? 1.0 : -1.0; // Inverted charge
    mass = 2.2;
    spin = -spin;
  } else if (isSpace) {
    // Vacuum Gluon / Carrier Boson coupling words
    type = 'boson';
    color = 'gold';
    mass = 0.35;
    charge = 0.0;
    spin = 1.0;
  } else if (isPunctuation) {
    type = 'boson';
    color = 'gold';
    mass = '!?'.includes(char) ? 0.85 : 0.55;
    charge = '!?'.includes(char) ? 1.5 : ',;:'.includes(char) ? -0.25 : 0.0;
    spin = 1.0;
  } else if (isVowel) {
    type = 'lepton';
    color = 'blue';
    mass = isUppercaseLetter ? 1.25 : 1.0; // Capital vowels carry 1.25x rest mass
    charge = -1.0; // Negative charge
  } else if (isDigit) {
    type = 'quark';
    color = 'gold';
    mass = 3.0;
    charge = 0.0;
    spin = 0.5;
  } else {
    // Consonant quarks
    type = 'quark';
    const caseMassFactor = isUppercaseLetter ? 1.25 : 1.0;
    // Sub-classification of quarks:
    if ('PTKBDG'.includes(upper)) {
      // Plosive quarks (heavy, high inertia)
      color = 'red';
      mass = 3.5 * caseMassFactor;
      charge = 1.0;
    } else if ('SFVZ'.includes(upper)) {
      // Fricative quarks (active, fast oscillating)
      color = 'green';
      mass = 1.8 * caseMassFactor;
      charge = 0.8;
    } else if ('MN'.includes(upper)) {
      // Nasal quarks (smooth resonance)
      color = 'blue';
      mass = 2.2 * caseMassFactor;
      charge = 0.5;
    } else {
      // Liquids and others (L, R, W, H, J, X, C, Q)
      color = 'red';
      mass = 2.5 * caseMassFactor;
      charge = 1.0;
    }
  }

  // Radius proportional to mass^(1/3)
  const radius = Math.max(13, Math.min(22, 13 * Math.cbrt(mass)));

  return {
    type,
    color,
    mass,
    charge,
    spin,
    radius,
  };
}

export function checkWordStability(
  letters: string[],
  dynamicLexicon?: Set<string>
): { isStable: boolean; word: string } {
  const word = letters.join('').toUpperCase();
  if (STABLE_LEXICON.has(word) || (dynamicLexicon && dynamicLexicon.has(word))) {
    return { isStable: true, word };
  }
  // Any 3+ letter string with at least one vowel and one consonant has partial stability
  const hasVowel = /[AEIOUY]/.test(word);
  const hasConsonant = /[BCDFGHJKLMNPQRSTVWXZ]/.test(word);
  if (
    word.length >= 3 &&
    hasVowel &&
    hasConsonant &&
    (STABLE_LEXICON.has(word) || (dynamicLexicon && dynamicLexicon.has(word)))
  ) {
    return { isStable: true, word };
  }
  return { isStable: false, word };
}

export function areComplementaryAntimatter(wordA: string, wordB: string): boolean {
  const a = wordA.toUpperCase();
  const b = wordB.toUpperCase();
  return ANTIMATTER_PAIRS[a] === b || ANTIMATTER_PAIRS[b] === a;
}
