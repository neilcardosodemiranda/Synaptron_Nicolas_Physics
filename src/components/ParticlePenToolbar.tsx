import React, { useRef } from 'react';
import { Target, Magnet, Activity, Search, Volume2, VolumeX, Pause, Play, Download, Upload } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ParticlePenToolbarProps {
  activeTool: 'sling' | 'well' | 'probe' | 'inspect';
  setActiveTool: (tool: 'sling' | 'well' | 'probe' | 'inspect') => void;
  selectedChar: string;
  setSelectedChar: (char: string) => void;
  isAntimatter: boolean;
  setIsAntimatter: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onExportState: () => void;
  onImportState: (jsonString: string) => void;
}

export const ParticlePenToolbar: React.FC<ParticlePenToolbarProps> = ({
  activeTool,
  setActiveTool,
  selectedChar,
  setSelectedChar,
  isAntimatter,
  setIsAntimatter,
  soundEnabled,
  setSoundEnabled,
  isPaused,
  onTogglePause,
  onExportState,
  onImportState,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commonLetters = ['A', 'E', 'I', 'O', 'U', 'N', 'T', 'R', 'S', 'Q', 'M', 'P', '!', '?'];

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setMuted(!next);
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Tool Mode Buttons */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded border border-slate-800">
        <button
          onClick={() => setActiveTool('sling')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
            activeTool === 'sling'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Click and drag inside chamber to slingshot particle"
        >
          <Target className="w-3.5 h-3.5" />
          <span>Sling Particle</span>
        </button>

        <button
          onClick={() => setActiveTool('well')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
            activeTool === 'well'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Click inside chamber to place gravity attractor well"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>Place Well</span>
        </button>

        <button
          onClick={() => setActiveTool('probe')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
            activeTool === 'probe'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Click near neurons to inject voltage current"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Voltage Probe</span>
        </button>

        <button
          onClick={() => setActiveTool('inspect')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
            activeTool === 'inspect'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Click particle or neuron to inspect quantum states"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      </div>

      {/* Elementary Letter Particle Quick Palette */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Letter:</span>
        <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none py-0.5">
          {commonLetters.map((c) => {
            const isVowel = 'AEIOUY'.includes(c);
            const isSelected = selectedChar === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedChar(c)}
                className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 font-black'
                    : isVowel
                    ? 'bg-sky-950 text-sky-300 border border-sky-800/60 hover:bg-sky-900'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Custom Letter Input */}
        <input
          type="text"
          maxLength={1}
          value={selectedChar}
          onChange={(e) => setSelectedChar(e.target.value.toUpperCase() || 'A')}
          className="w-7 h-6 text-center font-mono font-bold text-xs bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-sky-500 ml-1"
          title="Custom letter"
        />
      </div>

      {/* Antimatter & Audio Controls */}
      <div className="flex items-center gap-2">
        <label
          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${
            isAntimatter
              ? 'bg-pink-950 border-pink-600 text-pink-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            type="checkbox"
            checked={isAntimatter}
            onChange={(e) => setIsAntimatter(e.target.checked)}
            className="hidden"
          />
          <span className="font-mono font-bold">Anti-Quark [x̄]</span>
        </label>

        <button
          onClick={handleToggleSound}
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            soundEnabled
              ? 'bg-slate-900 border-slate-700 text-sky-400 hover:bg-slate-800'
              : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
          }`}
          title={soundEnabled ? 'Mute physics acoustic sonification' : 'Enable sonification'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Pause / Resume Collider */}
        <button
          onClick={onTogglePause}
          className={`px-2.5 py-1 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            isPaused
              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title={isPaused ? 'Resume simulation' : 'Pause simulation'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Capture & Save Particle Coordinates / Momentum JSON */}
        <button
          onClick={onExportState}
          className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Save particle coordinates and momentum as JSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save JSON</span>
        </button>

        {/* Load Particle Configuration JSON */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Load saved particle configuration JSON"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Load JSON</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              const content = event.target?.result as string;
              if (content) onImportState(content);
            };
            reader.readAsText(file);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>
    </div>
  );
};
