/**
 * Electromagnetic & Quantum Field Modulator Controls
 * Adjusts Lorentz B-field, Strong Binding Force, Thermal Annealing, and Collision physics.
 */

import React from 'react';
import { NeuromorphicPhysicsEngine } from '../physics/engine';
import { gpuAccelerator } from '../physics/webgpuEngine';
import { Sliders, Shield, Zap, Wind, Orbit, Cpu } from 'lucide-react';

interface FieldModulatorPanelProps {
  engine: NeuromorphicPhysicsEngine;
  onUpdate: () => void;
}

export const FieldModulatorPanel: React.FC<FieldModulatorPanelProps> = ({
  engine,
  onUpdate,
}) => {
  const settings = engine.settings;

  const handleChange = (key: keyof typeof settings, value: unknown) => {
    (engine.settings as unknown as Record<string, unknown>)[key] = value;
    onUpdate();
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-3 text-slate-300 text-xs">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="font-semibold uppercase tracking-wider text-slate-200">
            Electromagnetic & Quantum Field Modulators
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          VACUUM CHAMBER: 10⁻¹⁰ TORR
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lorentz Magnetic Deflection Field B_z */}
        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
          <div className="flex items-center justify-between mb-1.5 text-slate-300">
            <span className="flex items-center gap-1 font-medium">
              <Orbit className="w-3.5 h-3.5 text-sky-400" />
              <span>Lorentz B-Field:</span>
            </span>
            <span className="font-mono text-sky-400 font-bold">
              {settings.lorentzBField > 0 ? `+${settings.lorentzBField.toFixed(1)}` : settings.lorentzBField.toFixed(1)} T
            </span>
          </div>
          <input
            type="range"
            min="-3.5"
            max="3.5"
            step="0.1"
            value={settings.lorentzBField}
            onChange={(e) => handleChange('lorentzBField', parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>− Spin Left</span>
            <span>0</span>
            <span>+ Spin Right</span>
          </div>
        </div>

        {/* Strong Linguistic Binding Force */}
        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
          <div className="flex items-center justify-between mb-1.5 text-slate-300">
            <span className="flex items-center gap-1 font-medium">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Linguistic Gluon Force:</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {(settings.strongForceStrength * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.2"
            step="0.05"
            value={settings.strongForceStrength}
            onChange={(e) => handleChange('strongForceStrength', parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Weak Bond</span>
            <span>Resonant Lock</span>
          </div>
        </div>

        {/* Thermal Annealing / Temperature */}
        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
          <div className="flex items-center justify-between mb-1.5 text-slate-300">
            <span className="flex items-center gap-1 font-medium">
              <Wind className="w-3.5 h-3.5 text-rose-400" />
              <span>Thermal Annealing (T):</span>
            </span>
            <span className="font-mono text-rose-400 font-bold">
              {(settings.temperature * 100).toFixed(0)} K
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.2"
            step="0.05"
            value={settings.temperature}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0 K (Freeze)</span>
            <span>Plasma Soup</span>
          </div>
        </div>

        {/* Collision Interaction Mode */}
        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
          <div className="flex items-center justify-between mb-1.5 text-slate-300">
            <span className="flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Collision Mode:</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold uppercase">
              {settings.collisionMode}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['fusion', 'fission', 'elastic'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleChange('collisionMode', mode)}
                className={`py-1 rounded text-[10px] font-medium uppercase transition-colors cursor-pointer ${
                  settings.collisionMode === mode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {settings.collisionMode === 'fusion'
              ? 'Letters bond into words'
              : settings.collisionMode === 'fission'
              ? 'High impact breaks words'
              : 'Pure elastic ricochet'}
          </div>
        </div>
      </div>

      {/* Visual Layer Toggles */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <span className="font-medium text-slate-300">Visualization Layers:</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showTrails}
              onChange={(e) => handleChange('showTrails', e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Phosphor Trails</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showWaveFunctions}
              onChange={(e) => handleChange('showWaveFunctions', e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Quantum Wave-Packets</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showSynapticGrid}
              onChange={(e) => handleChange('showSynapticGrid', e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Synaptic Lattice & Memristors</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.quantumTunneling}
              onChange={(e) => handleChange('quantumTunneling', e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
            />
            <span>Quantum Tunneling</span>
          </label>
        </div>
      </div>

      {/* WebGPU Hardware Compute Acceleration Monitor & Control */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 px-3 py-2 rounded border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Cpu className={`w-4 h-4 ${settings.useWebGPU && gpuAccelerator.status.isInitialized ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="font-semibold uppercase tracking-wider text-slate-200 text-[11px]">
              Compute Core:
            </span>
          </div>

          {settings.useWebGPU && gpuAccelerator.status.isInitialized ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/90 text-cyan-300 border border-cyan-800/60 font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                ⚡ WEBGPU ACCELERATED
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {gpuAccelerator.status.adapterName} • @workgroup(64) • {gpuAccelerator.status.dispatchTimeUs} μs
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/50 font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                CPU PHYSICS FALLBACK
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                {!settings.useWebGPU ? '(Manual Toggle Disabled)' : gpuAccelerator.status.error || '(GPU Inactive in Browser)'}
              </span>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700/80 transition-colors">
          <input
            type="checkbox"
            checked={settings.useWebGPU}
            onChange={(e) => handleChange('useWebGPU', e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-[11px] font-medium text-slate-200">
            Enable WebGPU WGSL Compute
          </span>
        </label>
      </div>
    </div>
  );
};
