/**
 * Bare-Metal WebAssembly Persistent Memory Manager (WASM Linear Memory + .bin mmap Engine)
 *
 * Allocates a single contiguous WebAssembly.Memory arena (64 KiB WASM pages) and maps
 * all Neuromorphic Crossbar CSR & Soma TypedArrays directly onto the WASM linear address space.
 * Synchronizes active memory pages in real time to persistent binary (.bin) storage across:
 *   1. Browser OPFS (Origin Private File System: synaptron_crystal.bin)
 *   2. Browser IndexedDB Binary Store (synaptron_crystal_mmap_db)
 *   3. Server POSIX Disk File (data/synaptron_crystal.bin via /api/crystal/mmap.bin)
 *
 * 100% Pure Physics & Hardware Memory Management — Zero LLMs, Zero Hardcoded Prompts.
 */

export interface WasmMemoryArenaLayout {
  wasmMemory: WebAssembly.Memory | null;
  rawBuffer: ArrayBuffer;
  wasmPagesAllocated: number;
  totalArenaBytes: number;
  headerU32: Uint32Array;
  headerF32: Float32Array;
  rowPtr: Uint32Array;
  rowCounts: Uint32Array;
  tokenFreq: Uint32Array;
  tokenStartFreq: Uint32Array;
  tokenHfwd: Float32Array;
  tokenMu: Float32Array;
  somaVoltages: Float32Array;
  refractoryPsi: Float32Array;
  headEdge: Int32Array;
  colHorizon: Uint32Array;
  conductance: Float32Array;
  nextEdge: Int32Array;
  edgeSource: Uint32Array;
  synapseLineage: Uint32Array;
}

export interface MmapPersistenceTelemetry {
  wasmPagesAllocated: number;
  wasmArenaBytes: number;
  binFileBytes: number;
  mmapGeneration: number;
  dirtyWritesCount: number;
  lastFlushLatencyMs: number;
  storageTierStatus: string;
  opfsAvailable: boolean;
}

const WASM_PAGE_SIZE = 65536; // 64 KiB standard WebAssembly page size
const SCB1_MAGIC = 0x53434231; // "SCB1"

function align64(byteOffset: number): number {
  return (byteOffset + 63) & ~63;
}

export class WasmPersistentMemoryManager {
  public wasmPagesAllocated = 0;
  public wasmArenaBytes = 0;
  public binFileBytes = 0;
  public mmapGeneration = 0;
  public dirtyWritesCount = 0;
  public lastFlushLatencyMs = 0;
  public opfsAvailable = false;
  public storageTierStatus = 'WASM MMAP INITIALIZING';

  private idbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Allocates a single contiguous WebAssembly.Memory linear address space and maps
   * all CSR synaptic and soma buffers at deterministic 64-byte aligned offsets.
   */
  public allocateContiguousWasmArena(
    maxVocab: number,
    maxSynapses: number,
    auxEdgeCap: number
  ): WasmMemoryArenaLayout {
    let offset = 0;

    // 0x0000: 64-byte Hardware Control & Mmap Register Header
    const offHeader = offset;
    offset = align64(offset + 64);

    // Vocab-indexed arrays
    const offRowPtr = offset;
    offset = align64(offset + (maxVocab + 1) * 4);

    const offRowCounts = offset;
    offset = align64(offset + maxVocab * 4);

    const offTokenFreq = offset;
    offset = align64(offset + maxVocab * 4);

    const offTokenStartFreq = offset;
    offset = align64(offset + maxVocab * 4);

    const offTokenHfwd = offset;
    offset = align64(offset + maxVocab * 4);

    const offTokenMu = offset;
    offset = align64(offset + maxVocab * 4);

    const offSomaVoltages = offset;
    offset = align64(offset + maxVocab * 4);

    const offRefractoryPsi = offset;
    offset = align64(offset + maxVocab * 4);

    const offHeadEdge = offset;
    offset = align64(offset + maxVocab * 4);

    // Synapse-indexed CSR & Forward-Star arrays
    const offColHorizon = offset;
    offset = align64(offset + maxSynapses * 4);

    const offConductance = offset;
    offset = align64(offset + maxSynapses * 4);

    const offNextEdge = offset;
    offset = align64(offset + auxEdgeCap * 4);

    const offEdgeSource = offset;
    offset = align64(offset + auxEdgeCap * 4);

    const offSynapseLineage = offset;
    offset = align64(offset + auxEdgeCap * 4);

    const totalRequiredBytes = offset;
    const requiredPages = Math.ceil(totalRequiredBytes / WASM_PAGE_SIZE);

    let wasmMemory: WebAssembly.Memory | null = null;
    let rawBuffer: ArrayBuffer;

    try {
      wasmMemory = new WebAssembly.Memory({
        initial: requiredPages,
        maximum: requiredPages,
      });
      rawBuffer = wasmMemory.buffer;
      this.wasmPagesAllocated = requiredPages;
      this.wasmArenaBytes = rawBuffer.byteLength;
    } catch {
      // Fallback to contiguous ArrayBuffer if browser caps WebAssembly.Memory pages
      rawBuffer = new ArrayBuffer(requiredPages * WASM_PAGE_SIZE);
      this.wasmPagesAllocated = requiredPages;
      this.wasmArenaBytes = rawBuffer.byteLength;
    }

    const headerU32 = new Uint32Array(rawBuffer, offHeader, 16);
    const headerF32 = new Float32Array(rawBuffer, offHeader, 16);
    headerU32[0] = SCB1_MAGIC;
    headerU32[1] = 1;

    const rowPtr = new Uint32Array(rawBuffer, offRowPtr, maxVocab + 1);
    const rowCounts = new Uint32Array(rawBuffer, offRowCounts, maxVocab);
    const tokenFreq = new Uint32Array(rawBuffer, offTokenFreq, maxVocab);
    const tokenStartFreq = new Uint32Array(rawBuffer, offTokenStartFreq, maxVocab);
    const tokenHfwd = new Float32Array(rawBuffer, offTokenHfwd, maxVocab);
    const tokenMu = new Float32Array(rawBuffer, offTokenMu, maxVocab);
    const somaVoltages = new Float32Array(rawBuffer, offSomaVoltages, maxVocab);
    const refractoryPsi = new Float32Array(rawBuffer, offRefractoryPsi, maxVocab);
    const headEdge = new Int32Array(rawBuffer, offHeadEdge, maxVocab);

    const colHorizon = new Uint32Array(rawBuffer, offColHorizon, maxSynapses);
    const conductance = new Float32Array(rawBuffer, offConductance, maxSynapses);
    const nextEdge = new Int32Array(rawBuffer, offNextEdge, auxEdgeCap);
    const edgeSource = new Uint32Array(rawBuffer, offEdgeSource, auxEdgeCap);
    const synapseLineage = new Uint32Array(rawBuffer, offSynapseLineage, auxEdgeCap);

    // Initialize default hardware register values
    tokenMu.fill(1.0);
    refractoryPsi.fill(1.0);
    headEdge.fill(-1);
    nextEdge.fill(-1);

    return {
      wasmMemory,
      rawBuffer,
      wasmPagesAllocated: requiredPages,
      totalArenaBytes: rawBuffer.byteLength,
      headerU32,
      headerF32,
      rowPtr,
      rowCounts,
      tokenFreq,
      tokenStartFreq,
      tokenHfwd,
      tokenMu,
      somaVoltages,
      refractoryPsi,
      headEdge,
      colHorizon,
      conductance,
      nextEdge,
      edgeSource,
      synapseLineage,
    };
  }

  /**
   * Opens the IndexedDB binary object store for .bin mmap persistence
   */
  private openIndexedDB(): Promise<IDBDatabase> {
    if (this.idbPromise) return this.idbPromise;
    const p = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        if (typeof indexedDB === 'undefined') {
          this.idbPromise = null;
          return reject(new Error('IndexedDB unavailable'));
        }
        const req = indexedDB.open('synaptron_crystal_mmap_db', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('mmap_bins')) {
            db.createObjectStore('mmap_bins');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          this.idbPromise = null;
          reject(req.error || new Error('IndexedDB open error'));
        };
      } catch (err) {
        this.idbPromise = null;
        reject(err);
      }
    });
    p.catch(() => {});
    this.idbPromise = p;
    return this.idbPromise;
  }

  /**
   * Writes the raw .bin ArrayBuffer into the Browser's Origin Private File System (OPFS)
   * if supported by the user's browser (e.g. Chrome / Safari on Apple Silicon).
   */
  private async writeOpfsBin(binBuffer: ArrayBuffer): Promise<boolean> {
    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.storage ||
        typeof navigator.storage.getDirectory !== 'function'
      ) {
        return false;
      }
      const rootDir = await navigator.storage.getDirectory();
      const fileHandle = await rootDir.getFileHandle('synaptron_crystal.bin', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(binBuffer);
      await writable.close();
      this.opfsAvailable = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads the raw .bin ArrayBuffer from Browser OPFS if present
   */
  private async readOpfsBin(): Promise<ArrayBuffer | null> {
    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.storage ||
        typeof navigator.storage.getDirectory !== 'function'
      ) {
        return null;
      }
      const rootDir = await navigator.storage.getDirectory();
      const fileHandle = await rootDir.getFileHandle('synaptron_crystal.bin', { create: false });
      const file = await fileHandle.getFile();
      if (file.size < 64) return null;
      this.opfsAvailable = true;
      return await file.arrayBuffer();
    } catch {
      return null;
    }
  }

  /**
   * Flushes the packed SCB1 .bin memory-mapped image across all 3 persistence tiers:
   * 1. OPFS (Origin Private File System)
   * 2. IndexedDB Binary Store
   * 3. Server POSIX File (data/synaptron_crystal.bin)
   */
  public async flushBinaryImageToStorage(binBuffer: ArrayBuffer): Promise<{
    ok: boolean;
    elapsedMs: number;
    statusText: string;
  }> {
    const t0 = performance.now();
    this.binFileBytes = binBuffer.byteLength;
    this.mmapGeneration++;

    const tiersSucceeded: string[] = ['WASM'];

    // Tier 1: OPFS zero-copy binary file write
    const opfsOk = await this.writeOpfsBin(binBuffer);
    if (opfsOk) tiersSucceeded.push('OPFS');

    // Tier 2: IndexedDB binary ArrayBuffer store
    try {
      const db = await this.openIndexedDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('mmap_bins', 'readwrite');
        tx.objectStore('mmap_bins').put(binBuffer, 'synaptron_crystal.bin');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      tiersSucceeded.push('IDB');
    } catch {
      // Ignore IndexedDB quota errors if OPFS or Server succeeds
    }

    // Tier 3: Server POSIX data/synaptron_crystal.bin
    try {
      const res = await fetch('/api/crystal/mmap.bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: binBuffer,
      });
      if (res.ok) {
        tiersSucceeded.push('POSIX .BIN');
      }
    } catch {
      // Offline / local mode fallback
    }

    const elapsedMs = Math.round((performance.now() - t0) * 10) / 10;
    this.lastFlushLatencyMs = elapsedMs;
    const mb = (binBuffer.byteLength / (1024 * 1024)).toFixed(2);
    this.storageTierStatus = `MMAP [${tiersSucceeded.join('+')}]: ${mb} MB .bin (${elapsedMs} ms)`;

    return {
      ok: tiersSucceeded.length > 1,
      elapsedMs,
      statusText: this.storageTierStatus,
    };
  }

  /**
   * Restores the richest SCB1 .bin binary image across OPFS, IndexedDB, and Server POSIX storage.
   * Compares vocabCount (headerU32[3]) and activeSynapses (headerU32[4]) so the highest-knowledge
   * crystal state always wins on startup.
   */
  public async loadRichestBinaryImageFromStorage(): Promise<ArrayBuffer | null> {
    const candidates: Array<{ source: string; buf: ArrayBuffer; vocab: number; synapses: number }> =
      [];

    const inspectBuffer = (source: string, buf: ArrayBuffer | null) => {
      try {
        if (!buf || buf.byteLength < 64) return;
        const h = new Uint32Array(buf, 0, 8);
        if (h[0] === SCB1_MAGIC) {
          candidates.push({
            source,
            buf,
            vocab: h[3] || 0,
            synapses: h[4] || 0,
          });
        }
      } catch {
        // Safe ignore corrupted or unaligned buffers
      }
    };

    // 1. Check OPFS
    const opfsBuf = await this.readOpfsBin();
    inspectBuffer('OPFS', opfsBuf);

    // 2. Check IndexedDB
    try {
      const db = await this.openIndexedDB();
      const idbBuf = await new Promise<ArrayBuffer | null>((resolve) => {
        const tx = db.transaction('mmap_bins', 'readonly');
        const req = tx.objectStore('mmap_bins').get('synaptron_crystal.bin');
        req.onsuccess = () => resolve((req.result as ArrayBuffer) || null);
        req.onerror = () => resolve(null);
      });
      inspectBuffer('IDB', idbBuf);
    } catch {
      // Ignore
    }

    // 3. Check Server POSIX data/synaptron_crystal.bin
    try {
      const statusRes = await fetch('/api/crystal/status');
      if (statusRes.ok) {
        const status = await statusRes.json();
        if (status.exists && status.byteLength >= 64) {
          const binRes = await fetch('/api/crystal/mmap.bin');
          if (binRes.ok) {
            const srvBuf = await binRes.arrayBuffer();
            inspectBuffer('POSIX .BIN', srvBuf);
          }
        }
      }
    } catch {
      // Ignore
    }

    if (candidates.length === 0) return null;

    // Sort by richest vocabulary first, then highest active synapse count
    candidates.sort((a, b) => {
      if (b.vocab !== a.vocab) return b.vocab - a.vocab;
      return b.synapses - a.synapses;
    });

    const winner = candidates[0];
    this.binFileBytes = winner.buf.byteLength;
    const mb = (winner.buf.byteLength / (1024 * 1024)).toFixed(2);
    this.storageTierStatus = `MMAP RESTORED [${winner.source}]: ${mb} MB .bin`;

    return winner.buf;
  }

  /**
   * Clears all persisted .bin images across OPFS, IndexedDB, and Server POSIX disk
   */
  public async purgeAllBinaryStorage(): Promise<void> {
    this.binFileBytes = 0;
    this.mmapGeneration = 0;
    this.dirtyWritesCount = 0;
    this.storageTierStatus = 'WASM MMAP RESET';

    void fetch('/api/crystal/mmap.bin', { method: 'DELETE' }).catch(() => {});

    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction('mmap_bins', 'readwrite');
      tx.objectStore('mmap_bins').delete('synaptron_crystal.bin');
    } catch {
      // Ignore
    }

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.storage &&
        typeof navigator.storage.getDirectory === 'function'
      ) {
        const rootDir = await navigator.storage.getDirectory();
        await rootDir.removeEntry('synaptron_crystal.bin');
      }
    } catch {
      // Ignore
    }
  }

  public getTelemetry(): MmapPersistenceTelemetry {
    return {
      wasmPagesAllocated: this.wasmPagesAllocated,
      wasmArenaBytes: this.wasmArenaBytes,
      binFileBytes: this.binFileBytes,
      mmapGeneration: this.mmapGeneration,
      dirtyWritesCount: this.dirtyWritesCount,
      lastFlushLatencyMs: this.lastFlushLatencyMs,
      storageTierStatus: this.storageTierStatus,
      opfsAvailable: this.opfsAvailable,
    };
  }
}
