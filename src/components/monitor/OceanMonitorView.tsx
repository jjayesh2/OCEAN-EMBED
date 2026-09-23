import React from 'react';
import {
  PrimaryView,
  OceanRegion,
  OceanSurfaceState,
  ModelInferencePackage,
  SurfaceVariableMeta,
  ArgoValidationMatch,
} from '../../types/ocean';
import { ScientificOceanMap } from './ScientificOceanMap';
import { Loader2, Zap, Layers, AlertCircle, ChevronRight, Waves, Compass } from 'lucide-react';

interface OceanMonitorViewProps {
  date: string;
  region: OceanRegion;
  selectedLat: number;
  selectedLon: number;
  activeLayer: string;
  setActiveLayer: (l: string) => void;
  surfaceState: OceanSurfaceState | null;
  inferenceResult: ModelInferencePackage | null;
  isRunning: boolean;
  runStage: string;
  availableVariables: SurfaceVariableMeta[];
  allArgoFloats: ArgoValidationMatch[];
  onSelectLocation: (lat: number, lon: number) => void;
  onRunInference: () => void;
  onNavigate: (v: PrimaryView) => void;
}

function SurfaceValueRow({ label, value, unit, available }: {
  label: string;
  value: number | null | undefined;
  unit: string;
  available: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-ocean-800/60 last:border-0">
      <span className="text-slate-400 text-xs">{label}</span>
      {!available ? (
        <span className="text-xs font-mono text-slate-600">Not in dataset</span>
      ) : value === null || value === undefined ? (
        <span className="text-xs font-mono text-slate-500">Land / Snapped</span>
      ) : (
        <span className="text-xs font-mono text-cyan-300 font-semibold">{value.toFixed(3)} <span className="text-slate-500 font-normal">{unit}</span></span>
      )}
    </div>
  );
}

export function OceanMonitorView({
  date,
  selectedLat,
  selectedLon,
  activeLayer,
  setActiveLayer,
  surfaceState,
  inferenceResult,
  isRunning,
  runStage,
  availableVariables,
  allArgoFloats,
  onSelectLocation,
  onRunInference,
  onNavigate,
}: OceanMonitorViewProps) {
  const activeVar = availableVariables.find(v => v.key === activeLayer) ?? availableVariables[0];

  const depthAtTarget = inferenceResult
    ? inferenceResult.profile.find(p => p.depth === inferenceResult.targetDepth)
    : null;

  const currentBasin = selectedLon < 77.5 ? 'Arabian Sea' : 'Bay of Bengal';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      
      {/* Quick Basin Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-ocean-900 border border-ocean-700/80 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Quick Basin Jump:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectLocation(15.0, 66.0)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all border ${
              currentBasin === 'Arabian Sea'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-ocean-800/80 border-ocean-700 text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            🌊 Arabian Sea (West)
          </button>
          <button
            onClick={() => onSelectLocation(14.5, 87.5)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all border ${
              currentBasin === 'Bay of Bengal'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-ocean-800/80 border-ocean-700 text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            🌊 Bay of Bengal (East)
          </button>
          <button
            onClick={() => onSelectLocation(6.0, 77.5)}
            className="px-3 py-1.5 rounded text-xs font-medium bg-ocean-800/80 border border-ocean-700 text-slate-300 hover:border-cyan-500/50 transition-colors"
          >
            🌊 Equatorial Indian Ocean (South)
          </button>
          {allArgoFloats.length > 0 && (
            <button
              onClick={() => onSelectLocation(allArgoFloats[0].lat, allArgoFloats[0].lon)}
              className="px-3 py-1.5 rounded text-xs font-medium bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Jump to Real ARGO Float
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Map Left, Calculated Output Right */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── Left Column: Interactive Map & Layers ── */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Layer Selector */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-mono shrink-0">Satellite Layer:</span>
              {availableVariables.map(v => (
                <button
                  key={v.key}
                  disabled={!v.availableInGlorys}
                  onClick={() => v.availableInGlorys && setActiveLayer(v.key)}
                  title={v.availableInGlorys ? v.fullName : v.unavailableReason}
                  className={`
                    text-[11px] font-mono px-2.5 py-1 rounded border transition-colors
                    ${!v.availableInGlorys
                      ? 'border-ocean-800/30 text-slate-700 cursor-not-allowed line-through'
                      : activeLayer === v.key
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-semibold shadow-sm'
                        : 'border-ocean-700 text-slate-300 hover:border-ocean-500 hover:text-white'}
                  `}
                >
                  {v.name}
                  {!v.availableInGlorys && <span className="ml-1 text-[9px] no-underline">✗</span>}
                </button>
              ))}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Region: <span className="text-cyan-400 font-semibold">{currentBasin}</span>
            </div>
          </div>

          {/* The Enhanced Map */}
          <ScientificOceanMap
            variable={activeVar}
            argoFloats={allArgoFloats}
            selectedLat={selectedLat}
            selectedLon={selectedLon}
            surfaceState={surfaceState}
            onSelectLocation={onSelectLocation}
          />

          {/* Map Helper & Metadata */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
            <div>
              <span className="text-white font-medium">{activeVar.fullName}</span> · Source: {activeVar.sourceDataset} · Res: 0.25°
            </div>
            <div className="text-slate-500">
              Copernicus GLORYS12V1 · {date} · Northern Indian Ocean
            </div>
          </div>
        </div>

        {/* ── Right Column: Live Calculated Output Panel ── */}
        <div className="xl:w-80 space-y-3">

          {/* 1. Selected Coordinates & Satellite Signals */}
          <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Selected Location</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ocean-800 text-cyan-400 border border-ocean-700">
                {currentBasin}
              </span>
            </div>
            <div className="font-mono text-base font-bold text-cyan-300">
              {selectedLat.toFixed(2)}°N, {selectedLon.toFixed(2)}°E
            </div>

            <div className="space-y-0.5 pt-1">
              <SurfaceValueRow label="SST (Surface Temp)" value={surfaceState?.SST} unit="°C" available={true} />
              <SurfaceValueRow label="SSS (Salinity)" value={surfaceState?.SSS} unit="PSU" available={true} />
              <SurfaceValueRow label="SSH / SLA (Sea Level)" value={surfaceState?.SSH} unit="m" available={true} />
              <SurfaceValueRow label="Current U (East)" value={surfaceState?.currentU} unit="m/s" available={true} />
              <SurfaceValueRow label="Current V (North)" value={surfaceState?.currentV} unit="m/s" available={true} />
              <SurfaceValueRow label="MLD (Mixed Layer)" value={surfaceState?.MLD} unit="m" available={true} />
              <SurfaceValueRow label="Wind Stress" value={null} unit="m/s" available={false} />
            </div>
          </div>

          {/* 2. Live Reconstructed OceanEmbed Calculation */}
          <div className="bg-ocean-900 border border-cyan-500/40 rounded-lg p-4 space-y-3 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Waves size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">Live Calculation</span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded">
                OceanEmbed
              </span>
            </div>

            {isRunning ? (
              <div className="py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <Loader2 size={13} className="animate-spin" />
                  <span>{runStage}</span>
                </div>
                <div className="h-1 bg-ocean-800 rounded overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ) : inferenceResult ? (
              <div className="space-y-2.5">
                <div className="bg-ocean-950/80 border border-ocean-800 rounded p-2.5 space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Temp at {inferenceResult.targetDepth}m:</span>
                    <span className="font-mono text-base font-bold text-cyan-300">
                      {depthAtTarget?.reconstructedTemp.toFixed(2)} °C
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">GLORYS Reference:</span>
                    <span className="font-mono text-slate-300">
                      {depthAtTarget?.glorysRefTemp.toFixed(2)} °C
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Difference (ΔT):</span>
                    <span className={`font-mono font-semibold ${
                      Math.abs(depthAtTarget?.tempDiffAgainstGlorys ?? 0) > 1.0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {(depthAtTarget?.tempDiffAgainstGlorys ?? 0) > 0 ? '+' : ''}{depthAtTarget?.tempDiffAgainstGlorys.toFixed(2)} °C
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Physics Stability:</span>
                  <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {inferenceResult.physicsReport.statusBadge}
                  </span>
                </div>

                {/* Big Action Button to View Reconstruction View */}
                <button
                  onClick={() => onNavigate('reconstruction')}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs py-2.5 rounded-lg shadow-md transition-all group"
                >
                  <span>View 0–1000m Depth Graphs & Table</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ) : null}

            <button
              onClick={onRunInference}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-1.5 bg-ocean-800 hover:bg-ocean-700 disabled:opacity-50 text-slate-300 text-xs py-1.5 rounded transition-colors"
            >
              <Zap size={11} />
              <span>{isRunning ? 'Computing…' : 'Recalculate Profile'}</span>
            </button>
          </div>

          {/* 3. Nearest ARGO In-situ Match Card */}
          {inferenceResult?.argoMatch ? (
            <div className="bg-ocean-900 border border-amber-600/40 rounded-lg p-3 space-y-1.5 shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  ARGO Float Match Found
                </span>
                <span className="text-[10px] font-mono text-slate-400">{inferenceResult.argoMatch.distanceKm} km</span>
              </div>
              <div className="text-[11px] font-mono text-slate-300">
                WMO ID: <span className="text-white font-semibold">{inferenceResult.argoMatch.wmo}</span>
              </div>
              <button
                onClick={() => onNavigate('validation')}
                className="w-full text-center text-[11px] text-amber-400 hover:text-amber-300 font-mono pt-1 flex items-center justify-center gap-1"
              >
                Compare against real ARGO sensor →
              </button>
            </div>
          ) : (
            <div className="bg-ocean-900/60 border border-ocean-800 rounded-lg p-3 text-[11px] text-slate-500">
              No ARGO float within 350 km. Click near an orange dot to compare with an in-situ float!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
