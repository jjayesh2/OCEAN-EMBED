import { VolumetricOcean3D } from '../3d/VolumetricOcean3D';
import { CycloneHeatIntelligence } from '../analytics/CycloneHeatIntelligence';
import { MarineHeatwaveIntelligence } from '../analytics/MarineHeatwaveIntelligence';
import { AlertCircle, Info, Box, BarChart2, Flame, Compass, Sparkles } from 'lucide-react';

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
  const W = 240, H = 360;
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

  // Y-axis depth labels
  const depthTicks = [0, 100, 200, 300, 500, 700, 1000];
  const nTicks = 4;
  const tickStep = (maxV - minV) / (nTicks - 1);
  const xTicks = Array.from({ length: nTicks }, (_, i) => minV + i * tickStep);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#334155" strokeWidth={0.8} />
      <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="#334155" strokeWidth={0.8} />

      {depthTicks.map(d => {
        const y = toY(d);
        return (
          <g key={d}>
            <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#1e293b" strokeWidth={0.5} />
            <text x={PAD.left - 4} y={y + 4} fill="#64748b" fontSize={9} textAnchor="end">{d}m</text>
          </g>
        );
      })}

      {xTicks.map((v, i) => {
        const x = toX(v);
        return (
          <g key={i}>
            <line x1={x} y1={PAD.top + plotH} x2={x} y2={PAD.top + plotH + 3} stroke="#334155" strokeWidth={0.8} />
            <text x={x} y={PAD.top + plotH + 12} fill="#64748b" fontSize={9} textAnchor="middle">{v.toFixed(1)}</text>
          </g>
        );
      })}

      <text x={W / 2} y={14} fill="#94a3b8" fontSize={10} textAnchor="middle" fontWeight="600">{title} ({unit})</text>

      {glorysPath && (
        <path d={glorysPath} fill="none" stroke="#64748b" strokeWidth={1.4} strokeDasharray="4 3" />
      )}

      {reconPath && (
        <path d={reconPath} fill="none" stroke="#22d3ee" strokeWidth={2} />
      )}

      {argoObs.map((v, i) => {
        if (v === null || v === undefined) return null;
        return (
          <circle key={i} cx={toX(v)} cy={toY(depths[i])} r={3} fill="#f59e0b" stroke="#030814" strokeWidth={0.8} />
        );
      })}
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
      {[0.33, 0.66, 1.0].map(f => (
        <circle key={f} cx={cx} cy={cy} r={r * f} fill="none" stroke="#1e3e70" strokeWidth={0.6} />
      ))}
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
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'all'>('3d');

  if (!inferenceResult || isRunning) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
        <div className="text-slate-400 text-sm">
          {isRunning ? 'Rendering 3D Subsurface Ocean Reconstruction…' : 'Select a location on the Ocean Monitor to inspect.'}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* ── Title bar with View Switcher ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-ocean-900 border border-ocean-700/80 rounded-xl p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-wide">3D Subsurface Ocean Reconstruction</h2>
            <span className="text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded">
              0–1000m Depth
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {ss.lat.toFixed(2)}°N, {ss.lon.toFixed(2)}°E · {ss.region} · {ss.date} · Inference: {executionTimeMs}ms
          </p>
        </div>

        {/* View Mode Toggle: 3D Model vs 2D Charts vs All */}
        <div className="flex items-center gap-2 bg-ocean-950 border border-ocean-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box size={14} />
            <span>3D Model View</span>
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
              viewMode === '2d'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 size={14} />
            <span>2D Curves</span>
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Full Suite</span>
          </button>
        </div>
      </div>

      {/* ── Extreme Weather & Cyclone Heat Potential (TCHP) Intelligence ── */}
      <CycloneHeatIntelligence
        profile={profile}
        sst={surfaceState?.SST ?? 29.5}
        mld={surfaceState?.MLD}
      />

      {/* ── 3D VOLUMETRIC MODEL (Three.js Canvas) ── */}
      {(viewMode === '3d' || viewMode === 'all') && (
        <div className="space-y-2">
          <VolumetricOcean3D
            selectedLat={ss.lat}
            selectedLon={ss.lon}
            profile={profile}
            targetDepth={selectedDepth}
            onSelectDepth={onSelectDepth}
            sst={surfaceState?.SST ?? 29.5}
          />
        </div>
      )}

      {/* ── 2D Depth Profile Charts ── */}
      {(viewMode === '2d' || viewMode === 'all') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Temperature Profile Chart */}
          <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-ocean-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Temperature Stratification (0–1000m)</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Thermocline Focus
              </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
              <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-cyan-400 rounded" /><span className="text-slate-300">OceanEmbed 3D Recon</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-slate-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(to right, #64748b 0px, #64748b 4px, transparent 4px, transparent 7px)' }} /><span className="text-slate-400">GLORYS Reference</span></div>
              {hasArgo && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-amber-300">ARGO In-Situ</span></div>}
            </div>

            <div className="flex justify-center py-2">
              <DepthProfileChart profile={profile} field="temp" title="Temperature" unit="°C" />
            </div>
          </div>

          {/* Salinity Profile Chart */}
          <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-ocean-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Salinity Profile (0–1000m)</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Halocline Focus
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
              <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-cyan-400 rounded" /><span className="text-slate-300">OceanEmbed 3D Recon</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-slate-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(to right, #64748b 0px, #64748b 4px, transparent 4px, transparent 7px)' }} /><span className="text-slate-400">GLORYS Reference</span></div>
            </div>

            <div className="flex justify-center py-2">
              <DepthProfileChart profile={profile} field="salinity" title="Salinity" unit="PSU" />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <AlertCircle size={11} />
              <span>ARGO salinity sensor not available in supplied dataset. Evaluated against GLORYS reference.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 15-Depth Data Table ── */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-xl overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ocean-800 bg-ocean-950/60">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">15-Depth Telemetry Table</span>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-500">Sort:</span>
            <button
              onClick={() => setTableSort('depth')}
              className={`px-2 py-0.5 rounded ${tableSort === 'depth' ? 'text-cyan-400 bg-ocean-800 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Depth
            </button>
            <button
              onClick={() => setTableSort('diff')}
              className={`px-2 py-0.5 rounded ${tableSort === 'diff' ? 'text-cyan-400 bg-ocean-800 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              |ΔT|
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-ocean-800 text-slate-400 text-[11px] bg-ocean-950/40">
                <th className="text-left px-4 py-2.5">Depth (m)</th>
                <th className="text-right px-3 py-2.5">P (dbar)</th>
                <th className="text-right px-3 py-2.5 text-cyan-400 font-bold">Recon T °C</th>
                <th className="text-right px-3 py-2.5 text-slate-300">GLORYS T °C</th>
                <th className="text-right px-3 py-2.5 text-amber-300">ARGO T °C</th>
                <th className="text-right px-3 py-2.5 text-cyan-400 font-bold">Recon S PSU</th>
                <th className="text-right px-3 py-2.5 text-slate-300">GLORYS S PSU</th>
                <th className="text-right px-3 py-2.5">ΔT vs GLORYS</th>
                <th className="text-right px-3 py-2.5">N² (s⁻²)</th>
                <th className="text-center px-3 py-2.5">Stable</th>
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
                      ${isSelected ? 'bg-cyan-500/15 border-l-2 border-l-cyan-400' : i % 2 === 0 ? 'bg-ocean-900' : 'bg-ocean-900/50'}
                      hover:bg-ocean-800/60`}
                  >
                    <td className="px-4 py-1.5 text-slate-200 font-bold">{pt.depth}</td>
                    <td className="px-3 py-1.5 text-right text-slate-500">{pt.pressureDbar.toFixed(1)}</td>
                    <td className="px-3 py-1.5 text-right text-cyan-300 font-semibold">{pt.reconstructedTemp.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-slate-300">{pt.glorysRefTemp.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-amber-300">
                      {pt.argoObservedTemp !== null && pt.argoObservedTemp !== undefined
                        ? pt.argoObservedTemp.toFixed(2)
                        : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right text-cyan-300 font-semibold">{pt.reconstructedSalinity.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-slate-300">{pt.glorysRefSalinity.toFixed(2)}</td>
                    <td className={`px-3 py-1.5 text-right font-semibold
                      ${Math.abs(pt.tempDiffAgainstGlorys) > 1.5 ? 'text-red-400' :
                        Math.abs(pt.tempDiffAgainstGlorys) > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {pt.tempDiffAgainstGlorys > 0 ? '+' : ''}{pt.tempDiffAgainstGlorys.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-slate-400">
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
        <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Physics Consistency</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              physicsReport.overallStable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {physicsReport.statusBadge}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">{physicsReport.statusExplanation}</p>

          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="bg-ocean-950/70 border border-ocean-800 rounded p-2.5">
              <div className="text-slate-500">Min N² (Buoyancy)</div>
              <div className="text-cyan-300 font-semibold">{physicsReport.minN2.toExponential(2)} s⁻²</div>
            </div>
            <div className="bg-ocean-950/70 border border-ocean-800 rounded p-2.5">
              <div className="text-slate-500">Max N²</div>
              <div className="text-cyan-300 font-semibold">{physicsReport.maxN2.toExponential(2)} s⁻²</div>
            </div>
            <div className="bg-ocean-950/70 border border-ocean-800 rounded p-2.5">
              <div className="text-slate-500">Inversions Detected</div>
              <div className="text-white font-semibold">{physicsReport.convectiveInversionCount}</div>
            </div>
            <div className="bg-ocean-950/70 border border-ocean-800 rounded p-2.5">
              <div className="text-slate-500">Density Gradient ⟨dρ/dz⟩</div>
              <div className="text-white font-semibold">{physicsReport.meanDensityGradient.toFixed(4)} kg/m⁴</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">{physicsReport.formulationCitation}</div>
        </div>

        {/* Ocean Embedding Radar */}
        <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">16-D Latent Ocean Embedding</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              dim=16
            </span>
          </div>

          <div className="flex items-center gap-4">
            <EmbeddingViz vector={embedding.vector} />
            <div className="space-y-1.5 text-[11px] font-mono flex-1">
              <div className="flex justify-between border-b border-ocean-800/60 pb-1">
                <span className="text-slate-400">Mode:</span>
                <span className="text-amber-400">{embedding.mode}</span>
              </div>
              <div className="flex justify-between border-b border-ocean-800/60 pb-1">
                <span className="text-slate-400">Vector Norm ‖v‖:</span>
                <span className="text-white font-bold">{embedding.norm}</span>
              </div>
              <div className="flex justify-between border-b border-ocean-800/60 pb-1">
                <span className="text-slate-400">Thermal Heave:</span>
                <span className="text-cyan-300 font-semibold">{embedding.thermalHeaveProxy}</span>
              </div>
              <div className="flex justify-between border-b border-ocean-800/60 pb-1">
                <span className="text-slate-400">Haline Stratification:</span>
                <span className="text-cyan-300 font-semibold">{embedding.halineStratificationProxy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Geostrophic Shear:</span>
                <span className="text-cyan-300 font-semibold">{embedding.geostrophicShearProxy}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
            <Info size={11} className="mt-0.5 shrink-0" />
            <span>Deterministic surface proxy representation. Production architecture swaps this with trained MAE/FNO weights.</span>
          </div>
        </div>
      </div>

      {/* Uncertainty Notice */}
      <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3.5 py-2.5 text-xs text-slate-400">
        <AlertCircle size={14} className="text-slate-500 shrink-0" />
        <span>
          <span className="font-semibold text-slate-300">Uncertainty Status:</span> {uncertainty.statusText}.
          Full $1\sigma / 2\sigma$ confidence bands will be calibrated using Monte Carlo Dropout once model training is completed.
        </span>
      </div>
    </div>
  );
}
