import React, { useState, useEffect, useRef } from 'react';
import {
  QA_DATASET_CATALOG,
  QaDatasetMeta,
  QaPair,
  QaStreamProgress,
  OFFLINE_EE_PHYSICS_DATASET,
  OFFLINE_CODING_DATASET,
} from '../data/qaDatasetCatalog';
import { wasmCrossbarEngine, CrossbarTelemetry } from '../physics/wasmMemristorEngine';

interface MassiveQaDatasetsViewProps {
  onDatasetTrained?: () => void;
  onExecuteQuery?: (query: string) => void;
}

export const MassiveQaDatasetsView: React.FC<MassiveQaDatasetsViewProps> = ({
  onDatasetTrained,
  onExecuteQuery,
}) => {
  const [catalog, setCatalog] = useState<QaDatasetMeta[]>(QA_DATASET_CATALOG);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('ee_physics');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  
  // Streaming & Training parameters
  const [batchSize, setBatchSize] = useState<number>(500);
  const [learningRate, setLearningRate] = useState<number>(0.16);
  const [epochs, setEpochs] = useState<number>(1);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isContinuousAutoStream, setIsContinuousAutoStream] = useState<boolean>(false);
  const abortStreamRef = useRef<boolean>(false);

  // Ingestion progress & live ticker
  const [progress, setProgress] = useState<QaStreamProgress | null>(null);
  const [streamStatusMsg, setStreamStatusMsg] = useState<string>('');
  const [datasetOffsetMap, setDatasetOffsetMap] = useState<Record<string, number>>({});

  // Custom dataset upload
  const [uploadMode, setUploadMode] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');
  const [customUploadFormat, setCustomUploadFormat] = useState<'json' | 'jsonl' | 'csv'>('json');
  const [customCount, setCustomCount] = useState<number>(0);
  const [customPreview, setCustomPreview] = useState<QaPair[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick test query terminal inside the Q&A tab
  const [testQuery, setTestQuery] = useState<string>("What is Kirchhoff's Current Law?");
  const [isTestingQuery, setIsTestingQuery] = useState<boolean>(false);
  const [testAnswer, setTestAnswer] = useState<string>('');
  const [testEnergyStats, setTestEnergyStats] = useState<{
    resonantCurrentUa: number;
    leftEnergy: number;
    rightEnergy: number;
    selectedClause: string;
    commissureDeltaE: number;
    latencyUs: number;
  } | null>(null);

  // Engine telemetry
  const [telemetry, setTelemetry] = useState<CrossbarTelemetry>(wasmCrossbarEngine.getTelemetry());

  useEffect(() => {
    // Refresh telemetry every 1.5 seconds
    const interval = setInterval(() => {
      setTelemetry(wasmCrossbarEngine.getTelemetry());
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Fetch catalog and custom status on mount
  useEffect(() => {
    fetch('/api/qa-datasets/catalog')
      .then((res) => res.json())
      .then((data: { catalog?: QaDatasetMeta[]; customUploadedCount?: number }) => {
        if (data.catalog && Array.isArray(data.catalog)) {
          setCatalog(data.catalog);
        }
        if (data.customUploadedCount) {
          setCustomCount(data.customUploadedCount);
        }
      })
      .catch(() => {
        // Fallback to static catalog
        setCatalog(QA_DATASET_CATALOG);
      });
  }, []);

  const selectedMeta = catalog.find((d) => d.id === selectedDatasetId) || catalog[0];

  // Filter datasets
  const filteredDatasets = catalog.filter((d) => {
    if (activeCategoryFilter === 'all') return true;
    return d.category === activeCategoryFilter;
  });

  // Stream a single batch of Q&A pairs from server into crossbar
  const streamSingleBatch = async (
    datasetId: string,
    offset: number,
    limit: number
  ): Promise<{ pairsIngested: number; hasMore: boolean; newOffset: number }> => {
    const meta = catalog.find((d) => d.id === datasetId);
    const title = meta?.title || datasetId;

    setStreamStatusMsg(`Fetching pairs [${offset}..${offset + limit}] from server for ${title}...`);
    
    let pairsToIngest: QaPair[] = [];
    let hasMore = true;

    try {
      const resp = await fetch(`/api/qa-datasets/stream/${datasetId}?offset=${offset}&limit=${limit}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        pairs: QaPair[];
        hasMore: boolean;
        totalPairs: number;
      };
      pairsToIngest = data.pairs || [];
      hasMore = data.hasMore;
    } catch {
      // Fallback to local offline datasets
      if (datasetId === 'ee_physics') {
        pairsToIngest = OFFLINE_EE_PHYSICS_DATASET.slice(offset % OFFLINE_EE_PHYSICS_DATASET.length, (offset % OFFLINE_EE_PHYSICS_DATASET.length) + limit);
      } else if (['codealpaca', 'humaneval_algorithms', 'typescript_web', 'embedded_c', 'sql_database', 'code_debugging'].includes(datasetId)) {
        pairsToIngest = OFFLINE_CODING_DATASET.slice(offset % OFFLINE_CODING_DATASET.length, (offset % OFFLINE_CODING_DATASET.length) + limit);
      }
    }

    if (pairsToIngest.length === 0) {
      setStreamStatusMsg(`No more pairs available in dataset ${title}.`);
      return { pairsIngested: 0, hasMore: false, newOffset: offset };
    }

    setStreamStatusMsg(`Physical memristor training: ${pairsToIngest.length} pairs into Right Hemisphere CSR Crossbar...`);

    const result = await wasmCrossbarEngine.ingestQaPairStream(
      pairsToIngest,
      title,
      epochs,
      learningRate,
      (p) => {
        setProgress(p);
      }
    );

    const newOffset = offset + pairsToIngest.length;
    setDatasetOffsetMap((prev) => ({ ...prev, [datasetId]: newOffset }));
    setTelemetry(wasmCrossbarEngine.getTelemetry());
    onDatasetTrained?.();

    setStreamStatusMsg(
      `✓ Ingested batch: +${result.pairsIngested} pairs · +${result.newSynapses.toLocaleString()} synapses · ${Math.round(result.tokensPerSec).toLocaleString()} tok/s`
    );

    return {
      pairsIngested: result.pairsIngested,
      hasMore,
      newOffset,
    };
  };

  // Start batch or continuous ingestion
  const handleStartIngest = async (continuous: boolean = false) => {
    setIsStreaming(true);
    setIsContinuousAutoStream(continuous);
    abortStreamRef.current = false;

    const currentOffset = datasetOffsetMap[selectedDatasetId] || 0;
    let offset = currentOffset;

    try {
      if (!continuous) {
        await streamSingleBatch(selectedDatasetId, offset, batchSize);
      } else {
        // Continuous crawler loop
        let hasMore = true;
        let cycles = 0;
        const maxCycles = 50; // Safety cap per run

        while (hasMore && !abortStreamRef.current && cycles < maxCycles) {
          const res = await streamSingleBatch(selectedDatasetId, offset, batchSize);
          offset = res.newOffset;
          hasMore = res.hasMore;
          cycles++;
          if (res.pairsIngested === 0) break;
          // Short pause between batches for UI responsiveness
          await new Promise((r) => setTimeout(r, 60));
        }

        if (abortStreamRef.current) {
          setStreamStatusMsg(`Auto-streaming paused by user at pair offset ${offset}.`);
        } else {
          setStreamStatusMsg(`✓ Finished continuous stream across ${cycles} batches.`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Streaming encountered an error';
      setStreamStatusMsg(`Error streaming Q&A: ${msg}`);
    } finally {
      setIsStreaming(false);
      setIsContinuousAutoStream(false);
    }
  };

  const handleStopStream = () => {
    abortStreamRef.current = true;
    setIsContinuousAutoStream(false);
    setStreamStatusMsg('Stopping auto-stream after current batch finishes...');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = String(evt.target?.result || '');
      setCustomText(text);
      if (file.name.endsWith('.jsonl')) setCustomUploadFormat('jsonl');
      else if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) setCustomUploadFormat('csv');
      else setCustomUploadFormat('json');
    };
    reader.readAsText(file);
  };

  const handleUploadCustomPairs = async () => {
    if (!customText.trim()) return;
    setIsUploading(true);

    try {
      const resp = await fetch('/api/qa-datasets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: customText,
          format: customUploadFormat,
          clearExisting: false,
        }),
      });

      const data = (await resp.json()) as {
        ok: boolean;
        addedCount: number;
        totalCustomCount: number;
        sample: QaPair[];
      };

      if (data.ok) {
        setCustomCount(data.totalCustomCount);
        setCustomPreview(data.sample || []);
        setStreamStatusMsg(`✓ Uploaded ${data.addedCount} custom Q&A pairs (Total custom: ${data.totalCustomCount})`);
        
        // Add or update custom in catalog
        const exists = catalog.some((d) => d.id === 'custom');
        if (!exists) {
          const customMeta: QaDatasetMeta = {
            id: 'custom',
            title: `Custom User Uploaded Q&As (${data.totalCustomCount} pairs)`,
            description: 'Directly uploaded pairs from JSON, JSONL, or CSV file.',
            category: 'dialogue',
            totalPairsEstimate: data.totalCustomCount,
            provider: 'User Upload',
            license: 'User Private',
            tags: ['User Dataset', 'Custom Domain', 'Direct Crossbar'],
            recommendedBatchSize: 250,
          };
          setCatalog([customMeta, ...catalog]);
          setSelectedDatasetId('custom');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setStreamStatusMsg(`Upload error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Run quick test query
  const handleRunTestQuery = () => {
    if (!testQuery.trim()) return;
    setIsTestingQuery(true);
    setTestAnswer('');
    setTestEnergyStats(null);

    setTimeout(() => {
      const startNs = performance.now();
      const res = wasmCrossbarEngine.synthesizeResponse(testQuery, 56, 0.15);
      const latencyUs = Math.round((performance.now() - startNs) * 1000);

      setTestAnswer(res.response || 'No resonant excitation produced.');
      setTestEnergyStats({
        resonantCurrentUa: res.resonanceScoreMv,
        leftEnergy: res.triChamber?.forwardEnergy ?? 0,
        rightEnergy: res.triChamber?.backwardEnergy ?? 0,
        selectedClause: res.focusedClause || res.matchedSentence || '',
        commissureDeltaE: res.triChamber?.commissureDeltaE ?? 0,
        latencyUs,
      });
      setIsTestingQuery(false);
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold uppercase tracking-wider">
                Massive Q&A Crossbar Streamer
              </span>
              <span className="text-xs text-slate-400 font-mono">
                100% Pure Physics · Ohm's Law & Kirchhoff Delay Crossbars
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-2">
              Train on Hundreds of Thousands of Q&A Pairs
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Stream world-class open instruction datasets (Stanford Alpaca 52K, Databricks Dolly 15K, Stanford SQuAD 100K+, EE StackExchange 25K) or your own custom pairs directly into the Right Hemisphere memristor crossbar.
            </p>
          </div>

          {/* Quick Hardware Stats */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3">
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">CSR Synapses</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {(telemetry.activeSynapseCount || 0).toLocaleString()}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Right Molecules</div>
              <div className="text-lg font-mono font-bold text-cyan-400">
                {(telemetry.narrativeMoleculesCount || 0).toLocaleString()}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Vocab Somas</div>
              <div className="text-lg font-mono font-bold text-amber-400">
                {(telemetry.vocabSize || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-mono text-slate-400 mr-2">Filter Category:</span>
          {[
            { id: 'all', label: 'All Datasets' },
            { id: 'coding', label: '💻 Coding Agent & Algorithms' },
            { id: 'physics_ee', label: '⚡ EE & Circuit Physics' },
            { id: 'instruction', label: '🧠 Stanford Alpaca 52K' },
            { id: 'dialogue', label: '💬 Human Dialogue & Dolly' },
            { id: 'reading_qa', label: '📖 Stanford SQuAD' },
            { id: 'science', label: '🔬 Science & STEM' },
            { id: 'philosophy', label: '🏛️ Philosophy of Mind' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                activeCategoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <button
            onClick={() => setUploadMode(!uploadMode)}
            className={`ml-auto px-3 py-1 text-xs rounded-lg font-medium border transition-all ${
              uploadMode
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {uploadMode ? '← Back to Catalog' : '📁 Upload Custom Dataset'}
          </button>
        </div>
      </div>

      {/* Custom Dataset Upload Drawer (if active) */}
      {uploadMode ? (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <span>📁 Upload Your Own Q&A Dataset (JSON / JSONL / CSV)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Format auto-detected · Instant CSR crossbar ingestion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                Paste JSON Array, JSONL Lines, or CSV Text:
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder='[
  {"question": "What is Kirchhoffs Current Law?", "answer": "The sum of all currents entering and exiting any node is zero (Σ I = 0)."},
  {"question": "How does an LC tank resonate?", "answer": "At f = 1/(2π√LC), capacitive and inductive reactances cancel out."}
]'
                className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200 mb-2">Or Choose Local File:</div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,.jsonl,.csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                />
                <div className="mt-4 text-xs font-mono text-slate-400 space-y-1">
                  <div>• Supports <code className="text-amber-400">question / answer</code></div>
                  <div>• Supports <code className="text-amber-400">instruction / output</code></div>
                  <div>• Supports <code className="text-amber-400">CSV (col1, col2)</code></div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleUploadCustomPairs}
                  disabled={isUploading || !customText.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  {isUploading ? 'Parsing & Loading...' : `Upload to Memory (${customCount} loaded)`}
                </button>
              </div>
            </div>
          </div>

          {customPreview.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-xs font-mono text-slate-400 mb-2">Sample Parsed Pairs:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {customPreview.map((cp, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-300 truncate">
                    <span className="text-emerald-400">Q:</span> {cp.question} <span className="text-cyan-400">→ A:</span> {cp.answer}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDatasets.map((meta) => {
          const isSelected = selectedDatasetId === meta.id;
          const currentOffset = datasetOffsetMap[meta.id] || 0;
          return (
            <div
              key={meta.id}
              onClick={() => setSelectedDatasetId(meta.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-100 text-base leading-snug">
                    {meta.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 shrink-0">
                    ~{meta.totalPairsEstimate.toLocaleString()} pairs
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                  {meta.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {meta.tags.slice(0, 3).map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">
                  {currentOffset > 0 ? (
                    <span className="text-emerald-400">Trained: {currentOffset.toLocaleString()}</span>
                  ) : (
                    <span>Ready</span>
                  )}
                </span>
                <span className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isSelected ? '✓ Active Target' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Dataset Ingestion Control Deck */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Selected Target Dataset
            </div>
            <h3 className="text-xl font-bold text-slate-100 mt-1">
              {selectedMeta.title}
            </h3>
            <div className="text-xs text-slate-400 mt-1">
              Provider: {selectedMeta.provider} · License: {selectedMeta.license} · Total Estimated Pairs: {selectedMeta.totalPairsEstimate.toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isStreaming ? (
              <>
                <button
                  onClick={() => handleStartIngest(false)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <span>⚡ Stream Next {batchSize} Pairs</span>
                </button>
                <button
                  onClick={() => handleStartIngest(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                >
                  <span>🔁 Continuous Auto-Stream</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleStopStream}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 animate-pulse"
              >
                <span>⏹ Stop Ingestion</span>
              </button>
            )}
          </div>
        </div>

        {/* Hyperparameters & Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-slate-400">Batch Size</span>
              <span className="text-emerald-400 font-bold">{batchSize} pairs</span>
            </div>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              disabled={isStreaming}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={100}>100 Pairs (Quick Probe)</option>
              <option value={250}>250 Pairs</option>
              <option value={500}>500 Pairs (Recommended)</option>
              <option value={1000}>1,000 Pairs (High Density)</option>
              <option value={2500}>2,500 Pairs (Heavy)</option>
              <option value={5000}>5,000 Pairs (Maximum WASM Slice)</option>
            </select>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-slate-400">STDP Learning Rate</span>
              <span className="text-cyan-400 font-bold">{learningRate.toFixed(2)} ΔG</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.01"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              disabled={isStreaming}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-slate-400">Ingestion Epochs</span>
              <span className="text-amber-400 font-bold">{epochs} Pass</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={epochs}
              onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
              disabled={isStreaming}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Live Progress Bar & Telemetry Dashboard */}
        {progress && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-200 font-bold">{progress.datasetTitle}</span>
              </div>
              <div className="text-emerald-400 font-bold">
                {progress.pairsProcessed.toLocaleString()} / {progress.totalPairs.toLocaleString()} pairs ({progress.percent}%)
              </div>
            </div>

            {/* Progress Track */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-150"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            {/* High-frequency Telemetry Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs font-mono">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">THROUGHPUT</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {progress.tokensPerSec.toLocaleString()} tok/s
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">TOKENS INGESTED</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {progress.tokensProcessed.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">NEW SYNAPSES</span>
                <span className="text-amber-400 font-bold text-sm">
                  +{progress.newSynapses.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">TOTAL VOCAB</span>
                <span className="text-purple-400 font-bold text-sm">
                  {progress.vocabSize.toLocaleString()} somas
                </span>
              </div>
            </div>

            {/* Live Q&A Ticker */}
            <div className="mt-3 pt-3 border-t border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400 truncate">
                <span className="text-emerald-400 font-bold">Stimulus S(t-1):</span> {progress.currentQuestion}
              </div>
              <div className="text-slate-300 truncate">
                <span className="text-cyan-400 font-bold">Resonant S(t):</span> {progress.currentAnswer}
              </div>
            </div>
          </div>
        )}

        {/* Status / Log Message */}
        {streamStatusMsg && (
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3">
            {streamStatusMsg}
          </div>
        )}
      </div>

      {/* Quick Test Terminal: Query the Newly Ingested Knowledge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="text-base font-bold text-slate-100">
              Live Neuromorphic Test Terminal
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Tests highest-energy excitation from Left/Right Hemispheres & Corpus Callosum
          </span>
        </div>

        {/* Sample query chips */}
        <div className="flex flex-wrap gap-2">
          {[
            "Who was Albert Einstein?",
            "Write a TypeScript function to debounce an event callback with trailing execution.",
            "Write a binary search algorithm in Python that returns the index of target or -1.",
            "How do you implement a circular ring buffer in C with volatile head and tail indices?",
            "Write an SQL query using a Common Table Expression (CTE) to find the top 3 highest-paid employees per department.",
            "What is Kirchhoff's Current Law?",
            "What is a memristor in electrical circuits?",
            "What is your name?",
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => setTestQuery(q)}
              className="text-xs px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg font-mono transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Query Input & Button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunTestQuery()}
            placeholder="Type your question or stimulus..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleRunTestQuery}
            disabled={isTestingQuery || !testQuery.trim()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isTestingQuery ? (
              <span>Exciting...</span>
            ) : (
              <span>⚡ Transmit Pulse</span>
            )}
          </button>
        </div>

        {/* Answer Output */}
        {testAnswer && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold">Memristor Excitation Output:</span>
              {testEnergyStats && (
                <span className="text-slate-400">
                  Latency: <span className="text-cyan-400">{testEnergyStats.latencyUs} µs</span> · Resonant Current: <span className="text-amber-400">{testEnergyStats.resonantCurrentUa.toFixed(2)} µA</span>
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
              {testAnswer}
            </div>

            {testEnergyStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400 pt-1">
                <div>
                  Left (Analytical): <span className="text-cyan-300 font-bold">{testEnergyStats.leftEnergy.toFixed(1)} meV</span>
                </div>
                <div>
                  Right (Q&A/Dialogue): <span className="text-emerald-300 font-bold">{testEnergyStats.rightEnergy.toFixed(1)} meV</span>
                </div>
                <div>
                  Commissure ΔE: <span className="text-amber-300 font-bold">{testEnergyStats.commissureDeltaE.toFixed(1)} meV</span>
                </div>
                <div>
                  Focal Clause: <span className="text-purple-300 font-bold truncate block">{testEnergyStats.selectedClause.slice(0, 24)}...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
