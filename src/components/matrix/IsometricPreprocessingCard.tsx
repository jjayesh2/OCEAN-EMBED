import React, { useState } from 'react';
import { Layers, CheckCircle2, Sliders, Database, ArrowRight } from 'lucide-react';

interface LayerInfo {
  id: string;
  name: string;
  symbol: string;
  nativeRes: string;
  regridMethod: string;
  colorGrad: string;
  borderColor: string;
  textColor: string;
}

const LAYERS: LayerInfo[] = [
  {
    id: 'sst',
    name: 'Sea Surface Temperature',
    symbol: 'SST (OSTIA 0.05°)',
    nativeRes: '0.05° native → 0.25°',
    regridMethod: 'Bilinear 2D spatial interpolation',
    colorGrad: 'from-amber-500/70 via-orange-500/60 to-blue-600/70',
    borderColor: '#f97316',
    textColor: 'text-amber-300',
  },
  {
    id: 'sss',
    name: 'Sea Surface Salinity',
    symbol: 'SSS (SMAP 0.125°)',
    nativeRes: '0.125° native → 0.25°',
    regridMethod: 'Area-weighted conservative regridding',
    colorGrad: 'from-emerald-500/70 via-teal-600/60 to-cyan-700/70',
    borderColor: '#14b8a6',
    textColor: 'text-teal-300',
  },
  {
    id: 'ssh',
    name: 'Sea Surface Height / SLA',
    symbol: 'SSH / SLA (DUACS 0.25°)',
    nativeRes: '0.25° native (matched)',
    regridMethod: 'Direct geodetic raster registration',
    colorGrad: 'from-blue-500/70 via-indigo-600/60 to-purple-700/70',
    borderColor: '#6366f1',
    textColor: 'text-indigo-300',
  },
  {
    id: 'currents',
    name: 'Surface Ocean Currents',
    symbol: 'Currents U, V (OSCAR 0.25°)',
    nativeRes: '0.25° native (matched)',
    regridMethod: 'Vector component alignment (U eastward, V northward)',
    colorGrad: 'from-cyan-500/70 via-blue-600/60 to-sky-700/70',
    borderColor: '#06b6d4',
    textColor: 'text-cyan-300',
  },
  {
    id: 'winds',
    name: 'Surface 10m Wind Stress',
    symbol: 'Winds U, V (CCMP/ASCAT 0.25°)',
    nativeRes: '0.25° native (matched)',
    regridMethod: '6-hourly to daily diurnal vector average',
    colorGrad: 'from-sky-500/70 via-slate-600/60 to-blue-800/70',
    borderColor: '#38bdf8',
    textColor: 'text-sky-300',
  },
];

export function IsometricPreprocessingCard() {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);

  return (
    <div className="bg-gradient-to-b from-ocean-900 to-ocean-950 border border-ocean-700/90 rounded-2xl p-5 shadow-2xl space-y-4 max-w-xl mx-auto transition-all">
      
      {/* 1. Header with Badge Number "2" (Matching User Slide Exactly) */}
      <div className="flex items-start justify-between border-b border-ocean-800/80 pb-3">
        <div className="flex items-center gap-3">
          {/* Circular Step Badge "2" */}
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md border-2 border-blue-400 shrink-0">
            2
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Preprocessing
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-normal">
                Standardize to 0.25° grid
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Clean and align all variables in a common 0.25° daily spatio-temporal grid
            </p>
          </div>
        </div>

        {/* Toggle Exploded View */}
        <button
          onClick={() => setExpandedView(!expandedView)}
          className="text-[11px] font-mono px-2.5 py-1 rounded bg-ocean-800 hover:bg-ocean-700 border border-ocean-700 text-cyan-300 transition-colors shrink-0"
        >
          {expandedView ? 'Normal View' : 'Exploded Stack'}
        </button>
      </div>

      {/* 2. Isometric 3D Layer Stack Illustration */}
      <div className="relative py-6 flex items-center justify-center overflow-hidden min-h-[300px] select-none">
        
        {/* Subtle background glow */}
        <div className="absolute w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* SVG Container for Isometric Stack */}
        <svg
          viewBox="0 0 460 320"
          className="w-full max-w-[420px] h-auto overflow-visible"
        >
          <defs>
            {/* Gradients for each ocean layer */}
            <linearGradient id="grad-sst" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#eab308" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="grad-sss" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="grad-ssh" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="grad-currents" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#2563eb" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="grad-winds" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#475569" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#071226" stopOpacity="0.85" />
            </linearGradient>

            {/* Drop shadow */}
            <filter id="layer-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 4 Corner Registration Alignment Guides (Proving Spatio-Temporal Standardization) */}
          <line x1="230" y1="40" x2="230" y2="280" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <line x1="70" y1="125" x2="70" y2="235" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
          <line x1="390" y1="125" x2="390" y2="235" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
          <line x1="230" y1="210" x2="230" y2="295" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />

          {/* Render 5 Isometric Stacked Rhombus Plates */}
          {LAYERS.map((layer, idx) => {
            // Isometric rhomboid points:
            // Top point: (230, baseY)
            // Right point: (390, baseY + 85)
            // Bottom point: (230, baseY + 170)
            // Left point: (70, baseY + 85)
            const spacing = expandedView ? 52 : 36;
            const baseY = 20 + idx * spacing;
            const isHovered = hoveredLayer === layer.id;
            const liftY = isHovered ? -12 : 0;
            const currentY = baseY + liftY;

            return (
              <g
                key={layer.id}
                onMouseEnter={() => setHoveredLayer(layer.id)}
                onMouseLeave={() => setHoveredLayer(null)}
                className="cursor-pointer transition-transform duration-200"
                style={{ transform: `translateY(${liftY}px)` }}
              >
                {/* Rhombus Surface Plate */}
                <polygon
                  points={`230,${currentY} 390,${currentY + 85} 230,${currentY + 170} 70,${currentY + 85}`}
                  fill={`url(#grad-${layer.id})`}
                  stroke={isHovered ? '#00ffff' : layer.borderColor}
                  strokeWidth={isHovered ? 2.5 : 1.2}
                  filter="url(#layer-shadow)"
                  opacity={isHovered ? 1 : 0.92}
                />

                {/* Simulated 0.25° Grid Lines on each layer */}
                <path
                  d={`M 150,${currentY + 42} L 310,${currentY + 127} M 190,${currentY + 63} L 350,${currentY + 148} M 150,${currentY + 127} L 310,${currentY + 42} M 190,${currentY + 148} L 350,${currentY + 63}`}
                  stroke="#ffffff"
                  strokeWidth="0.4"
                  opacity="0.35"
                />

                {/* Coastline shape approximation of Indian Peninsula on layer */}
                <path
                  d={`M 220,${currentY + 60} Q 235,${currentY + 85} 230,${currentY + 115} Q 220,${currentY + 100} 210,${currentY + 75} Z`}
                  fill="#0c1729"
                  opacity="0.75"
                  stroke="#ffffff"
                  strokeWidth="0.6"
                />

                {/* Layer Label on the side */}
                <g transform={`translate(400, ${currentY + 90})`}>
                  <line x1="-8" y1="0" x2="8" y2="0" stroke={layer.borderColor} strokeWidth="1.2" />
                  <circle cx="8" cy="0" r="2.5" fill={layer.borderColor} />
                  <text
                    x="16"
                    y="3"
                    fill={isHovered ? '#ffffff' : '#94a3b8'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {layer.symbol}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Dynamic Inspector for Hovered/Selected Layer */}
      {hoveredLayer ? (
        (() => {
          const l = LAYERS.find(x => x.id === hoveredLayer)!;
          return (
            <div className="bg-ocean-950 border border-cyan-500/40 rounded-xl p-3 text-xs font-mono space-y-1 animate-fade-in shadow-inner">
              <div className="flex items-center justify-between text-white font-bold">
                <span className={l.textColor}>▸ {l.name}</span>
                <span className="text-[10px] text-slate-400">{l.nativeRes}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Regridding Protocol: <span className="text-cyan-300 font-semibold">{l.regridMethod}</span>
              </div>
            </div>
          );
        })()
      ) : (
        /* 4. Bottom Default Caption (Matching User's Slide Text Exactly) */
        <div className="bg-ocean-950/70 border border-ocean-800/80 rounded-xl p-3 text-center space-y-1">
          <div className="text-xs font-semibold text-slate-200">
            Clean and align all variables in a common 0.25° daily grid
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Harmonized Input Tensor: [Batch, 5 channels, 81 lats × 160 lons] · North Indian Ocean
          </div>
        </div>
      )}
    </div>
  );
}
