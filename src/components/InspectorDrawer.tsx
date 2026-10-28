/**
 * Subatomic Particle & Neuromorphic Soma Inspector Drawer
 */

import React from 'react';
import { LetterParticle, SynapticNeuron } from '../types/physics';
import { X, Atom, Cpu, Zap, Activity } from 'lucide-react';

interface InspectorDrawerProps {
  particle: LetterParticle | null;
  neuron: SynapticNeuron | null;
  onClose: () => void;
  onAccelerateParticle?: (p: LetterParticle) => void;
  onInvertParticlePolarity?: (p: LetterParticle) => void;
  onStimulateNeuron?: (n: SynapticNeuron) => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  particle,
  neuron,
  onClose,
  onAccelerateParticle,
  onInvertParticlePolarity,
  onStimulateNeuron,
}) => {
  if (!particle && !neuron) return null;

  return (
    <div className="absolute top-3 right-3 w-80 bg-[#090d17]/95 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl p-3.5 text-slate-300 text-xs z-30">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {particle ? (
            <Atom className="w-4 h-4 text-sky-400" />
          ) : (
            <Cpu className="w-4 h-4 text-emerald-400" />
          )}
          <span className="font-semibold uppercase tracking-wider text-slate-100">
            {particle ? `Quantum Particle [ ${particle.char} ]` : `Neuromorphic Soma [ ${neuron?.label} ]`}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {particle && (
        <div className="space-y-3 font-mono">
          {/* Particle Character Header */}
          <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-black ${
                particle.isAntimatter
                  ? 'bg-purple-950 text-pink-400 border border-pink-700'
                  : particle.type === 'lepton'
                  ? 'bg-sky-950 text-sky-300 border border-sky-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}
            >
              {particle.char}
            </div>
            <div>
              <div className="font-sans font-bold text-slate-200">
                {particle.isAntimatter ? 'Anti-Linguistic Quark' : particle.type === 'lepton' ? 'Leptonic Vowel' : 'Quark Consonant'}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                {particle.hadronId ? 'Bound into Hadron Word' : 'Free Unbound Particle'}
              </div>
            </div>
          </div>

          {/* Quantum Standard Model Properties */}
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Rest Mass (m₀):</span>
              <span className="text-slate-200 font-bold">{particle.mass.toFixed(2)} MeV/c²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Electrical Charge (q):</span>
              <span className={particle.charge > 0 ? 'text-rose-400 font-bold' : particle.charge < 0 ? 'text-sky-400 font-bold' : 'text-amber-400'}>
                {particle.charge > 0 ? `+${particle.charge.toFixed(1)}e` : `${particle.charge.toFixed(1)}e`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quantum Spin (S):</span>
              <span className="text-slate-200 font-bold">{particle.spin} ℏ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Semantic Color:</span>
              <span className="capitalize font-bold text-slate-200">{particle.color}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kinetic Energy:</span>
              <span className="text-sky-400 font-bold">{particle.energy.toFixed(2)} GeV</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Velocity Vector:</span>
              <span className="text-slate-300">({particle.vx.toFixed(2)}, {particle.vy.toFixed(2)})</span>
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
            <button
              onClick={() => onAccelerateParticle?.(particle)}
              className="px-2 py-1.5 bg-sky-900/60 hover:bg-sky-800 border border-sky-700/60 text-sky-200 rounded font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Boost +3c</span>
            </button>
            <button
              onClick={() => onInvertParticlePolarity?.(particle)}
              className="px-2 py-1.5 bg-pink-950/60 hover:bg-pink-900 border border-pink-700/60 text-pink-200 rounded font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Flip Polarity</span>
            </button>
          </div>
        </div>
      )}

      {neuron && (
        <div className="space-y-3 font-mono">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">{neuron.label}</span>
              <span className="text-[10px] uppercase text-slate-400">Core: {neuron.core}</span>
            </div>
            <div className="mt-1 text-[11px] font-sans text-sky-300 font-medium">
              {neuron.specialization}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Membrane Potential:</span>
                <span className="text-slate-100 font-bold">{neuron.membranePotential.toFixed(1)} mV</span>
              </div>
              <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        ((neuron.membranePotential - neuron.restPotential) /
                          (neuron.threshold - neuron.restPotential)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>Rest -70mV</span>
                <span className="text-rose-400">Thresh -50mV</span>
              </div>
            </div>
          </div>

          {/* Learned Token Associations from Books */}
          {neuron.learnedTokens && neuron.learnedTokens.length > 0 && (
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-[11px]">
              <div className="text-slate-400 font-sans font-semibold mb-1">
                Learned Book Patterns ({neuron.learnedTokens.length}):
              </div>
              <div className="flex flex-wrap gap-1">
                {neuron.learnedTokens.slice(0, 8).map((tok, idx) => (
                  <span
                    key={idx}
                    className="bg-sky-950 text-sky-300 border border-sky-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                  >
                    {tok}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 p-2 rounded border border-slate-800 text-[11px] space-y-1">
            <div className="text-slate-400 font-sans font-semibold mb-1">Memristor Synaptic Conductances:</div>
            {Object.entries(neuron.weights).slice(0, 4).map(([target, w]) => (
              <div key={target} className="flex justify-between">
                <span className="text-slate-400">→ {target}:</span>
                <span className="text-sky-300 font-bold">{w.toFixed(3)} S</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onStimulateNeuron?.(neuron)}
            className="w-full py-1.5 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 rounded font-medium text-xs flex items-center justify-center gap-1.5 font-sans cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inject Depolarizing Current (+25mV)</span>
          </button>
        </div>
      )}
    </div>
  );
};
