/**
 * Real-time Physical Telemetry HUD
 * Displays active particles, stable hadrons, compute ops, kinetic energy, and recognized words.
 */

import React from 'react';
import { ComputerTelemetry } from '../types/physics';
import { Atom, Zap, Gauge, Flame, Sparkles } from 'lucide-react';

interface PhysicsHUDProps {
  telemetry: ComputerTelemetry;
}

export const PhysicsHUD: React.FC<PhysicsHUDProps> = ({ telemetry }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {/* Particle Quarks / Leptons */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
          <Atom className="w-3.5 h-3.5 text-sky-400" />
          <span>Active Particles</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-slate-100">
            {telemetry.particleCount}
          </span>
          <span className="text-[10px] text-slate-500">quarks/leptons</span>
        </div>
      </div>

      {/* Bound Hadrons (Words) */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Synthesized Words</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-amber-300">
            {telemetry.stableHadrons}
          </span>
          <span className="text-[10px] text-slate-500">/ {telemetry.wordCount} hadrons</span>
        </div>
      </div>

      {/* Neuromorphic Spike Frequency */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Spike Freq</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-emerald-400">
            {telemetry.spikeRateHz}
          </span>
          <span className="text-[10px] text-slate-500">Hz</span>
        </div>
      </div>

      {/* Kinetic Energy */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Kinetic Energy</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-rose-400">
            {telemetry.totalKineticEnergy}
          </span>
          <span className="text-[10px] text-slate-500">GeV</span>
        </div>
      </div>

      {/* Semantic Entropy */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
          <Gauge className="w-3.5 h-3.5 text-purple-400" />
          <span>Entropy</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-purple-300">
            {telemetry.entropy}
          </span>
          <span className="text-[10px] text-slate-500">bits</span>
        </div>
      </div>

      {/* Compute Operations / Sec */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping" />
          <span>Neuromorphic Ops</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-cyan-300">
            {(telemetry.opsPerSecond / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-slate-500">ops/s</span>
        </div>
      </div>
    </div>
  );
};
