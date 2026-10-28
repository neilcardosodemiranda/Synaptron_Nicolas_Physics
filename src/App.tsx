/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NeuromorphicPhysicsEngine } from './physics/engine';
import { gpuAccelerator } from './physics/webgpuEngine';
import { ColliderCanvas } from './components/ColliderCanvas';
import { BeamInjectorControls } from './components/BeamInjectorControls';
import { NeuromorphicOscilloscope } from './components/NeuromorphicOscilloscope';
import { PhysicsHUD } from './components/PhysicsHUD';
import { ParticlePenToolbar } from './components/ParticlePenToolbar';
import { FieldModulatorPanel } from './components/FieldModulatorPanel';
import { InspectorDrawer } from './components/InspectorDrawer';
import { ParticlePhysicsTheoryModal } from './components/ParticlePhysicsTheoryModal';
import { GutenbergTrainer, SAMPLE_GUTENBERG_BOOKS } from './components/GutenbergTrainer';
import { GpuPerformanceDashboard } from './components/GpuPerformanceDashboard';
import { TemporalMultiscaleChamber } from './components/TemporalMultiscaleChamber';
import { BareMetalCrossbarConsole } from './components/BareMetalCrossbarConsole';
import {
  LetterParticle,
  SynapticNeuron,
  ComputerTelemetry,
  BookTrainingStats,
} from './types/physics';
import { soundEngine } from './utils/audio';
import { Atom, BookOpen, RotateCcw, Volume2, VolumeX, Sparkles, Database, Cpu, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Instantiate singleton physics engine
  const engine = useMemo(() => new NeuromorphicPhysicsEngine(1100, 580), []);

  // Active laboratory branch: Bare-Metal Crossbar vs. Linguistic Collider vs. Temporal Multiscale Chamber
  const [activeLabBranch, setActiveLabBranch] = useState<'bare_metal_crossbar' | 'collider' | 'temporal_multiscale'>('bare_metal_crossbar');

  // UI States
  const [activeTool, setActiveTool] = useState<'sling' | 'well' | 'probe' | 'inspect'>('sling');
  const [selectedChar, setSelectedChar] = useState<string>('E');
  const [isAntimatter, setIsAntimatter] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [showTrainer, setShowTrainer] = useState<boolean>(true);
  const [showGpuDashboard, setShowGpuDashboard] = useState<boolean>(true);

  // Inspected objects
  const [inspectedParticle, setInspectedParticle] = useState<LetterParticle | null>(null);
  const [inspectedNeuron, setInspectedNeuron] = useState<SynapticNeuron | null>(null);

  // Local copy of telemetry for reactive UI updates
  const [telemetry, setTelemetry] = useState<ComputerTelemetry>(engine.telemetry);
  const [, setTick] = useState(0);

  // Synchronize telemetry state every 200ms
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry({ ...engine.telemetry });
    }, 200);
    return () => clearInterval(timer);
  }, [engine]);

  // Initial setup: initialize WebGPU accelerator and prime engine with Alice in Wonderland
  useEffect(() => {
    void gpuAccelerator.init().catch((err) => {
      console.warn('WebGPU accelerator initialization error:', err);
    });

    const aliceBook = SAMPLE_GUTENBERG_BOOKS[0];
    if (aliceBook) {
      engine.trainOnText(aliceBook.text, aliceBook.title, 2, 0.12);
    }
    engine.injectBeam('QUANTUM', 'left', 5.5, false, -30);
    engine.injectBeam('NEURON', 'right', 5.5, false, 30);
  }, [engine]);

  // Presets
  const handleRunPreset = useCallback((presetId: string) => {
    engine.clearChamber();

    if (presetId === 'bigbang') {
      const alphabet = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
      const cx = engine.width / 2;
      const cy = engine.height / 2;

      for (let i = 0; i < 48; i++) {
        const char = alphabet[Math.floor(Math.random() * alphabet.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 6.0;
        engine.addParticle(
          char,
          cx + (Math.random() - 0.5) * 40,
          cy + (Math.random() - 0.5) * 40,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          Math.random() < 0.1
        );
      }
      engine.settings.temperature = 0.5;
      setTimeout(() => {
        engine.settings.temperature = 0.15;
      }, 2500);
    } else if (presetId === 'smash') {
      engine.injectBeam('THOUGHT', 'left', 8.5, false, 0);
      engine.injectBeam('LOGIC', 'right', 8.5, false, 0);
    } else if (presetId === 'annihilation') {
      engine.injectBeam('LIGHT', 'left', 7.0, false, 0);
      engine.injectBeam('DARK', 'right', 7.0, true, 0);
    } else if (presetId === 'neuromorphic') {
      engine.attractors = [
        {
          id: 'well-center',
          x: engine.width / 2,
          y: engine.height / 2,
          strength: 0.5,
          radius: 90,
          type: 'gravity',
          label: 'SYNAPTIC BASIN',
        },
      ];
      engine.injectBeam('SYNAPSE', 'left', 4.5, false, -50);
      engine.injectBeam('BRAIN', 'right', 4.5, false, 50);
    }

    setTelemetry({ ...engine.telemetry });
  }, [engine]);

  // Particle acceleration / manipulation from inspector
  const handleAccelerateParticle = (p: LetterParticle) => {
    p.vx *= 1.8;
    p.vy *= 1.8;
    setTick((t) => t + 1);
  };

  const handleInvertPolarity = (p: LetterParticle) => {
    p.isAntimatter = !p.isAntimatter;
    p.charge *= -1;
    setTick((t) => t + 1);
  };

  const handleStimulateNeuron = (n: SynapticNeuron) => {
    n.membranePotential += 28.0;
    setTick((t) => t + 1);
  };

  // Export current particle coordinates, velocities, and momentum as JSON
  const handleExportState = () => {
    const jsonString = engine.exportState();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `particle_collider_state_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import and resume saved particle configuration
  const handleImportState = (jsonString: string) => {
    const success = engine.importState(jsonString);
    if (success) {
      setTick((t) => t + 1);
      setTelemetry({ ...engine.telemetry });
    }
  };

  // Celebrate when multiple stable words form
  useEffect(() => {
    if (telemetry.stableHadrons > 0 && telemetry.stableHadrons % 3 === 0) {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#38bdf8', '#4ade80', '#fbbf24'],
      });
    }
  }, [telemetry.stableHadrons]);

  return (
    <div className="min-h-screen bg-[#04060b] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Application Bar */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-950/80 border border-sky-600/50 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-900/20">
            <Atom className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-200 to-amber-200 font-mono">
                SYNAPTRON // NL-QPU
              </h1>
              <span className="text-[10px] font-mono text-sky-400 font-semibold bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">
                Linguistic Collider
              </span>
            </div>
            {/* Clean unboxed metadata with typographic separators compliant with Frontend Constitution */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Particle Physics Standard Model</span>
              <span aria-hidden="true">·</span>
              <span>8-Core Spiking Neuromorphic Substrate</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-400">STATUS: VACUUM ARMED</span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Isolated Research Chamber Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-md mr-2">
            <button
              onClick={() => setActiveLabBranch('bare_metal_crossbar')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeLabBranch === 'bare_metal_crossbar'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Bare-Metal Crossbar</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/40 text-sky-200">
                M4 25M
              </span>
            </button>
            <button
              onClick={() => setActiveLabBranch('collider')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeLabBranch === 'collider'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>Linguistic Collider</span>
            </button>
            <button
              onClick={() => setActiveLabBranch('temporal_multiscale')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeLabBranch === 'temporal_multiscale'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Temporal Multiscale</span>
            </button>
          </div>

          {activeLabBranch === 'collider' && (
            <>
              <button
                onClick={() => setShowGpuDashboard(!showGpuDashboard)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
                  showGpuDashboard
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-300'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>GPU Performance</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/40 text-cyan-200">
                  {engine.settings.useWebGPU ? 'WGSL' : 'CPU'}
                </span>
              </button>

              <button
                onClick={() => setShowTrainer(!showTrainer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
                  showTrainer
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Gutenberg Trainer</span>
                {engine.trainingStats.totalWordsParsed > 0 && (
                  <span className="bg-amber-950/80 text-amber-200 text-[10px] px-1.5 py-0.2 rounded font-mono">
                    {engine.trainingStats.uniqueVocabularyCount}w
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsTheoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-sky-300 font-medium transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Standard Model Theory</span>
              </button>

              <button
                onClick={() => handleRunPreset('bigbang')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Collider</span>
              </button>

              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  soundEngine.setMuted(!next);
                }}
                className={`p-1.5 rounded border text-xs transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-slate-900 border-slate-800 text-sky-400 hover:bg-slate-800'
                    : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                }`}
                title={soundEnabled ? 'Acoustic Synthesizer ON' : 'Acoustic Synthesizer MUTED'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </header>

      {activeLabBranch === 'bare_metal_crossbar' ? (
        <main className="flex-1 p-3 max-w-[1600px] w-full mx-auto space-y-3">
          <BareMetalCrossbarConsole
            onInjectIntoCollider={(tokens) => {
              setActiveLabBranch('collider');
              tokens.forEach((t, i) => {
                setTimeout(() => {
                  const side = i % 2 === 0 ? 'left' : 'right';
                  engine.injectBeam(
                    t,
                    side,
                    4.5 + Math.random() * 2,
                    false,
                    (i - tokens.length / 2) * 12
                  );
                  setTick((tick) => tick + 1);
                }, i * 140);
              });
            }}
          />
        </main>
      ) : activeLabBranch === 'temporal_multiscale' ? (
        <TemporalMultiscaleChamber />
      ) : (
        /* Main Workspace Layout */
        <main className="flex-1 p-3 max-w-[1600px] w-full mx-auto space-y-3">
        {/* Upper Real-Time Telemetry HUD */}
        <PhysicsHUD telemetry={telemetry} />

        {/* Real-Time WebGPU Compute Performance Dashboard (Collapsible) */}
        {showGpuDashboard && (
          <GpuPerformanceDashboard
            engine={engine}
            onClose={() => setShowGpuDashboard(false)}
          />
        )}

        {/* Project Gutenberg Book Trainer & Pattern Extractor (Collapsible) */}
        {showTrainer && (
          <GutenbergTrainer
            engine={engine}
            onTrainingComplete={(stats: BookTrainingStats) => {
              setTick((t) => t + 1);
              setTelemetry({ ...engine.telemetry });
              confetti({
                particleCount: 40,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#38bdf8', '#fbbf24', '#34d399'],
              });
            }}
            onInjectPredictedParticles={(tokens: string[]) => {
              setTick((t) => t + 1);
            }}
          />
        )}

        {/* Interactive Vacuum Chamber & Particle Pen */}
        <div className="space-y-2">
          {/* Particle Pen & Interaction Toolbar */}
          <ParticlePenToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            selectedChar={selectedChar}
            setSelectedChar={setSelectedChar}
            isAntimatter={isAntimatter}
            setIsAntimatter={setIsAntimatter}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            isPaused={engine.isPaused}
            onTogglePause={() => {
              engine.isPaused = !engine.isPaused;
              setTick((t) => t + 1);
            }}
            onExportState={handleExportState}
            onImportState={handleImportState}
          />

          {/* Main 60 FPS Collider Vacuum Canvas */}
          <div className="relative rounded-lg border border-slate-800 overflow-hidden shadow-2xl h-[520px]">
            <ColliderCanvas
              engine={engine}
              activeTool={activeTool}
              selectedChar={selectedChar}
              isAntimatter={isAntimatter}
              onSelectParticle={(p) => {
                setInspectedParticle(p);
                setInspectedNeuron(null);
              }}
              onSelectNeuron={(n) => {
                setInspectedNeuron(n);
                setInspectedParticle(null);
              }}
            />

            {/* Floating Inspector Drawer */}
            <InspectorDrawer
              particle={inspectedParticle}
              neuron={inspectedNeuron}
              onClose={() => {
                setInspectedParticle(null);
                setInspectedNeuron(null);
              }}
              onAccelerateParticle={handleAccelerateParticle}
              onInvertParticlePolarity={handleInvertPolarity}
              onStimulateNeuron={handleStimulateNeuron}
            />

            {/* Floating Synthesized Words Ticker overlay */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none text-xs">
              <div className="flex items-center gap-2 bg-[#090d18]/90 backdrop-blur-md px-3 py-1.5 rounded border border-slate-800/80 shadow-lg pointer-events-auto">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-slate-400 font-medium">Synthesized Words:</span>
                {telemetry.recognizedWords.length > 0 ? (
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {telemetry.recognizedWords.map((word, idx) => (
                      <span
                        key={idx}
                        className="text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 text-[11px] font-mono">
                    Colliding letters to assemble lexicon...
                  </span>
                )}
              </div>

              {telemetry.annihilationsCount > 0 && (
                <div className="bg-pink-950/80 text-pink-300 px-2.5 py-1 rounded border border-pink-700/60 font-mono text-[11px] shadow">
                  Annihilation Events: {telemetry.annihilationsCount}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lower Deck: Synchrotron Beam Injectors */}
        <BeamInjectorControls engine={engine} onRunPreset={handleRunPreset} />

        {/* Lower Deck: Neuromorphic Oscilloscope & Spiking Telemetry */}
        <NeuromorphicOscilloscope engine={engine} />

        {/* Lower Deck: Electromagnetic & Quantum Field Modulators */}
        <FieldModulatorPanel engine={engine} onUpdate={() => setTick((t) => t + 1)} />
      </main>
      )}

      {/* Standard Model Scientific Theory Modal */}
      <ParticlePhysicsTheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />
    </div>
  );
}
