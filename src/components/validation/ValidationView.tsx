import React, { useMemo } from 'react';
import { ModelInferencePackage, ArgoValidationMatch, PrimaryView } from '../../types/ocean';
import { calculateArgoValidationMetrics } from '../../validation/metricsEngine';
import { IncoisLasBenchmark } from './IncoisLasBenchmark';
import { AlertCircle, MapPin, Activity, Info } from 'lucide-react';

interface ValidationViewProps {
  inferenceResult: ModelInferencePackage | null;
  allArgoFloats: ArgoValidationMatch[];
  onSelectLocation: (lat: number, lon: number) => void;
  onNavigate: (v: PrimaryView) => void;
}

function MetricCard({ label, value, unit, description, color }: {
  label: string;
  value: string;
  unit: string;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-ocean-800/60 border border-ocean-700 rounded-lg p-4 space-y-1.5">
      <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-mono font-bold ${color}`}>
        {value} <span className="text-sm font-normal text-slate-500">{unit}</span>
      </div>
      <div className="text-[11px] text-slate-600">{description}</div>
    </div>
  );
}

// Spatial ARGO network map (SVG)
function ArgoNetworkMap({
  floats,
  selected,
  onSelect,
}: {
  floats: ArgoValidationMatch[];
  selected: ArgoValidationMatch | null | undefined;
  onSelect: (lat: number, lon: number) => void;
}) {
  const W = 460, H = 200;
  const LAT_MIN = 5, LAT_MAX = 25, LON_MIN = 55, LON_MAX = 95;

  const toX = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
  const toY = (lat: number) => H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="rounded bg-ocean-950 border border-ocean-800">
      {/* Ocean background */}
      <rect width={W} height={H} fill="#030814" />

      {/* Grid lines */}
      {[10, 15, 20].map(lat => {
        const y = toY(lat);
        return <line key={lat} x1={0} y1={y} x2={W} y2={y} stroke="#0b1b36" strokeWidth={0.5} />;
      })}
      {[60, 70, 80, 90].map(lon => {
        const x = toX(lon);
        return <line key={lon} x1={x} y1={0} x2={x} y2={H} stroke="#0b1b36" strokeWidth={0.5} />;
      })}

      {/* Region labels */}
      <text x={toX(65)} y={toY(18)} fill="#1e3e70" fontSize={9} textAnchor="middle">Arabian Sea</text>
      <text x={toX(87)} y={toY(18)} fill="#1e3e70" fontSize={9} textAnchor="middle">Bay of Bengal</text>

      {/* ARGO floats */}
      {floats.map(f => {
        const isSelected = selected && f.floatId === selected.floatId;
        return (
          <g key={f.floatId} onClick={() => onSelect(f.lat, f.lon)} className="cursor-pointer">
            <circle
              cx={toX(f.lon)} cy={toY(f.lat)} r={isSelected ? 5 : 3.5}
              fill={isSelected ? '#22d3ee' : '#f59e0b'}
              stroke={isSelected ? '#030814' : '#030814'}
              strokeWidth={0.8}
            />
          </g>
        );
      })}

      {/* Axis labels */}
      {[10, 15, 20].map(lat => (
        <text key={lat} x={4} y={toY(lat) + 3} fill="#334155" fontSize={8}>{lat}°N</text>
      ))}
      {[60, 70, 80, 90].map(lon => (
        <text key={lon} x={toX(lon)} y={H - 3} fill="#334155" fontSize={8} textAnchor="middle">{lon}°E</text>
      ))}
    </svg>
  );
}

export function ValidationView({ inferenceResult, allArgoFloats, onSelectLocation, onNavigate }: ValidationViewProps) {
  const argoMatch = inferenceResult?.argoMatch;
  const profile = inferenceResult?.profile ?? [];

  const metrics = useMemo(
    () => argoMatch ? calculateArgoValidationMetrics(profile, argoMatch) : null,
    [profile, argoMatch]
  );

  const hasMatch = argoMatch !== null && argoMatch !== undefined;
  const hasMetrics = metrics !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">ARGO Float Validation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent in-situ observational validation of OceanEmbed prototype reconstruction
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-1 rounded">
            ARGO In-Situ
          </span>
          <span className="bg-ocean-800 border border-ocean-700 text-slate-400 px-2 py-1 rounded">
            {allArgoFloats.length} floats indexed
          </span>
        </div>
      </div>

      {/* ARGO network map */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">ARGO Float Network — Northern Indian Ocean</span>
          <span className="text-[11px] font-mono text-slate-500">Apr–Jun 2026</span>
        </div>

        <ArgoNetworkMap
          floats={allArgoFloats}
          selected={argoMatch}
          onSelect={onSelectLocation}
        />

        <p className="text-[11px] text-slate-600">
          Click any float (amber) to select it as the validation reference point. Cyan = currently selected. Data from INCOIS/Coriolis ARGO network.
        </p>
      </div>

      {/* INCOIS Live Access Server (LAS) Benchmark Suite */}
      <IncoisLasBenchmark
        metrics={metrics}
        selectedStationLat={argoMatch?.lat ?? 15.0}
        selectedStationLon={argoMatch?.lon ?? 85.0}
      />

      {/* ARGO match info */}
      {hasMatch ? (
        <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-amber-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Nearest ARGO Observation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-[11px] font-mono">
            {[
              { label: 'Float ID', value: argoMatch!.floatId },
              { label: 'WMO', value: argoMatch!.wmo },
              { label: 'Platform', value: argoMatch!.platformType },
              { label: 'QC Flag', value: argoMatch!.qcFlag },
              { label: 'Lat/Lon', value: `${argoMatch!.lat.toFixed(2)}°N, ${argoMatch!.lon.toFixed(2)}°E` },
              { label: 'Distance', value: `${argoMatch!.distanceKm} km` },
              { label: 'Date', value: argoMatch!.date },
              { label: 'Match Type', value: argoMatch!.isDirectSpatialMatch ? 'Direct (<50 km)' : 'Nearest (<350 km)' },
            ].map(item => (
              <div key={item.label} className="bg-ocean-800/60 rounded p-2">
                <div className="text-slate-500 mb-0.5">{item.label}</div>
                <div className="text-slate-300">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Salinity notice */}
          <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
            <AlertCircle size={11} className="mt-0.5 shrink-0" />
            <span>{argoMatch!.observedSalinityStatus}</span>
          </div>
        </div>
      ) : (
        <div className="bg-ocean-900 border border-ocean-800 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle size={15} className="text-slate-600 shrink-0" />
          <div>
            <div className="text-sm text-slate-400">ARGO observation unavailable for this selection.</div>
            <div className="text-xs text-slate-600 mt-1">
              No ARGO float was found within 350 km of the selected location. Select a point closer to the float network on the Ocean Monitor, or click a float on the map above.
            </div>
          </div>
        </div>
      )}

      {/* Validation metrics */}
      {hasMatch && hasMetrics && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Live Validation Metrics</span>
            <span className="text-[10px] text-slate-600 font-mono ml-1">(computed from actual profile arrays)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="RMSE"
              value={metrics!.rmse.toFixed(3)}
              unit="°C"
              description="Root mean square temperature error vs ARGO"
              color={metrics!.rmse < 1.0 ? 'text-emerald-400' : metrics!.rmse < 2.0 ? 'text-amber-400' : 'text-red-400'}
            />
            <MetricCard
              label="MAE"
              value={metrics!.mae.toFixed(3)}
              unit="°C"
              description="Mean absolute temperature error"
              color={metrics!.mae < 1.0 ? 'text-emerald-400' : metrics!.mae < 2.0 ? 'text-amber-400' : 'text-red-400'}
            />
            <MetricCard
              label="Bias"
              value={(metrics!.bias > 0 ? '+' : '') + metrics!.bias.toFixed(3)}
              unit="°C"
              description="Systematic reconstruction bias (+ = warm)"
              color={Math.abs(metrics!.bias) < 0.5 ? 'text-emerald-400' : 'text-amber-400'}
            />
            <MetricCard
              label="Correlation"
              value={metrics!.correlation.toFixed(4)}
              unit="r"
              description="Pearson r between reconstruction and ARGO"
              color={metrics!.correlation > 0.95 ? 'text-emerald-400' : metrics!.correlation > 0.85 ? 'text-amber-400' : 'text-red-400'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Epipelagic RMSE (0–200 m)"
              value={metrics!.epipelagicRmse.toFixed(3)}
              unit="°C"
              description="Thermocline zone — most scientifically significant"
              color={metrics!.epipelagicRmse < 1.5 ? 'text-emerald-400' : 'text-amber-400'}
            />
            <MetricCard
              label="Mesopelagic RMSE (200–1000 m)"
              value={metrics!.mesopelagicRmse.toFixed(3)}
              unit="°C"
              description="Deep zone — harder to reconstruct from surface"
              color={metrics!.mesopelagicRmse < 0.8 ? 'text-emerald-400' : 'text-amber-400'}
            />
          </div>
        </div>
      )}

      {hasMatch && !hasMetrics && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-ocean-900/50 border border-ocean-800 rounded p-3">
          <Info size={13} />
          <span>Insufficient co-located depth levels to compute validation metrics (minimum 3 required).</span>
        </div>
      )}

      {/* Scientific context */}
      <div className="bg-ocean-900/60 border border-ocean-800 rounded-lg p-4 space-y-2 text-[11px] text-slate-500">
        <div className="font-semibold text-slate-400">Scientific Note on ARGO Validation</div>
        <p>
          ARGO float observations represent independent in-situ measurements of the real ocean state,
          spatially and temporally collocated with the model's selected point. RMSE/MAE/Bias metrics
          compare OceanEmbed prototype reconstruction against the physical ocean state, not against
          the GLORYS reanalysis (which is the training reference). A well-performing model should achieve
          RMSE &lt; 1°C in the epipelagic zone and &lt; 0.5°C in the deep ocean.
        </p>
        <p className="text-slate-600">
          ARGO salinity observations are not available in the supplied dataset. Salinity validation will be
          available when BGC-ARGO or full CTD data is ingested.
        </p>
      </div>
    </div>
  );
}
