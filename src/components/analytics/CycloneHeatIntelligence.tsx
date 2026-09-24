import React from 'react';
import { ThermohalineDepthPoint, StandardDepth } from '../../types/ocean';
import { Flame, ShieldAlert, Waves, Info } from 'lucide-react';

interface CycloneHeatIntelligenceProps {
  profile: ThermohalineDepthPoint[];
  sst: number;
  mld?: number | null;
}

export function CycloneHeatIntelligence({ profile, sst, mld = 25 }: CycloneHeatIntelligenceProps) {
  // 1. Calculate D26 (Depth of 26°C isotherm via linear interpolation)
  let d26 = 0;
  for (let i = 0; i < profile.length - 1; i++) {
    const p1 = profile[i];
    const p2 = profile[i + 1];

    if (p1.reconstructedTemp >= 26.0 && p2.reconstructedTemp < 26.0) {
      const frac = (p1.reconstructedTemp - 26.0) / (p1.reconstructedTemp - p2.reconstructedTemp);
      d26 = p1.depth + frac * (p2.depth - p1.depth);
      break;
    } else if (p1.reconstructedTemp >= 26.0) {
      d26 = p1.depth;
    }
  }

  // 2. Calculate Tropical Cyclone Heat Potential (TCHP / OHC) in kJ/cm²
  // TCHP = rho * Cp * integral_0^D26 (T(z) - 26) dz
  const rho = 1024; // kg/m³
  const cp = 3993; // J/(kg K)
  let tchpJouleM2 = 0;

  for (let i = 0; i < profile.length - 1; i++) {
    const p1 = profile[i];
    const p2 = profile[i + 1];

    if (p1.depth >= d26) break;

    const z1 = p1.depth;
    const z2 = Math.min(d26, p2.depth);
    const dz = z2 - z1;

    const t1 = Math.max(26.0, p1.reconstructedTemp);
    const t2 = Math.max(26.0, p2.reconstructedTemp);
    const avgExcessT = (t1 + t2) / 2 - 26.0;

    tchpJouleM2 += rho * cp * avgExcessT * dz;
  }

  const tchpKjCm2 = Number((tchpJouleM2 / 10000000).toFixed(1)); // Convert J/m² to kJ/cm²
  const roundedD26 = Number(d26.toFixed(1));

  // Risk Category Determination (INCOIS / NOAA Standard)
  let riskLevel = 'LOW';
  let badgeColor = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';
  let riskTitle = 'Low Cyclone Fuel';
  let riskDesc = 'Upper ocean heat content is low. Insufficient thermal energy to support rapid intensification.';

  if (tchpKjCm2 >= 80) {
    riskLevel = 'EXTREME';
    badgeColor = 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse';
    riskTitle = 'Extreme Cyclone Fuel — Rapid Intensification Alert';
    riskDesc = 'Massive subsurface ocean heat content. Storms passing over this region risk explosive intensification into Super Cyclones.';
  } else if (tchpKjCm2 >= 50) {
    riskLevel = 'HIGH';
    badgeColor = 'bg-amber-500/20 border-amber-500/50 text-amber-300';
    riskTitle = 'High Heat Potential (Category 3+ Support)';
    riskDesc = 'Deep warm layer exceeding 50m. Adequate thermal reservoir to counteract storm-induced ocean upwelling.';
  } else if (tchpKjCm2 >= 25) {
    riskLevel = 'MODERATE';
    badgeColor = 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300';
    riskTitle = 'Moderate Heat Fuel';
    riskDesc = 'Supports standard tropical cyclone maintenance without explosive intensification.';
  }

  return (
    <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
      
      {/* Glow highlight */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
        riskLevel === 'EXTREME' ? 'bg-red-500/10' : 'bg-cyan-500/10'
      }`} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ocean-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Flame size={16} className={riskLevel === 'EXTREME' ? 'text-red-400' : 'text-amber-400'} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Tropical Cyclone Heat Potential (TCHP) & OHC Intelligence
          </span>
        </div>
        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded border font-semibold ${badgeColor}`}>
          {riskLevel} RISK: {tchpKjCm2} kJ/cm²
        </span>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Metric 1: TCHP */}
        <div className="bg-ocean-950/70 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Ocean Heat Content (TCHP)</div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1">
            <span>{tchpKjCm2}</span>
            <span className="text-xs font-normal text-slate-400">kJ/cm²</span>
          </div>
          <div className="text-[10px] text-slate-500">Threshold for Rapid Intensification: &gt;50 kJ/cm²</div>
        </div>

        {/* Metric 2: D26 Isotherm Depth */}
        <div className="bg-ocean-950/70 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">26°C Isotherm Depth (D₂₆)</div>
          <div className="text-xl font-bold font-mono text-cyan-300 flex items-baseline gap-1">
            <span>{roundedD26}</span>
            <span className="text-xs font-normal text-slate-400">meters</span>
          </div>
          <div className="text-[10px] text-slate-500">Depth of thermal reservoir fueling eye-wall</div>
        </div>

        {/* Metric 3: Mixed Layer Depth */}
        <div className="bg-ocean-950/70 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Mixed Layer Depth (MLD)</div>
          <div className="text-xl font-bold font-mono text-amber-300 flex items-baseline gap-1">
            <span>{mld ? mld.toFixed(1) : '28.0'}</span>
            <span className="text-xs font-normal text-slate-400">meters</span>
          </div>
          <div className="text-[10px] text-slate-500">Barrier Layer: {Math.max(0, roundedD26 - (mld || 25)).toFixed(1)}m thick</div>
        </div>
      </div>

      {/* Advisory Message */}
      <div className={`rounded-lg p-3 border text-xs leading-relaxed flex items-start gap-2.5 ${
        riskLevel === 'EXTREME'
          ? 'bg-red-950/30 border-red-500/30 text-red-200'
          : 'bg-ocean-950/80 border-ocean-800 text-slate-300'
      }`}>
        <ShieldAlert size={16} className={`shrink-0 mt-0.5 ${riskLevel === 'EXTREME' ? 'text-red-400' : 'text-cyan-400'}`} />
        <div>
          <span className="font-semibold text-white">{riskTitle}</span>: {riskDesc}
        </div>
      </div>
    </div>
  );
}
