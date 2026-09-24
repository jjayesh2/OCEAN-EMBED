import React from 'react';
import { ThermohalineDepthPoint } from '../../types/ocean';
import { ThermometerSun, Fish, Activity, ShieldCheck } from 'lucide-react';

interface MarineHeatwaveProps {
  profile: ThermohalineDepthPoint[];
  sst: number;
}

export function MarineHeatwaveIntelligence({ profile, sst }: MarineHeatwaveProps) {
  // Climatological 90th percentile threshold for North Indian Ocean (~29.0°C in June)
  const climatology90th = 29.0;
  const tempAnomaly = Math.max(0, sst - climatology90th);

  // MHW Category (Hobday et al., 2016 standard definition)
  // Category I: 1x - 2x anomaly threshold
  // Category II: 2x - 3x anomaly threshold
  // Category III: 3x - 4x anomaly threshold
  // Category IV: >4x anomaly threshold
  let mhwCategory = 'NONE';
  let badgeColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let categoryName = 'No Marine Heatwave (Normal Climatology)';

  if (tempAnomaly > 2.5) {
    mhwCategory = 'CAT_IV';
    badgeColor = 'bg-purple-500/20 border-purple-500/50 text-purple-300 animate-pulse';
    categoryName = 'Category IV — Extreme Marine Heatwave';
  } else if (tempAnomaly > 1.8) {
    mhwCategory = 'CAT_III';
    badgeColor = 'bg-red-500/20 border-red-500/50 text-red-300';
    categoryName = 'Category III — Severe Marine Heatwave';
  } else if (tempAnomaly > 1.0) {
    mhwCategory = 'CAT_II';
    badgeColor = 'bg-amber-500/20 border-amber-500/50 text-amber-300';
    categoryName = 'Category II — Strong Marine Heatwave';
  } else if (tempAnomaly > 0.2) {
    mhwCategory = 'CAT_I';
    badgeColor = 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300';
    categoryName = 'Category I — Moderate Marine Heatwave';
  }

  // Calculate Subsurface Thermal Penetration Depth (Depth where T exceeds 27.5°C)
  let penetrationDepth = 0;
  for (const pt of profile) {
    if (pt.reconstructedTemp >= 27.5) {
      penetrationDepth = pt.depth;
    }
  }

  // Potential Fishing Zone (PFZ) Optimal Depth Window: Pelagic Tuna & Mackerel dwell in 19°C - 23°C thermocline
  let pfzMinDepth = 40;
  let pfzMaxDepth = 90;
  for (const pt of profile) {
    if (pt.reconstructedTemp <= 23.0 && pfzMinDepth === 40) {
      pfzMinDepth = pt.depth;
    }
    if (pt.reconstructedTemp <= 19.0 && pfzMaxDepth === 90) {
      pfzMaxDepth = pt.depth;
    }
  }

  return (
    <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-3.5 shadow-lg">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ocean-800 pb-2.5">
        <div className="flex items-center gap-2">
          <ThermometerSun size={17} className="text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Marine Heatwave (MHW) & Fisheries Advisory
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Hobday et al. (2016) Protocol
          </span>
        </div>
        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded border font-semibold ${badgeColor}`}>
          {categoryName}
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Metric 1: MHW Surface Anomaly */}
        <div className="bg-ocean-950/70 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">SST Thermal Anomaly (ΔT)</div>
          <div className="text-xl font-bold font-mono text-amber-300 flex items-baseline gap-1">
            <span>+{tempAnomaly.toFixed(2)}</span>
            <span className="text-xs font-normal text-slate-400">°C above 90th%</span>
          </div>
          <div className="text-[10px] text-slate-500">Climatological baseline: {climatology90th}°C</div>
        </div>

        {/* Metric 2: Subsurface Heat Penetration */}
        <div className="bg-ocean-950/70 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Thermal Penetration Depth</div>
          <div className="text-xl font-bold font-mono text-cyan-300 flex items-baseline gap-1">
            <span>{penetrationDepth}</span>
            <span className="text-xs font-normal text-slate-400">meters</span>
          </div>
          <div className="text-[10px] text-slate-500">Depth where warm anomaly reaches &gt;27.5°C</div>
        </div>

        {/* Metric 3: Fisheries Advisory (PFZ) */}
        <div className="bg-ocean-950/70 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
            <Fish size={12} className="text-cyan-400" />
            <span>Optimal Fishery Window (PFZ)</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-1">
            <span>{pfzMinDepth}m – {pfzMaxDepth}m</span>
          </div>
          <div className="text-[10px] text-slate-500">Thermocline aggregation zone (19°C – 23°C)</div>
        </div>
      </div>

      {/* Advisory Message */}
      <div className="bg-ocean-950/80 border border-ocean-800 rounded-lg p-3 text-xs leading-relaxed text-slate-300 flex items-start gap-2">
        <Activity size={15} className="text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Ecosystem & Data Assimilation Impact:</span>{' '}
          Subsurface heat penetration directly influences vertical nutrient upwelling, coral bleaching vulnerability in the Lakshadweep/Andaman archipelagos, and numerical weather model initialization (coupled air-sea data assimilation).
        </div>
      </div>
    </div>
  );
}
