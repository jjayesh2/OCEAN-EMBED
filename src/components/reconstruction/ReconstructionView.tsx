import React, { useState } from 'react';
import { ModelInferencePackage, OceanSurfaceState, StandardDepth, STANDARD_DEPTHS, ThermohalineDepthPoint } from '../../types/ocean';
import { AlertCircle, Info } from 'lucide-react';

interface ReconstructionViewProps {
  inferenceResult: ModelInferencePackage | null;
  surfaceState: OceanSurfaceState | null;
  selectedDepth: StandardDepth;
  onSelectDepth: (d: StandardDepth) => void;
  isRunning: boolean;
}

// ── SVG Depth Profile Chart ──────────────────────────────────────────────────
function DepthProfileChart({
  profile,
  field,
  title,
  unit,
}: {
  profile: ThermohalineDepthPoint[];
  field: 'temp' | 'salinity';
  title: string;
  unit: string;
}) {
  const W = 240, H = 380;
  const PAD = { top: 24, right: 16, bottom: 32, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxDepth = 1000;

  const recon = profile.map(p => field === 'temp' ? p.reconstructedTemp : p.reconstructedSalinity);
  const glorys = profile.map(p => field === 'temp' ? p.glorysRefTemp : p.glorysRefSalinity);
  const argoObs = profile.map(p => field === 'temp' ? p.argoObservedTemp : null);
  const depths = profile.map(p => p.depth);

  const allVals = [...recon, ...glorys].filter(v => v !== null && v !== undefined) as number[];
  const minV = Math.min(...allVals) - 0.5;
  const maxV = Math.max(...allVals) + 0.5;

  const toX = (v: number) => PAD.left + ((v - minV) / (maxV - minV)) * plotW;
  const toY = (d: number) => PAD.top + (d / maxDepth) * plotH;

  const makePath = (vals: (number | null | undefined)[], ds: number[]) => {
    const pts = vals
      .map((v, i) => (v !== null && v !== undefined ? `${toX(v)},${toY(ds[i])}` : null))
      .filter(Boolean);
    if (pts.length < 2) return '';
    return 'M ' + pts.join(' L ');
  };

  const reconPath = makePath(recon, depths);
  const glorysPath = makePath(glorys, depths);
  const argoPath = makePath(argoObs, depths);

  // Y-axis depth labels
  const depthTicks = [0, 100, 200, 300, 500, 700, 1000];
  // X-axis value ticks
  const nTicks = 4;
  const tickStep = (maxV - minV) / (nTicks - 1);
  const xTicks = Array.from({ length: nTicks }, (_, i) => minV + i * tickStep);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#334155" strokeWidth={0.8} />
      <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="#334155" strokeWidth={0.8} />

      {/* Depth grid lines + labels */}
      {depthTicks.map(d => {
        const y = toY(d);
        return (
          <g key={d}>
            <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#1e293b" strokeWidth={0.5} />
            <text x={PAD.left - 4} y={y + 4} fill="#64748b" fontSize={9} textAnchor="end">{d}m</text>
          </g>
        );
      })}

      {/* X-axis ticks */}
      {xTicks.map((v, i) => {
        const x = toX(v);
        return (
          <g key={i}>
            <line x1={x} y1={PAD.top + plotH} x2={x} y2={PAD.top + plotH + 3} stroke="#334155" strokeWidth={0.8} />
            <text x={x} y={PAD.top + plotH + 12} fill="#64748b" fontSize={9} textAnchor="middle">{v.toFixed(1)}</text>
          </g>
        );
      })}

      {/* Chart title */}
      <text x={W / 2} y={14} fill="#94a3b8" fontSize={10} textAnchor="middle" fontWeight="600">{title} ({unit})</text>

      {/* GLORYS Reference line (dashed slate) */}
      {glorysPath && (
        <path d={glorysPath} fill="none" stroke="#64748b" strokeWidth={1.4} strokeDasharray="4 3" />
      )}

      {/* OceanEmbed Reconstruction (solid cyan) */}
      {reconPath && (
        <path d={reconPath} fill="none" stroke="#22d3ee" strokeWidth={2} />
      )}

      {/* ARGO observation dots (amber) */}
      {argoObs.map((v, i) => {
        if (v === null || v === undefined) return null;
        return (
          <circle key={i} cx={toX(v)} cy={toY(depths[i])} r={3} fill="#f59e0b" stroke="#030814" strokeWidth={0.8} />
        );
      })}

      {/* Depth indicator dot on reconstruction curve */}
    </svg>
  );
}

// ── Embedding radar mini-visualization ──────────────────────────────────────
function EmbeddingViz({ vector }: { vector: number[] }) {
  const cx = 60, cy = 60, r = 45;
  const n = Math.min(vector.length, 16);
  const pts = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const mag = (Math.abs(vector[i]) / 1.0) * r;
    return {
      x: cx + Math.cos(angle) * Math.min(mag, r),
      y: cy + Math.sin(angle) * Math.min(mag, r),
    };
  });
  const pStr = pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={120} height={120} className="opacity-80">
      {/* Background rings */}
      {[0.33, 0.66, 1.0].map(f => (
        <circle key={f} cx={cx} cy={cy} r={r * f} fill="none" stroke="#1e3e70" strokeWidth={0.6} />
      ))}
      {/* Radar spokes */}
      {Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(angle) * r}
            y2={cy + Math.sin(angle) * r}
            stroke="#1e3e70" strokeWidth={0.5}
          />
        );
      })}
      <polygon points={pStr} fill="#22d3ee20" stroke="#22d3ee" strokeWidth={1.2} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.8} fill="#22d3ee" />
      ))}
    </svg>
  );
}

export function ReconstructionView({
  inferenceResult,
  surfaceState,
  selectedDepth,
  onSelectDepth,
  isRunning,
}: ReconstructionViewProps) {
  const [tableSort, setTableSort] = useState<'depth' | 'diff'>('depth');

  if (!inferenceResult || isRunning) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
        <div className="text-slate-500 text-sm">
          {isRunning ? 'Running OceanEmbed prototype inference…' : 'Select a location on the Ocean Monitor to run reconstruction.'}
        </div>
      </div>
    );
  }

  const { profile, physicsReport, uncertainty, embedding, argoMatch, inferenceType, glorysCitation, executionTimeMs, surfaceState: ss } = inferenceResult;
  const hasArgo = argoMatch !== null && argoMatch !== undefined;

  const sortedProfile = [...profile].sort(tableSort === 'diff'
    ? (a, b) => Math.abs(b.tempDiffAgainstGlorys) - Math.abs(a.tempDiffAgainstGlorys)
    : (a, b) => a.depth - b.depth
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* ── Title bar ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Subsurface Reconstruction</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {ss.lat.toFixed(2)}°N, {ss.lon.toFixed(2)}°E · {ss.date} · {executionTimeMs}ms
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-1 rounded">
            {inferenceType}
          </span>
          <span className={`text-[11px] font-mono px-2 py-1 rounded border ${
            physicsReport.overallStable
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {physicsReport.statusBadge}
          </span>
        </div>
      </div>

      {/* ── Uncertainty notice ── */}
      <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 rounded px-3 py-2">
        <AlertCircle size={13} className="text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Uncertainty:</span> {uncertainty.statusText}.
          Confidence intervals will be available when a calibrated probabilistic model (MC-Dropout, Laplace approximation) is trained.
        </span>
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Temperature Profile Chart */}
        <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Temperature Profile (0–1000 m)</span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-cyan-400 rounded" /><span className="text-slate-400">OceanEmbed Prototype</span></div>
            <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-slate-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(to right, #64748b 0px, #64748b 4px, transparent 4px, transparent 7px)' }} /><span className="text-slate-400">GLORYS Reference</span></div>
            {hasArgo && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-slate-400">ARGO Observation</span></div>}
          </div>

          <div className="flex justify-center">
            <DepthProfileChart profile={profile} field="temp" title="Temperature" unit="°C" />
          </div>

          {!hasArgo && (
            <div className="text-[11px] text-slate-600 text-center">
              ARGO observation unavailable for this selection.
            </div>
          )}
        </div>

        {/* Salinity Profile Chart */}
        <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Salinity Profile (0–1000 m)</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-cyan-400 rounded" /><span className="text-slate-400">OceanEmbed Prototype</span></div>
            <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-slate-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(to right, #64748b 0px, #64748b 4px, transparent 4px, transparent 7px)' }} /><span className="text-slate-400">GLORYS Reference</span></div>
          </div>

          <div className="flex justify-center">
            <DepthProfileChart profile={profile} field="salinity" title="Salinity" unit="PSU" />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <AlertCircle size={10} />
            <span>ARGO salinity observation not available in supplied dataset.</span>
          </div>
        </div>
      </div>

      {/* ── Depth Data Table ── */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ocean-800">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">15-Depth Profile Table</span>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-500">Sort by:</span>
            <button
              onClick={() => setTableSort('depth')}
              className={`px-2 py-0.5 rounded ${tableSort === 'depth' ? 'text-cyan-400 bg-ocean-800' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Depth
            </button>
            <button
              onClick={() => setTableSort('diff')}
              className={`px-2 py-0.5 rounded ${tableSort === 'diff' ? 'text-cyan-400 bg-ocean-800' : 'text-slate-500 hover:text-slate-300'}`}
            >
              |ΔT|
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-ocean-800 text-slate-500 text-[11px]">
                <th className="text-left px-4 py-2">Depth (m)</th>
                <th className="text-right px-3 py-2">P (dbar)</th>
                <th className="text-right px-3 py-2 text-cyan-500">Recon T °C</th>
                <th className="text-right px-3 py-2 text-slate-400">GLORYS T °C</th>
                <th className="text-right px-3 py-2 text-amber-400">ARGO T °C</th>
                <th className="text-right px-3 py-2 text-cyan-500">Recon S PSU</th>
                <th className="text-right px-3 py-2 text-slate-400">GLORYS S PSU</th>
                <th className="text-right px-3 py-2">ΔT vs GLORYS</th>
                <th className="text-right px-3 py-2">N² (s⁻²)</th>
                <th className="text-center px-3 py-2">Stable</th>
              </tr>
            </thead>
            <tbody>
              {sortedProfile.map((pt, i) => {
                const isSelected = pt.depth === selectedDepth;
                return (
                  <tr
                    key={pt.depth}
                    onClick={() => onSelectDepth(pt.depth)}
                    className={`border-b border-ocean-800/50 cursor-pointer transition-colors
                      ${isSelected ? 'bg-ocean-800/60' : i % 2 === 0 ? 'bg-ocean-900' : 'bg-ocean-900/50'}
                      hover:bg-ocean-800/40`}
                  >
                    <td className="px-4 py-1.5 text-slate-300 font-semibold">{pt.depth}</td>
                    <td className="px-3 py-1.5 text-right text-slate-500">{pt.pressureDbar.toFixed(1)}</td>
                    <td className="px-3 py-1.5 text-right text-cyan-300">{pt.reconstructedTemp.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-slate-400">{pt.glorysRefTemp.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-amber-300">
                      {pt.argoObservedTemp !== null && pt.argoObservedTemp !== undefined
                        ? pt.argoObservedTemp.toFixed(2)
                        : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right text-cyan-300">{pt.reconstructedSalinity.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-slate-400">{pt.glorysRefSalinity.toFixed(2)}</td>
                    <td className={`px-3 py-1.5 text-right font-semibold
                      ${Math.abs(pt.tempDiffAgainstGlorys) > 1.5 ? 'text-red-400' :
                        Math.abs(pt.tempDiffAgainstGlorys) > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {pt.tempDiffAgainstGlorys > 0 ? '+' : ''}{pt.tempDiffAgainstGlorys.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-slate-500">
                      {pt.buoyancyFrequencyN2.toExponential(2)}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {pt.isStaticallyStable
                        ? <span className="text-emerald-400">✓</span>
                        : <span className="text-amber-400">⚠</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Physics Consistency + Embedding ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Physics Consistency */}
        <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Physics Consistency</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              physicsReport.overallStable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {physicsReport.statusBadge}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">{physicsReport.statusExplanation}</p>

          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="bg-ocean-800/60 rounded p-2 space-y-0.5">
              <div className="text-slate-500">Min N²</div>
              <div className="text-slate-300">{physicsReport.minN2.toExponential(2)} s⁻²</div>
            </div>
            <div className="bg-ocean-800/60 rounded p-2 space-y-0.5">
              <div className="text-slate-500">Max N²</div>
              <div className="text-slate-300">{physicsReport.maxN2.toExponential(2)} s⁻²</div>
            </div>
            <div className="bg-ocean-800/60 rounded p-2 space-y-0.5">
              <div className="text-slate-500">Inversions</div>
              <div className="text-slate-300">{physicsReport.convectiveInversionCount}</div>
            </div>
            <div className="bg-ocean-800/60 rounded p-2 space-y-0.5">
              <div className="text-slate-500">⟨dρ/dz⟩</div>
              <div className="text-slate-300">{physicsReport.meanDensityGradient.toFixed(4)} kg/m⁴</div>
            </div>
          </div>

          {physicsReport.inversionDepths.length > 0 && (
            <div className="text-[11px] text-amber-500">
              Potential inversions at: {physicsReport.inversionDepths.join('m, ')}m
            </div>
          )}

          <div className="text-[10px] text-slate-600 font-mono">{physicsReport.formulationCitation}</div>
        </div>

        {/* Ocean Embedding */}
        <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Ocean Latent Embedding</span>
            <span className="text-[10px] font-mono text-slate-600">dim={embedding.embeddingDim}</span>
          </div>

          <div className="flex items-center gap-4">
            <EmbeddingViz vector={embedding.vector} />
            <div className="space-y-2 text-[11px] font-mono flex-1">
              <div className="space-y-0.5">
                <div className="text-slate-500">Mode</div>
                <div className="text-amber-400">{embedding.mode}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-slate-500">‖v‖ (norm)</div>
                <div className="text-slate-300">{embedding.norm}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-slate-500">Thermal heave</div>
                <div className="text-slate-300">{embedding.thermalHeaveProxy}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-slate-500">Haline strat.</div>
                <div className="text-slate-300">{embedding.halineStratificationProxy}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-slate-500">Geostr. shear</div>
                <div className="text-slate-300">{embedding.geostrophicShearProxy}</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
            <Info size={11} className="mt-0.5 shrink-0" />
            <span>16-D deterministic prototype representation. A trained model produces learned embeddings via neural encoder.</span>
          </div>
        </div>
      </div>

      {/* Citation */}
      <div className="text-[11px] font-mono text-slate-600">
        Reference: {glorysCitation} · Physics: UNESCO EOS-80 (1983) density + Brunt–Väisälä N² stability
      </div>
    </div>
  );
}
