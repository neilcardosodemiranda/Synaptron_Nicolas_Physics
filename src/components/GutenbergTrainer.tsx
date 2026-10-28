/**
 * Project Gutenberg Book Training, Pass 1 Thermodynamic Calibration,
 * Tri-Chamber Narrative Molecule M(t) Routing & Pauli-Orthogonal H8 Memristor Readout
 * 100% Pure Physics: Zero Grammar Rules, Zero Stopword Lists, Zero Lexical Dictionaries.
 */

import React, { useState, useEffect } from 'react';
import { NeuromorphicPhysicsEngine } from '../physics/engine';
import { BookTrainingStats, MemoryRecallResult } from '../types/physics';
import { soundEngine } from '../utils/audio';
import {
  BookOpen,
  Upload,
  Cpu,
  Sparkles,
  Zap,
  Play,
  Search,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Activity,
} from 'lucide-react';

interface GutenbergTrainerProps {
  engine: NeuromorphicPhysicsEngine;
  onTrainingComplete?: (stats: BookTrainingStats) => void;
  onInjectPredictedParticles?: (tokens: string[]) => void;
}

// Sample Project Gutenberg book excerpts for instant 1-click training
export const SAMPLE_GUTENBERG_BOOKS = [
  {
    id: 'alice',
    title: 'Alice in Wonderland (Lewis Carroll)',
    year: '1865',
    text: `Alice was beginning to get very tired of sitting by her sister on the bank. Suddenly a White Rabbit with pink eyes ran close by her, took a watch out of its waistcoat-pocket, and hurried down a large rabbit-hole under the hedge.
    Down, down, down went Alice into the deep subterranean hall.
    There were doors all round the long hall, but they were all locked; and when Alice had been all the way down one side and up the other, trying every door, she walked sadly down the middle, wondering how she was ever to get out again.
    Suddenly she came upon a little three-legged table, all made of solid glass; there was nothing on it except a tiny golden key, and Alice's first thought was that it might belong to one of the doors of the hall; but, alas! either the locks were too large, or the key was too small, but at any rate it would not open any of them.
    However, on the second time round, she came upon a low curtain she had not noticed before, and behind it was a little door about fifteen inches high: she tried the little golden key in the lock, and to her great delight it fitted!
    Alice opened the door and found that it led into a small passage, not much larger than a rat-hole: she knelt down and looked along the passage into the loveliest garden you ever saw.`,
  },
  {
    id: 'timemachine',
    title: 'The Time Machine (H.G. Wells)',
    year: '1895',
    text: `The Time Traveller was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.
    "You must follow me carefully. There are four dimensions, three which we call the three planes of Space, and a fourth, Time. Scientific people know very well that Time is only a kind of Space. A mark of a man's motion through space is a line; his motion through time is also a line."
    The Time Machine was made of nickel, parts of ivory, and crystalline quartz. It had two levers: one to push forward into the future, and one to reverse back into the past. It stood ready for its journey into the fourth dimension.`,
  },
  {
    id: 'frankenstein',
    title: 'Frankenstein (Mary Shelley)',
    year: '1818',
    text: `It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet.
    It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.
    The spark of galvanic electricity had awakened the nervous system. The mind breathed within the reconstructed biological matrix.`,
  },
  {
    id: 'principia',
    title: "Newton's Principia (Laws of Motion & Particles)",
    year: '1687',
    text: `Law I: Every body continues in its state of rest, or of uniform motion in a right line, unless it is compelled to change that state by forces impressed upon it.
    Law II: The alteration of motion is ever proportional to the motive force impressed; and is made in the direction of the right line in which that force is impressed.
    Law III: To every Action there is always opposed an equal and opposite Reaction: or the mutual actions of two bodies upon each other are always equal, and directed to contrary parts.
    The particles of matter attract each other with a force proportional to the product of their masses and inversely proportional to the square of the distance between them.`,
  },
  {
    id: 'sherlock',
    title: 'The Adventures of Sherlock Holmes (Conan Doyle)',
    year: '1892',
    text: `To Sherlock Holmes she is always the woman. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.
    Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his.
    Holmes examined the curious brass magnifying lens upon the oak desk: the cipher was concealed inside the double-locked safe behind the oil painting.`,
  },
  {
    id: 'relativity',
    title: 'Relativity: Special & General Theory (Einstein)',
    year: '1916',
    text: `Light is always propagated in empty space with a definite velocity c which is independent of the state of motion of the emitting body.
    Every reference-body has its own particular time; unless we are told the reference-body to which the statement of time refers, there is no meaning in a statement of the time of an event.
    Furthermore, the gravitational field influences and even determines the metrical laws of the space-time continuum: rays of light are propagated curvilinearly in gravitational fields.`,
  },
];

export const GutenbergTrainer: React.FC<GutenbergTrainerProps> = ({
  engine,
  onTrainingComplete,
  onInjectPredictedParticles,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>('alice');
  const [customText, setCustomText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'crossbar' | 'calibration'>('presets');
  const [learningRate, setLearningRate] = useState<number>(0.12);
  const [epochs, setEpochs] = useState<number>(2);
  const [isTraining, setIsTraining] = useState<boolean>(false);

  // Question & Memory Recall States
  const [memoryQuery, setMemoryQuery] = useState<string>('Where did the golden key fit?');
  const [physicsMode, setPhysicsMode] = useState<'pure_char_physics' | 'hybrid_semantic'>('pure_char_physics');
  const [recallResult, setRecallResult] = useState<MemoryRecallResult | null>(null);
  const [isQueryingPulse, setIsQueryingPulse] = useState<boolean>(false);
  const [queryExecCount, setQueryExecCount] = useState<number>(1);

  const stats = engine.trainingStats;
  const cal = stats.calibration || engine.calibrationArtifact;

  // Execute STDP training + Pass 1 thermodynamic calibration on text
  const handleTrain = (text: string, title: string) => {
    setIsTraining(true);
    setTimeout(() => {
      const resultStats = engine.trainOnText(text, title, epochs, learningRate);
      setIsTraining(false);
      onTrainingComplete?.(resultStats);

      // Perform query after training
      const recall = engine.queryBookMemory(memoryQuery, physicsMode);
      setRecallResult(recall);
      setQueryExecCount((c) => c + 1);
    }, 120);
  };

  // Pre-index all 6 Gutenberg classics on initial component load (with Alice as primary active book)
  useEffect(() => {
    if (engine.storedPassages.length < SAMPLE_GUTENBERG_BOOKS.length) {
      for (let i = SAMPLE_GUTENBERG_BOOKS.length - 1; i >= 0; i--) {
        const book = SAMPLE_GUTENBERG_BOOKS[i];
        engine.trainOnText(book.text, book.title, 2, 0.12);
      }
      const recall = engine.queryBookMemory('Where did the golden key fit?', 'pure_char_physics');
      setRecallResult(recall);
    } else if (!recallResult) {
      const recall = engine.queryBookMemory(memoryQuery, physicsMode);
      setRecallResult(recall);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // Execute query against associative memory with visual, audio & collider excitation
  const handleExecuteMemoryQuery = (
    q: string,
    modeOverride?: 'pure_char_physics' | 'hybrid_semantic'
  ) => {
    const activeMode = modeOverride || physicsMode;
    const targetQuery = q.trim() || 'Where did the golden key fit?';
    setMemoryQuery(targetQuery);
    setIsQueryingPulse(true);
    setQueryExecCount((c) => c + 1);

    const result = engine.queryBookMemory(targetQuery, activeMode);
    setRecallResult({ ...result });

    // Play neuromorphic recall synth & inject top recalled answer particle into chamber
    const primaryToken = result.predictedTokens[0] || 'key,';
    soundEngine.playWordFusion(primaryToken);
    engine.injectBeam(primaryToken, 'center', 4.8, false);
    onInjectPredictedParticles?.(result.predictedTokens);

    setTimeout(() => {
      setIsQueryingPulse(false);
    }, 550);
  };

  // Handle local .txt file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCustomText(content);
        handleTrain(content, file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-3.5 text-slate-300 text-xs shadow-xl space-y-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <div>
            <div className="font-semibold text-slate-100 uppercase tracking-wider text-xs flex items-center gap-2 flex-wrap">
              <span>Project Gutenberg Neuromorphic Crystal & Pass-1 STDP Trainer</span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50 font-mono">
                100% PURE PHYSICS · M(t) TRI-CHAMBER + PAULI H8
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Autonomous Pass-1 Entropy Calibration (ρ*, c*, th_trans, λ*), 8-View Delay Lines (V0–V7), Dual-Crystal Commissure (ΔE), and Pauli-Orthogonal Memristor Stream
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'presets' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gutenberg Library ({SAMPLE_GUTENBERG_BOOKS.length})
          </button>
          <button
            onClick={() => setActiveTab('calibration')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'calibration' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pass-1 Calibration Artifact
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'upload' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload .TXT / Custom
          </button>
          <button
            onClick={() => setActiveTab('crossbar')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'crossbar' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Synaptic Crossbar Heatmap
          </button>
        </div>
      </div>

      {/* Tab 1: Project Gutenberg Classics */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SAMPLE_GUTENBERG_BOOKS.map((book) => {
              const isSelected = selectedBookId === book.id;
              const isTrained = engine.storedPassages.some((p) => p.bookTitle === book.title);
              return (
                <div
                  key={book.id}
                  onClick={() => setSelectedBookId(book.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-950/70 border-sky-500 text-sky-100 shadow-md shadow-sky-950/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-100 mb-1 flex items-center justify-between gap-1">
                      <span className="truncate">{book.title}</span>
                      {isTrained && (
                        <span title="Indexed in Crystal" className="shrink-0 flex items-center">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mb-1.5">
                      Gutenberg · {book.year} · M(t) Tri-Sentence Crystal
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      "{book.text.slice(0, 125)}..."
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBookId(book.id);
                      handleTrain(book.text, book.title);
                    }}
                    disabled={isTraining}
                    className="mt-2.5 w-full py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white rounded font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Recalibrate & Train Crystal</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Pass-1 Autonomous Corpus-Local Thermodynamic Calibration Artifact */}
      {activeTab === 'calibration' && (
        <div className="bg-slate-950/90 border border-cyan-900/50 rounded-lg p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-cyan-200 uppercase tracking-wider text-[11px]">
                Pass 1 Autonomous Corpus-Local Thermodynamic Calibration (Zero Stopwords / Zero Supervision)
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">
              Pass 1 Latency: {cal.calibrationTimeMs} ms · Narrative Molecules M(t): {stats.narrativeMoleculesCount || engine.narrativeMolecules.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-[11px]">
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400 font-sans">Density Scale (ρ*)</div>
              <div className="text-cyan-300 font-bold">{cal.tokenDensityRho}</div>
              <div className="text-[9px] text-slate-500">1 / (μ_Ls + ε)</div>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400 font-sans">Count Cutoff (c*)</div>
              <div className="text-amber-300 font-bold">{cal.structuralCountThresholdC}</div>
              <div className="text-[9px] text-slate-500">quantile_0.90(cnt)</div>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400 font-sans">Start Prior (p*_start)</div>
              <div className="text-emerald-300 font-bold">{cal.sentenceStartPriorP}</div>
              <div className="text-[9px] text-slate-500">quantile_0.10(p_0)</div>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400 font-sans">Dynamic th_trans</div>
              <div className="text-sky-300 font-bold">{cal.transitionEntropyThTrans} b</div>
              <div className="text-[9px] text-slate-500">median(H_fwd)</div>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400 font-sans">Upper H*_fwd</div>
              <div className="text-purple-300 font-bold">{cal.forwardEntropyBoundaryHfwd} b</div>
              <div className="text-[9px] text-slate-500">quantile_0.90(H_f)</div>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400 font-sans">Lower H*_bwd</div>
              <div className="text-rose-300 font-bold">{cal.backwardEntropyBoundaryHbwd} b</div>
              <div className="text-[9px] text-slate-500">quantile_0.10(H_b)</div>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400 font-sans">Decay Factor (λ*)</div>
              <div className="text-amber-200 font-bold">{cal.temporalDecayLambda}</div>
              <div className="text-[9px] text-slate-500">1 / ln(μ_Δd)</div>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400 font-sans">Coherence (ψ*)</div>
              <div className="text-emerald-200 font-bold">{cal.coherenceScalePsi}</div>
              <div className="text-[9px] text-slate-500">√Var(H)·log2|V|</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-1">
            <span>
              Corpus-Derived Inverse-Variance Bidirectional Weights:{' '}
              <b className="text-sky-300 font-mono">
                α_bwd={cal.weights.alphaBackward} · β_pres={cal.weights.betaPresent} · γ_fwd={cal.weights.gammaForward} · δ_rev={cal.weights.deltaReverse}
              </b>
            </span>
            <span className="text-slate-500 font-mono">
              Directional Separation θ*_sep = {cal.directionalSeparationTheta} bits
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Custom Text / File Upload */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* File Dropzone */}
            <label className="flex-1 border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all">
              <Upload className="w-6 h-6 text-sky-400" />
              <div className="text-center">
                <span className="font-semibold text-slate-200">Upload Project Gutenberg .txt Book</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Click to browse or drop any plain text file</p>
              </div>
              <input type="file" accept=".txt,.text" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Hyperparameter Settings */}
            <div className="w-full sm:w-64 bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-200 uppercase">STDP Parameters</div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Learning Rate (η):</span>
                  <span className="font-mono text-sky-400">{learningRate.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.30"
                  step="0.02"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Training Epochs:</span>
                  <span className="font-mono text-sky-400">{epochs}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Paste Raw Text Box */}
          <div>
            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Or paste any book excerpt, poem, or scientific paper here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => handleTrain(customText || 'Quantum neuromorphic substrate', 'Pasted Document')}
                disabled={!customText.trim() || isTraining}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white rounded font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Pass-1 Calibrate & Train Memristors</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Synaptic Crossbar Matrix (8x8 Heatmap) */}
      {activeTab === 'crossbar' && (
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              MEMRISTOR CONDUCTANCE CROSSBAR MATRIX (<span className="text-sky-400">Pre-Synaptic N_i</span> ↓ vs{' '}
              <span className="text-emerald-400">Post-Synaptic N_j</span> →)
            </span>
            <span className="font-mono text-[10px] text-slate-500">Conductance scale: 0.0S (Dark) to 1.0S (Bright Cyan)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center font-mono text-[10px] border-collapse">
              <thead>
                <tr>
                  <th className="p-1 text-slate-500">Soma</th>
                  {engine.neurons.map((n) => (
                    <th key={n.id} className="p-1 text-emerald-400 font-bold" title={n.specialization}>
                      {n.label.split('-')[0]}
                    </th>
                  ))}
                  <th className="p-1 text-slate-400 text-left pl-3 font-sans">Neuron Specialization</th>
                </tr>
              </thead>
              <tbody>
                {engine.neurons.map((nI, i) => (
                  <tr key={nI.id} className="border-t border-slate-800/60 hover:bg-slate-900/40">
                    <td className="p-1 text-sky-400 font-bold">{nI.label.split('-')[0]}</td>
                    {engine.neurons.map((nJ, j) => {
                      if (i === j) {
                        return (
                          <td key={nJ.id} className="p-1 text-slate-600 bg-slate-950/60">
                            —
                          </td>
                        );
                      }
                      const weight = nI.weights[nJ.id] || 0.2;
                      const isHigh = weight > 0.45;
                      return (
                        <td
                          key={nJ.id}
                          className={`p-1.5 transition-colors ${
                            isHigh
                              ? 'bg-sky-500/25 text-sky-200 font-bold border border-sky-500/40'
                              : 'text-slate-400'
                          }`}
                          title={`${nI.label} → ${nJ.label}: ${weight.toFixed(3)}S`}
                        >
                          {weight.toFixed(2)}
                        </td>
                      );
                    })}
                    <td className="p-1 text-slate-300 text-left pl-3 font-sans text-[11px] truncate max-w-[220px]">
                      {nI.specialization}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CORE FEATURE: Neuromorphic Memory Question & Contextual Recall Card */}
      <div className="bg-slate-900/90 border border-amber-900/40 rounded-lg p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-100 uppercase tracking-wider text-xs">
              Tri-Chamber Neuromorphic Query & Pauli-Orthogonal H8 Readout
            </span>
          </div>

          {/* Mode Toggle: Both 100% Pure Physics (Zero Stopwords / Zero Grammar Rules) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
            <button
              onClick={() => {
                setPhysicsMode('pure_char_physics');
                handleExecuteMemoryQuery(memoryQuery, 'pure_char_physics');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                physicsMode === 'pure_char_physics'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="100% Pure Physics: Uses character spin (+1/2 vs -1/2), Pass-1 entropy chemical potential, Pauli trajectory orthogonality, and H8 phase-seeded delay-line conductance (I = G*V)"
            >
              Pure Char-Crystal + Pauli H8 Stream
            </button>
            <button
              onClick={() => {
                setPhysicsMode('hybrid_semantic');
                handleExecuteMemoryQuery(memoryQuery, 'hybrid_semantic');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                physicsMode === 'hybrid_semantic'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="100% Pure Physics: Focused Focal Clause readout via Dual-Crystal Commissure Energy & Pass-1 Entropy Boundaries"
            >
              Focal Clause Crystal Readout
            </button>
          </div>
        </div>

        {/* Query Input Box */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={memoryQuery}
              onChange={(e) => setMemoryQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteMemoryQuery(memoryQuery);
              }}
              placeholder="Ask anything — capital letters, lowercase, spaces & punctuation all carry spin, entropy & phase..."
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500 pr-8"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
          </div>
          <button
            onClick={() => handleExecuteMemoryQuery(memoryQuery)}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Query Crystal</span>
          </button>
        </div>

        {/* Quick Example Questions + Trap Probe */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Quick Probes:</span>
          <button
            onClick={() => handleExecuteMemoryQuery('Where did the golden key fit?')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors cursor-pointer"
          >
            "Where did the golden key fit?"
          </button>
          <button
            onClick={() => handleExecuteMemoryQuery('Where is the golden key?')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 transition-colors cursor-pointer"
          >
            "Where is the golden key?"
          </button>
          <button
            onClick={() => handleExecuteMemoryQuery('What was the Time Machine made of?')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors cursor-pointer"
          >
            "What was the Time Machine made of?"
          </button>
          <button
            onClick={() => handleExecuteMemoryQuery('What do the two levers on the Time Machine do?')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 transition-colors cursor-pointer"
          >
            "What do the two levers on the Time Machine do?"
          </button>
          <button
            onClick={() => handleExecuteMemoryQuery('What awakened the creature in Frankenstein?')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors cursor-pointer"
          >
            "What awakened the creature?"
          </button>
          <button
            onClick={() => handleExecuteMemoryQuery("What is Newton's Third Law of Action and Reaction?")}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 transition-colors cursor-pointer"
          >
            "What is Newton's Third Law?"
          </button>
          <button
            onClick={() => handleExecuteMemoryQuery('Where was the cipher concealed in Sherlock Holmes?')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors cursor-pointer"
          >
            "Where was the cipher concealed?"
          </button>
          <button
            onClick={() =>
              handleExecuteMemoryQuery('Did the lock try the golden Martian spaceship on the hyperdrive?')
            }
            className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900/70 border border-rose-800/50 text-rose-300 transition-colors cursor-pointer"
            title="Test Chamber 2 Cat Gate & Consequence Continuity Collapse on an adversarial trap"
          >
            Trap Probe (Alien / Reversal)
          </button>
        </div>

        {/* Retrieved Associative Memory Result */}
        {recallResult && (
          <div
            className={`bg-slate-950/90 border rounded p-3 space-y-2.5 font-mono text-[11px] transition-all duration-300 ${
              isQueryingPulse
                ? 'border-amber-400 shadow-lg shadow-amber-500/20 bg-amber-950/20'
                : 'border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-amber-300 font-bold uppercase">
                  Source Crystal: {recallResult.sourceBook}
                </span>
                <span className="bg-slate-900 text-sky-400 border border-slate-700 px-1.5 py-0.5 rounded">
                  Recall #{queryExecCount} · "{recallResult.query}"
                </span>
                <span className="bg-amber-950/80 text-amber-300 border border-amber-700/50 px-1.5 py-0.5 rounded">
                  ZERO GRAMMAR RULES · PASS-1 ENTROPY + PAULI ORTHOGONALITY
                </span>
              </div>
              <span className="text-emerald-400 font-bold">
                Resonance Energy: {recallResult.resonanceScore > 0 ? `${recallResult.resonanceScore} mV` : 'Baseline'}
              </span>
            </div>

            {/* Pure Character-Physics Spin & Boson Telemetry Bar */}
            {recallResult.caseSpinCoupling && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1.5 text-[10px]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-400 font-sans font-semibold uppercase">Query Particle Telemetry:</span>
                  <span className="text-sky-300">
                    Capital Spin (+½): <b>{recallResult.caseSpinCoupling.uppercaseHits}</b>
                  </span>
                  <span className="text-emerald-300">
                    Lowercase Spin (-½): <b>{recallResult.caseSpinCoupling.lowercaseHits}</b>
                  </span>
                  <span className="text-amber-300">
                    Space Gluons (' '): <b>{recallResult.caseSpinCoupling.spaceGluons}</b>
                  </span>
                  <span className="text-rose-300">
                    Punctuation Bosons (!?,.;): <b>{recallResult.caseSpinCoupling.punctuationBosons}</b>
                  </span>
                </div>
                {recallResult.triChamber && (
                  <div className="flex items-center gap-2">
                    {recallResult.triChamber.catGatePassed ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3" />
                        <span>CAT GATE: APPROVED</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 rounded">
                        <ShieldAlert className="w-3 h-3" />
                        <span>CAT GATE VETO: {recallResult.triChamber.catGateReason}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Coherent Character Wave-Packets Breakdown (with Pass-1 Chemical Potential mu & Entropy) */}
            {recallResult.charWavePackets && recallResult.charWavePackets.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded p-2 space-y-1.5">
                <div className="text-[10px] text-sky-400 font-sans font-semibold uppercase tracking-wider flex flex-wrap items-center justify-between gap-1">
                  <span>Coherent Wave-Packet Interference (No Stop-Words / Pass-1 Chemical Potential μ):</span>
                  <span className="font-mono text-slate-400">
                    E ∝ (Mass + G_memristor) · L^1.48 · μ(H_fwd, th_trans) · STD
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recallResult.charWavePackets.map((pkt, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-sky-900/60 rounded px-2 py-1 text-[10px] flex items-center gap-1.5"
                    >
                      <span className="text-amber-300 font-bold whitespace-pre bg-amber-950/40 px-1 rounded">
                        "{pkt.fragment}"
                      </span>
                      <span className="text-emerald-400 font-bold">+{pkt.energyMv} mV</span>
                      <span className="text-sky-400">({pkt.conductanceSiemens}S)</span>
                      {pkt.chemicalPotential !== undefined && (
                        <span className="text-cyan-300" title="Thermodynamic Chemical Potential (replaces stopword lists)">
                          μ={pkt.chemicalPotential}
                        </span>
                      )}
                      <span className="text-slate-500 text-[9px]">{pkt.spinState}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tri-Chamber Neuromorphic Telemetry Strip (Chamber 1 M(t), Chamber 2 Commissure & Consistency, Chamber 3 H8 Seed) */}
            {recallResult.triChamber && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 bg-slate-900/70 border border-slate-800 rounded p-2 text-[10px]">
                {/* Chamber 1: Multi-View Stability V0..V7 */}
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-cyan-400 font-sans font-semibold uppercase">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Chamber 1: 8-View Delay (V0–V7)</span>
                    </span>
                    <span className="font-mono text-emerald-400">
                      Wisdom={recallResult.triChamber.multiViewStability}
                    </span>
                  </div>
                  <div className="flex items-end gap-1 h-7 pt-1">
                    {recallResult.triChamber.viewResonanceProfile.map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full bg-slate-900 rounded-sm h-4 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-cyan-500/80"
                            style={{ height: `${Math.max(15, Math.round(v * 100))}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-slate-500">V{i}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chamber 2: Dual-Crystal Commissure & Bidirectional Consistency */}
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-amber-400 font-sans font-semibold uppercase">
                    <span>Chamber 2: Dual-Crystal Truth</span>
                    <span className="font-mono text-sky-300">
                      C_total={recallResult.triChamber.bidirectionalConsistency.cTotal}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-400">
                    <div>
                      Commissure ΔE: <b className="text-amber-300">{recallResult.triChamber.commissureDeltaE}</b>
                    </div>
                    <div>
                      Pauli Ortho: <b className="text-emerald-300">{recallResult.triChamber.pauliOrthogonalityScore}</b>
                    </div>
                    <div>
                      C_bwd / C_pres:{' '}
                      <b className="text-slate-200">
                        {recallResult.triChamber.bidirectionalConsistency.cBackward} /{' '}
                        {recallResult.triChamber.bidirectionalConsistency.cPresent}
                      </b>
                    </div>
                    <div>
                      C_fwd / C_rev:{' '}
                      <b className="text-slate-200">
                        {recallResult.triChamber.bidirectionalConsistency.cForward} /{' '}
                        {recallResult.triChamber.bidirectionalConsistency.cReverse}
                      </b>
                    </div>
                  </div>
                </div>

                {/* Chamber 3: Holographic H8 8-Byte Phase Seed */}
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-purple-400 font-sans font-semibold uppercase">
                    <span>Chamber 3: H8 Phase Seed</span>
                    <span className="font-mono text-purple-300">8-Byte Anchor</span>
                  </div>
                  <div className="text-[10px] text-slate-300 truncate">
                    Seed: <span className="text-amber-300 font-bold">"{recallResult.triChamber.h8PhaseSeed}"</span>
                  </div>
                  <div className="text-[9px] text-slate-500 truncate">
                    HEX: {recallResult.triChamber.h8HexSignature}
                  </div>
                </div>
              </div>
            )}

            {/* Focused Reservoir Direct Answer Clause / Autonomous Pauli-Orthogonal Memristor Character Stream */}
            <div className="bg-amber-950/30 border border-amber-700/40 rounded p-2">
              <div className="text-[10px] text-amber-400/90 font-sans font-semibold uppercase tracking-wider mb-0.5 flex flex-wrap items-center justify-between gap-1">
                <span>
                  {recallResult.physicsMode === 'pure_char_physics'
                    ? 'Autonomous Pauli-Orthogonal H8 Memristor Character-by-Character Stream (I = G · V · Ψ_Pauli):'
                    : 'Chamber 3 Focal Clause Readout (Dual-Crystal Verified):'}
                </span>
                {recallResult.activePathways.length > 0 && (
                  <span className="font-mono text-[10px] text-sky-300">
                    Active Somas: {recallResult.activePathways.map((p) => p.split('-')[0]).join(' → ')}
                  </span>
                )}
              </div>
              <div className="text-amber-100 font-mono font-medium text-xs leading-relaxed break-words">
                "{recallResult.answerPhrase}"
              </div>
            </div>

            {/* Ordered Three-Sentence Narrative Molecule M(t) = [S(t-1), S(t), S(t+1)] */}
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                <span>
                  Ordered Three-Sentence Narrative Molecule{' '}
                  <b className="text-cyan-400 font-mono">M(t) = [S(t-1), S(t), S(t+1)]</b> (Exact Case & Punctuation Crystal):
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800/80 space-y-1.5 font-sans leading-relaxed">
                {recallResult.triChamber?.narrativeMolecule.prevSentence && (
                  <div className="text-[11px] text-slate-500">
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-950 px-1 py-0.2 rounded mr-1.5">
                      S(t-1)
                    </span>
                    {recallResult.triChamber.narrativeMolecule.prevSentence}
                  </div>
                )}
                <div className="text-xs text-slate-100 font-medium bg-sky-950/30 border-l-2 border-sky-400 pl-2 py-0.5">
                  <span className="font-mono text-[9px] text-sky-300 bg-sky-950 px-1 py-0.2 rounded mr-1.5">
                    Focal S(t)
                  </span>
                  "{recallResult.matchedSentence}"
                </div>
                {recallResult.triChamber?.narrativeMolecule.nextSentence && (
                  <div className="text-[11px] text-slate-500">
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-950 px-1 py-0.2 rounded mr-1.5">
                      S(t+1)
                    </span>
                    {recallResult.triChamber.narrativeMolecule.nextSentence}
                  </div>
                )}
              </div>
            </div>

            {/* Particle Tokens Extracted from the Answer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 font-sans">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">
                  High Chemical-Potential Particles (μ-Ranked, Zero Stopword List):
                </span>
                {recallResult.predictedTokens.map((tok, i) => (
                  <span
                    key={i}
                    className="bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded font-mono font-bold text-[11px]"
                  >
                    {tok}
                  </span>
                ))}
              </div>

              {/* Action Button: Inject Recalled Tokens into Collider */}
              <button
                onClick={() => {
                  const toInject = recallResult.predictedTokens.slice(0, 3).join(' ') || 'key,';
                  engine.injectBeam(toInject, 'center', 5.5, false);
                  onInjectPredictedParticles?.(recallResult.predictedTokens);
                }}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Launch Recalled Words as Particles</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Pattern Dashboard */}
      {stats.totalWordsParsed > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-2">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Active Book:</div>
              <div className="font-bold text-slate-100 truncate">{stats.bookTitle}</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Raw Character Stream:</div>
              <div className="font-bold text-amber-300">
                {stats.totalCharsParsed || 0} chars{' '}
                <span className="text-slate-500 text-[10px]">({stats.uniqueCharsCount || 0} sym)</span>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Pauli Delay Synapses:</div>
              <div className="font-bold text-purple-400">
                {stats.charSynapsesCount || 0} <span className="text-slate-500 text-[10px]">k=2..8</span>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Narrative Molecules:</div>
              <div className="font-bold text-cyan-400">
                {stats.narrativeMoleculesCount || engine.narrativeMolecules.length}{' '}
                <span className="text-slate-500 text-[10px]">M(t)</span>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Pass-1 th_trans:</div>
              <div className="font-bold text-sky-400">{cal.transitionEntropyThTrans} bits</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Potentiated STDP:</div>
              <div className="font-bold text-emerald-400">
                {stats.stdpPotentiatedSynapses} <span className="text-slate-500 text-[10px]">/ 56 ch</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

