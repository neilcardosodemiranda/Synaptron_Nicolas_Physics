/**
 * Real-time Neuromorphic Oscilloscope & Synaptic Spiking Raster Plot
 * Renders membrane potentials (Vm), action potentials, and memristor weight matrix.
 */

import React, { useRef, useEffect } from 'react';
import { NeuromorphicPhysicsEngine } from '../physics/engine';
import { Activity, Cpu, Radio } from 'lucide-react';

interface NeuromorphicOscilloscopeProps {
  engine: NeuromorphicPhysicsEngine;
}

export const NeuromorphicOscilloscope: React.FC<NeuromorphicOscilloscopeProps> = ({ engine }) => {
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);
  const rasterCanvasRef = useRef<HTMLCanvasElement>(null);

  // History buffer for oscilloscope waveforms
  const historyRef = useRef<number[][]>([[], [], [], []]);

  useEffect(() => {
    let animId: number;

    const updateScopes = () => {
      // Sample membrane potential for first 4 neurons (representative of alpha, beta, gamma, delta)
      const coresSample = [
        engine.neurons[0]?.membranePotential ?? -70,
        engine.neurons[1]?.membranePotential ?? -70,
        engine.neurons[2]?.membranePotential ?? -70,
        engine.neurons[3]?.membranePotential ?? -70,
      ];

      coresSample.forEach((vm, idx) => {
        historyRef.current[idx].push(vm);
        if (historyRef.current[idx].length > 180) {
          historyRef.current[idx].shift();
        }
      });

      // 1. Draw Oscilloscope Waveforms
      const oscCanvas = oscCanvasRef.current;
      if (oscCanvas) {
        const ctx = oscCanvas.getContext('2d');
        if (ctx) {
          const w = oscCanvas.width;
          const h = oscCanvas.height;
          ctx.fillStyle = '#070b13';
          ctx.fillRect(0, 0, w, h);

          // Grid lines
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, h * 0.35); // Threshold ~ -50mV
          ctx.lineTo(w, h * 0.35);
          ctx.moveTo(0, h * 0.75); // Rest ~ -70mV
          ctx.lineTo(w, h * 0.75);
          ctx.stroke();

          // Threshold label
          ctx.fillStyle = '#f43f5e';
          ctx.font = '8px monospace';
          ctx.fillText('-50mV (THRESHOLD)', 4, h * 0.35 - 3);

          ctx.fillStyle = '#64748b';
          ctx.fillText('-70mV (REST)', 4, h * 0.75 - 3);

          const colors = ['#38bdf8', '#4ade80', '#f43f5e', '#fbbf24'];

          // Plot traces
          historyRef.current.forEach((history, coreIdx) => {
            if (history.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = colors[coreIdx];
            ctx.lineWidth = 1.5;

            const stepX = w / 180;
            history.forEach((val, i) => {
              // Map -80mV ... +40mV to Canvas Height
              const norm = (val - (-80)) / (40 - (-80));
              const y = h - norm * (h - 10) - 5;
              const x = i * stepX;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          });
        }
      }

      // 2. Draw Spike Raster Plot
      const rasterCanvas = rasterCanvasRef.current;
      if (rasterCanvas) {
        const ctx = rasterCanvas.getContext('2d');
        if (ctx) {
          const w = rasterCanvas.width;
          const h = rasterCanvas.height;
          ctx.fillStyle = '#070b13';
          ctx.fillRect(0, 0, w, h);

          const rowHeight = h / 8;
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
          ctx.lineWidth = 1;

          for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * rowHeight);
            ctx.lineTo(w, i * rowHeight);
            ctx.stroke();
          }

          const now = performance.now();
          const windowMs = 5000; // last 5 seconds

          engine.neurons.forEach((neuron, idx) => {
            const y = idx * rowHeight + rowHeight / 2;
            ctx.fillStyle =
              neuron.core === 'alpha'
                ? '#38bdf8'
                : neuron.core === 'beta'
                ? '#4ade80'
                : neuron.core === 'gamma'
                ? '#f43f5e'
                : '#fbbf24';

            neuron.spikeHistory.forEach((t) => {
              const age = now - t;
              if (age <= windowMs) {
                const x = w - (age / windowMs) * w;
                ctx.fillRect(x - 1, y - 4, 2, 8);
              }
            });
          });
        }
      }

      animId = requestAnimationFrame(updateScopes);
    };

    animId = requestAnimationFrame(updateScopes);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-3 text-slate-300">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Neuromorphic Oscilloscope & Spiking Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>{engine.telemetry.spikeRateHz} Hz Spikes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Oscilloscope Channel */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>MEMBRANE POTENTIAL [V_m(t)]</span>
            <div className="flex items-center gap-2 font-mono text-[9px]">
              <span className="text-sky-400">α</span>
              <span className="text-emerald-400">β</span>
              <span className="text-rose-400">γ</span>
              <span className="text-amber-400">δ</span>
            </div>
          </div>
          <canvas
            ref={oscCanvasRef}
            width={320}
            height={90}
            className="w-full h-24 rounded border border-slate-800/80 block bg-[#070b13]"
          />
        </div>

        {/* Spike Raster Channel */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>SYNAPTIC RASTER PLOT [8 CORES · 5s]</span>
            <span className="text-[10px] text-slate-500 font-mono">T-0 (NOW) ←</span>
          </div>
          <canvas
            ref={rasterCanvasRef}
            width={320}
            height={90}
            className="w-full h-24 rounded border border-slate-800/80 block bg-[#070b13]"
          />
        </div>
      </div>

      {/* Memristor Weights Conductance Strip */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span>Memristor Plasticity Conductance (STDP):</span>
        </div>
        <div className="flex items-center gap-1">
          {engine.neurons.slice(0, 8).map((n) => {
            const avgWeight =
              Object.values(n.weights).reduce((a, b) => a + b, 0) /
              (Object.values(n.weights).length || 1);
            return (
              <div
                key={n.id}
                title={`${n.label} Avg Weight: ${avgWeight.toFixed(2)}`}
                className="w-5 h-2.5 rounded-xs bg-slate-800 overflow-hidden relative"
              >
                <div
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${Math.round(avgWeight * 100)}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
