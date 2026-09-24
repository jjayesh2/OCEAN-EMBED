import React from 'react';
import { PrimaryView } from '../../types/ocean';
import { DatasetMetadata } from '../../data/adapter/DatasetAdapter';
import { Waves, Satellite, Activity, FlaskConical, BookOpen, Loader2 } from 'lucide-react';

interface HeaderProps {
  activeView: PrimaryView;
  onSetView: (v: PrimaryView) => void;
  date: string;
  region: string;
  isRunning: boolean;
  adapterMeta: DatasetMetadata;
}

const NAV_ITEMS: { id: PrimaryView; label: string; icon: React.ReactNode; short: string }[] = [
  { id: 'monitor',        label: 'Ocean Monitor',         icon: <Satellite size={15} />,   short: 'Monitor' },
  { id: 'reconstruction', label: 'Subsurface Reconstruction', icon: <Waves size={15} />,   short: 'Reconstruction' },
  { id: 'validation',     label: 'ARGO Validation',       icon: <Activity size={15} />,    short: 'Validation' },
  { id: 'method',         label: 'Method & Pipeline',     icon: <BookOpen size={15} />,    short: 'Method' },
];

export function Header({ activeView, onSetView, date, region, isRunning, adapterMeta }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-ocean-800/80 bg-ocean-950/95 backdrop-blur-sm">
      {/* Top identity bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded bg-ocean-700 flex items-center justify-center">
              <Waves size={16} className="text-cyan-400" />
            </div>
            <span className="font-bold text-white text-sm tracking-widest uppercase">OceanEmbed</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-ocean-700" />
          <span className="hidden sm:block text-slate-400 text-xs truncate max-w-xs">
            Surface Signals → Physics-aware Subsurface Reconstruction
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
          {isRunning ? (
            <div className="flex items-center gap-1.5 bg-ocean-800 border border-cyan-500/40 rounded px-2 py-1 text-cyan-400">
              <Loader2 size={11} className="animate-spin" />
              <span>Inferring…</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-ocean-900 border border-ocean-700 rounded px-2 py-1 text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Prototype Ready</span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-1.5 bg-ocean-900 border border-ocean-700 rounded px-2 py-1 text-slate-400">
            <FlaskConical size={11} className="text-amber-400" />
            <span>GLORYS12V1 · {date}</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 bg-ocean-900 border border-ocean-700 rounded px-2 py-1 text-slate-400">
            <span className="text-slate-500">Domain:</span>
            <span className="text-cyan-400 font-mono">5°N–30°N, 45°E–105°E</span>
          </div>
          <div className="hidden xl:flex items-center gap-1.5 bg-ocean-900 border border-ocean-700 rounded px-2 py-1 text-slate-400">
            <span className="text-slate-500">Cells:</span>
            <span className="text-slate-300">{adapterMeta.totalOceanCells.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-0 border-t border-ocean-800/50">
        {NAV_ITEMS.map(item => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSetView(item.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                ${active
                  ? 'border-cyan-500 text-cyan-400 bg-ocean-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-ocean-600'}
              `}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.short}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
