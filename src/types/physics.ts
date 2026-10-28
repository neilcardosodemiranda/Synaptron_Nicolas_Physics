/**
 * Types for the Neuromorphic Linguistic Particle Computer (Synaptron NL-QPU)
 */

export type ParticleType = 'lepton' | 'quark' | 'boson' | 'antimatter';
export type SemanticColor = 'red' | 'green' | 'blue' | 'gold' | 'violet';

export interface LetterParticle {
  id: string;
  char: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
  mass: number;
  charge: number; // e.g. -1 for vowels, +1 for consonants, 0 for bosons
  spin: number;
  color: SemanticColor;
  radius: number;
  energy: number;
  quantumPhase: number;
  isAntimatter: boolean;
  hadronId: string | null;
  bondOrder: number; // position in word
  trail: Array<{ x: number; y: number; alpha: number }>;
  pinned?: boolean;
  decayTime?: number;
}

export interface HadronBond {
  id: string;
  particleAId: string;
  particleBId: string;
  restLength: number;
  stiffness: number;
  damping: number;
  strength: number;
}

export interface HadronWord {
  id: string;
  word: string;
  particleIds: string[];
  isStable: boolean;
  resonanceEnergy: number;
  createdAt: number;
  centerX: number;
  centerY: number;
}

export interface SynapticNeuron {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  core: 'alpha' | 'beta' | 'gamma' | 'delta';
  specialization: string; // e.g. "Vowel Leptons (A,E,I,O,U)", "Plosive Quarks (P,T,K,B)", etc.
  membranePotential: number; // -70mV rest to -50mV threshold
  threshold: number; // -50mV
  restPotential: number; // -70mV
  resetPotential: number; // -78mV
  refractoryTime: number; // ms
  decayRate: number; // leaky factor
  spikeHistory: number[]; // recent spike times (ms)
  weights: Record<string, number>; // memristor connection to other neuron IDs
  lastSpikeVisual: number; // 0 to 1 for rendering glow
  accumulatedCurrent: number;
  learnedTokens: string[]; // n-grams / words tuned to this soma
}

export interface CorpusCalibrationArtifact {
  tokenDensityRho: number;
  structuralCountThresholdC: number;
  sentenceStartPriorP: number;
  forwardEntropyBoundaryHfwd: number;
  backwardEntropyBoundaryHbwd: number;
  transitionEntropyThTrans: number;
  temporalDecayLambda: number;
  coherenceScalePsi: number;
  directionalSeparationTheta: number;
  calibrationTimeMs: number;
  weights: {
    alphaBackward: number;
    betaPresent: number;
    gammaForward: number;
    deltaReverse: number;
  };
}

export interface BookTrainingStats {
  bookTitle: string;
  totalWordsParsed: number;
  uniqueVocabularyCount: number;
  patternsExtracted: number;
  topBigrams: Array<{ bigram: string; count: number; weight: number }>;
  topWords: Array<{ word: string; frequency: number }>;
  trainingEpoch: number;
  stdpPotentiatedSynapses: number;
  isTraining: boolean;
  totalCharsParsed?: number;
  uniqueCharsCount?: number;
  charSynapsesCount?: number;
  calibration?: CorpusCalibrationArtifact;
  narrativeMoleculesCount?: number;
}

export interface AttractorWell {
  id: string;
  x: number;
  y: number;
  strength: number; // positive = attract, negative = repel
  radius: number;
  type: 'gravity' | 'magnetic' | 'vowel_trap' | 'consonant_trap' | 'annihilation_sink';
  label: string;
}

export interface QuantumBarrier {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  potential: number; // Barrier height
  active: boolean;
  label: string;
}

export interface CollisionFlash {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  label?: string;
  life: number; // 1 to 0
  decayRate: number;
  type: 'fusion' | 'fission' | 'annihilation' | 'spike' | 'tunnel' | 'cherenkov';
}

export interface BeamlineConfig {
  active: boolean;
  text: string;
  velocity: number; // 0.1 to 1.5 relativistic scale
  energyGeV: number;
  frequency: number; // particles/sec in fountain mode
  isAntimatter: boolean;
  polarity: 'positive' | 'negative' | 'neutral';
}

export interface SimulationSettings {
  timeStep: number;
  cSpeed: number; // simulated speed of light
  lorentzBField: number; // magnetic field (-5 to +5)
  strongForceStrength: number; // linguistic bonding spring
  coulombConstant: number; // electrostatic attraction/repulsion
  damping: number; // vacuum viscosity
  quantumTunneling: boolean;
  collisionMode: 'fusion' | 'fission' | 'annihilation' | 'elastic';
  soundEnabled: boolean;
  soundVolume: number;
  showTrails: boolean;
  showWaveFunctions: boolean;
  showSynapticGrid: boolean;
  temperature: number; // thermal noise
  useWebGPU: boolean; // WebGPU compute shader acceleration
}

export interface ComputerTelemetry {
  particleCount: number;
  wordCount: number;
  stableHadrons: number;
  spikeRateHz: number;
  totalKineticEnergy: number;
  entropy: number;
  opsPerSecond: number;
  annihilationsCount: number;
  recognizedWords: string[];
  recentSpikes: Array<{ neuronId: string; time: number; core: string }>;
}

export interface CharWavePacket {
  fragment: string;
  charLength: number;
  energyMv: number;
  spinState: string;
  conductanceSiemens: number;
  forwardEntropyBits?: number;
  backwardEntropyBits?: number;
  chemicalPotential?: number;
}

export interface TriChamberTelemetry {
  narrativeMolecule: {
    prevSentence: string;
    focalSentence: string;
    nextSentence: string;
  };
  commissureDeltaE: number;
  forwardEnergy: number;
  backwardEnergy: number;
  bidirectionalConsistency: {
    cBackward: number;
    cPresent: number;
    cForward: number;
    cReverse: number;
    cTotal: number;
  };
  multiViewStability: number;
  viewResonanceProfile: number[]; // V0..V7
  pauliOrthogonalityScore: number;
  h8PhaseSeed: string;
  h8HexSignature: string;
  catGatePassed: boolean;
  catGateReason: string;
}

export interface HemisphericProposal {
  hemisphere: 'left' | 'right';
  proposalType: 'analytical' | 'relational';
  candidateTrajectory: string;
  charStream: string;
  resonanceEnergyMv: number;
  groundingScore: number; // [0, 1] based on chemical potential and coherent wave-packet density
  confidence: number; // [0, 1]
  provenance: {
    sourceCrystal: string;
    docTitle: string;
    sentenceIndex?: number;
    moleculeId?: string;
  };
  activeSomas: string[];
  matchedFermions: string[];
  final_output: null; // STRICT INVARIANT: Evidence subsystem only, NEVER emits final user output
}

export interface CorpusCallosumReport {
  interHemisphericAgreement: number; // \kappa_agree [0, 1]
  topicCompatibility: number; // [0, 1] topic alignment between proposals
  provenanceCompatibility: number; // [0, 1] compatibility of evidence sources
  phaseAlignment: number; // [0, 1] phase coherence fraction
  conflictDetected: boolean;
  conflictState: string;
  callosalBridgeWords: string[];
  relationalDipoleMatch: number;
  fluxCurrentUa: number;
  parityTransformation: string;
  transformedQueryWave: string;
  final_output: null; // STRICT INVARIANT: Comparison bus only, NEVER emits final user output
}

export interface FrontalLobeDecision {
  action: 'SYNTHESIZE' | 'SELECT_LEFT' | 'SELECT_RIGHT' | 'CLARIFY' | 'ABSTAIN';
  synthesisMode: 'PURE_ANALYTICAL' | 'PURE_RELATIONAL' | 'BICAMERAL_COMPLEMENTARY_SYNTHESIS' | 'CLARIFICATION_REQUEST' | 'SAFE_ABSTENTION';
  arbitrationReason: string;
  selfReflectionVerdict: string;
  confidenceScore: number;
  groundingScore: number;
  queryType: 'FACTUAL_ANALYTICAL' | 'RELATIONAL_IDENTITY' | 'COMPOUND_BICAMERAL' | 'AMBIGUOUS_CONFLICT' | 'SUB_THRESHOLD';
  final_output: string; // STRICT INVARIANT: Frontal lobe is the SOLE owner of conversational emission
}

export interface BicameralMindTelemetry {
  activeDominance: 'LEFT_ANALYTICAL' | 'RIGHT_DIALOGIC' | 'BICAMERAL_SYNTHESIS' | 'FRONTAL_CLARIFICATION' | 'FRONTAL_ABSTENTION';
  leftHemisphereProposal: HemisphericProposal;
  rightHemisphereProposal: HemisphericProposal;
  corpusCallosumReport: CorpusCallosumReport;
  frontalLobeDecision: FrontalLobeDecision;

  // Subsystem telemetry views for HUD integration
  leftHemisphere: {
    label?: string;
    resonanceMv: number;
    matchedSentence: string;
    sourceCrystal: string;
    activeSomas: string[];
    moleculesCount?: number;
    energyMv?: number;
    sourceBook?: string;
    groundingScore?: number;
    proposalOnly: true;
    final_output: null;
  };
  rightHemisphere: {
    label?: string;
    resonanceMv: number;
    matchedSentence: string;
    sourceCrystal: string;
    activeSomas: string[];
    moleculesCount?: number;
    energyMv?: number;
    sourceBook?: string;
    observerFrameTransformation?: string;
    groundingScore?: number;
    proposalOnly: true;
    final_output: null;
  };
  corpusCallosum: {
    phaseLockCoherence?: number;
    interHemisphericFluxUa?: number;
    relationalDipoleRatio?: number;
    callosalBridgeWords?: string[];
    fluxCurrentUa: number;
    parityTransformation: string;
    transformedQueryWave: string;
    phaseCoherencePct: number;
    interHemisphericAgreement?: number;
    conflictDetected?: boolean;
    conflictReason?: string;
    relationDipoleMatch?: number;
    topicCompatibility?: number;
    provenanceCompatibility?: number;
    proposalOnly: true;
    final_output: null;
  };
  frontalLobeOrchestrator: {
    action?: 'SYNTHESIZE' | 'SELECT_LEFT' | 'SELECT_RIGHT' | 'CLARIFY' | 'ABSTAIN';
    executiveDecision?: string;
    consciousStreamSummary?: string;
    activeTotalCsrSynapsesFired?: number;
    activeH8DelaySynapsesFired?: number;
    arbitrationReason: string;
    synthesizedStream?: string;
    executiveGain: number;
    selfReflectionVerdict?: string;
    synthesisMode?: 'PURE_ANALYTICAL' | 'PURE_RELATIONAL' | 'BICAMERAL_COMPLEMENTARY_SYNTHESIS' | 'CLARIFICATION_REQUEST' | 'SAFE_ABSTENTION';
    final_output: string;
  };
  equilibriumSettlingLoops?: number;
  equilibriumDeltaI?: number;
  multiHopCascade?: Array<{
    hop: number;
    label: string;
    text: string;
    energyMv: number;
    sourceCrystal: string;
  }>;
}

export interface MemoryRecallResult {
  query: string;
  matchedSentence: string;
  sourceBook: string;
  answerPhrase: string;
  predictedTokens: string[];
  resonanceScore: number;
  activePathways: string[];
  physicsMode?: 'pure_char_physics' | 'hybrid_semantic';
  rawMemristorStream?: string;
  charWavePackets?: CharWavePacket[];
  caseSpinCoupling?: {
    uppercaseHits: number;
    lowercaseHits: number;
    punctuationBosons: number;
    spaceGluons: number;
  };
  triChamber?: TriChamberTelemetry;
  bicameral?: BicameralMindTelemetry;
}

export interface WorkingMemoryTrace {
  id: string;
  timestamp: number;
  timeStr: string;
  text: string;
  role: 'user' | 'system' | 'monologue' | 'insight';
  salience: number; // 0.0 to 1.0 importance
  sourceHemisphere?: 'left' | 'right' | 'frontal';
  associatedTokens: string[];
  resonanceMv: number;
  consolidated: boolean;
}

export interface WorkingMemoryState {
  isActive: boolean;
  awakeStartTime: number;
  awakeDurationHours: number; // typically 24h
  traces: WorkingMemoryTrace[];
  totalTracesToday: number;
  lastSleepTimestamp: number | null;
  sleepCycleCount: number;
  isSleeping: boolean;
  consolidationProgress: number; // 0 to 100%
  lastConsolidationReport?: {
    timestamp: number;
    tracesProcessed: number;
    synapsesPotentiated: number;
    moleculesEtched: number;
    settledAt: string;
    summary: string;
  };
}



