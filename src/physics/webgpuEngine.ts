/**
 * WebGPU Compute Accelerator for Particle Dynamics
 * Accelerates pairwise particle forces, Coulomb repulsion, relativistic kinematics,
 * and Lorentz deflection using WGSL compute shaders.
 * Automatically falls back gracefully to CPU physics when WebGPU is unavailable or disabled.
 */

export interface WebGpuMemoryMetrics {
  particleStorageBytes: number;
  paramsUniformBytes: number;
  stagingReadBytes: number;
  totalAllocatedBytes: number;
  theoreticalBandwidthGBs: number;
}

export interface WebGpuKernelMetrics {
  dispatchTimeUs: number;
  avgDispatchTimeUs: number;
  minDispatchTimeUs: number;
  maxDispatchTimeUs: number;
  timingHistory: number[]; // Rolling buffer of last 60 dispatches (in microseconds)
  workgroupSize: number;
  workgroupCount: number;
  activeParticleCount: number;
  occupancyPct: number;
  pairwiseInteractions: number;
  megaInteractionsPerSec: number;
  estimatedGflops: number;
  totalDispatches: number;
}

export interface CrossbarComputeMetrics {
  dispatchTimeUs: number;
  avgDispatchTimeUs: number;
  totalCrossbarDispatches: number;
  activeHorizons: number;
  simulatedMemristors: number;
  bandwidthGBs: number;
  gflops: number;
  timingHistory: number[];
}

export interface WebGPUStatus {
  isSupported: boolean;
  isInitialized: boolean;
  adapterName: string;
  vendor: string;
  architecture: string;
  maxWorkgroupSizeX: number;
  maxStorageBufferSize: number;
  error?: string;
  enablePairwiseGpu: boolean;
  dispatchTimeUs: number;
  workgroupSize: number;
  memory: WebGpuMemoryMetrics;
  kernel: WebGpuKernelMetrics;
  crossbar: CrossbarComputeMetrics;
}

export class WebGPUAccelerator {
  public device: GPUDevice | null = null;
  public adapter: GPUAdapter | null = null;
  public pipeline: GPUComputePipeline | null = null;

  public status: WebGPUStatus = {
    isSupported: false,
    isInitialized: false,
    adapterName: 'Detecting Hardware...',
    vendor: 'Generic',
    architecture: 'Unified GPU',
    maxWorkgroupSizeX: 256,
    maxStorageBufferSize: 128 * 1024 * 1024,
    enablePairwiseGpu: true,
    dispatchTimeUs: 0,
    workgroupSize: 64,
    memory: {
      particleStorageBytes: 0,
      paramsUniformBytes: 32,
      stagingReadBytes: 0,
      totalAllocatedBytes: 0,
      theoreticalBandwidthGBs: 0,
    },
    kernel: {
      dispatchTimeUs: 0,
      avgDispatchTimeUs: 0,
      minDispatchTimeUs: 0,
      maxDispatchTimeUs: 0,
      timingHistory: new Array(60).fill(0),
      workgroupSize: 64,
      workgroupCount: 0,
      activeParticleCount: 0,
      occupancyPct: 0,
      pairwiseInteractions: 0,
      megaInteractionsPerSec: 0,
      estimatedGflops: 0,
      totalDispatches: 0,
    },
    crossbar: {
      dispatchTimeUs: 0,
      avgDispatchTimeUs: 0,
      totalCrossbarDispatches: 0,
      activeHorizons: 8,
      simulatedMemristors: 0,
      bandwidthGBs: 0,
      gflops: 0,
      timingHistory: new Array(60).fill(0),
    },
  };

  public crossbarPipeline: GPUComputePipeline | null = null;
  private particleBuffer: GPUBuffer | null = null;
  private paramsBuffer: GPUBuffer | null = null;
  private readBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private maxParticles: number = 1024;
  private isBenchmarking: boolean = false;

  // WGSL Compute Shader for Parallel CSR Memristor Crossbar Resonance
  public readonly crossbarWgslShaderCode = `
    struct CrossbarUniforms {
      vocabCount: u32,
      horizonCount: u32,
      refractoryHalfLife: f32,
      temperature: f32,
    };

    @group(0) @binding(0) var<storage, read> colHorizon: array<u32>;
    @group(0) @binding(1) var<storage, read> conductance: array<f32>;
    @group(0) @binding(2) var<storage, read> rowPtr: array<u32>;
    @group(0) @binding(3) var<storage, read> rowCounts: array<u32>;
    @group(0) @binding(4) var<storage, read> wavefront: array<u32>;
    @group(0) @binding(5) var<storage, read_write> refractoryPsi: array<f32>;
    @group(0) @binding(6) var<storage, read_write> outCurrents: array<f32>;
    @group(0) @binding(7) var<uniform> crossbarParams: CrossbarUniforms;

    @compute @workgroup_size(256)
    fn crossbar_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
      let targetId = global_id.x;
      if (targetId >= crossbarParams.vocabCount) {
        return;
      }

      // Pauli-exclusion refractory recovery: dPsi/dt = (1.0 - Psi) / tau
      let recRate = 1.0 / max(1.0, crossbarParams.refractoryHalfLife);
      var psi = refractoryPsi[targetId];
      if (psi < 1.0) {
        psi = min(1.0, psi + (1.0 - psi) * recRate);
        refractoryPsi[targetId] = psi;
      }

      var totalI: f32 = 0.0;
      let hDecay = array<f32, 8>(1.0, 0.88, 0.76, 0.64, 0.52, 0.42, 0.33, 0.25);

      // Multi-horizon Kirchhoff current summation across 8 delay lines
      for (var delta = 0u; delta < crossbarParams.horizonCount; delta = delta + 1u) {
        let sourceId = wavefront[delta];
        if (sourceId == 0u || sourceId >= crossbarParams.vocabCount) {
          continue;
        }
        let start = rowPtr[sourceId];
        let count = rowCounts[sourceId];
        for (var k = 0u; k < count; k = k + 1u) {
          let idx = start + k;
          let packed = colHorizon[idx];
          let tId = (packed >> 8u) & 0xffffffu;
          let edgeH = packed & 0xffu;
          if (tId == targetId && edgeH == delta) {
            totalI = totalI + conductance[idx] * hDecay[delta] * psi;
          }
        }
      }

      outCurrents[targetId] = totalI;
    }
  `;

  // WGSL Compute Shader with Shared Memory Tiling for Massively Parallel N-Body Interaction & Kinematics
  public readonly wgslShaderCode = `
    struct Particle {
      x: f32,
      y: f32,
      vx: f32,
      vy: f32,
      fx: f32,
      fy: f32,
      mass: f32,
      charge: f32,
    };

    struct Params {
      dt: f32,
      damping: f32,
      lorentzB: f32,
      width: f32,
      height: f32,
      particleCount: u32,
      coulombK: f32,
      enablePairwise: u32,
    };

    @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
    @group(0) @binding(1) var<uniform> params: Params;

    var<workgroup> tile: array<Particle, 64>;

    @compute @workgroup_size(64)
    fn main(
      @builtin(global_invocation_id) global_id: vec3<u32>,
      @builtin(local_invocation_id) local_id: vec3<u32>,
      @builtin(workgroup_id) group_id: vec3<u32>
    ) {
      let index = global_id.x;
      let n = params.particleCount;

      var p: Particle;
      var totalFx: f32 = 0.0;
      var totalFy: f32 = 0.0;

      if (index < n) {
        p = particles[index];
        totalFx = p.fx;
        totalFy = p.fy;
      }

      // Massively Parallel N-Body Pairwise Interactions via Workgroup Tiling
      if (params.enablePairwise == 1u && n > 1u) {
        let numTiles = (n + 63u) / 64u;

        for (var t = 0u; t < numTiles; t = t + 1u) {
          let loadIdx = t * 64u + local_id.x;
          if (loadIdx < n) {
            tile[local_id.x] = particles[loadIdx];
          }
          workgroupBarrier();

          if (index < n) {
            let tileEnd = min(64u, n - t * 64u);
            for (var j = 0u; j < tileEnd; j = j + 1u) {
              let otherIdx = t * 64u + j;
              if (otherIdx != index) {
                let other = tile[j];
                let dx = other.x - p.x;
                let dy = other.y - p.y;
                let distSq = dx * dx + dy * dy;
                let dist = sqrt(max(distSq, 1.0));

                // 1. Coulomb Electrostatic force: F = (k * q1 * q2) / (distSq + epsilon)
                if (dist < 260.0) {
                  let fCoulomb = (params.coulombK * p.charge * other.charge) / (distSq + 120.0);
                  let nx = dx / dist;
                  let ny = dy / dist;
                  totalFx = totalFx - fCoulomb * nx;
                  totalFy = totalFy - fCoulomb * ny;
                }

                // 2. Short-range Pauli Exclusion / Elastic contact repulsion
                let minDist = 32.0;
                if (dist < minDist) {
                  let overlap = minDist - dist;
                  let nx = dx / dist;
                  let ny = dy / dist;
                  let push = overlap * 4.5;
                  totalFx = totalFx - push * nx;
                  totalFy = totalFy - push * ny;
                }
              }
            }
          }
          workgroupBarrier();
        }
      }

      if (index >= n) {
        return;
      }

      // 3. Lorentz Magnetic Deflection: F_x = q * v_y * B, F_y = -q * v_x * B
      let lorentzFx = p.charge * p.vy * params.lorentzB * 0.15;
      let lorentzFy = -p.charge * p.vx * params.lorentzB * 0.15;

      totalFx = totalFx + lorentzFx;
      totalFy = totalFy + lorentzFy;

      // 4. Kinematic Acceleration & Velocity Integration: a = F / m
      let ax = totalFx / max(p.mass, 0.1);
      let ay = totalFy / max(p.mass, 0.1);

      p.vx = (p.vx + ax * params.dt) * params.damping;
      p.vy = (p.vy + ay * params.dt) * params.damping;

      // 5. Relativistic Position Update
      p.x = p.x + p.vx * params.dt;
      p.y = p.y + p.vy * params.dt;

      // 6. Chamber Boundary Elastic Restitution
      let margin = 16.0;
      if (p.x < margin) {
        p.x = margin;
        p.vx = abs(p.vx) * 0.8;
      } else if (p.x > params.width - margin) {
        p.x = params.width - margin;
        p.vx = -abs(p.vx) * 0.8;
      }

      if (p.y < margin) {
        p.y = margin;
        p.vy = abs(p.vy) * 0.8;
      } else if (p.y > params.height - margin) {
        p.y = params.height - margin;
        p.vy = -abs(p.vy) * 0.8;
      }

      particles[index] = p;
    }
  `;

  /**
   * Initialize WebGPU adapter and compute pipeline
   */
  public async init(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      this.status.isSupported = false;
      this.status.isInitialized = false;
      this.status.adapterName = 'Unsupported (CPU Mode)';
      this.status.error = 'WebGPU API is not available in this browser environment.';
      return false;
    }

    try {
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!this.adapter) {
        throw new Error('No compatible GPU adapter returned by requestAdapter.');
      }

      this.device = await this.adapter.requestDevice({
        requiredLimits: {
          maxStorageBufferBindingSize: Math.min(
            this.adapter.limits.maxStorageBufferBindingSize || 128 * 1024 * 1024,
            256 * 1024 * 1024
          ),
        },
      });

      // Extract adapter hardware details
      const info = (this.adapter as unknown as {
        info?: { description?: string; architecture?: string; vendor?: string };
      }).info;

      const gpuName = info?.description || info?.architecture || 'WebGPU Compute Core';
      const vendor = info?.vendor || 'Hardware Accelerator';
      const architecture = info?.architecture || 'WGSL SIMD Workgroup';

      this.status.adapterName = gpuName;
      this.status.vendor = vendor;
      this.status.architecture = architecture;
      this.status.maxWorkgroupSizeX = this.adapter.limits.maxComputeWorkgroupSizeX || 256;
      this.status.maxStorageBufferSize = this.adapter.limits.maxStorageBufferBindingSize || 128 * 1024 * 1024;

      // Compile WGSL shader module
      const shaderModule = this.device.createShaderModule({
        label: 'Particle Physics & N-Body Compute Module',
        code: this.wgslShaderCode,
      });

      this.pipeline = this.device.createComputePipeline({
        label: 'Particle Dynamics Compute Pipeline',
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main',
        },
      });

      // Compile WGSL crossbar shader module
      const crossbarModule = this.device.createShaderModule({
        label: 'Crossbar Memristor Compute Module',
        code: this.crossbarWgslShaderCode,
      });

      this.crossbarPipeline = this.device.createComputePipeline({
        label: 'Crossbar Memristor Compute Pipeline',
        layout: 'auto',
        compute: {
          module: crossbarModule,
          entryPoint: 'crossbar_main',
        },
      });

      // Allocate GPU storage buffers
      this.allocateBuffers(this.maxParticles);

      this.status.isSupported = true;
      this.status.isInitialized = true;
      this.status.error = undefined;

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.status.isSupported = false;
      this.status.isInitialized = false;
      this.status.adapterName = 'CPU Fallback Active';
      this.status.error = msg;
      return false;
    }
  }

  /**
   * Allocates GPU storage, uniform, and staging read buffers and tracks VRAM footprint
   */
  private allocateBuffers(particleCount: number) {
    if (!this.device || !this.pipeline) return;

    this.maxParticles = Math.max(512, particleCount);
    const particleStride = 8 * 4; // 8 floats * 4 bytes = 32 bytes per particle
    const particleBytes = this.maxParticles * particleStride;
    const paramsBytes = 8 * 4; // 32 bytes uniform

    // Destroy prior buffers if reallocating
    if (this.particleBuffer) this.particleBuffer.destroy();
    if (this.paramsBuffer) this.paramsBuffer.destroy();
    if (this.readBuffer) this.readBuffer.destroy();

    this.particleBuffer = this.device.createBuffer({
      label: 'Particles Storage Buffer',
      size: particleBytes,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    this.paramsBuffer = this.device.createBuffer({
      label: 'Params Uniform Buffer',
      size: paramsBytes,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.readBuffer = this.device.createBuffer({
      label: 'Particles Staging Read Buffer',
      size: particleBytes,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = this.device.createBindGroup({
      label: 'Particle Compute BindGroup',
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.paramsBuffer } },
      ],
    });

    // Update memory metrics
    this.status.memory = {
      particleStorageBytes: particleBytes,
      paramsUniformBytes: paramsBytes,
      stagingReadBytes: particleBytes,
      totalAllocatedBytes: particleBytes * 2 + paramsBytes,
      theoreticalBandwidthGBs: 0,
    };
  }

  /**
   * Toggle parallel pairwise N-body interaction calculation in compute shader
   */
  public setPairwiseGpu(enabled: boolean) {
    this.status.enablePairwiseGpu = enabled;
  }

  /**
   * Dispatches GPU compute pass for particle array
   */
  public async computeParticles(
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      fx: number;
      fy: number;
      mass: number;
      charge: number;
    }>,
    dt: number,
    damping: number,
    lorentzB: number,
    width: number,
    height: number,
    coulombK: number = 25.0
  ): Promise<boolean> {
    if (!this.device || !this.pipeline || !this.particleBuffer || !this.paramsBuffer || !this.bindGroup || !this.readBuffer) {
      return false;
    }

    const count = particles.length;
    if (count === 0) return true;

    // Dynamically expand buffer if active particles exceed current allocated size
    if (count > this.maxParticles) {
      this.allocateBuffers(Math.max(count * 2, 1024));
    }

    const tStart = performance.now();

    // 1. Pack particle data into Float32Array (Stride: 8 floats = 32 bytes)
    const particleData = new Float32Array(count * 8);
    for (let i = 0; i < count; i++) {
      const offset = i * 8;
      const p = particles[i];
      particleData[offset + 0] = p.x;
      particleData[offset + 1] = p.y;
      particleData[offset + 2] = p.vx;
      particleData[offset + 3] = p.vy;
      particleData[offset + 4] = p.fx;
      particleData[offset + 5] = p.fy;
      particleData[offset + 6] = p.mass;
      particleData[offset + 7] = p.charge;
    }

    // 2. Pack uniforms: [dt, damping, lorentzB, width, height, particleCount, coulombK, enablePairwise]
    const paramsBuffer = new ArrayBuffer(32);
    const paramsFloat = new Float32Array(paramsBuffer);
    const paramsUint = new Uint32Array(paramsBuffer);

    paramsFloat[0] = dt;
    paramsFloat[1] = damping;
    paramsFloat[2] = lorentzB;
    paramsFloat[3] = width;
    paramsFloat[4] = height;
    paramsUint[5] = count;
    paramsFloat[6] = coulombK;
    paramsUint[7] = this.status.enablePairwiseGpu ? 1 : 0;

    // 3. Write data to GPU buffers
    this.device.queue.writeBuffer(this.particleBuffer, 0, particleData);
    this.device.queue.writeBuffer(this.paramsBuffer, 0, paramsBuffer);

    // 4. Encode and submit compute commands
    const commandEncoder = this.device.createCommandEncoder({ label: 'Particle Compute Encoder' });
    const passEncoder = commandEncoder.beginComputePass({ label: 'Particle Kinematics & N-Body Pass' });
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);

    const workgroupCount = Math.ceil(count / 64);
    passEncoder.dispatchWorkgroups(workgroupCount);
    passEncoder.end();

    // Copy result back to staging buffer
    const byteSize = count * 8 * 4;
    commandEncoder.copyBufferToBuffer(this.particleBuffer, 0, this.readBuffer, 0, byteSize);

    this.device.queue.submit([commandEncoder.finish()]);

    // 5. Read back results
    try {
      await this.readBuffer.mapAsync(GPUMapMode.READ, 0, byteSize);
      const copyArray = new Float32Array(this.readBuffer.getMappedRange(0, byteSize));

      for (let i = 0; i < count; i++) {
        const offset = i * 8;
        particles[i].x = copyArray[offset + 0];
        particles[i].y = copyArray[offset + 1];
        particles[i].vx = copyArray[offset + 2];
        particles[i].vy = copyArray[offset + 3];
      }

      this.readBuffer.unmap();

      const elapsedMs = performance.now() - tStart;
      const elapsedUs = Math.max(1, Math.round(elapsedMs * 1000));

      this.recordTelemetry(elapsedUs, count, workgroupCount, byteSize);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Internal telemetry recorder for rolling metrics, throughput, and VRAM bandwidth
   */
  private recordTelemetry(elapsedUs: number, count: number, workgroupCount: number, byteSize: number) {
    const k = this.status.kernel;
    k.dispatchTimeUs = elapsedUs;
    this.status.dispatchTimeUs = elapsedUs;
    k.totalDispatches++;
    k.activeParticleCount = count;
    k.workgroupCount = workgroupCount;

    // Shift rolling 60-sample history
    k.timingHistory.push(elapsedUs);
    if (k.timingHistory.length > 60) {
      k.timingHistory.shift();
    }

    // Min, max, moving average
    k.minDispatchTimeUs = Math.min(...k.timingHistory.filter((v) => v > 0));
    k.maxDispatchTimeUs = Math.max(...k.timingHistory);
    const sum = k.timingHistory.reduce((a, b) => a + b, 0);
    k.avgDispatchTimeUs = Math.round(sum / (k.timingHistory.length || 1));

    // Occupancy percentage: active particles / total allocated workgroup slots
    const totalSlots = workgroupCount * 64;
    k.occupancyPct = totalSlots > 0 ? Math.round((count / totalSlots) * 100) : 100;

    // Pairwise interactions: N * (N - 1)
    const pairwise = this.status.enablePairwiseGpu ? count * Math.max(0, count - 1) : 0;
    k.pairwiseInteractions = pairwise;
    const elapsedSec = elapsedUs / 1_000_000;
    k.megaInteractionsPerSec = elapsedSec > 0 ? Math.round((pairwise / elapsedSec) / 10_000) / 100 : 0;

    // Estimated GFLOPs: ~35 FLOPs per particle + ~25 FLOPs per pairwise interaction
    const totalFlops = count * 35 + pairwise * 25;
    k.estimatedGflops = elapsedSec > 0 ? Math.round((totalFlops / elapsedSec) / 10_000_000) / 100 : 0;

    // Theoretical Memory Bandwidth: (bytes written to storage + bytes read from staging) / seconds
    const totalBytesTransferred = byteSize * 2 + 32;
    this.status.memory.theoreticalBandwidthGBs =
      elapsedSec > 0 ? Math.round((totalBytesTransferred / elapsedSec / 1_000_000_000) * 100) / 100 : 0;
  }

  /**
   * Micro-benchmark to run N dispatches and measure GPU sustained dispatch throughput
   */
  public async runBenchmark(iterations: number = 60): Promise<{
    iterations: number;
    avgUs: number;
    minUs: number;
    maxUs: number;
    gflops: number;
    particlesBenchmarked: number;
  }> {
    if (this.isBenchmarking || !this.status.isInitialized) {
      return {
        iterations: 0,
        avgUs: this.status.kernel.avgDispatchTimeUs,
        minUs: this.status.kernel.minDispatchTimeUs,
        maxUs: this.status.kernel.maxDispatchTimeUs,
        gflops: this.status.kernel.estimatedGflops,
        particlesBenchmarked: this.status.kernel.activeParticleCount,
      };
    }

    this.isBenchmarking = true;
    const sampleSize = Math.max(64, this.status.kernel.activeParticleCount || 128);
    const dummyParticles = Array.from({ length: sampleSize }, (_, i) => ({
      x: 100 + (i % 20) * 20,
      y: 100 + Math.floor(i / 20) * 20,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      fx: 0,
      fy: 0,
      mass: 1.0,
      charge: i % 2 === 0 ? 1.0 : -1.0,
    }));

    const timings: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      await this.computeParticles(dummyParticles, 0.5, 0.99, 1.2, 1000, 600, 25.0);
      timings.push(Math.round((performance.now() - t0) * 1000));
    }

    this.isBenchmarking = false;

    const minUs = Math.min(...timings);
    const maxUs = Math.max(...timings);
    const avgUs = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
    const pairwise = sampleSize * (sampleSize - 1);
    const flops = sampleSize * 35 + pairwise * 25;
    const gflops = Math.round((flops / (avgUs / 1_000_000) / 10_000_000) / 100);

    return {
      iterations,
      avgUs,
      minUs,
      maxUs,
      gflops,
      particlesBenchmarked: sampleSize,
    };
  }

  private crossbarBuffers: {
    colHorizon?: GPUBuffer;
    conductance?: GPUBuffer;
    rowPtr?: GPUBuffer;
    rowCounts?: GPUBuffer;
    wavefront?: GPUBuffer;
    psi?: GPUBuffer;
    currents?: GPUBuffer;
    params?: GPUBuffer;
    readCurrents?: GPUBuffer;
    bindGroup?: GPUBindGroup;
    allocatedSynapses: number;
    allocatedVocab: number;
  } = {
    allocatedSynapses: 0,
    allocatedVocab: 0,
  };

  /**
   * Dispatches parallel CSR Crossbar Resonance Compute Pass on WebGPU
   * Computes Kirchhoff Current Summation I_j = \sum_{\delta=0}^7 G_{ij}^{(\delta)} \cdot V_{t-\delta, i} \cdot \Psi_j
   */
  public async computeCrossbarResonance(
    colHorizon: Uint32Array,
    conductance: Float32Array,
    rowPtr: Uint32Array,
    rowCounts: Uint32Array,
    wavefront: Uint32Array,
    refractoryPsi: Float32Array,
    outCurrents: Float32Array,
    vocabCount: number,
    activeSynapseCount: number,
    refractoryHalfLife: number = 6.0,
    temperature: number = 0.25
  ): Promise<boolean> {
    if (!this.device || !this.crossbarPipeline || vocabCount === 0) {
      return false;
    }

    const tStart = performance.now();

    try {
      // Allocate or expand GPU buffers if capacity increased
      const neededSynapses = Math.max(activeSynapseCount, 1024);
      const neededVocab = Math.max(vocabCount, 512);

      if (
        !this.crossbarBuffers.colHorizon ||
        this.crossbarBuffers.allocatedSynapses < neededSynapses ||
        this.crossbarBuffers.allocatedVocab < neededVocab
      ) {
        // Free prior buffers
        this.crossbarBuffers.colHorizon?.destroy();
        this.crossbarBuffers.conductance?.destroy();
        this.crossbarBuffers.rowPtr?.destroy();
        this.crossbarBuffers.rowCounts?.destroy();
        this.crossbarBuffers.wavefront?.destroy();
        this.crossbarBuffers.psi?.destroy();
        this.crossbarBuffers.currents?.destroy();
        this.crossbarBuffers.params?.destroy();
        this.crossbarBuffers.readCurrents?.destroy();

        const synBytes = neededSynapses * 4;
        const vocabBytes = neededVocab * 4;

        this.crossbarBuffers.colHorizon = this.device.createBuffer({
          label: 'Crossbar ColHorizon Buffer',
          size: synBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.crossbarBuffers.conductance = this.device.createBuffer({
          label: 'Crossbar Conductance Buffer',
          size: synBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.crossbarBuffers.rowPtr = this.device.createBuffer({
          label: 'Crossbar RowPtr Buffer',
          size: vocabBytes + 4,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.crossbarBuffers.rowCounts = this.device.createBuffer({
          label: 'Crossbar RowCounts Buffer',
          size: vocabBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.crossbarBuffers.wavefront = this.device.createBuffer({
          label: 'Crossbar Wavefront Buffer',
          size: 8 * 4,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.crossbarBuffers.psi = this.device.createBuffer({
          label: 'Crossbar Refractory Psi Buffer',
          size: vocabBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        this.crossbarBuffers.currents = this.device.createBuffer({
          label: 'Crossbar Currents Output Buffer',
          size: vocabBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        this.crossbarBuffers.params = this.device.createBuffer({
          label: 'Crossbar Params Uniform Buffer',
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.crossbarBuffers.readCurrents = this.device.createBuffer({
          label: 'Crossbar Read Current Staging Buffer',
          size: vocabBytes,
          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });

        this.crossbarBuffers.bindGroup = this.device.createBindGroup({
          label: 'Crossbar BindGroup',
          layout: this.crossbarPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: this.crossbarBuffers.colHorizon } },
            { binding: 1, resource: { buffer: this.crossbarBuffers.conductance } },
            { binding: 2, resource: { buffer: this.crossbarBuffers.rowPtr } },
            { binding: 3, resource: { buffer: this.crossbarBuffers.rowCounts } },
            { binding: 4, resource: { buffer: this.crossbarBuffers.wavefront } },
            { binding: 5, resource: { buffer: this.crossbarBuffers.psi } },
            { binding: 6, resource: { buffer: this.crossbarBuffers.currents } },
            { binding: 7, resource: { buffer: this.crossbarBuffers.params } },
          ],
        });

        this.crossbarBuffers.allocatedSynapses = neededSynapses;
        this.crossbarBuffers.allocatedVocab = neededVocab;
      }

      // Write active data to GPU buffers
      const activeSynBytes = activeSynapseCount * 4;
      const activeVocabBytes = vocabCount * 4;

      if (activeSynapseCount > 0) {
        this.device.queue.writeBuffer(
          this.crossbarBuffers.colHorizon!,
          0,
          colHorizon.buffer,
          colHorizon.byteOffset,
          activeSynBytes
        );
        this.device.queue.writeBuffer(
          this.crossbarBuffers.conductance!,
          0,
          conductance.buffer,
          conductance.byteOffset,
          activeSynBytes
        );
      }

      this.device.queue.writeBuffer(
        this.crossbarBuffers.rowPtr!,
        0,
        rowPtr.buffer,
        rowPtr.byteOffset,
        activeVocabBytes
      );
      this.device.queue.writeBuffer(
        this.crossbarBuffers.rowCounts!,
        0,
        rowCounts.buffer,
        rowCounts.byteOffset,
        activeVocabBytes
      );
      this.device.queue.writeBuffer(
        this.crossbarBuffers.wavefront!,
        0,
        wavefront.buffer,
        wavefront.byteOffset,
        8 * 4
      );
      this.device.queue.writeBuffer(
        this.crossbarBuffers.psi!,
        0,
        refractoryPsi.buffer,
        refractoryPsi.byteOffset,
        activeVocabBytes
      );

      // Pack uniform: [vocabCount, horizonCount, refractoryHalfLife, temperature]
      const uniformBuffer = new ArrayBuffer(16);
      const uViewU32 = new Uint32Array(uniformBuffer);
      const uViewF32 = new Float32Array(uniformBuffer);
      uViewU32[0] = vocabCount;
      uViewU32[1] = 8;
      uViewF32[2] = refractoryHalfLife;
      uViewF32[3] = temperature;
      this.device.queue.writeBuffer(this.crossbarBuffers.params!, 0, uniformBuffer);

      // Encode and dispatch
      const commandEncoder = this.device.createCommandEncoder({ label: 'Crossbar Encoder' });
      const pass = commandEncoder.beginComputePass({ label: 'Crossbar Resonance Pass' });
      pass.setPipeline(this.crossbarPipeline);
      pass.setBindGroup(0, this.crossbarBuffers.bindGroup!);

      const workgroupCount = Math.ceil(vocabCount / 256);
      pass.dispatchWorkgroups(workgroupCount);
      pass.end();

      // Copy results back to staging
      commandEncoder.copyBufferToBuffer(
        this.crossbarBuffers.currents!,
        0,
        this.crossbarBuffers.readCurrents!,
        0,
        activeVocabBytes
      );
      this.device.queue.submit([commandEncoder.finish()]);

      // Map staging buffer
      await this.crossbarBuffers.readCurrents!.mapAsync(GPUMapMode.READ, 0, activeVocabBytes);
      const mapped = new Float32Array(this.crossbarBuffers.readCurrents!.getMappedRange(0, activeVocabBytes));
      outCurrents.set(mapped);
      this.crossbarBuffers.readCurrents!.unmap();

      const elapsedMs = performance.now() - tStart;
      const elapsedUs = Math.max(1, Math.round(elapsedMs * 1000));

      // Record crossbar telemetry
      const cb = this.status.crossbar;
      cb.dispatchTimeUs = elapsedUs;
      cb.totalCrossbarDispatches++;
      cb.simulatedMemristors = activeSynapseCount;
      cb.timingHistory.push(elapsedUs);
      if (cb.timingHistory.length > 60) cb.timingHistory.shift();

      const sum = cb.timingHistory.reduce((a, b) => a + b, 0);
      cb.avgDispatchTimeUs = Math.round(sum / cb.timingHistory.length);

      const sec = elapsedUs / 1_000_000;
      const totalBytes = activeSynBytes * 2 + activeVocabBytes * 3 + 16;
      cb.bandwidthGBs = sec > 0 ? Math.round((totalBytes / sec / 1_000_000_000) * 100) / 100 : 0;
      const flops = vocabCount * 8 * 4;
      cb.gflops = sec > 0 ? Math.round((flops / sec / 1_000_000_000) * 100) / 100 : 0;

      return true;
    } catch {
      return false;
    }
  }
}

export const gpuAccelerator = new WebGPUAccelerator();
