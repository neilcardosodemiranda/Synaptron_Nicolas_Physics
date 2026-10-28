/**
 * Standard Model of Linguistic Particle Physics & Neuromorphic Architecture Guide
 */

import React from 'react';
import { X, BookOpen, Atom, Zap, Shield, Sparkles } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParticlePhysicsTheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#090d18] border border-slate-700/80 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white">
                THE STANDARD MODEL OF LINGUISTIC PARTICLE PHYSICS
              </h2>
              <p className="text-[11px] text-slate-400">
                Synaptron NL-QPU (Neuromorphic Linguistic Quantum Processing Unit)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs leading-relaxed text-slate-300">
          {/* Section 1: The Particle Taxonomy */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-sky-400 mb-2 uppercase tracking-wider text-[11px]">
              <Atom className="w-4 h-4" />
              <span>1. Fundamental Particle Classification</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-sky-900/40">
                <div className="font-bold text-sky-300 mb-1">Leptonic Vowels (A, E, I, O, U, Y)</div>
                <div className="text-[11px] text-slate-400">
                  Ultra-light leptons ($m \approx 1.0$) carrying negative electric charge ($-1e$). They oscillate with high quantum phase frequencies and act as fluid binders between heavy consonant nuclei.
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-rose-900/40">
                <div className="font-bold text-rose-300 mb-1">Quark Consonants (P, T, K, S, M, etc.)</div>
                <div className="text-[11px] text-slate-400">
                  Massive hadrons-forming particles ($m \approx 1.8 - 3.5$) carrying positive charge ($+1e$) and Semantic Color Charge (Red: Plosive, Green: Fricative, Blue: Nasal).
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-900/40">
                <div className="font-bold text-amber-300 mb-1">Gauge Bosons (!, ?, #, γ, .)</div>
                <div className="text-[11px] text-slate-400">
                  Force-mediating bosons ($S = 1\hbar$) carrying punctuation charge. They mediate syntactic field transitions, reset membrane voltages, and propagate electromagnetic shockwaves.
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Strong Linguistic Force & Words as Hadrons */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-amber-400 mb-2 uppercase tracking-wider text-[11px]">
              <Shield className="w-4 h-4" />
              <span>2. Strong Linguistic Force & Word Condensation</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <p>
                In the Synaptron collider, letters attract via a modified Yukawa / spring potential when their spatial distance falls below the confinement radius. Complementary bigrams (e.g. <span className="font-mono text-sky-300">Q-U</span>, <span className="font-mono text-sky-300">T-H</span>, <span className="font-mono text-sky-300">S-T</span>, <span className="font-mono text-sky-300">I-N-G</span>) establish gluon flux tubes.
              </p>
              <p>
                When a sequence of bound letters forms a recognized English word in the dictionary (e.g., <span className="font-mono text-amber-300">ATOM</span>, <span className="font-mono text-amber-300">NEURON</span>, <span className="font-mono text-amber-300">QUANTUM</span>), it enters <span className="font-semibold text-slate-100">Mass Resonance</span>. The word stabilizes, gains a protective energy envelope, and resists fission!
              </p>
            </div>
          </div>

          {/* Section 3: Neuromorphic Computing via LIF Neurons */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-2 uppercase tracking-wider text-[11px]">
              <Zap className="w-4 h-4" />
              <span>3. Neuromorphic Computing Substrate</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <p>
                The vacuum chamber is ringed by <span className="font-semibold text-emerald-300">Leaky Integrate-and-Fire (LIF) neurons</span> organized across 4 cores (<span className="text-sky-300 font-mono">α</span>, <span className="text-emerald-300 font-mono">β</span>, <span className="text-rose-300 font-mono">γ</span>, <span className="text-amber-300 font-mono">δ</span>) interconnected by a memristor crossbar lattice.
              </p>
              <p>
                As charged letter particles pass through a neuron’s receptive field, their electromagnetic flux induces synaptic current (I<sub>syn</sub>). When the membrane potential reaches the -50 mV threshold, the neuron <span className="text-emerald-400 font-bold">SPIKES</span>! This spike kicks surrounding particles into new orbits and updates memristor weights via <span className="font-semibold text-slate-100">STDP</span> (Spike-Timing-Dependent Plasticity).
              </p>
            </div>
          </div>

          {/* Section 4: Antimatter Annihilation */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-pink-400 mb-2 uppercase tracking-wider text-[11px]">
              <Sparkles className="w-4 h-4" />
              <span>4. Antimatter & Annihilation Physics</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <p>
                When matter particles collide with their anti-quark counterparts (or when antonym words such as <span className="font-mono text-sky-300">LIGHT</span> and <span className="font-mono text-pink-400">DARK</span> collide), they undergo <span className="font-semibold text-pink-300">Matter-Antimatter Annihilation</span> ($E = mc^2$). The particles vanish, emitting high-energy gamma bosons ($\gamma$) and intense acoustic shockwaves.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
