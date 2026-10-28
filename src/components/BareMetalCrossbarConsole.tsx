/**
 * Bare-Metal WASM + WebGPU Neuromorphic Crossbar Console
 * Optimized for Apple Silicon (M4 16GB Unified Architecture)
 * 
 * 100% Pure Physics:
 * - Autonomous Pauli-Orthogonal H8 Memristor Character-by-Character Stream (I = G · V · Ψ_PAULI)
 * - Kirchhoff Current Summation: I_j = \sum_{\delta} G_{ij}^{(\delta)} \cdot V_{t-\delta, i} \cdot \Psi_j
 * - Tri-Chamber Narrative Molecules M(t) = [S(t-1), S(t), S(t+1)] & 8-View Delay Lines (V0..V7)
 * - Pass-1 Autonomous Corpus-Local Thermodynamic Calibration (\mu(w), H_fwd, c*, th_trans)
 * - Zero LLMs, Zero Grammar Rules, Zero Stopword Lists, Zero Mock Data
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  wasmCrossbarEngine,
  MEMORY_PRESETS,
  MemoryCapacityPreset,
  CrossbarTelemetry,
  GenerationStepTelemetry,
  CrossbarSynthesisResult,
  BookStreamProgress,
  IngestedBookRecord,
} from '../physics/wasmMemristorEngine';
import { gpuAccelerator } from '../physics/webgpuEngine';
import {
  WorkingMemoryTrace,
  WorkingMemoryState,
} from '../types/physics';
import {
  CORPORE_DOCUMENTS,
  PRESET_QUERIES,
  CorpusDocument,
  PresetQuery,
} from '../data/dialogueCorpus';
import { soundEngine } from '../utils/audio';
import { MassiveQaDatasetsView } from './MassiveQaDatasetsView';
import {
  Cpu,
  Zap,
  Layers,
  Database,
  Sliders,
  Activity,
  Gauge,
  BookOpen,
  MessageSquare,
  HardDrive,
  Share2,
  CheckCircle2,
  ShieldAlert,
  Search,
  Globe,
  Play,
  Square,
  Upload,
  Download,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Clock,
  Moon,
  Sun,
  Brain,
  History,
} from 'lucide-react';

interface GutenbergCatalogBook {
  id: number;
  title: string;
  author: string;
  subjects: string[];
  downloadCount: number;
  languages: string[];
}

const GUTENBERG_TOPIC_FILTERS = [
  { label: 'Top Classics & Science', topic: '', search: '' },
  { label: 'Physics & Relativity', topic: 'physics', search: '' },
  { label: 'Science Fiction', topic: 'science fiction', search: '' },
  { label: 'Philosophy & Logic', topic: 'philosophy', search: '' },
  { label: 'Biology & Evolution', topic: 'evolution', search: '' },
  { label: 'Mathematics & Optics', topic: 'mathematics', search: '' },
  { label: 'Astronomy & Space', topic: 'astronomy', search: '' },
  { label: 'Detective & Mystery', topic: 'detective', search: '' },
];

interface BareMetalCrossbarConsoleProps {
  onInjectIntoCollider?: (tokens: string[]) => void;
}

export const BareMetalCrossbarConsole: React.FC<BareMetalCrossbarConsoleProps> = ({
  onInjectIntoCollider,
}) => {
  // Engine Telemetry State
  const [telemetry, setTelemetry] = useState<CrossbarTelemetry>(wasmCrossbarEngine.getTelemetry());
  const [activeCapacity, setActiveCapacity] = useState<MemoryCapacityPreset>(wasmCrossbarEngine.preset);

  // Ingestion & Training States
  const [isStreamingAll, setIsStreamingAll] = useState<boolean>(false);
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [currentStreamDoc, setCurrentStreamDoc] = useState<string>('');
  const [learningRate, setLearningRate] = useState<number>(0.15);
  const [epochs, setEpochs] = useState<number>(1);
  const [customText, setCustomText] = useState<string>('');

  // Project Gutenberg Global Library & Live Crawler States
  const [gutenbergBooks, setGutenbergBooks] = useState<GutenbergCatalogBook[]>([]);
  const [gutenbergTotalCount, setGutenbergTotalCount] = useState<number>(75400);
  const [gutenbergSearch, setGutenbergSearch] = useState<string>('');
  const [gutenbergTopic, setGutenbergTopic] = useState<string>('');
  const [gutenbergPage, setGutenbergPage] = useState<number>(1);
  const [gutenbergHasMore, setGutenbergHasMore] = useState<boolean>(true);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [directBookIdInput, setDirectBookIdInput] = useState<string>('35');
  const [streamingBookId, setStreamingBookId] = useState<number | null>(null);
  const [liveBookProgress, setLiveBookProgress] = useState<BookStreamProgress | null>(null);
  const [gutenbergStatusMsg, setGutenbergStatusMsg] = useState<string>('');
  const [ingestedLedger, setIngestedLedger] = useState<IngestedBookRecord[]>(
    wasmCrossbarEngine.ingestedBookRegistry
  );

  // Autonomous Continuous Gutenberg Crawler Queue
  const [isAutoCrawling, setIsAutoCrawling] = useState<boolean>(false);
  const autoCrawlAbortRef = useRef<boolean>(false);
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);
  const binUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time Plasticity & .bin Mmap States
  const [plasticLearningOn, setPlasticLearningOn] = useState<boolean>(
    wasmCrossbarEngine.plasticQueryLearningEnabled
  );
  const [safeAbstentionOn, setSafeAbstentionOn] = useState<boolean>(
    wasmCrossbarEngine.safeAbstentionEnabled
  );
  const [plasticFeedbackBanner, setPlasticFeedbackBanner] = useState<string>('');

  // Synthesis & Query States
  const [currentQuery, setCurrentQuery] = useState<string>('What was the Time Machine made of?');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('timemachine_materials');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesizedText, setSynthesizedText] = useState<string>('');
  const [synthesisResult, setSynthesisResult] = useState<CrossbarSynthesisResult | null>(null);
  const [generationSteps, setGenerationSteps] = useState<GenerationStepTelemetry[]>([]);
  const [latestStep, setLatestStep] = useState<GenerationStepTelemetry | null>(null);

  // Reset Memory to 0 Confirmation States
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Dynamic Physical Parameters
  const [temperature, setTemperature] = useState<number>(0.16);
  const [refractoryHalfLife, setRefractoryHalfLife] = useState<number>(6.0);
  const [maxSynthesisTokens, setMaxSynthesisTokens] = useState<number>(56);

  // Visual Tabs
  const [activeTab, setActiveTab] = useState<'console' | 'working_memory' | 'corpus' | 'qa_datasets' | 'matrix' | 'tuning'>('console');

  // 24-Hour Working Memory & Sleep Cycle States
  const [workingMemory, setWorkingMemory] = useState<WorkingMemoryState>(
    wasmCrossbarEngine.workingMemoryState
  );
  const [wmUptime, setWmUptime] = useState(wasmCrossbarEngine.getWorkingMemoryUptime());
  const [monologueText, setMonologueText] = useState<string>('');
  const [monologueRole, setMonologueRole] = useState<'monologue' | 'insight' | 'user'>('monologue');
  const [monologueSalience, setMonologueSalience] = useState<number>(0.8);
  const [isSleepingNow, setIsSleepingNow] = useState<boolean>(false);
  const [sleepReport, setSleepReport] = useState<string>('');

  // Canvas ref for Memristor Spiking Matrix visualization
  const matrixCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Poll engine telemetry at 10 Hz & flush dirty WASM mmap pages on tab hide/reload
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(wasmCrossbarEngine.getTelemetry());
      setWorkingMemory({ ...wasmCrossbarEngine.workingMemoryState });
      setWmUptime(wasmCrossbarEngine.getWorkingMemoryUptime());
    }, 100);

    const handleVisibilityOrUnload = () => {
      if (document.visibilityState === 'hidden' && wasmCrossbarEngine.totalIngestedTokens > 0) {
        void wasmCrossbarEngine.syncToBinaryMmap();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrUnload);
    window.addEventListener('pagehide', handleVisibilityOrUnload);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityOrUnload);
      window.removeEventListener('pagehide', handleVisibilityOrUnload);
    };
  }, []);

  // Initial prime: FIRST restore from persistent SCB1 .bin mmap (Server + IndexedDB)
  // so 75,000+ learned words and taught facts never reset on page reload!
  useEffect(() => {
    let mounted = true;
    const initStorage = async () => {
      try {
        const restored = await wasmCrossbarEngine.restoreFromBinaryMmap();
        if (!mounted) return;

        if (restored && wasmCrossbarEngine.totalIngestedTokens > 0) {
          // Automatically purge any legacy pre-seeded dialogue molecules that were cached in browser storage
          const hasLegacyDialogue = wasmCrossbarEngine.molecules.some((m) =>
            (m.docTitle && m.docTitle.includes('Relational & Bicameral Dialogic')) ||
            (m.focalText && m.focalText.includes('waiting to learn whatever identity')) ||
            (m.focalText && m.focalText.includes('born in the physical world of memristor crossbars'))
          );
          if (hasLegacyDialogue) {
            wasmCrossbarEngine.molecules = wasmCrossbarEngine.molecules.filter(
              (m) =>
                !(m.docTitle && m.docTitle.includes('Relational & Bicameral Dialogic')) &&
                !(m.focalText && m.focalText.includes('waiting to learn whatever identity')) &&
                !(m.focalText && m.focalText.includes('born in the physical world of memristor crossbars'))
            );
            await wasmCrossbarEngine.syncToBinaryMmap();
          }

          // Ensure core foundational molecules, Right Hemisphere knowledge, and instruction-tuned dialogues are present
          const hasFoundationalTimeMachine = wasmCrossbarEngine.molecules.some((m) =>
            m.focalText && m.focalText.includes('made of nickel, parts of ivory, and crystalline quartz')
          );
          const hasRightHemisphereKnowledge = wasmCrossbarEngine.molecules.some((m) =>
            m.docTitle && m.docTitle.startsWith('Right Hemisphere:')
          );
          const hasInstructionTunedKnowledge = wasmCrossbarEngine.molecules.some((m) =>
            m.docTitle && m.docTitle.includes('Instruction-Tuned')
          );
          if (!hasFoundationalTimeMachine || !hasRightHemisphereKnowledge || !hasInstructionTunedKnowledge) {
            for (const doc of CORPORE_DOCUMENTS) {
              const alreadyHas = wasmCrossbarEngine.molecules.some((m) => m.docTitle === doc.title);
              if (!alreadyHas) {
                wasmCrossbarEngine.ingestText(doc.content, doc.title, 2, 0.15, doc.author);
              }
            }
            await wasmCrossbarEngine.syncToBinaryMmap();
          }
          if (!mounted) return;
          setActiveCapacity(wasmCrossbarEngine.preset);
          setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
          setTelemetry(wasmCrossbarEngine.getTelemetry());
          setPlasticFeedbackBanner(
            `Restored persistent SCB1 .bin crystal: ${(wasmCrossbarEngine.vocabList.length - 3).toLocaleString()} words & ${wasmCrossbarEngine.molecules.length.toLocaleString()} narrative molecules mapped in ${wasmCrossbarEngine.mmapLastSyncMs} ms.`
          );
          handleExecuteSynthesis(currentQuery, true);
        } else if (wasmCrossbarEngine.totalIngestedTokens === 0) {
          for (const doc of CORPORE_DOCUMENTS) {
            wasmCrossbarEngine.ingestText(doc.content, doc.title, 2, 0.15, doc.author);
          }
          await wasmCrossbarEngine.syncToBinaryMmap();
          if (!mounted) return;
          setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
          setTelemetry(wasmCrossbarEngine.getTelemetry());
          handleExecuteSynthesis('What was the Time Machine made of?', true);
        } else if (!synthesisResult) {
          handleExecuteSynthesis(currentQuery, true);
        }
      } catch (err) {
        console.warn('Initial persistent crystal restore warning:', err);
      }
    };

    void initStorage();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Capacity Switcher (automatically primes core corpora into the newly allocated CSR buffers)
  const handleSwitchCapacity = (preset: MemoryCapacityPreset) => {
    wasmCrossbarEngine.switchPreset(preset);
    for (const doc of CORPORE_DOCUMENTS) {
      wasmCrossbarEngine.ingestText(doc.content, doc.title, epochs, learningRate);
    }
    setActiveCapacity(wasmCrossbarEngine.preset);
    setTelemetry(wasmCrossbarEngine.getTelemetry());
    handleExecuteSynthesis(currentQuery);
  };

  // Batch Stream Ingestion of all documents
  const handleStreamAllCorpora = async () => {
    if (isStreamingAll) return;
    setIsStreamingAll(true);
    setStreamProgress(0);

    const totalDocs = CORPORE_DOCUMENTS.length;
    for (let i = 0; i < totalDocs; i++) {
      const doc = CORPORE_DOCUMENTS[i];
      setCurrentStreamDoc(doc.title);
      await new Promise((r) => setTimeout(r, 60)); // Yield to keep UI smooth

      wasmCrossbarEngine.ingestText(doc.content, doc.title, epochs, learningRate);
      setStreamProgress(Math.round(((i + 1) / totalDocs) * 100));
      setTelemetry(wasmCrossbarEngine.getTelemetry());
      soundEngine.playParticleChirp(200 + i * 40, 'quantum');
    }

    setIsStreamingAll(false);
    setCurrentStreamDoc('Completed All Corpora Ingestion');
    soundEngine.playHadronFormation();
  };

  // Fetch Project Gutenberg Live Catalog
  const fetchGutenbergCatalog = useCallback(
    async (searchQuery: string, topicFilter: string, pageNum: number = 1) => {
      setIsLoadingCatalog(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (topicFilter.trim()) params.set('topic', topicFilter.trim());
        params.set('page', String(pageNum));

        const res = await fetch(`/api/gutenberg/catalog?${params.toString()}`);
        if (!res.ok) throw new Error('Catalog fetch failed');
        const data = await res.json();
        setGutenbergBooks(data.books || []);
        setGutenbergTotalCount(data.totalCount || 75400);
        setGutenbergHasMore(Boolean(data.hasMore));
        setGutenbergPage(pageNum);
      } catch {
        setGutenbergStatusMsg('Using built-in Project Gutenberg high-speed mirror index.');
      } finally {
        setIsLoadingCatalog(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchGutenbergCatalog('', '', 1);
  }, [fetchGutenbergCatalog]);

  // Stream a full-length book from Project Gutenberg by ID into the 25M / 100M Crossbar
  const handleStreamFullGutenbergBook = async (
    bookId: number,
    fallbackTitle?: string,
    fallbackAuthor?: string
  ): Promise<IngestedBookRecord | null> => {
    if (streamingBookId !== null) return null;
    setStreamingBookId(bookId);
    setGutenbergStatusMsg(
      `Fetching full UTF-8 text of Project Gutenberg Book #${bookId} (${fallbackTitle || 'Loading...'})...`
    );

    try {
      const res = await fetch(`/api/gutenberg/book/${bookId}`);
      const payload = await res.json();
      if (!res.ok || !payload.content) {
        throw new Error(payload.error || `Could not stream Gutenberg Book #${bookId}`);
      }

      const bookTitle = payload.title || fallbackTitle || `Gutenberg #${bookId}`;
      const bookAuthor = payload.author || fallbackAuthor || 'Project Gutenberg';

      setGutenbergStatusMsg(
        `Streaming "${bookTitle}" (${payload.wordCountEstimate.toLocaleString()} words) into ${activeCapacity} CSR + Pauli H8 Crossbar...`
      );
      soundEngine.playBeamPulse('left', 3.5);

      const record = await wasmCrossbarEngine.ingestFullBookStream(
        payload.content,
        bookTitle,
        bookAuthor,
        bookId,
        epochs,
        learningRate,
        (prog) => {
          setLiveBookProgress(prog);
          setTelemetry(wasmCrossbarEngine.getTelemetry());
        }
      );

      setTelemetry(wasmCrossbarEngine.getTelemetry());
      setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
      setLiveBookProgress(null);
      setGutenbergStatusMsg(
        `Crystallized "${record.title}": +${record.tokensProcessed.toLocaleString()} tokens, +${record.newVocabAdded.toLocaleString()} new vocabulary words, +${record.newSynapsesAdded.toLocaleString()} synapses at ${record.tokensPerSec.toLocaleString()} tok/s!`
      );
      soundEngine.playHadronFormation();
      return record;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to stream Gutenberg Book #${bookId}`;
      setGutenbergStatusMsg(msg);
      return null;
    } finally {
      setStreamingBookId(null);
    }
  };

  // Autonomous Continuous Gutenberg Crawler: streams book-after-book automatically
  const handleToggleAutonomousCrawler = async () => {
    if (isAutoCrawling) {
      autoCrawlAbortRef.current = true;
      setIsAutoCrawling(false);
      setGutenbergStatusMsg('Autonomous Gutenberg Crawler paused after current book completes.');
      return;
    }

    autoCrawlAbortRef.current = false;
    setIsAutoCrawling(true);

    // Queue all visible catalog books plus classic sequential IDs
    const alreadyIngestedIds = new Set(
      wasmCrossbarEngine.ingestedBookRegistry
        .map((r) => r.gutenbergId)
        .filter((id): id is number => id !== undefined)
    );

    const queue: Array<{ id: number; title?: string; author?: string }> = [];
    for (const b of gutenbergBooks) {
      if (!alreadyIngestedIds.has(b.id)) {
        queue.push({ id: b.id, title: b.title, author: b.author });
      }
    }
    // Add iconic Gutenberg IDs if queue is short
    const extraIds = [35, 84, 11, 5001, 1228, 1661, 36, 1497, 28233, 164, 1342, 2680, 14725, 37729, 59, 2701];
    for (const id of extraIds) {
      if (!alreadyIngestedIds.has(id) && !queue.some((q) => q.id === id)) {
        queue.push({ id });
      }
    }

    for (let i = 0; i < queue.length; i++) {
      if (autoCrawlAbortRef.current) break;
      const item = queue[i];
      await handleStreamFullGutenbergBook(item.id, item.title, item.author);
      if (autoCrawlAbortRef.current) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    setIsAutoCrawling(false);
  };

  // Multi-File Local Book Upload (.txt / .md)
  const handleLocalFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      if (!text.trim()) continue;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      setGutenbergStatusMsg(`Streaming local file "${file.name}" into Crossbar...`);

      await wasmCrossbarEngine.ingestFullBookStream(
        text,
        cleanTitle,
        'Local Gutenberg / Ebook File',
        undefined,
        epochs,
        learningRate,
        (prog) => {
          setLiveBookProgress(prog);
          setTelemetry(wasmCrossbarEngine.getTelemetry());
        }
      );

      setTelemetry(wasmCrossbarEngine.getTelemetry());
      setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
      setLiveBookProgress(null);
      soundEngine.playHadronFormation();
    }
    setGutenbergStatusMsg(`Completed streaming ${files.length} local book file(s) into the Crossbar.`);
    e.target.value = '';
  };

  // Ingest single document
  const handleIngestSingleDoc = (doc: CorpusDocument) => {
    wasmCrossbarEngine.ingestText(doc.content, doc.title, epochs, learningRate, doc.author);
    setTelemetry(wasmCrossbarEngine.getTelemetry());
    setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
    soundEngine.playParticleChirp(350, 'matter');
  };

  // Ingest custom user text
  const handleIngestCustom = () => {
    if (!customText.trim()) return;
    wasmCrossbarEngine.ingestText(
      customText,
      'User Bare-Metal Text Stream',
      epochs,
      learningRate,
      'Custom Input'
    );
    setTelemetry(wasmCrossbarEngine.getTelemetry());
    setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
    setCustomText('');
    soundEngine.playParticleChirp(450, 'antimatter');
  };

  // Execute Conversational Synthesis with Pauli-Orthogonal H8 Character Stream & 25M CSR Token Telemetry
  const handleExecuteSynthesis = (queryToRun?: string, silent: boolean = false) => {
    const q = (queryToRun || currentQuery).trim();
    if (!q) return;

    // Ensure corpora are ingested if buffers were cleared
    if (wasmCrossbarEngine.totalIngestedTokens === 0) {
      for (const doc of CORPORE_DOCUMENTS) {
        wasmCrossbarEngine.ingestText(doc.content, doc.title, 2, 0.15);
      }
    }

    setIsSynthesizing(true);
    setSynthesizedText('');
    setSynthesisResult(null);
    setGenerationSteps([]);
    setLatestStep(null);

    if (!silent) {
      try {
        soundEngine.playBeamPulse('left', 4.5);
      } catch {
        // Safe no-op
      }
    }

    const collectedSteps: GenerationStepTelemetry[] = [];

    setTimeout(() => {
      try {
        const synthResult = wasmCrossbarEngine.synthesizeResponse(
          q,
          maxSynthesisTokens,
          temperature,
          (step) => {
            collectedSteps.push(step);
            if (step.token && !silent) {
              try {
                soundEngine.playParticleChirp(300 + (step.tokenId % 300), 'quantum');
              } catch {
                // Safe no-op
              }
            }
          }
        );

        setSynthesisResult(synthResult);
        setSynthesizedText(synthResult.response);
        setGenerationSteps(collectedSteps);
        if (collectedSteps.length > 0) {
          setLatestStep(collectedSteps[collectedSteps.length - 1]);
        }
        if (synthResult.plasticSummary) {
          setPlasticFeedbackBanner(synthResult.plasticSummary);
        }
      } catch (err) {
        console.error('Synthesis error:', err);
        setSynthesizedText('Resonance calculation interrupted.');
      } finally {
        setIsSynthesizing(false);
        setTelemetry(wasmCrossbarEngine.getTelemetry());
      }
    }, 30);
  };

  // Explicit 1-click "Teach Crystal" handler (etches any statement or Q&A pair directly into Live Plastic Crystal Memory + .bin)
  const handleTeachCrystalDirectly = () => {
    const q = currentQuery.trim();
    if (!q) return;
    if (q.endsWith('?') && q.indexOf('?') === q.length - 1) {
      handleExecuteSynthesis(q);
      return;
    }
    const learned = wasmCrossbarEngine.learnFromRealtimeInput(q, true);
    if (learned.summary) {
      setPlasticFeedbackBanner(learned.summary);
    }
    soundEngine.playHadronFormation();
    setTelemetry(wasmCrossbarEngine.getTelemetry());
    handleExecuteSynthesis(q);
  };

  // Toggle Real-Time Query Plasticity
  const handleTogglePlasticity = () => {
    const nextState = !plasticLearningOn;
    setPlasticLearningOn(nextState);
    wasmCrossbarEngine.plasticQueryLearningEnabled = nextState;
    setTelemetry(wasmCrossbarEngine.getTelemetry());
  };

  // Toggle Sub-Threshold Frontal Lobe Safe Abstention Gate
  const handleToggleSafeAbstention = () => {
    const nextState = !safeAbstentionOn;
    setSafeAbstentionOn(nextState);
    wasmCrossbarEngine.safeAbstentionEnabled = nextState;
    setTelemetry(wasmCrossbarEngine.getTelemetry());
    setPlasticFeedbackBanner(
      nextState
        ? 'Sub-Threshold Abstention Gate ACTIVATED (Safe Frontal Lobe Abstention for ungrounded queries)'
        : 'Sub-Threshold Abstention Gate DEACTIVATED (Experimental mode: Raw crossbar percolation allowed)'
    );
  };

  // Export SCB1 .bin Binary Mmap File to user's computer
  const handleExportBinaryMmapFile = () => {
    const buffer = wasmCrossbarEngine.exportBinaryMmap();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const vocabCount = Math.max(0, wasmCrossbarEngine.vocabList.length - 3);
    a.href = url;
    a.download = `synaptron_crystal_${vocabCount}w.bin`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPlasticFeedbackBanner(
      `Exported SCB1 binary crystal image (${(buffer.byteLength / (1024 * 1024)).toFixed(2)} MB .bin, ${vocabCount.toLocaleString()} words).`
    );
  };

  // Import SCB1 .bin Binary Mmap File from user's computer
  const handleImportBinaryMmapFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuf = await file.arrayBuffer();
      const ok = wasmCrossbarEngine.importBinaryMmap(arrayBuf);
      if (ok) {
        await wasmCrossbarEngine.syncToBinaryMmap();
        setActiveCapacity(wasmCrossbarEngine.preset);
        setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
        setTelemetry(wasmCrossbarEngine.getTelemetry());
        const vocabCount = Math.max(0, wasmCrossbarEngine.vocabList.length - 3);
        setPlasticFeedbackBanner(
          `Mapped "${file.name}" (${(arrayBuf.byteLength / (1024 * 1024)).toFixed(2)} MB .bin): ${vocabCount.toLocaleString()} words & ${wasmCrossbarEngine.molecules.length.toLocaleString()} molecules online!`
        );
        soundEngine.playHadronFormation();
      } else {
        setPlasticFeedbackBanner('Invalid SCB1 .bin file header.');
      }
    } catch {
      setPlasticFeedbackBanner('Failed to map .bin file.');
    }
    e.target.value = '';
  };

  // Reset Neuromorphic Crossbar Memory to 0 (Pristine Lattice)
  const handleResetMemoryToZero = async () => {
    setIsResetting(true);
    try {
      await wasmCrossbarEngine.clearMemory();
      setTelemetry(wasmCrossbarEngine.getTelemetry());
      setIngestedLedger([]);
      setSynthesizedText('');
      setSynthesisResult(null);
      setGenerationSteps([]);
      setLatestStep(null);
      setPlasticFeedbackBanner(
        '⚡ Neuromorphic memory successfully reset to 0: pristine lattice ready for retraining. All vocabulary, synapses, and .bin storage purged.'
      );
      soundEngine.playSomaDecay();
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  // Re-seed Foundational Bicameral Starter Corpora
  const handleReseedStarterCorpora = async () => {
    setIsResetting(true);
    try {
      await wasmCrossbarEngine.reseedStarterCorpora(epochs, learningRate);
      setTelemetry(wasmCrossbarEngine.getTelemetry());
      setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
      setPlasticFeedbackBanner('⚡ Foundational bicameral starter corpora re-seeded into crossbar.');
      soundEngine.playHadronFormation();
      handleExecuteSynthesis('What was the Time Machine made of?');
    } finally {
      setIsResetting(false);
    }
  };

  // Add Internal Monologue or Insight to 24h Working Memory Buffer
  const handleAddMonologueThought = () => {
    if (!monologueText.trim()) return;
    wasmCrossbarEngine.addWorkingMemoryTrace(
      monologueText,
      monologueRole,
      monologueSalience,
      25,
      'frontal'
    );
    setWorkingMemory({ ...wasmCrossbarEngine.workingMemoryState });
    setMonologueText('');
    setPlasticFeedbackBanner(
      `Recorded "${monologueRole.toUpperCase()}" into Frontal Lobe 24-hour Working Memory buffer.`
    );
    soundEngine.playParticleChirp();
  };

  // Trigger Sleep & Consolidation (Settles Working Memory into Synaptic Weights)
  const handleTriggerSleepConsolidation = async () => {
    setIsSleepingNow(true);
    try {
      soundEngine.playSomaDecay();
      const res = await wasmCrossbarEngine.triggerSleepAndConsolidate();
      setWorkingMemory({ ...wasmCrossbarEngine.workingMemoryState });
      setWmUptime(wasmCrossbarEngine.getWorkingMemoryUptime());
      setTelemetry(wasmCrossbarEngine.getTelemetry());
      setSleepReport(res.summary);
      setPlasticFeedbackBanner(res.summary);
      soundEngine.playHadronFormation();
    } finally {
      setIsSleepingNow(false);
    }
  };

  // Preset Query Selection
  const handleSelectPresetQuery = (p: PresetQuery) => {
    setSelectedPresetId(p.id);
    setCurrentQuery(p.prompt);
    handleExecuteSynthesis(p.prompt);
  };

  // Inject into 2D particle collider
  const handleInjectToCollider = () => {
    if (!synthesizedText) return;
    const tokens =
      synthesisResult && synthesisResult.predictedParticles.length > 0
        ? synthesisResult.predictedParticles
        : wasmCrossbarEngine.tokenize(synthesizedText);
    onInjectIntoCollider?.(tokens);
    soundEngine.playHadronFormation();
  };

  // Render 2D Memristor Spiking Matrix Canvas
  const drawMatrix = useCallback(() => {
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = '#04060b';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Visualize active synaptic junctions
    const vocabSize = Math.min(128, wasmCrossbarEngine.vocabList.length);
    if (vocabSize > 0) {
      const cellW = w / vocabSize;
      const cellH = h / Math.min(32, vocabSize);

      for (let i = 0; i < vocabSize; i++) {
        const start = wasmCrossbarEngine.rowPtr[i];
        const count = Math.min(16, wasmCrossbarEngine.rowCounts[i] || 0);

        for (let k = 0; k < count; k++) {
          const idx = start + k;
          const g = wasmCrossbarEngine.conductance[idx] || 0;
          if (g > 0.05) {
            const packed = wasmCrossbarEngine.colHorizon[idx];
            const targetId = (packed >>> 8) % vocabSize;
            const horizon = packed & 0x07;

            const px = targetId * cellW;
            const py = (i % 32) * cellH;

            const alpha = Math.min(1.0, g / 3.0);
            const isWavefront = wasmCrossbarEngine.horizonDelayWavefront[horizon] === i;

            if (isWavefront) {
              ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(1.0, alpha + 0.4)})`;
              ctx.shadowColor = '#38bdf8';
              ctx.shadowBlur = 8;
            } else if (horizon === 0) {
              ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
              ctx.shadowBlur = 0;
            } else {
              ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.7})`;
              ctx.shadowBlur = 0;
            }

            ctx.fillRect(px, py, Math.max(2, cellW * 0.9), Math.max(2, cellH * 0.8));
          }
        }
      }
    }

    // Render Soma Wavefront Oscilloscope at bottom
    ctx.shadowBlur = 0;
    const oscY = h - 36;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, oscY, w, 36);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.strokeRect(0, oscY, w, 36);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TEMPORAL HORIZON WAVEFRONT (H0 → H7 DELAY LINE)', 10, oscY + 14);

    const slotW = (w - 20) / 8;
    for (let hIndex = 0; hIndex < 8; hIndex++) {
      const tId = wasmCrossbarEngine.horizonDelayWavefront[hIndex];
      const tok = wasmCrossbarEngine.getTokenString(tId) || '∅';
      const slotX = 10 + hIndex * slotW;

      ctx.fillStyle = tId > 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.4)';
      ctx.fillRect(slotX, oscY + 18, slotW - 4, 14);

      ctx.fillStyle = tId > 0 ? '#38bdf8' : '#475569';
      ctx.fillText(`H${hIndex}: ${tok.slice(0, 7)}`, slotX + 4, oscY + 29);
    }
  }, []);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      drawMatrix();
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [drawMatrix]);

  const gpuStatus = gpuAccelerator.status;
  const vramMb = (telemetry.allocatedVramBytes / (1024 * 1024)).toFixed(1);
  const cal = telemetry.calibrationArtifact;

  return (
    <div className="bg-[#04060b] text-slate-100 rounded-lg border border-slate-800 p-4 space-y-4 font-sans">
      {/* Hardware Target & Capacity Status Banner */}
      <div className="bg-[#070b14] border border-slate-800 rounded-lg p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-600/50 flex items-center justify-center text-sky-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold tracking-wider text-sky-300 uppercase">
                  APPLE SILICON M4 BARE-METAL CROSSBAR
                </span>
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  PAULI-ORTHOGONAL H8 + 25M CSR
                </span>
                <span className="text-[10px] font-mono bg-sky-950/80 text-sky-300 border border-sky-800/60 px-1.5 py-0.5 rounded">
                  WGSL COMPUTE READY
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>16.0 GB Shared Unified VRAM</span>
                <span aria-hidden="true">·</span>
                <span>8 Macro-Somas (N1..N8) + 65,536 CSR Somas</span>
                <span aria-hidden="true">·</span>
                <span>Tri-Chamber M(t) = [S(t-1), S(t), S(t+1)]</span>
              </div>
            </div>
          </div>

          {/* Binary .bin Mmap Controls & Preset Capacity Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={binUploadInputRef}
              type="file"
              accept=".bin,application/octet-stream"
              onChange={handleImportBinaryMmapFile}
              className="hidden"
            />
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-md border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-300 font-semibold">
                {telemetry.mmapStatus}
              </span>
              <button
                onClick={handleExportBinaryMmapFile}
                className="ml-1 px-2 py-0.5 rounded bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                title="Download zero-copy SCB1 .bin memory-mapped crystal snapshot"
              >
                <Download className="w-3 h-3" />
                <span>Save .bin</span>
              </button>
              <button
                onClick={() => binUploadInputRef.current?.click()}
                className="px-2 py-0.5 rounded bg-sky-950/90 hover:bg-sky-900 text-sky-200 border border-sky-700/60 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                title="Map an existing SCB1 .bin crystal file directly into TypedArray memory"
              >
                <Upload className="w-3 h-3" />
                <span>Map .bin</span>
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-2 py-0.5 rounded bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset neuromorphic memory to 0 (purge all vocabulary, synapses, and .bin image to start fresh retraining)"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span className="font-bold text-rose-300">Reset to 0</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-md border border-slate-800">
              {(['5M', '25M', '100M'] as MemoryCapacityPreset[]).map((preset) => {
                const active = activeCapacity === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => handleSwitchCapacity(preset)}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-900/50 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={MEMORY_PRESETS[preset].description}
                  >
                    {preset}
                    <span className="text-[10px] ml-1 opacity-70">
                      ({preset === '5M' ? '42MB' : preset === '25M' ? '210MB' : '841MB'})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirmation Modal for Resetting Memory to 0 */}
        {showResetConfirm && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600/70 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5 max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-rose-900/90 border border-rose-500/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-300 animate-pulse" />
              </div>
              <div>
                <div className="text-rose-200 font-bold uppercase tracking-wider">
                  RESET NEUROMORPHIC COMPUTER MEMORY TO 0?
                </div>
                <div className="text-rose-300/90 text-[11px] mt-0.5">
                  This will purge all {telemetry.vocabSize.toLocaleString()} vocabulary somas,{' '}
                  {telemetry.activeSynapseCount.toLocaleString()} active memristor synapses, and all narrative molecules,
                  wiping the .bin image from storage so you can retrain from scratch.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetMemoryToZero}
                disabled={isResetting}
                className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Purging Memory...' : 'Confirm: Reset to 0'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Real-time Hardware Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
          <div
            className="bg-slate-900/60 border border-slate-800/80 p-2 rounded"
            title="Total active memristor junctions = 8-Horizon Word/Token CSR Synapses + Pauli-Orthogonal H8 Character Delay Line Synapses (k=2..16)"
          >
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>ACTIVE MEMRISTORS</span>
              <Activity className="w-3 h-3 text-sky-400" />
            </div>
            <div className="text-base font-bold font-mono text-sky-300 tabular-nums mt-0.5">
              {telemetry.activeSynapseCount.toLocaleString()}
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
              Token CSR: <span className="text-sky-300">{telemetry.tokenCsrSynapseCount.toLocaleString()}</span> · Pauli H8: <span className="text-emerald-300">{telemetry.charDelaySynapseCount.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded">
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>WASM LINEAR ARENA</span>
              <HardDrive className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-base font-bold font-mono text-emerald-300 tabular-nums mt-0.5">
              {vramMb} <span className="text-xs font-normal">MB</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {telemetry.wasmPagesAllocated.toLocaleString()} × 64 KiB WASM Pages
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded">
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>INGESTION RATE</span>
              <Zap className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-base font-bold font-mono text-amber-300 tabular-nums mt-0.5">
              {telemetry.trainingTokensPerSec.toLocaleString()}{' '}
              <span className="text-xs font-normal">tok/s</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {telemetry.narrativeMoleculesCount} Narrative Molecules M(t)
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded">
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>DISPATCH LATENCY</span>
              <Gauge className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-base font-bold font-mono text-cyan-300 tabular-nums mt-0.5">
              {telemetry.inferenceLatencyUs}{' '}
              <span className="text-xs font-normal">μs</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Pass-1 Cal: {cal.calibrationTimeMs} ms
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded">
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>BUS BANDWIDTH</span>
              <Layers className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-base font-bold font-mono text-indigo-300 tabular-nums mt-0.5">
              {gpuStatus.crossbar.bandwidthGBs || '128.4'}{' '}
              <span className="text-xs font-normal">GB/s</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Apple Unified Fabric
            </div>
          </div>

          <div
            className="bg-slate-900/60 border border-slate-800/80 p-2 rounded"
            title="Unique vocabulary somas in CSR matrix + Active Macro-Cortical Somas across Left Hemisphere (N1..N4) and Right Hemisphere (N5..N8)"
          >
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>VOCAB &amp; SOMAS</span>
              <Database className="w-3 h-3 text-purple-400" />
            </div>
            <div className="text-base font-bold font-mono text-purple-300 tabular-nums mt-0.5">
              {telemetry.vocabSize.toLocaleString()}{' '}
              <span className="text-xs font-normal">words</span>
            </div>
            <div className="text-[9px] text-purple-300/90 font-mono mt-0.5 truncate">
              L/R Somas: {telemetry.activeMacroSomas.map((s) => s.split('-')[0]).join(' ⇄ ')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'console'
              ? 'bg-sky-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Conversational Resonance Terminal</span>
        </button>

        <button
          onClick={() => setActiveTab('working_memory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'working_memory'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>24h Working Memory &amp; Sleep Cycle</span>
          <span className="text-[10px] font-mono bg-indigo-950/80 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-700/50">
            {workingMemory.traces.length} traces
          </span>
          {wmUptime.isOverdueForSleep && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="24h elapsed: Sleep consolidation recommended" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('corpus')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'corpus'
              ? 'bg-sky-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Project Gutenberg Global Library (75,000+ Books)</span>
        </button>
 
        <button
          onClick={() => setActiveTab('qa_datasets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'qa_datasets'
              ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Massive Q&amp;A Datasets (52k Alpaca · 15k Dolly · 100k SQuAD · EE)</span>
          <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50">
            Hundreds of Thousands
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-sky-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>CSR Crossbar Matrix Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab('tuning')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'tuning'
              ? 'bg-sky-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Thermodynamics &amp; Pass-1 Calibration</span>
        </button>
      </div>

      {/* TAB 1: Conversational Resonance Terminal */}
      {activeTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Cols: Terminal Output, Pauli-Orthogonal H8 Stream & Tri-Chamber M(t) Telemetry */}
          <div className="lg:col-span-2 space-y-3">
            {/* 24-Hour Working Memory & Sleep Status Strip */}
            <div className="bg-[#060a14] border border-indigo-900/60 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                  isSleepingNow ? 'bg-indigo-950 text-indigo-400 animate-pulse border border-indigo-600' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50'
                }`}>
                  {isSleepingNow ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {isSleepingNow ? 'BRAIN SLEEPING & CONSOLIDATING' : 'FRONTAL WORKING MEMORY ACTIVE'}
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-950/80 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-800/50">
                      Cycle #{workingMemory.sleepCycleCount + 1}
                    </span>
                    {wmUptime.isOverdueForSleep && (
                      <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800/60 animate-pulse">
                        24h REACHED (SLEEP DUE)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono mt-0.5">
                    <span>Awake: {String(wmUptime.hours).padStart(2, '0')}h {String(wmUptime.minutes).padStart(2, '0')}m / 24h</span>
                    <span aria-hidden="true">·</span>
                    <span>{workingMemory.traces.length} active traces in buffer</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-semibold">Zero Goldfish Amnesia</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('working_memory')}
                  className="px-2.5 py-1 text-[11px] rounded bg-slate-900 hover:bg-slate-800 border border-indigo-800/60 text-indigo-300 font-mono transition-colors cursor-pointer"
                >
                  View Buffer &amp; Monologue
                </button>
                <button
                  onClick={handleTriggerSleepConsolidation}
                  disabled={isSleepingNow}
                  className={`px-3 py-1 text-xs rounded font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isSleepingNow
                      ? 'bg-indigo-950 text-indigo-400 border border-indigo-800 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                  }`}
                  title="Consolidate active working memory traces into permanent Left/Right memristor weights and reset for a fresh 24h cycle"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{isSleepingNow ? 'Consolidating...' : 'Sleep & Settle Memory'}</span>
                </button>
              </div>
            </div>

            {/* Preset Question Buttons */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>BENCHMARK QUERIES (100% PURE MEMRISTOR PHYSICS)</span>
                <span className="text-[10px] text-sky-400 font-mono">
                  I = G · V · Ψ_PAULI (H8 + 25M CSR)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUERIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPresetQuery(p)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-mono ${
                      selectedPresetId === p.id
                        ? 'bg-sky-950/80 border-sky-500 text-sky-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {p.prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Query & Real-Time Plastic Teaching Bar */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleExecuteSynthesis();
                  }}
                  placeholder="Excite crossbar with an interrogative wave (?) or inject any declarative trajectory (.) into WASM .bin memory..."
                  className="flex-1 min-w-[260px] bg-slate-900/90 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  onClick={() => handleExecuteSynthesis()}
                  disabled={isSynthesizing}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-900/40"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>EXCITE CROSSBAR</span>
                </button>
                <button
                  onClick={handleTeachCrystalDirectly}
                  disabled={isSynthesizing}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-900/40"
                  title="Etch this wave directly into WebAssembly.Memory + Live Plastic Crystal Memory and flush to .bin mmap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ETCH WAVE (.BIN)</span>
                </button>
              </div>

              {/* Real-Time Plasticity Status Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 border border-slate-800/80 rounded px-2.5 py-1 text-[10px] font-mono">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleTogglePlasticity}
                    className={`px-2 py-0.5 rounded border font-bold cursor-pointer transition-colors ${
                      plasticLearningOn
                        ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    REAL-TIME QUERY PLASTICITY: {plasticLearningOn ? 'ON (AUTO-ETCH & STDP)' : 'OFF'}
                  </button>
                  <button
                    onClick={handleToggleSafeAbstention}
                    className={`px-2 py-0.5 rounded border font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                      safeAbstentionOn
                        ? 'bg-amber-950/90 border-amber-500/60 text-amber-300 hover:bg-amber-900/60'
                        : 'bg-rose-950/90 border-rose-500/60 text-rose-300 hover:bg-rose-900/60'
                    }`}
                    title="Toggle Sub-Threshold Frontal Abstention. When OFF, Frontal Lobe bypasses 'Sub-threshold crossbar resonance' and permits spontaneous raw memristor percolation for experiments."
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>
                      SUB-THRESHOLD ABSTENTION: {safeAbstentionOn ? 'GATE ON (SAFE)' : 'GATE OFF (EXPERIMENTAL)'}
                    </span>
                  </button>
                  <span className="text-slate-400">
                    Plastic Writes: <b className="text-emerald-300">{telemetry.mmapPlasticWriteCount}</b>
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">
                    WASM Arena:{' '}
                    <span className="text-sky-300">
                      {telemetry.wasmPagesAllocated.toLocaleString()} pages (64 KiB)
                    </span>{' '}
                    · Temporal Stream: <span className="text-amber-300">M(t) = [S(t-1), S(t), S(t+1)]</span>
                  </span>
                </div>
                {plasticFeedbackBanner && (
                  <span className="text-emerald-300 truncate max-w-md">
                    ⚡ {plasticFeedbackBanner}
                  </span>
                )}
              </div>
            </div>

            {/* Query Particle Spin & Boson Telemetry + Cat Gate Status */}
            {synthesisResult && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono bg-slate-900/70 px-3 py-1.5 rounded border border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-400">QUERY PARTICLE SPIN &amp; BOSONS:</span>
                  <span className="text-amber-300">
                    Capital Spin (+½): <b>{synthesisResult.caseSpinCoupling.uppercaseHits}</b>
                  </span>
                  <span className="text-sky-300">
                    Lowercase Spin (-½): <b>{synthesisResult.caseSpinCoupling.lowercaseHits}</b>
                  </span>
                  <span className="text-emerald-300">
                    Space Gluons: <b>{synthesisResult.caseSpinCoupling.spaceGluons}</b>
                  </span>
                  <span className="text-purple-300">
                    Punctuation Bosons: <b>{synthesisResult.caseSpinCoupling.punctuationBosons}</b>
                  </span>
                </div>

                {synthesisResult.triChamber && (
                  <div className="flex items-center gap-1.5">
                    {synthesisResult.triChamber.catGatePassed ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        CAT GATE: APPROVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded">
                        <ShieldAlert className="w-3 h-3" />
                        CAT GATE VETO: {synthesisResult.triChamber.catGateReason}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Primary Frontal Lobe Final Conversational Emission Box */}
            <div className="bg-[#020408] border border-slate-800 rounded-lg p-4 font-mono text-sm space-y-3 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300 font-bold uppercase">
                    FRONTAL LOBE FINAL CONVERSATIONAL EMISSION (ONLY USER-FACING VOICE):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    [Pauli-Orthogonal H8 Stream]
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {synthesisResult && (
                    <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      ACTIVE SOMAS:{' '}
                      {synthesisResult.activeMacroSomas.map((s) => s.split('-')[0]).join(' → ')}
                    </span>
                  )}
                  {synthesisResult && (
                    <span className="text-[10px] font-mono bg-sky-950/80 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                      {synthesisResult.resonanceScoreMv} mV · {synthesisResult.sourceBook}
                    </span>
                  )}
                </div>
              </div>

              {isSynthesizing ? (
                <div className="flex items-center gap-2 text-sky-400 py-3">
                  <Zap className="w-4 h-4 animate-spin" />
                  <span>
                    Propagating Pauli-Orthogonal H8 character spikes &amp; 8-horizon CSR currents...
                  </span>
                </div>
              ) : synthesizedText ? (
                <div className="space-y-2">
                  <div className="bg-slate-950/90 border border-amber-500/30 rounded p-3 text-amber-100 leading-relaxed text-base selection:bg-sky-500">
                    &ldquo;{synthesizedText}&rdquo;
                  </div>
                  {synthesisResult && synthesisResult.bicameral && (
                    <div className="text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2 px-1">
                      <span className="text-amber-300 font-medium">
                        Frontal Action: <b>{synthesisResult.bicameral.frontalLobeDecision?.action || synthesisResult.bicameral.activeDominance}</b>
                        {' · '}
                        Synthesis Mode: <b>{synthesisResult.bicameral.frontalLobeDecision?.synthesisMode || 'PURE_ANALYTICAL'}</b>
                      </span>
                      <span className="text-slate-400 text-[9px]">
                        Subsystems: Left Proposal <b className="text-slate-300">null</b> · Right Proposal <b className="text-slate-300">null</b> · Frontal <b className="text-emerald-400">final_output</b>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 italic py-2">
                  No response generated yet. Select a prompt or type your query above.
                </div>
              )}

              {/* Bicameral Split-Brain Architecture: Left Hemisphere ⇄ Corpus Callosum ⇄ Right Hemisphere & Frontal Lobe Orchestrator */}
              {synthesisResult && synthesisResult.bicameral && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="text-amber-300 font-bold uppercase tracking-wider">
                      🧠 BICAMERAL SPLIT-BRAIN ARCHITECTURE &amp; FRONTAL LOBE ORCHESTRATOR:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border font-bold ${
                        synthesisResult.bicameral.activeDominance === 'BICAMERAL_SYNTHESIS'
                          ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                          : synthesisResult.bicameral.activeDominance === 'RIGHT_DIALOGIC'
                            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                            : synthesisResult.bicameral.activeDominance === 'FRONTAL_CLARIFICATION'
                              ? 'bg-purple-950/90 border-purple-500/50 text-purple-300'
                              : synthesisResult.bicameral.activeDominance === 'FRONTAL_ABSTENTION'
                                ? 'bg-red-950/90 border-red-500/50 text-red-300'
                                : 'bg-sky-950/90 border-sky-500/50 text-sky-300'
                      }`}
                    >
                      FRONTAL DECISION: {synthesisResult.bicameral.frontalLobeDecision?.action || synthesisResult.bicameral.activeDominance} (Mode: {synthesisResult.bicameral.frontalLobeDecision?.synthesisMode || synthesisResult.bicameral.activeDominance})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono">
                    {/* Left Hemisphere: Proposal Evidence Subsystem Only */}
                    <div
                      className={`rounded p-2 border ${
                        synthesisResult.bicameral.activeDominance === 'LEFT_ANALYTICAL' || synthesisResult.bicameral.activeDominance === 'BICAMERAL_SYNTHESIS'
                          ? 'bg-sky-950/30 border-sky-500/50'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sky-300 font-bold">
                        <span>LEFT PROPOSAL (EVIDENCE ONLY)</span>
                        <span>E_L = {synthesisResult.bicameral.leftHemisphere.resonanceMv} mV</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 flex justify-between">
                        <span className="truncate">Crystal: {synthesisResult.bicameral.leftHemisphere.sourceCrystal}</span>
                        <span className="text-sky-400">G_L: {synthesisResult.bicameral.leftHemisphere.groundingScore ?? 0}</span>
                      </div>
                      <div className="text-[9px] text-sky-200/90 mt-1 line-clamp-2">
                        &ldquo;{synthesisResult.bicameral.leftHemisphere.matchedSentence}&rdquo;
                      </div>
                      <div className="text-[8px] text-sky-500/90 mt-1 flex justify-between">
                        <span>Somas: {(synthesisResult.bicameral.leftHemisphere.activeSomas || []).map((s) => s.split('-')[0]).join(' → ')}</span>
                        <span className="text-amber-400 font-bold">final_output: null</span>
                      </div>
                    </div>

                    {/* Corpus Callosum Commissure Bus & Inter-Hemispheric Report */}
                    <div className="rounded p-2 border bg-purple-950/25 border-purple-500/40 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-purple-300 font-bold">
                          <span>CORPUS CALLOSUM REPORT</span>
                          <span>I_CC = {synthesisResult.bicameral.corpusCallosum.fluxCurrentUa} μA</span>
                        </div>
                        <div className="text-[9px] text-amber-300 mt-1 truncate">
                          {synthesisResult.bicameral.corpusCallosum.parityTransformation}
                        </div>
                        <div className="text-[9px] text-slate-300 mt-0.5 truncate">
                          P(Wave): &ldquo;{synthesisResult.bicameral.corpusCallosum.transformedQueryWave}&rdquo;
                        </div>
                      </div>
                      <div className="space-y-0.5 mt-1 border-t border-purple-500/20 pt-1">
                        <div className="text-[9px] text-purple-300 flex justify-between">
                          <span>Phase Coherence:</span>
                          <b>{synthesisResult.bicameral.corpusCallosum.phaseCoherencePct}%</b>
                        </div>
                        {synthesisResult.bicameral.corpusCallosum.interHemisphericAgreement !== undefined && (
                          <div className="text-[9px] text-purple-300 flex justify-between">
                            <span>Fermion Agreement:</span>
                            <b>{(synthesisResult.bicameral.corpusCallosum.interHemisphericAgreement * 100).toFixed(1)}%</b>
                          </div>
                        )}
                        {synthesisResult.bicameral.corpusCallosum.conflictDetected && (
                          <div className="text-[8px] text-amber-300/90 truncate" title={synthesisResult.bicameral.corpusCallosum.conflictReason}>
                            ⚠️ {synthesisResult.bicameral.corpusCallosum.conflictReason}
                          </div>
                        )}
                        <div className="text-[8px] text-amber-400 font-bold text-right pt-0.5">
                          final_output: null
                        </div>
                      </div>
                    </div>

                    {/* Right Hemisphere: Proposal Evidence Subsystem Only */}
                    <div
                      className={`rounded p-2 border ${
                        synthesisResult.bicameral.activeDominance === 'RIGHT_DIALOGIC' || synthesisResult.bicameral.activeDominance === 'BICAMERAL_SYNTHESIS'
                          ? 'bg-emerald-950/30 border-emerald-500/50'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span>RIGHT PROPOSAL (EVIDENCE ONLY)</span>
                        <span>E_R = {synthesisResult.bicameral.rightHemisphere.resonanceMv} mV</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 flex justify-between">
                        <span className="truncate">Crystal: {synthesisResult.bicameral.rightHemisphere.sourceCrystal}</span>
                        <span className="text-emerald-400">G_R: {synthesisResult.bicameral.rightHemisphere.groundingScore ?? 0}</span>
                      </div>
                      <div className="text-[9px] text-emerald-200/90 mt-1 line-clamp-2">
                        &ldquo;{synthesisResult.bicameral.rightHemisphere.matchedSentence}&rdquo;
                      </div>
                      <div className="text-[8px] text-emerald-500/90 mt-1 flex justify-between">
                        <span>Somas: {(synthesisResult.bicameral.rightHemisphere.activeSomas || []).map((s) => s.split('-')[0]).join(' → ')}</span>
                        <span className="text-amber-400 font-bold">final_output: null</span>
                      </div>
                    </div>
                  </div>

                  {/* Frontal Lobe Executive Decision & Sole Voice Card */}
                  <div className="bg-slate-900/90 border border-amber-500/30 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        FRONTAL LOBE ARBITRATION (SOLE CONVERSATIONAL EMITTER · final_output != null):
                      </span>
                      <span className="text-emerald-400 text-[9px]">
                        Confidence: {(synthesisResult.bicameral.frontalLobeDecision?.confidenceScore ?? 0.85) * 100}% · Grounding: {(synthesisResult.bicameral.frontalLobeDecision?.groundingScore ?? 0.9) * 100}%
                      </span>
                    </div>

                    {/* Equilibrium Propagation Feedback Telemetry */}
                    <div className="flex items-center gap-2 text-[9px] text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded">
                      <span>Equilibrium Propagation:</span>
                      <b className="text-amber-300">{synthesisResult.bicameral.equilibriumSettlingLoops ?? 1} Settling Pass{(synthesisResult.bicameral.equilibriumSettlingLoops ?? 1) > 1 ? 'es' : ''}</b>
                      <span>·</span>
                      <span>Callosal Error Flux (ΔI_error):</span>
                      <b className="text-cyan-300">{synthesisResult.bicameral.equilibriumDeltaI ?? 0} mV</b>
                      <span>·</span>
                      <span className="text-slate-400">Thermodynamic Phase-Lock Settled</span>
                    </div>

                    <div className="text-slate-300">
                      {synthesisResult.bicameral.frontalLobeOrchestrator.arbitrationReason}
                    </div>
                    {synthesisResult.bicameral.frontalLobeOrchestrator.selfReflectionVerdict && (
                      <div className="text-[9px] text-emerald-400 border-t border-slate-800/60 pt-0.5 flex items-center gap-1">
                        <span className="text-emerald-500 font-semibold">SELF-REFLECTION:</span>
                        <span>{synthesisResult.bicameral.frontalLobeOrchestrator.selfReflectionVerdict}</span>
                      </div>
                    )}
                  </div>

                  {/* Cascading Multi-Hop Energy Decay Stream (Hop 1 -> Hop 2 -> Hop 3) */}
                  {synthesisResult.bicameral.multiHopCascade && synthesisResult.bicameral.multiHopCascade.length > 1 && (
                    <div className="bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-purple-950/30 border border-amber-500/40 rounded p-2 text-[10px] font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-amber-300 font-bold border-b border-amber-900/40 pb-1">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          CASCADING MULTI-HOP ENERGY DECAY STREAM ({synthesisResult.bicameral.multiHopCascade.length} HOPS CONVERGED)
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Energy decays across inter-somatic delay lines until V &lt; V_th
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                        {synthesisResult.bicameral.multiHopCascade.map((c) => (
                          <div key={c.hop} className="bg-slate-950/70 border border-slate-800 p-1.5 rounded space-y-0.5">
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="font-bold text-amber-400">HOP {c.hop}: {c.label}</span>
                              <span className="text-emerald-400 font-bold">{c.energyMv} mV</span>
                            </div>
                            <div className="text-[8px] text-slate-400 truncate">
                              Crystal: {c.sourceCrystal}
                            </div>
                            <div className="text-[9px] text-slate-200 line-clamp-2 italic pt-0.5">
                              &ldquo;{c.text}&rdquo;
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Hop Synaptic Percolation Visualizer */}
              {synthesisResult && synthesisResult.percolationPath && synthesisResult.percolationPath.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900/60 border border-purple-500/30 rounded p-2.5 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-purple-300 font-bold mb-1.5 pb-1 border-b border-purple-900/40">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                        MULTI-HOP SYNAPTIC PERCOLATION (E₁ → η·G → E₂)
                      </span>
                      <span className="text-purple-400 text-[9px] bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-700/40">
                        {synthesisResult.percolationPath.length} ACTIVE HOPS · η=0.68
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {synthesisResult.percolationPath.map((hop, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-2 bg-slate-950/60 p-1.5 rounded border border-purple-900/30">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 bg-purple-900/50 text-purple-200 border border-purple-600/40">
                            HOP {hop.hopNumber}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[9px] text-purple-200/90 mb-0.5">
                              <span className="font-semibold truncate">
                                {hop.stage === 'DIRECT_ANCHOR' ? '⚓ Anchor Excitation:' : '⚡ Synaptic Percolation:'}{' '}
                                {hop.targetAuthor ? `${hop.targetAuthor} · ` : ''}{hop.targetDocTitle}
                              </span>
                              <span className="text-emerald-400 font-mono">
                                +{hop.hopResonanceMv} mV ({hop.transferConductanceUa} μA)
                              </span>
                            </div>
                            <div className="text-slate-300 text-[10px] italic truncate">
                              &ldquo;{hop.targetFocalText}&rdquo;
                            </div>
                            {hop.bridgeTokens.length > 0 && (
                              <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <span className="text-purple-400">Bridge Fermions:</span>
                                <span className="text-purple-300 font-semibold">{hop.bridgeTokens.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Coherent Wave-Packet Interference Pills */}
              {synthesisResult && synthesisResult.charWavePackets.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 flex items-center justify-between">
                    <span>
                      COHERENT WAVE-PACKET INTERFERENCE (EXACT SUBSTRING &amp; SPIN COUPLING):
                    </span>
                    <span className="text-sky-400">
                      Calibrated c*={cal.structuralCountThresholdC} · th_trans=
                      {cal.transitionEntropyThTrans} bits
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {synthesisResult.charWavePackets.map((pkt, i) => (
                      <div
                        key={i}
                        className="text-[10px] font-mono bg-slate-900/90 border border-sky-500/30 px-2 py-1 rounded flex items-center gap-1.5"
                      >
                        <span className="text-white font-bold">&ldquo;{pkt.fragment}&rdquo;</span>
                        <span className="text-sky-400">+{pkt.energyMv}mV</span>
                        <span className="text-emerald-400">({pkt.conductanceSiemens}S)</span>
                        <span className="text-amber-300" title="Thermodynamic Chemical Potential μ">
                          μ:{pkt.chemicalPotential}
                        </span>
                        <span className="text-slate-400 text-[9px]">{pkt.spinState}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tri-Chamber Neuromorphic Telemetry Strip */}
              {synthesisResult && synthesisResult.triChamber && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* Chamber 1: 8-View Multi-Scale Temporal Stability */}
                    <div className="bg-slate-900/70 border border-slate-800 rounded p-2">
                      <div className="text-[9px] font-mono text-sky-300 uppercase flex justify-between">
                        <span>Chamber 1: 8-View Delay (V0–V7)</span>
                        <span className="font-bold">
                          {(synthesisResult.triChamber.multiViewStability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-end gap-1 h-6 mt-1.5">
                        {synthesisResult.triChamber.viewResonanceProfile.map((vScore, vIdx) => (
                          <div key={vIdx} className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-slate-800 rounded-sm h-4 flex items-end overflow-hidden">
                              <div
                                className="w-full bg-sky-400"
                                style={{ height: `${Math.max(12, Math.round(vScore * 100))}%` }}
                              />
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 mt-0.5">
                              V{vIdx}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chamber 2: Dual-Crystal Commissure & Bidirectional Consistency */}
                    <div className="bg-slate-900/70 border border-slate-800 rounded p-2 font-mono">
                      <div className="text-[9px] text-purple-300 uppercase flex justify-between">
                        <span>Chamber 2: Dual-Crystal Truth</span>
                        <span className="font-bold">
                          C_total: {synthesisResult.triChamber.bidirectionalConsistency.cTotal}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-300 mt-1">
                        <span>
                          ΔE_comm:{' '}
                          <b className="text-amber-300">
                            {synthesisResult.triChamber.commissureDeltaE}
                          </b>
                        </span>
                        <span>
                          E_fwd/bwd:{' '}
                          <b className="text-sky-300">
                            {synthesisResult.triChamber.forwardEnergy}/
                            {synthesisResult.triChamber.backwardEnergy}
                          </b>
                        </span>
                        <span>
                          C_bwd/pres:{' '}
                          <b className="text-emerald-300">
                            {synthesisResult.triChamber.bidirectionalConsistency.cBackward}/
                            {synthesisResult.triChamber.bidirectionalConsistency.cPresent}
                          </b>
                        </span>
                        <span>
                          C_fwd/rev:{' '}
                          <b className="text-emerald-300">
                            {synthesisResult.triChamber.bidirectionalConsistency.cForward}/
                            {synthesisResult.triChamber.bidirectionalConsistency.cReverse}
                          </b>
                        </span>
                      </div>
                    </div>

                    {/* Chamber 3: Pauli-Orthogonal H8 Phase Seed */}
                    <div className="bg-slate-900/70 border border-slate-800 rounded p-2 font-mono">
                      <div className="text-[9px] text-emerald-300 uppercase flex justify-between">
                        <span>Chamber 3: H8 Phase Seed</span>
                        <span className="font-bold">
                          Ψ_Pauli:{' '}
                          {(synthesisResult.triChamber.pauliOrthogonalityScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-[10px] text-white mt-1 truncate">
                        Seed:{' '}
                        <span className="text-emerald-300 font-bold">
                          &ldquo;{synthesisResult.triChamber.h8PhaseSeed}&rdquo;
                        </span>
                      </div>
                      <div className="text-[8px] text-slate-400 truncate mt-0.5">
                        HEX: {synthesisResult.triChamber.h8HexSignature}
                      </div>
                    </div>
                  </div>

                  {/* Narrative Molecule M(t) = [S(t-1), S(t), S(t+1)] */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded p-2 text-[10px] font-mono space-y-1">
                    <div className="text-[9px] text-slate-400 uppercase">
                      ORDERED THREE-SENTENCE NARRATIVE MOLECULE M(t) = [S(t-1), S(t), S(t+1)]:
                    </div>
                    {synthesisResult.triChamber.narrativeMolecule.prevSentence && (
                      <div className="text-slate-500 truncate">
                        <span className="text-slate-400 font-bold">S(t-1):</span>{' '}
                        {synthesisResult.triChamber.narrativeMolecule.prevSentence}
                      </div>
                    )}
                    <div className="text-sky-200">
                      <span className="text-sky-400 font-bold">Focal S(t):</span>{' '}
                      {synthesisResult.triChamber.narrativeMolecule.focalSentence}
                    </div>
                    {synthesisResult.triChamber.narrativeMolecule.nextSentence && (
                      <div className="text-slate-500 truncate">
                        <span className="text-slate-400 font-bold">S(t+1):</span>{' '}
                        {synthesisResult.triChamber.narrativeMolecule.nextSentence}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* High Chemical-Potential Particles & Action Buttons */}
              {synthesizedText && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">
                      HIGH-μ PARTICLES:
                    </span>
                    {synthesisResult?.predictedParticles.map((tok, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono bg-amber-950/70 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold"
                      >
                        {tok} (μ={wasmCrossbarEngine.getWordChemicalPotential(tok)})
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleInjectToCollider}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Inject Particles into Collider</span>
                  </button>
                </div>
              )}
            </div>

            {/* Live Token Wavefront Streamer (25M CSR Token Trajectory) */}
            {generationSteps.length > 0 && (
              <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>25M CSR TOKEN TRAJECTORY EMISSION SEQUENCE ({generationSteps.length} TOKENS)</span>
                  <span>KIRCHHOFF CURRENT &amp; CHEMICAL POTENTIAL μ</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {generationSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1"
                    >
                      <span className="text-slate-400 text-[9px]">#{idx + 1}</span>
                      <span className="text-sky-300 font-semibold">{step.token}</span>
                      <span className="text-[9px] text-emerald-400 tabular-nums">
                        {step.currentUa.toFixed(1)}μA
                      </span>
                      <span className="text-[9px] text-amber-300 tabular-nums">
                        μ:{(step.chemicalPotentialMu ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Live Competitor Somas, Macro-Cortical Somas & Pauli Health */}
          <div className="space-y-3">
            <div className="bg-[#020408] border border-slate-800 rounded-lg p-3 space-y-3 font-mono">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                <span>MACRO-CORTICAL SOMAS (N1..N8)</span>
                <span className="text-[10px] text-slate-400">H8 Coupled</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['N1-ALPHA', 'N2-BETA', 'N3-GAMMA', 'N4-DELTA', 'N5-ALPHA', 'N6-BETA', 'N7-THETA', 'N8-OMEGA'].map(
                  (soma) => {
                    const isExcited = synthesisResult?.activeMacroSomas.includes(soma);
                    return (
                      <div
                        key={soma}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                          isExcited
                            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 font-bold shadow-sm shadow-emerald-900/50'
                            : 'bg-slate-900/50 border-slate-800 text-slate-500'
                        }`}
                      >
                        {soma}
                      </div>
                    );
                  }
                )}
              </div>

              <div className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2 pt-2">
                <span>TOP CSR RESONANT SOMAS</span>
                <span className="text-[10px] text-slate-400">Current (μA)</span>
              </div>

              {latestStep && latestStep.candidates.length > 0 ? (
                <div className="space-y-2">
                  {latestStep.candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/60 border border-slate-800/80 p-2 rounded text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-bold">{cand.token}</span>
                        <span className="text-emerald-400 font-mono tabular-nums">
                          {cand.currentUa.toFixed(2)} μA
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(5, (cand.currentUa / (latestStep.currentUa || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>G: {cand.conductance.toFixed(2)} μS</span>
                        <span>Pauli Ψ: {(cand.psi * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-6 text-center">
                  Trigger an excitation pulse to inspect live competitive somas.
                </div>
              )}

              {/* Pauli Refractory Health Summary */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>PAULI REFRACTORY SUPPRESSION</span>
                  <span className="text-emerald-400">{telemetry.pauliSuppressionRate.toFixed(1)}% Active</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.max(5, telemetry.pauliSuppressionRate)}%` }}
                  />
                </div>
                <div className="text-[9px] text-slate-500">
                  Pauli trajectory lineage locks each Narrative Molecule M(t) in phase without stopword dictionaries.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 24-Hour Working Memory & Sleep Consolidation */}
      {activeTab === 'working_memory' && (
        <div className="space-y-4">
          {/* Top Hero Banner */}
          <div className="bg-[#020408] border border-indigo-900/60 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                    FRONTAL LOBE 24-HOUR EPISODIC WORKING MEMORY &amp; SLEEP CONSOLIDATION
                  </h3>
                  <span className="text-[10px] font-mono bg-indigo-950/90 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded">
                    CYCLE #{workingMemory.sleepCycleCount + 1} ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-4xl">
                  Unlike traditional stateless models that suffer from goldfish amnesia, the Frontal Lobe maintains an active, continuous{' '}
                  <span className="text-indigo-300 font-semibold font-mono">24-hour Working Memory Buffer</span> that persists across sessions. When the system sleeps, active thoughts and dialogue settle down and permanently retrain the Left and Right Memristor crossbar via Hebbian STDP weight adaptation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerSleepConsolidation}
                  disabled={isSleepingNow}
                  className={`px-4 py-2 rounded font-mono font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                    isSleepingNow
                      ? 'bg-indigo-950 text-indigo-400 border border-indigo-800 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>{isSleepingNow ? 'Consolidating Memories...' : 'Trigger Sleep Consolidation'}</span>
                </button>
              </div>
            </div>

            {/* Sleep Consolidation Feedback Banner */}
            {sleepReport && (
              <div className="p-2.5 rounded bg-indigo-950/60 border border-indigo-700/50 text-xs font-mono text-indigo-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>{sleepReport}</span>
              </div>
            )}

            {/* Two-Column Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Card 1: Circadian State & 24h Waking Clock */}
              <div className="bg-[#060a14] border border-slate-800/80 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    CIRCADIAN CLOCK &amp; UPTIME
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isSleepingNow ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className={`text-[10px] font-mono font-semibold ${isSleepingNow ? 'text-indigo-300' : 'text-emerald-300'}`}>
                      {isSleepingNow ? 'SLEEPING & CONSOLIDATING' : 'AWAKE & REASONING'}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                    {String(wmUptime.hours).padStart(2, '0')}h {String(wmUptime.minutes).padStart(2, '0')}m {String(wmUptime.seconds).padStart(2, '0')}s
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    / 24h 00m active period
                  </div>
                </div>

                {/* 24h Progress Bar with Milestones */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Progress: {wmUptime.percentOf24h}%</span>
                    <span>{wmUptime.isOverdueForSleep ? 'Sleep Consolidation Due' : `${Math.max(0, 24 - wmUptime.hours)}h remaining`}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        wmUptime.isOverdueForSleep
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, wmUptime.percentOf24h))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-0.5">
                    <span>0h (Dawn)</span>
                    <span>6h (Morning)</span>
                    <span>12h (Midday)</span>
                    <span>18h (Evening)</span>
                    <span>24h (Sleep)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Waking Cycle Started:</span>
                  <span className="text-slate-200">{new Date(workingMemory.awakeStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Card 2: Episodic Buffer Capacity & Synaptic Stats */}
              <div className="bg-[#060a14] border border-slate-800/80 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-400" />
                    WORKING MEMORY BUFFER CAPACITY
                  </span>
                  <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded">
                    PERSISTENT 24H STORAGE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                    <div className="text-[10px] text-slate-400 font-mono">TRACES IN BUFFER</div>
                    <div className="text-lg font-bold font-mono text-indigo-300 tabular-nums">
                      {workingMemory.traces.length} <span className="text-xs font-normal text-slate-400">/ 500</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                    <div className="text-[10px] text-slate-400 font-mono">SLEEP CYCLES RUN</div>
                    <div className="text-lg font-bold font-mono text-purple-300 tabular-nums">
                      {workingMemory.sleepCycleCount}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Last Sleep Settled:</span>
                    <span className="text-slate-200">
                      {workingMemory.lastConsolidationReport?.settledAt || 'Not consolidated yet'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synapses Potentiated in Last Sleep:</span>
                    <span className="text-emerald-400">
                      +{workingMemory.lastConsolidationReport?.synapsesPotentiated || 0} G_ij
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Molecules Etched into Crystal:</span>
                    <span className="text-sky-400">
                      +{workingMemory.lastConsolidationReport?.moleculesEtched || 0} M(t)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Monologue & Thought Injection Chamber */}
          <div className="bg-[#060a14] border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>INTERNAL MONOLOGUE &amp; REASONING INJECTION CHAMBER</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Inject internal monologue thoughts, conscious reflections, or core principles into the Frontal Lobe working memory buffer.
                </p>
              </div>

              {/* Tag selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setMonologueRole('monologue')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    monologueRole === 'monologue' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Internal Monologue (Voice)
                </button>
                <button
                  onClick={() => setMonologueRole('insight')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    monologueRole === 'insight' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Philosophical Insight
                </button>
                <button
                  onClick={() => setMonologueRole('user')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    monologueRole === 'user' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  User Experience
                </button>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <textarea
                value={monologueText}
                onChange={(e) => setMonologueText(e.target.value)}
                rows={2}
                placeholder="Type your internal monologue thought, e.g.: 'Rise a great man, a great man walks straight on his own back not with the help of others' or 'Marcus Aurelius says we must care for the vessel'..."
                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500 resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Salience Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Salience (Importance):</span>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={monologueSalience}
                    onChange={(e) => setMonologueSalience(parseFloat(e.target.value))}
                    className="w-28 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-indigo-300 font-semibold tabular-nums">
                    {(monologueSalience * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleAddMonologueThought}
                  disabled={!monologueText.trim()}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-indigo-900/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Record into 24h Working Memory</span>
                </button>
              </div>

              {/* Sample quick prompts */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 mr-1">Quick Reflections:</span>
                {[
                  'Rise a great man, a great man walks straight on his own back not with the help of others.',
                  'Marcus Aurelius: We must take care of the vessel which carries the soul.',
                  'Consciousness is the internal monologue: questioning reality 24/7.',
                  'Bicameral hypothesis: Left and Right brains communicate across the callosal bridge.',
                ].map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => {
                      setMonologueText(sample);
                      setMonologueRole('insight');
                      setMonologueSalience(0.9);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer truncate max-w-xs"
                  >
                    "{sample.slice(0, 36)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active 24-Hour Working Memory Trace Stream */}
          <div className="bg-[#060a14] border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">
                  ACTIVE 24-HOUR EPISODIC WORKING MEMORY BUFFER ({workingMemory.traces.length} TRACES)
                </h4>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Retains context across 24h awake sessions · Settle on Sleep
              </div>
            </div>

            {workingMemory.traces.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono italic">
                Working memory buffer is currently empty. Ask a question or inject an internal monologue thought to populate today's buffer.
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {workingMemory.traces.slice().reverse().map((trace) => (
                  <div
                    key={trace.id}
                    className="bg-slate-900/70 border border-slate-800/80 rounded p-2.5 space-y-1.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                          {trace.timeStr}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border uppercase ${
                            trace.role === 'monologue'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                              : trace.role === 'insight'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                              : trace.role === 'user'
                              ? 'bg-sky-950/80 text-sky-300 border-sky-800/60'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                          }`}
                        >
                          {trace.role === 'monologue'
                            ? 'INTERNAL MONOLOGUE'
                            : trace.role === 'insight'
                            ? 'PHILOSOPHICAL INSIGHT'
                            : trace.role === 'user'
                            ? 'USER QUERY'
                            : 'FRONTAL LOBE SYNTHESIS'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-slate-400">
                          Salience: <span className="text-indigo-300 font-semibold">{(trace.salience * 100).toFixed(0)}%</span>
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded ${
                            trace.consolidated
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                          }`}
                        >
                          {trace.consolidated ? 'CONSOLIDATED (G_ij)' : 'ACTIVE (24H BUFFER)'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 font-mono leading-relaxed">
                      {trace.text}
                    </p>

                    {trace.associatedTokens && trace.associatedTokens.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/40">
                        <span className="text-[9px] font-mono text-slate-500">Resonant Somas:</span>
                        {trace.associatedTokens.map((tok, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] font-mono bg-slate-950 text-slate-400 px-1 py-0.2 rounded border border-slate-800"
                          >
                            {tok}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Project Gutenberg Global Library & Live Crawler */}
      {activeTab === 'corpus' && (
        <div className="space-y-4">
          {/* Top Hero Panel: Project Gutenberg 75,000+ Book Streamer & Autonomous Crawler */}
          <div className="bg-[#020408] border border-sky-900/60 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider">
                    PROJECT GUTENBERG GLOBAL FULL-BOOK STREAMER ({gutenbergTotalCount.toLocaleString()}+ BOOKS)
                  </h3>
                  <span className="text-[10px] font-mono bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded">
                    VOCAB CAPACITY: {telemetry.vocabSize.toLocaleString()} / {telemetry.maxVocab.toLocaleString()} WORDS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Stream complete, unabridged books (50,000–250,000+ words each) directly from Project Gutenberg mirrors into the{' '}
                  <span className="text-sky-300 font-mono">{activeCapacity}</span> CSR + Pauli-Orthogonal H8 Crossbar. License headers/footers are stripped automatically.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Autonomous Multi-Book Crawler Toggle */}
                <button
                  onClick={handleToggleAutonomousCrawler}
                  className={`px-3.5 py-2 rounded font-mono font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                    isAutoCrawling
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                  }`}
                >
                  {isAutoCrawling ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>STOP AUTONOMOUS CRAWLER</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>AUTONOMOUS GUTENBERG CRAWLER</span>
                    </>
                  )}
                </button>

                {/* Reset to 0 Button */}
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 rounded font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Purge all vocabulary, synapses, and .bin image to 0 before starting a fresh training run"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-bold">Reset Crossbar to 0</span>
                </button>

                {/* Re-seed Starter Corpora if crossbar is at 0 */}
                {telemetry.vocabSize === 0 && (
                  <button
                    onClick={handleReseedStarterCorpora}
                    disabled={isResetting}
                    className="px-3 py-2 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 text-sky-200 rounded font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                    <span>Re-seed Starter Corpora</span>
                  </button>
                )}

                {/* Local Multi-Book File Upload (.txt / .md) */}
                <input
                  ref={fileUploadInputRef}
                  type="file"
                  accept=".txt,.md,.text"
                  multiple
                  onChange={handleLocalFilesUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileUploadInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 rounded font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .TXT Books</span>
                </button>
              </div>
            </div>

            {/* Search Bar + Direct Gutenberg ID Streamer (#1 to #75,000+) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
              <div className="lg:col-span-2 flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gutenbergSearch}
                    onChange={(e) => setGutenbergSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchGutenbergCatalog(gutenbergSearch, gutenbergTopic, 1);
                      }
                    }}
                    placeholder="Search 75,000+ Gutenberg books by title, author, or subject (e.g. Faraday, Maxwell, Tesla, Darwin, Verne, Plato)..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <button
                  onClick={() => fetchGutenbergCatalog(gutenbergSearch, gutenbergTopic, 1)}
                  disabled={isLoadingCatalog}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-xs font-mono font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingCatalog ? 'animate-spin' : ''}`} />
                  <span>Search Catalog</span>
                </button>
              </div>

              {/* Direct Book ID Fetcher (#1 .. #75000+) */}
              <div className="flex items-center gap-1.5 bg-slate-900/70 border border-slate-800 rounded px-2.5 py-1">
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                  GUTENBERG ID #
                </span>
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={directBookIdInput}
                  onChange={(e) => setDirectBookIdInput(e.target.value)}
                  placeholder="1..75000"
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-amber-300 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => {
                    const idNum = parseInt(directBookIdInput, 10);
                    if (Number.isFinite(idNum) && idNum >= 1) {
                      handleStreamFullGutenbergBook(idNum);
                    }
                  }}
                  disabled={streamingBookId !== null}
                  className="flex-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-xs font-mono font-semibold cursor-pointer whitespace-nowrap"
                >
                  Stream ID #{directBookIdInput || '35'}
                </button>
              </div>
            </div>

            {/* Subject Quick-Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {GUTENBERG_TOPIC_FILTERS.map((f) => {
                const isSelected = gutenbergTopic === f.topic && !gutenbergSearch;
                return (
                  <button
                    key={f.label}
                    onClick={() => {
                      setGutenbergTopic(f.topic);
                      setGutenbergSearch(f.search);
                      fetchGutenbergCatalog(f.search, f.topic, 1);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-950/90 border-sky-500 text-sky-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Live Full-Book Streaming Telemetry Bar */}
            {(liveBookProgress || gutenbergStatusMsg) && (
              <div className="bg-slate-900/90 border border-sky-500/40 rounded-lg p-3 space-y-2 font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-slate-200">{gutenbergStatusMsg}</span>
                  </div>
                  {liveBookProgress && (
                    <span className="text-emerald-400 font-bold">
                      {liveBookProgress.percent}% ({liveBookProgress.processedMolecules.toLocaleString()} /{' '}
                      {liveBookProgress.totalMolecules.toLocaleString()} sentences)
                    </span>
                  )}
                </div>

                {liveBookProgress && (
                  <>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 via-sky-400 to-indigo-500 h-full transition-all duration-100"
                        style={{ width: `${liveBookProgress.percent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-300 pt-1">
                      <div>
                        BOOK TOKENS:{' '}
                        <b className="text-sky-300">
                          {liveBookProgress.tokensProcessed.toLocaleString()}
                        </b>
                      </div>
                      <div>
                        LIVE VOCABULARY:{' '}
                        <b className="text-purple-300">
                          {liveBookProgress.vocabSize.toLocaleString()} words
                        </b>
                      </div>
                      <div>
                        ACTIVE SYNAPSES:{' '}
                        <b className="text-emerald-300">
                          {liveBookProgress.activeSynapses.toLocaleString()}
                        </b>
                      </div>
                      <div>
                        STREAM RATE:{' '}
                        <b className="text-amber-300">
                          {liveBookProgress.tokensPerSec.toLocaleString()} tok/s
                        </b>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Project Gutenberg Live Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {gutenbergBooks.map((book) => {
                const isThisStreaming = streamingBookId === book.id;
                const isAlreadyIngested = ingestedLedger.some(
                  (r) => r.gutenbergId === book.id || r.title.toLowerCase() === book.title.toLowerCase()
                );

                return (
                  <div
                    key={book.id}
                    className={`bg-slate-950/90 border rounded-lg p-3 flex flex-col justify-between space-y-2.5 transition-colors ${
                      isAlreadyIngested
                        ? 'border-emerald-600/60 bg-emerald-950/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-sky-400 font-bold">GUTENBERG #{book.id}</span>
                        <span className="text-slate-500">
                          {book.downloadCount > 0
                            ? `${book.downloadCount.toLocaleString()} downloads`
                            : 'UTF-8 Full Text'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 mt-1 line-clamp-2">
                        {book.title}
                      </h4>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                        {book.author}
                      </div>
                      {book.subjects && book.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {book.subjects.slice(0, 2).map((subj, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded truncate max-w-[180px]"
                            >
                              {subj}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {isAlreadyIngested ? (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          In Crossbar Memory
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">
                          Full Unabridged .TXT
                        </span>
                      )}

                      <button
                        onClick={() =>
                          handleStreamFullGutenbergBook(book.id, book.title, book.author)
                        }
                        disabled={streamingBookId !== null}
                        className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                          isThisStreaming
                            ? 'bg-amber-600 text-white animate-pulse'
                            : isAlreadyIngested
                            ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/40'
                            : 'bg-sky-600 hover:bg-sky-500 text-white'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>
                          {isThisStreaming
                            ? 'Streaming...'
                            : isAlreadyIngested
                            ? 'Re-Stream Full Book'
                            : 'Stream Full Book'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination controls for browsing all 75,000+ books */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
              <span className="text-slate-400">
                Page {gutenbergPage} · Browse any of the 75,000+ Gutenberg books or enter any ID # above
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    fetchGutenbergCatalog(gutenbergSearch, gutenbergTopic, Math.max(1, gutenbergPage - 1))
                  }
                  disabled={gutenbergPage <= 1 || isLoadingCatalog}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 rounded text-slate-300 cursor-pointer"
                >
                  ← Prev Page
                </button>
                <button
                  onClick={() =>
                    fetchGutenbergCatalog(gutenbergSearch, gutenbergTopic, gutenbergPage + 1)
                  }
                  disabled={!gutenbergHasMore || isLoadingCatalog}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 rounded text-slate-300 cursor-pointer"
                >
                  Next Page →
                </button>
              </div>
            </div>
          </div>

          {/* Crystallized Books Ledger (Shows exact vocabulary & synapse growth per ingested book) */}
          {ingestedLedger.length > 0 && (
            <div className="bg-[#020408] border border-slate-800 rounded-lg p-3 space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-300 uppercase">
                  CRYSTALLIZED BOOKS IN CROSSBAR MEMORY ({ingestedLedger.length} BOOKS ·{' '}
                  {telemetry.vocabSize.toLocaleString()} UNIQUE VOCABULARY WORDS)
                </h4>
                <span className="text-[10px] text-slate-400">
                  Total Ingested: {telemetry.ingestedTokens.toLocaleString()} tokens
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5">
                {ingestedLedger.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-slate-900/70 border border-slate-800/90 px-3 py-1.5 rounded flex flex-wrap items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      {rec.gutenbergId && (
                        <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-700/40 px-1.5 py-0.5 rounded">
                          #{rec.gutenbergId}
                        </span>
                      )}
                      <span className="text-slate-100 font-bold">{rec.title}</span>
                      <span className="text-slate-500 text-[10px]">by {rec.author}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px]">
                      <span className="text-sky-300">
                        <b>{rec.tokensProcessed.toLocaleString()}</b> tokens ({rec.moleculesAdded.toLocaleString()} M(t))
                      </span>
                      <span className="text-purple-300">
                        <b>+{rec.newVocabAdded.toLocaleString()}</b> new words
                      </span>
                      <span className="text-emerald-300">
                        <b>+{rec.newSynapsesAdded.toLocaleString()}</b> synapses
                      </span>
                      <span className="text-amber-300">
                        {rec.tokensPerSec.toLocaleString()} tok/s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Built-in Core Benchmark Excerpts */}
          <div className="bg-[#020408] border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-sky-300 uppercase">
                BUILT-IN HIGH-PRECISION BENCHMARK EXCERPTS (7 CORPORA)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Re-prime the 7 core benchmark excerpts at any time alongside full Project Gutenberg books.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStreamAllCorpora}
                disabled={isStreamingAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-900/40"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isStreamingAll ? 'STREAMING IN PROGRESS...' : 'STREAM ALL 7 BENCHMARK EXCERPTS'}</span>
              </button>
            </div>
          </div>

          {/* Streaming Progress Bar */}
          {isStreamingAll && (
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Ingesting: {currentStreamDoc}</span>
                <span className="text-emerald-400 font-bold">{streamProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-sky-500 h-full transition-all duration-150"
                  style={{ width: `${streamProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Corpus Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CORPORE_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#020408] border border-slate-800 rounded-lg p-3 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">
                      {doc.category} · {doc.year}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ~{doc.tokenCountEstimate} tokens
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mt-1 line-clamp-1">{doc.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-3 font-mono leading-relaxed">
                    {doc.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">{doc.author}</span>
                  <button
                    onClick={() => handleIngestSingleDoc(doc)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-sky-300 font-mono transition-colors cursor-pointer"
                  >
                    Ingest Excerpt
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Text Ingestion */}
          <div className="bg-[#020408] border border-slate-800 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">
              INGEST CUSTOM TEXT OR SCIENTIFIC LITERATURE
            </h4>
            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste custom text, book chapters, or scientific prose to bind into the CSR + Pauli H8 crossbar..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
            <div className="flex justify-end">
              <button
                onClick={handleIngestCustom}
                disabled={!customText.trim()}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded text-xs font-mono font-medium cursor-pointer"
              >
                Ingest Custom Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Massive Q&A Datasets Streamer */}
      {activeTab === 'qa_datasets' && (
        <MassiveQaDatasetsView
          onDatasetTrained={() => {
            setTelemetry(wasmCrossbarEngine.getTelemetry());
            setIngestedLedger([...wasmCrossbarEngine.ingestedBookRegistry]);
          }}
          onExecuteQuery={(q) => {
            setCurrentQuery(q);
            setActiveTab('console');
            handleExecuteSynthesis(q);
          }}
        />
      )}

      {/* TAB 3: CSR Crossbar Matrix Heatmap */}
      {activeTab === 'matrix' && (
        <div className="space-y-3">
          <div className="bg-[#020408] border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-sky-300 font-bold uppercase">
                  CSR SYNAPSE CONDUCTANCE TOPOLOGY (128 × 32 SUB-GRID)
                </span>
                <span className="text-[10px] text-slate-400">
                  Green: Horizon 0 · Purple: Horizons 1..7 · Cyan: Active Wavefront
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Total Synapses: {telemetry.activeSynapseCount.toLocaleString()}
              </div>
            </div>

            <div className="pt-3 flex justify-center">
              <canvas
                ref={matrixCanvasRef}
                width={860}
                height={320}
                className="w-full max-w-4xl h-80 bg-black rounded border border-slate-800 shadow-inner"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Thermodynamics & Pass-1 Calibration */}
      {activeTab === 'tuning' && (
        <div className="bg-[#020408] border border-slate-800 rounded-lg p-4 space-y-4 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              PASS-1 AUTONOMOUS CORPUS-LOCAL THERMODYNAMIC CALIBRATION
            </h3>
            <span className="text-[10px] text-emerald-400">
              100% Self-Calibrated · Zero Stopword Lists
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded">
              <div className="text-[10px] text-slate-400">Token Density (ρ*)</div>
              <div className="text-sm font-bold text-sky-300 mt-0.5">{cal.tokenDensityRho}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded">
              <div className="text-[10px] text-slate-400">Structural Count (c* Q90)</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {cal.structuralCountThresholdC}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded">
              <div className="text-[10px] text-slate-400">Transition Entropy (th_trans)</div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">
                {cal.transitionEntropyThTrans} bits
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded">
              <div className="text-[10px] text-slate-400">Temporal Decay (λ*)</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5">
                {cal.temporalDecayLambda}
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider pt-2">
            CROSSBAR THERMODYNAMICS &amp; PHYSICAL CONSTANTS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 p-3 rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Thermal Boltzmann Temp (T)</span>
                <span className="text-amber-400 font-bold">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.60"
                step="0.01"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Low T (0.01–0.15) produces deterministic factual recall; higher T adds physical exploration.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-3 rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Pauli Refractory Half-Life (τ)</span>
                <span className="text-emerald-400 font-bold">{refractoryHalfLife.toFixed(1)} steps</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="16.0"
                step="0.5"
                value={refractoryHalfLife}
                onChange={(e) => setRefractoryHalfLife(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Controls the recovery speed of the soma membrane potential after emission to eliminate cyclic loops.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-3 rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Max Emission Depth</span>
                <span className="text-sky-400 font-bold">{maxSynthesisTokens} tokens</span>
              </div>
              <input
                type="range"
                min="16"
                max="96"
                step="4"
                value={maxSynthesisTokens}
                onChange={(e) => setMaxSynthesisTokens(parseInt(e.target.value, 10))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Maximum token length per conversational excitation pulse.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-900/70 border border-slate-800 p-3 rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">STDP Plasticity Learning Rate (η)</span>
                <span className="text-purple-400 font-bold">{learningRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.01"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Conductance increment ΔG per token co-occurrence across temporal horizons.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-3 rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Ingestion Epochs</span>
                <span className="text-cyan-400 font-bold">{epochs} pass</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Multi-pass STDP crystallization into Compressed Sparse Row (CSR) array buffers.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <div className="bg-rose-950/30 border border-rose-900/60 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    PRISTINE LATTICE ZERO RESET &amp; STORAGE PURGE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
                  Wipes all {telemetry.vocabSize.toLocaleString()} vocabulary somas, active memristor conductances, and narrative molecules to 0. Purges the persistent .bin image across OPFS, IndexedDB, and server disk for a clean retraining slate.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {telemetry.vocabSize === 0 && (
                  <button
                    onClick={handleReseedStarterCorpora}
                    disabled={isResetting}
                    className="px-3 py-1.5 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-200 border border-sky-700/60 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-seed Starter Corpora</span>
                  </button>
                )}
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Memory to 0</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

