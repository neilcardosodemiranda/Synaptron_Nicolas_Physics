/**
 * Relativistic Beam Injector & Experiment Preset Controller
 */

import React, { useState } from 'react';
import { NeuromorphicPhysicsEngine } from '../physics/engine';
import { Play, Zap, Flame, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface BeamInjectorControlsProps {
  engine: NeuromorphicPhysicsEngine;
  onRunPreset: (presetId: string) => void;
}

export const BeamInjectorControls: React.FC<BeamInjectorControlsProps> = ({
  engine,
  onRunPreset,
}) => {
  const [beamAText, setBeamAText] = useState('QUANTUM');
  const [beamAVelocity, setBeamAVelocity] = useState(6.5);
  const [beamAAntimatter, setBeamAAntimatter] = useState(false);

  const [beamBText, setBeamBText] = useState('NEURON');
  const [beamBVelocity, setBeamBVelocity] = useState(6.5);
  const [beamBAntimatter, setBeamBAntimatter] = useState(false);

  const [fountainActive, setFountainActive] = useState(false);
  const [fountainLetters, setFountainLetters] = useState('ATOMSYNAPSELOGIC');

  // Handle firing Left Beam
  const handleFireBeamA = () => {
    engine.injectBeam(beamAText, 'left', beamAVelocity, beamAAntimatter);
  };

  // Handle firing Right Beam
  const handleFireBeamB = () => {
    engine.injectBeam(beamBText, 'right', beamBVelocity, beamBAntimatter);
  };

  // Synchronous Dual Beam Collision
  const handleCollideDualBeams = () => {
    engine.injectBeam(beamAText, 'left', beamAVelocity, beamAAntimatter);
    engine.injectBeam(beamBText, 'right', beamBVelocity, beamBAntimatter);
  };

  // Toggle Continuous Fountain
  const toggleFountain = () => {
    const nextState = !fountainActive;
    setFountainActive(nextState);

    if (nextState) {
      const intervalId = window.setInterval(() => {
        if (!engine) return;
        const alphabet = fountainLetters.toUpperCase() || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
        const side = Math.random() > 0.5 ? 'left' : 'right';
        engine.injectBeam(randomChar, side, 4 + Math.random() * 3, Math.random() < 0.15, (Math.random() - 0.5) * 120);
      }, 350);

      (window as unknown as { __fountainInterval?: number }).__fountainInterval = intervalId;
    } else {
      const intervalId = (window as unknown as { __fountainInterval?: number }).__fountainInterval;
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-3 text-slate-300">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Synchrotron Particle Injectors
          </span>
        </div>
        <button
          onClick={handleCollideDualBeams}
          className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs shadow-sm transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>COLLIDE DUAL BEAMS</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Beamline A (Left Injector) */}
        <div className="bg-slate-900/80 p-2.5 rounded border border-sky-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-semibold text-sky-400">BEAMLINE-α [LEFT]</span>
            <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={beamAAntimatter}
                onChange={(e) => setBeamAAntimatter(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-pink-500 focus:ring-0"
              />
              <span className={beamAAntimatter ? 'text-pink-400 font-bold' : ''}>Antimatter</span>
            </label>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={beamAText}
              onChange={(e) => setBeamAText(e.target.value.toUpperCase())}
              placeholder="WORD OR LETTERS..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={handleFireBeamA}
              className="px-2.5 py-1 bg-slate-800 hover:bg-sky-700 text-sky-200 rounded font-medium transition-colors cursor-pointer"
            >
              FIRE α
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Velocity: {(beamAVelocity * 0.1).toFixed(2)}c</span>
            <input
              type="range"
              min="2"
              max="14"
              step="0.5"
              value={beamAVelocity}
              onChange={(e) => setBeamAVelocity(parseFloat(e.target.value))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Beamline B (Right Injector) */}
        <div className="bg-slate-900/80 p-2.5 rounded border border-amber-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-semibold text-amber-400">BEAMLINE-β [RIGHT]</span>
            <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={beamBAntimatter}
                onChange={(e) => setBeamBAntimatter(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-pink-500 focus:ring-0"
              />
              <span className={beamBAntimatter ? 'text-pink-400 font-bold' : ''}>Antimatter</span>
            </label>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={beamBText}
              onChange={(e) => setBeamBText(e.target.value.toUpperCase())}
              placeholder="WORD OR LETTERS..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleFireBeamB}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-700 text-amber-200 rounded font-medium transition-colors cursor-pointer"
            >
              FIRE β
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Velocity: {(beamBVelocity * 0.1).toFixed(2)}c</span>
            <input
              type="range"
              min="2"
              max="14"
              step="0.5"
              value={beamBVelocity}
              onChange={(e) => setBeamBVelocity(parseFloat(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Preset Experiments & Continuous Stream Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Collider Presets:</span>
          <button
            onClick={() => onRunPreset('bigbang')}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-sky-300 rounded border border-slate-800 text-[11px] transition-colors cursor-pointer"
          >
            Big Bang Soup
          </button>
          <button
            onClick={() => onRunPreset('smash')}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded border border-slate-800 text-[11px] transition-colors cursor-pointer"
          >
            Relativistic Smash
          </button>
          <button
            onClick={() => onRunPreset('annihilation')}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-pink-300 rounded border border-slate-800 text-[11px] transition-colors cursor-pointer"
          >
            Light ⊗ Dark Annihilation
          </button>
          <button
            onClick={() => onRunPreset('neuromorphic')}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded border border-slate-800 text-[11px] transition-colors cursor-pointer"
          >
            Memristor Logic
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFountain}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
              fountainActive
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${fountainActive ? 'animate-spin' : ''}`} />
            <span>{fountainActive ? 'Fountain Active' : 'Letter Stream'}</span>
          </button>

          <button
            onClick={() => engine.clearChamber()}
            className="px-2 py-1 bg-slate-900 hover:bg-rose-950 hover:border-rose-800 border border-slate-800 text-slate-400 hover:text-rose-300 rounded text-[11px] transition-colors cursor-pointer"
          >
            Clear Chamber
          </button>
        </div>
      </div>
    </div>
  );
};
