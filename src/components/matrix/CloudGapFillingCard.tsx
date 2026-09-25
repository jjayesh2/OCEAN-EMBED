import React, { useState } from 'react';
import { CloudRain, Sparkles, Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';

export function CloudGapFillingCard() {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 for interactive before/after split
  const [activeTab, setActiveTab] = useState<'compare' | 'stacked'>('stacked');
  const [cloudCoverage, setCloudCoverage] = useState(42); // % simulated monsoon cloud cover

  return (
    <div className="bg-gradient-to-b from-ocean-900 to-ocean-950 border border-ocean-700/90 rounded-2xl p-5 shadow-2xl space-y-4 max-w-xl mx-auto transition-all">
      
      {/* 1. Header with Badge Number "3" (Matching User Slide Exactly) */}
      <div className="flex items-start justify-between border-b border-ocean-800/80 pb-3">
        <div className="flex items-center gap-3">
          {/* Circular Step Badge "3" */}
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md border-2 border-blue-400 shrink-0">
            3
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Cloud-Gap Filling
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-normal">
                Autoencoder
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Reconstruct missing SST satellite observations obscured by monsoon cloud cover
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-ocean-950 p-1 rounded-lg border border-ocean-800 text-[11px] font-mono shrink-0">
          <button
            onClick={() => setActiveTab('stacked')}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTab === 'stacked' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stacked View
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTab === 'compare' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Split Slider
          </button>
        </div>
      </div>

      {/* 2. Visual Displays (Stacked View matching User's exact layout) */}
      {activeTab === 'stacked' ? (
        <div className="space-y-4 py-1">
          
          {/* Top Panel: "With cloud gaps" */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CloudRain size={13} className="text-slate-400" />
                With cloud gaps (Raw Infrared Satellite Observation)
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                ~{cloudCoverage}% missing pixels
              </span>
            </div>

            {/* Raster Map with simulated cloud gaps (gray patches) */}
            <div className="relative h-28 rounded-lg overflow-hidden border border-ocean-800 shadow-inner bg-ocean-950">
              {/* Ocean SST background */}
              <div
                className="w-full h-full opacity-85"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 35%, #eab308 70%, #ea580c 100%)',
                }}
              />
              
              {/* India silhouette center-right */}
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-20 bg-slate-900/80 rounded-t-sm"
                style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}
              />

              {/* Realistic Monsoon Cloud Patches (Semi-transparent gray clouds obscuring ocean) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 120">
                <path d="M 20,10 Q 60,35 110,15 T 200,40 T 290,10 T 380,30 L 400,0 L 0,0 Z" fill="#94a3b8" opacity="0.88" />
                <path d="M 120,45 Q 160,85 210,55 T 310,75 T 380,50 L 390,95 Q 310,115 220,95 T 100,105 Z" fill="#cbd5e1" opacity="0.9" />
                <ellipse cx="70" cy="75" rx="55" ry="30" fill="#94a3b8" opacity="0.85" />
                <ellipse cx="270" cy="85" rx="70" ry="25" fill="#cbd5e1" opacity="0.88" />
              </svg>

              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono text-slate-300">
                Infrared Radiometer Satellite Track
              </div>
            </div>
          </div>

          {/* Bottom Panel: "Reconstructed SST" */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-cyan-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-cyan-400" />
                Reconstructed SST (Deep Learning Autoencoder Inpainting)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 size={10} /> 100% gap-filled
              </span>
            </div>

            {/* Seamless, fully continuous reconstructed SST */}
            <div className="relative h-28 rounded-lg overflow-hidden border border-cyan-500/40 shadow-lg bg-ocean-950">
              <div
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 35%, #06b6d4 55%, #eab308 75%, #f97316 100%)',
                }}
              />
              
              {/* India Landmass clearly outlined on infilled SST */}
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-20 bg-slate-900 border-b border-cyan-400"
                style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}
              />

              {/* Dynamic eddy isotherms on clean infilled SST */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 400 120">
                <circle cx="100" cy="65" r="30" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="290" cy="70" r="35" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
              </svg>

              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-200">
                Seamless Spatio-Temporal Infilled Grid (0.25° × 0.25°)
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Split Comparison Slider View */
        <div className="space-y-3 py-1">
          <div className="relative h-56 rounded-lg overflow-hidden border border-ocean-700 shadow-xl select-none">
            
            {/* Background: Reconstructed Infilled SST */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 35%, #06b6d4 55%, #eab308 75%, #f97316 100%)',
              }}
            />

            {/* Foreground: With Cloud Gaps (Clipped by slider position) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <div
                className="w-full h-full"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 35%, #eab308 70%, #ea580c 100%)',
                }}
              />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 200">
                <path d="M 20,20 Q 80,60 140,30 T 260,60 T 360,20 L 400,0 L 0,0 Z" fill="#94a3b8" opacity="0.92" />
                <ellipse cx="120" cy="120" rx="90" ry="45" fill="#cbd5e1" opacity="0.9" />
                <ellipse cx="280" cy="140" rx="80" ry="40" fill="#94a3b8" opacity="0.92" />
              </svg>
            </div>

            {/* Vertical Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500 text-ocean-950 font-bold flex items-center justify-center text-[10px] shadow-lg border-2 border-white">
                ↔
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
              ◄ With Cloud Gaps
            </div>
            <div className="absolute top-2 right-2 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-200">
              Reconstructed SST ►
            </div>
          </div>

          {/* Slider input */}
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="w-full h-1.5 bg-ocean-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="text-center text-[11px] font-mono text-slate-400">
            Drag slider to inspect Autoencoder gap-infilling capability
          </div>
        </div>
      )}

      {/* 3. Bottom Caption (Matching User's Slide Text Exactly) */}
      <div className="bg-ocean-950/70 border border-ocean-800/80 rounded-xl p-3 text-center space-y-1">
        <div className="text-xs font-semibold text-slate-200">
          Reconstruct missing SST using autoencoder
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          Architecture: Spatio-Temporal U-Net with partial convolutions & temporal recurrence
        </div>
      </div>
    </div>
  );
}
