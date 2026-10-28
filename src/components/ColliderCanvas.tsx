/**
 * High-Performance Interactive HTML5 Canvas for Synaptron Particle Collider
 * Renders vacuum chamber, relativistic beam injectors, LIF neurons,
 * gluon flux tube bonds, quantum wave-packet halos, and collision shockwaves.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NeuromorphicPhysicsEngine } from '../physics/engine';
import { LetterParticle, SynapticNeuron } from '../types/physics';

interface ColliderCanvasProps {
  engine: NeuromorphicPhysicsEngine;
  activeTool: 'sling' | 'well' | 'probe' | 'inspect';
  selectedChar: string;
  isAntimatter: boolean;
  onSelectParticle?: (p: LetterParticle | null) => void;
  onSelectNeuron?: (n: SynapticNeuron | null) => void;
}

export const ColliderCanvas: React.FC<ColliderCanvasProps> = ({
  engine,
  activeTool,
  selectedChar,
  isAntimatter,
  onSelectParticle,
  onSelectNeuron,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Resize canvas to fill container with proper pixel ratio
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    canvasRef.current.width = w * dpr;
    canvasRef.current.height = h * dpr;
    canvasRef.current.style.width = `${w}px`;
    canvasRef.current.style.height = `${h}px`;

    engine.setDimensions(w, h);
  }, [engine]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Main 60 FPS Render Loop with WebGPU compute synchronization
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let isRunning = true;

    const render = async (time: number) => {
      if (!isRunning) return;
      const dt = Math.min(2.0, (time - lastTime) / 16.6);
      lastTime = time;

      // Step physics (WebGPU compute shader pass or CPU fallback)
      await engine.update(dt);

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas && isRunning) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.save();
          ctx.scale(dpr, dpr);
          drawScene(ctx, engine.width, engine.height);
          ctx.restore();
        }
      }

      if (isRunning) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [engine]);

  // Rendering routines
  const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. Dark Vacuum Chamber Background with Cryogenic Grid
    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, width, height);

    // Fine coordinate grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1;
    const gridSize = 40;

    ctx.beginPath();
    for (let x = 0; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Central Interaction Zone Crosshairs
    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.moveTo(cx - 160, cy);
    ctx.lineTo(cx + 160, cy);
    ctx.moveTo(cx, cy - 160);
    ctx.lineTo(cx, cy + 160);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Beam Injector Ports (Left & Right Synchrotrons)
    drawBeamPorts(ctx, width, height);

    // 3. Neuromorphic Memristor Axon Interconnects & LIF Neurons
    if (engine.settings.showSynapticGrid) {
      drawSynapticLattice(ctx);
    }

    // 4. Quantum Barriers
    drawQuantumBarriers(ctx);

    // 5. Attractor / Sink Wells
    drawAttractorWells(ctx);

    // 6. Strong Linguistic Gluon Tubes (Hadron Bonds)
    drawBonds(ctx);

    // 7. Hadron Word Molecular Shields
    drawHadrons(ctx);

    // 8. Particles (Letters as Quarks & Leptons)
    drawParticles(ctx);

    // 9. Collision Flashes and Shockwaves
    drawFlashes(ctx);

    // 10. Interactive Drag Slingshot Arrow
    if (isDragging && dragStart && dragCurrent && activeTool === 'sling') {
      drawSlingshot(ctx, dragStart, dragCurrent);
    }

    // 11. Paused Indicator
    if (engine.isPaused) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⏸ SIMULATION PAUSED [COORDINATES & MOMENTUM FROZEN]', width / 2, 24);
    }
  };

  const drawBeamPorts = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const midY = height / 2;

    // Left Port (Beamline A)
    ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
    ctx.fillRect(0, midY - 32, 50, 64);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, midY - 32, 50, 64);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.fillText('BEAM-α', 6, midY - 38);

    // Right Port (Beamline B)
    ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
    ctx.fillRect(width - 50, midY - 32, 50, 64);
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 50, midY - 32, 50, 64);

    ctx.fillStyle = '#fb923c';
    ctx.font = '10px monospace';
    ctx.fillText('BEAM-β', width - 48, midY - 38);
  };

  const drawSynapticLattice = (ctx: CanvasRenderingContext2D) => {
    // Memristor Axon Interconnects
    for (let i = 0; i < engine.neurons.length; i++) {
      const nA = engine.neurons[i];
      for (let j = i + 1; j < engine.neurons.length; j++) {
        const nB = engine.neurons[j];
        const weight = nA.weights[nB.id] || 0.2;

        ctx.strokeStyle =
          nA.lastSpikeVisual > 0.1 || nB.lastSpikeVisual > 0.1
            ? `rgba(56, 189, 248, ${0.4 + (nA.lastSpikeVisual + nB.lastSpikeVisual) * 0.3})`
            : `rgba(71, 85, 105, ${weight * 0.4})`;

        ctx.lineWidth = 1 + weight * 2;
        ctx.beginPath();
        ctx.moveTo(nA.x, nA.y);
        ctx.lineTo(nB.x, nB.y);
        ctx.stroke();
      }
    }

    // LIF Neurons
    for (const neuron of engine.neurons) {
      // Receptive dendritic field aura
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, neuron.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.08)';
      ctx.fill();

      // Somatic Chamber
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);

      const coreColors = {
        alpha: '#38bdf8',
        beta: '#4ade80',
        gamma: '#f43f5e',
        delta: '#fbbf24',
      };
      const coreColor = coreColors[neuron.core];

      // Membrane potential fill level
      const normVm = Math.max(0, Math.min(1, (neuron.membranePotential - neuron.restPotential) / (neuron.threshold - neuron.restPotential)));
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Depolarization Glow
      if (neuron.lastSpikeVisual > 0.05) {
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, neuron.radius * (1 + neuron.lastSpikeVisual * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = `${coreColor}${Math.floor(neuron.lastSpikeVisual * 80).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }

      ctx.strokeStyle = neuron.lastSpikeVisual > 0.1 ? '#ffffff' : coreColor;
      ctx.lineWidth = neuron.lastSpikeVisual > 0.1 ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Neuron Label and Voltage readout
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(neuron.label, neuron.x, neuron.y - 4);

      ctx.font = '8px monospace';
      ctx.fillStyle = normVm > 0.8 ? '#f43f5e' : '#94a3b8';
      ctx.fillText(`${Math.round(neuron.membranePotential)}mV`, neuron.x, neuron.y + 7);
    }
  };

  const drawQuantumBarriers = (ctx: CanvasRenderingContext2D) => {
    for (const bar of engine.barriers) {
      if (!bar.active) continue;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);

      ctx.fillStyle = '#e9d5ff';
      ctx.font = '9px monospace';
      ctx.fillText(`TUNNEL GATE: ${bar.potential}eV`, bar.x + 6, bar.y - 6);
    }
  };

  const drawAttractorWells = (ctx: CanvasRenderingContext2D) => {
    for (const att of engine.attractors) {
      ctx.beginPath();
      ctx.arc(att.x, att.y, att.radius, 0, Math.PI * 2);
      ctx.strokeStyle = att.strength > 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(att.x, att.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = att.strength > 0 ? '#0ea5e9' : '#ef4444';
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(att.label, att.x, att.y + 16);
    }
  };

  const drawBonds = (ctx: CanvasRenderingContext2D) => {
    for (const bond of engine.bonds) {
      const pA = engine.particles.find((p) => p.id === bond.particleAId);
      const pB = engine.particles.find((p) => p.id === bond.particleBId);
      if (!pA || !pB) continue;

      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);

      // Gluon flux tube styling
      ctx.strokeStyle = bond.strength > 0.8 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = bond.strength > 0.8 ? 3 : 1.5;
      ctx.stroke();

      // Middle gluon particle knot
      const midX = (pA.x + pB.x) / 2;
      const midY = (pA.y + pB.y) / 2;
      ctx.beginPath();
      ctx.arc(midX, midY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
    }
  };

  const drawHadrons = (ctx: CanvasRenderingContext2D) => {
    for (const hadron of engine.hadrons) {
      const hadronParticles = engine.particles.filter((p) => hadron.particleIds.includes(p.id));
      if (hadronParticles.length < 2) continue;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      hadronParticles.forEach((p) => {
        minX = Math.min(minX, p.x - p.radius);
        maxX = Math.max(maxX, p.x + p.radius);
        minY = Math.min(minY, p.y - p.radius);
        maxY = Math.max(maxY, p.y + p.radius);
      });

      const pad = 12;
      ctx.strokeStyle = hadron.isStable ? 'rgba(56, 189, 248, 0.5)' : 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
      ctx.setLineDash([]);

      // Floating Hadron Status Tag
      ctx.fillStyle = hadron.isStable ? '#38bdf8' : '#fbbf24';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `HADRON: ${hadron.word} · ${hadron.isStable ? 'STABLE' : 'UNBOUND'}`,
        minX - pad,
        minY - pad - 4
      );
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (const p of engine.particles) {
      // 1. Phosphor Persistence Trail
      if (engine.settings.showTrails && p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.strokeStyle = p.isAntimatter
          ? 'rgba(236, 72, 153, 0.25)'
          : p.type === 'lepton'
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(244, 63, 94, 0.25)';
        ctx.lineWidth = p.radius * 0.7;
        ctx.stroke();
      }

      // 2. Quantum Wave-Packet Halo
      if (engine.settings.showWaveFunctions) {
        const waveRadius = p.radius + 4 + Math.sin(p.quantumPhase) * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = p.isAntimatter ? 'rgba(236, 72, 153, 0.2)' : 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Particle Body
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

      let fillColor = '#1e293b';
      let strokeColor = '#38bdf8';

      if (p.isAntimatter) {
        fillColor = '#3b0764';
        strokeColor = '#ec4899';
      } else if (p.type === 'lepton') {
        fillColor = '#0c4a6e';
        strokeColor = '#38bdf8';
      } else if (p.color === 'red') {
        fillColor = '#4c0519';
        strokeColor = '#f43f5e';
      } else if (p.color === 'green') {
        fillColor = '#052e16';
        strokeColor = '#22c55e';
      } else if (p.color === 'gold') {
        fillColor = '#451a03';
        strokeColor = '#f59e0b';
      }

      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Letter Glyph
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(p.radius * 1.05)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.char, p.x, p.y);

      // 5. Antimatter macron bar over letter
      if (p.isAntimatter) {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x - 7, p.y - p.radius * 0.7);
        ctx.lineTo(p.x + 7, p.y - p.radius * 0.7);
        ctx.stroke();
      }

      // 6. Charge & Mass Badge
      ctx.fillStyle = p.charge > 0 ? '#f43f5e' : p.charge < 0 ? '#38bdf8' : '#fbbf24';
      ctx.font = 'bold 8px monospace';
      const chargeSign = p.charge > 0 ? '+' : p.charge < 0 ? '−' : '0';
      ctx.fillText(chargeSign, p.x + p.radius - 2, p.y - p.radius + 3);
    }
  };

  const drawFlashes = (ctx: CanvasRenderingContext2D) => {
    for (const f of engine.flashes) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${f.color}33`;
      ctx.fill();
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (f.label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(f.label, f.x, f.y - f.radius - 6);
      }
      ctx.restore();
    }
  };

  const drawSlingshot = (
    ctx: CanvasRenderingContext2D,
    start: { x: number; y: number },
    current: { x: number; y: number }
  ) => {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ghost preview of the letter to be slingshot
    ctx.beginPath();
    ctx.arc(start.x, start.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedChar || 'A', start.x, start.y);
  };

  // Pointer / Mouse Event Handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (activeTool === 'inspect') {
      // Find clicked particle
      const clickedP = engine.particles.find(
        (p) => Math.hypot(p.x - coords.x, p.y - coords.y) <= p.radius + 5
      );
      if (clickedP) {
        onSelectParticle?.(clickedP);
        return;
      }
      // Find clicked neuron
      const clickedN = engine.neurons.find(
        (n) => Math.hypot(n.x - coords.x, n.y - coords.y) <= n.radius + 5
      );
      if (clickedN) {
        onSelectNeuron?.(clickedN);
        return;
      }
      onSelectParticle?.(null);
      onSelectNeuron?.(null);
      return;
    }

    if (activeTool === 'well') {
      // Place a new attractor well
      engine.attractors.push({
        id: `well-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        strength: 0.6,
        radius: 70,
        type: 'gravity',
        label: `WELL #${engine.attractors.length + 1}`,
      });
      return;
    }

    if (activeTool === 'probe') {
      // Inject high-voltage synaptic current pulse at cursor
      for (const n of engine.neurons) {
        const d = Math.hypot(n.x - coords.x, n.y - coords.y);
        if (d < 120) {
          n.membranePotential += 18.0;
        }
      }
      return;
    }

    // Default: Sling particle
    setIsDragging(true);
    setDragStart(coords);
    setDragCurrent(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (isDragging) {
      setDragCurrent(coords);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragCurrent && activeTool === 'sling') {
      const vx = (dragStart.x - dragCurrent.x) * 0.15;
      const vy = (dragStart.y - dragCurrent.y) * 0.15;

      engine.addParticle(
        selectedChar || 'A',
        dragStart.x,
        dragStart.y,
        vx,
        vy,
        isAntimatter
      );
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[480px] bg-[#06080e] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
};
