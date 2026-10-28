/**
 * WebGPU Compute Performance Dashboard
 * Scientific instrumentation displaying real-time WGSL compute kernel timing,
 * VRAM memory allocation metrics, workgroup SIMD occupancy, and theoretical throughput.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NeuromorphicPhysicsEngine } from '../physics/engine';
import { gpuAccelerator, WebGPUStatus } from '../physics/webgpuEngine';
import {
  Cpu,
  Zap,
  Activity,
  HardDrive,
  Layers,
  Gauge,
  Play,
  CheckCircle,
  X,
  Code2,
  RefreshCw,
} from 'lucide-react';

interface GpuPerformanceDashboardProps {
  engine: NeuromorphicPhysicsEngine;
  onClose?: () => void;
}

export const GpuPerformanceDashboard: React.FC<GpuPerformanceDashboardProps> = ({
  engine,
  onClose,
}) => {
  // Reactive copy of GPU status updated on high-frequency interval
  const [gpuStatus, setGpuStatus] = useState<WebGPUStatus>({ ...gpuAccelerator.status });
  const [activeTab, setActiveTab] = useState<'telemetry' | 'memory' | 'shader'>('telemetry');
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    iterations: number;
    avgUs: number;
    minUs: number;
    maxUs: number;
    gflops: number;
    particlesBenchmarked: number;
  } | null>(null);

  // Poll GPU telemetry at ~20 Hz
  useEffect(() => {
    const timer = setInterval(() => {
      setGpuStatus({
        ...gpuAccelerator.status,
        memory: { ...gpuAccelerator.status.memory },
        kernel: {
          ...gpuAccelerator.status.kernel,
          timingHistory: [...gpuAccelerator.status.kernel.timingHistory],
        },
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const k = gpuStatus.kernel;
  const mem = gpuStatus.memory;

  // Format bytes into readable KB/MB
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Sparkline SVG geometry calculations
  const sparklineData = useMemo(() => {
    const history = k.timingHistory;
    if (!history || history.length === 0) return { path: '', area: '', min: 0, max: 100 };

    const maxVal = Math.max(100, ...history) * 1.15;
    const minVal = 0;
    const width = 420;
    const height = 90;
    const step = width / Math.max(1, history.length - 1);

    const points = history.map((val, idx) => {
      const x = idx * step;
      const normalized = (val - minVal) / (maxVal - minVal || 1);
      const y = height - normalized * (height - 12) - 6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const path = `M ${points.join(' L ')}`;
    const area = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

    return { path, area, min: minVal, max: Math.round(maxVal) };
  }, [k.timingHistory]);

  // Run automated 100-dispatch hardware benchmark
  const handleExecuteBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkResult(null);
    try {
      const res = await gpuAccelerator.runBenchmark(100);
      setBenchmarkResult(res);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const isWebGpuActive = engine.settings.useWebGPU && gpuStatus.isInitialized;

  return (
    <div className="bg-[#080c16] border border-slate-800 rounded-lg text-slate-200 shadow-2xl overflow-hidden flex flex-col">
      {/* Instrumentation Header */}
      <div className="border-b border-slate-800/90 bg-[#0c111f] px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-100 font-mono">
                WebGPU Compute Kernel Telemetry & Memory Dashboard
              </h2>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  isWebGpuActive
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                }`}
              >
                {isWebGpuActive ? 'HARDWARE DISPATCH ACTIVE' : 'CPU SIMULATION FALLBACK'}
              </span>
            </div>
            {/* Zero-Pill Metadata Discipline */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>Adapter: {gpuStatus.adapterName}</span>
              <span aria-hidden="true">·</span>
              <span>Architecture: {gpuStatus.architecture}</span>
              <span aria-hidden="true">·</span>
              <span>Workgroup: 64 Invocations</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-2">
          {/* Tab selector buttons */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kernel Latency
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'memory'
                  ? 'bg-cyan-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              VRAM Footprint
            </button>
            <button
              onClick={() => setActiveTab('shader')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'shader'
                  ? 'bg-cyan-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WGSL Shader
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Close Dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Ribbon (Anti-slop, clean tabular typography) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 border-b border-slate-800/80 bg-[#0a0f1d] divide-x divide-slate-800/60 text-xs">
        {/* Metric 1: Instantaneous Latency */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
            Dispatch Duration
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold font-mono tabular-nums text-cyan-300">
              {k.dispatchTimeUs}
            </span>
            <span className="text-[10px] font-mono text-slate-400 ml-1.5">μs / frame</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            avg {k.avgDispatchTimeUs} μs · min {k.minDispatchTimeUs} μs
          </div>
        </div>

        {/* Metric 2: Pairwise Throughput */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
            Pairwise N-Body Rate
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold font-mono tabular-nums text-amber-300">
              {k.megaInteractionsPerSec}
            </span>
            <span className="text-[10px] font-mono text-slate-400 ml-1.5">M-Interactions/s</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {k.pairwiseInteractions.toLocaleString()} pairwise ops/frame
          </div>
        </div>

        {/* Metric 3: Compute Throughput */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
            Estimated Compute
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-300">
              {k.estimatedGflops}
            </span>
            <span className="text-[10px] font-mono text-slate-400 ml-1.5">GFLOP/s</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            tiled shared memory
          </div>
        </div>

        {/* Metric 4: Workgroups & Threads */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
            SIMD Workgroups
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold font-mono tabular-nums text-indigo-300">
              {k.workgroupCount}
            </span>
            <span className="text-[10px] font-mono text-slate-400 ml-1.5">
              ({k.workgroupCount * 64} lanes)
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {k.occupancyPct}% warp occupancy
          </div>
        </div>

        {/* Metric 5: Total VRAM Allocation */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
            Allocated VRAM
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold font-mono tabular-nums text-purple-300">
              {formatBytes(mem.totalAllocatedBytes)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {mem.theoreticalBandwidthGBs} GB/s bandwidth
          </div>
        </div>

        {/* Metric 6: Active Particles */}
        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
            Active Particles
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold font-mono tabular-nums text-sky-300">
              {k.activeParticleCount}
            </span>
            <span className="text-[10px] font-mono text-slate-400 ml-1.5">bodies</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {k.totalDispatches.toLocaleString()} total passes
          </div>
        </div>
      </div>

      {/* Main Tab Content Stage */}
      <div className="p-4">
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            {/* Real-Time Dispatch Latency Waveform Graph */}
            <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-slate-200 text-xs">
                    Compute Kernel Execution Latency Waveform
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Current: <span className="text-cyan-300">{k.dispatchTimeUs} μs</span></span>
                  <span aria-hidden="true">·</span>
                  <span>Min: <span className="text-emerald-400">{k.minDispatchTimeUs} μs</span></span>
                  <span aria-hidden="true">·</span>
                  <span>Max: <span className="text-rose-400">{k.maxDispatchTimeUs} μs</span></span>
                  <span aria-hidden="true">·</span>
                  <span>Window: 60 Frames</span>
                </div>
              </div>

              {/* SVG Oscilloscope Sparkline */}
              <div className="relative w-full h-[100px] bg-slate-950/80 rounded border border-slate-800/80 overflow-hidden flex items-center justify-center">
                {/* Grid guidelines */}
                <div className="absolute inset-0 grid grid-rows-3 grid-cols-6 pointer-events-none opacity-20">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="border-b border-r border-cyan-500" />
                  ))}
                </div>

                {isWebGpuActive ? (
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 420 90"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="gpuLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {sparklineData.area && (
                      <path d={sparklineData.area} fill="url(#gpuLatencyGrad)" />
                    )}
                    {sparklineData.path && (
                      <path
                        d={sparklineData.path}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                ) : (
                  <div className="text-slate-500 text-xs font-mono text-center px-4">
                    WebGPU compute shader currently inactive or falling back to CPU physics. Enable WebGPU below.
                  </div>
                )}
              </div>
            </div>

            {/* Parallel Configuration & Interactive Control Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: GPU Execution Controls */}
              <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span>Kernel Configuration & Parallel Acceleration</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Pairwise N-Body Acceleration Toggle */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div>
                      <div className="font-medium text-slate-200">
                        WGSL Pairwise N-Body Interaction
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Computes all O(N²) Coulomb repulsion and Pauli contact impulses directly on GPU
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gpuStatus.enablePairwiseGpu}
                        onChange={(e) => gpuAccelerator.setPairwiseGpu(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>

                  {/* Master WebGPU Toggle */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div>
                      <div className="font-medium text-slate-200">
                        Enable WebGPU Accelerator
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Switch seamlessly between WebGPU WGSL compute and CPU physics loop
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={engine.settings.useWebGPU}
                        onChange={(e) => {
                          engine.settings.useWebGPU = e.target.checked;
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                </div>

                {/* Benchmark Runner */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Run 100 consecutive compute dispatches to measure sustained throughput:
                  </div>
                  <button
                    onClick={handleExecuteBenchmark}
                    disabled={isBenchmarking || !isWebGpuActive}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                  >
                    {isBenchmarking ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Benchmarking...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Run 100-Pass Benchmark</span>
                      </>
                    )}
                  </button>
                </div>

                {benchmarkResult && (
                  <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-800/60 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Benchmark Completed ({benchmarkResult.iterations} dispatches)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                      <div>Average: <span className="text-white font-bold">{benchmarkResult.avgUs} μs</span></div>
                      <div>Min / Max: <span className="text-white">{benchmarkResult.minUs} / {benchmarkResult.maxUs} μs</span></div>
                      <div>Throughput: <span className="text-emerald-300 font-bold">{benchmarkResult.gflops} GFLOP/s</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 2: Workgroup SIMD Topology */}
              <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Workgroup SIMD Topology & Occupancy</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Workgroup Invocations (WG_SIZE):</span>
                    <span className="font-mono text-indigo-300 font-medium">64 threads / block</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Active Workgroups Dispatched:</span>
                    <span className="font-mono text-slate-200 font-medium">{k.workgroupCount} blocks</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Max Device Workgroup Size X:</span>
                    <span className="font-mono text-slate-200 font-medium">{gpuStatus.maxWorkgroupSizeX}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Shared Memory Tile Capacity:</span>
                    <span className="font-mono text-cyan-300 font-medium">64 particles (2,048 B / group)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Pairwise Interaction Architecture:</span>
                    <span className="font-mono text-emerald-300 font-medium">Tiled Workgroup Barriers</span>
                  </div>
                </div>

                {/* Warp Occupancy Meter */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">SIMD Lane Occupancy:</span>
                    <span className="font-mono text-cyan-300 font-bold">{k.occupancyPct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, k.occupancyPct))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-4">
            {/* VRAM Memory Allocation Breakdown */}
            <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-slate-200 text-xs">
                    VRAM Buffer Allocation Architecture & Bandwidth
                  </span>
                </div>
                <div className="text-[11px] font-mono text-purple-300">
                  Total Allocated: {formatBytes(mem.totalAllocatedBytes)}
                </div>
              </div>

              {/* Segmented memory bar */}
              <div>
                <div className="flex h-3 rounded overflow-hidden border border-slate-800 bg-slate-900">
                  <div
                    style={{ width: '48%' }}
                    className="bg-cyan-600"
                    title={`Storage Buffer (Read/Write): ${formatBytes(mem.particleStorageBytes)}`}
                  />
                  <div
                    style={{ width: '4%' }}
                    className="bg-amber-500"
                    title={`Uniform Parameters: ${formatBytes(mem.paramsUniformBytes)}`}
                  />
                  <div
                    style={{ width: '48%' }}
                    className="bg-purple-600"
                    title={`Staging Readback Buffer: ${formatBytes(mem.stagingReadBytes)}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-cyan-600 inline-block" />
                    Storage Buffer ({formatBytes(mem.particleStorageBytes)})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" />
                    Uniforms ({formatBytes(mem.paramsUniformBytes)})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-purple-600 inline-block" />
                    MAP_READ Staging ({formatBytes(mem.stagingReadBytes)})
                  </span>
                </div>
              </div>

              {/* Detailed Buffer Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                      <th className="py-2 px-3">Buffer Identification</th>
                      <th className="py-2 px-3">Usage Flags</th>
                      <th className="py-2 px-3">Stride</th>
                      <th className="py-2 px-3">Capacity</th>
                      <th className="py-2 px-3 text-right">Allocation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="font-semibold text-cyan-300">particleBuffer</div>
                        <div className="text-[10px] text-slate-500 font-sans">Primary kinematics & N-body state</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">STORAGE | COPY_DST | COPY_SRC</td>
                      <td className="py-2.5 px-3 text-slate-300">32 bytes (8 f32s)</td>
                      <td className="py-2.5 px-3 text-slate-300">1,024 bodies</td>
                      <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">
                        {formatBytes(mem.particleStorageBytes)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="font-semibold text-amber-300">paramsBuffer</div>
                        <div className="text-[10px] text-slate-500 font-sans">Time-step, damping, Lorentz B, Coulomb k</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">UNIFORM | COPY_DST</td>
                      <td className="py-2.5 px-3 text-slate-300">32 bytes (8 scalars)</td>
                      <td className="py-2.5 px-3 text-slate-300">1 frame state</td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                        {formatBytes(mem.paramsUniformBytes)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="font-semibold text-purple-300">readBuffer</div>
                        <div className="text-[10px] text-slate-500 font-sans">Asynchronous staging buffer for CPU unmap</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">MAP_READ | COPY_DST</td>
                      <td className="py-2.5 px-3 text-slate-300">32 bytes</td>
                      <td className="py-2.5 px-3 text-slate-300">1,024 bodies</td>
                      <td className="py-2.5 px-3 text-right text-purple-300 font-bold">
                        {formatBytes(mem.stagingReadBytes)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hardware VRAM Limits */}
            <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-slate-200">Hardware Adapter Limits</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px] text-slate-400">
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">MAX STORAGE BINDING</div>
                  <div className="text-slate-200 font-bold mt-0.5">{formatBytes(gpuStatus.maxStorageBufferSize)}</div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">POWER PREFERENCE</div>
                  <div className="text-cyan-300 font-bold mt-0.5">High Performance Dedicated</div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">THEORETICAL BANDWIDTH</div>
                  <div className="text-emerald-300 font-bold mt-0.5">{mem.theoreticalBandwidthGBs} GB/s</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shader' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-200">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>WGSL Compute Pipeline Source (Shading Language Spec)</span>
              </div>
              <div className="font-mono text-[11px] text-slate-400">
                Entry: main · Workgroup: (64, 1, 1)
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-200/90 overflow-x-auto max-h-[300px] leading-relaxed">
              <pre>{gpuAccelerator.wgslShaderCode.trim()}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
