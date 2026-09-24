import React from 'react';
import { SurfaceVariableMeta } from '../../types/ocean';
import { DatasetMetadata } from '../../data/adapter/DatasetAdapter';
import { SatelliteHarmonizationMatrix } from '../matrix/SatelliteHarmonizationMatrix';
import { SatelliteEmbeddingInspector } from '../engine/SatelliteEmbeddingInspector';
import { CheckCircle, FlaskConical, Clock, AlertCircle } from 'lucide-react';

interface MethodViewProps {
  availableVariables: SurfaceVariableMeta[];
  adapterMeta: DatasetMetadata;
}

type StageStatus = 'IMPLEMENTED' | 'PROTOTYPE' | 'PLANNED';

interface PipelineStage {
  step: number;
  name: string;
  status: StageStatus;
  description: string;
  detail: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    step: 1,
    name: 'Multi-Source Satellite Harmonization Pipeline',
    status: 'IMPLEMENTED',
    description: 'Ingest multi-source satellite products (OSTIA, SMAP, DUACS, OSCAR, CCMP/ASCAT) and standardize to 0.25° daily.',
    detail: 'Standardized spatial bounds: North Indian Ocean 5°N–30°N, 45°E–105°E. Area-weighted conservative regridding on SSS (0.125°) and bilinear on SST (0.05°).'
  },
  {
    step: 2,
    name: 'Surface Cloud-Gap & Feature Standardization',
    status: 'IMPLEMENTED',
    description: 'Standardize multimodal surface fields to 0.25° × 0.25° daily grid with land masking.',
    detail: 'Resampled to 0.25° grid covering Northern Indian Ocean. 81×160 grid, 9328 ocean cells identified via null masking.'
  },
  {
    step: 3,
    name: 'Satellite Embedding Engine (ViT / CNN / FNO / GNN)',
    status: 'PROTOTYPE',
    description: 'Extract compact latent representation (16-D / 32-D) from multimodal surface observation tensor [B, 5, H, W].',
    detail: 'Prototype: Deterministic 16-D vector derived from surface physical proxies (thermal heave, haline stratification, geostrophic shear). Production: Vision Transformer (ViT-Patch16) or Fourier Neural Operator (FNO-2D).'
  },
  {
    step: 4,
    name: 'Depth-Conditioned Continuous Decoder',
    status: 'PROTOTYPE',
    description: 'Decode latent embedding to 15-depth temperature and salinity profiles.',
    detail: 'Hypernetwork / depth-conditional MLP decoder mapping continuous depth z ∈ [0, 1000m] into T(z) and S(z). Target depths: 0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000m.'
  },
  {
    step: 5,
    name: 'UNESCO EOS-80 Density Computation',
    status: 'IMPLEMENTED',
    description: 'Compute in-situ seawater density at every reconstructed depth level.',
    detail: 'Full UNESCO 1983 EOS-80 formulation with Saunders (1981) depth-to-pressure approximation (pDbar = 0.1005·z). Verified: S=35, T=20, P=0 → 1024.76 kg/m³.'
  },
  {
    step: 6,
    name: 'Brunt–Väisälä Stability & Physics Loss Check',
    status: 'IMPLEMENTED',
    description: 'Evaluate N² static stability across all 14 inter-depth layers.',
    detail: 'N² = −(g/ρ)·(dρ/dz) computed per layer. Stability criterion: N² ≥ −1×10⁻⁶ s⁻² (tolerance for numerical noise). Convective inversions penalized via PINN loss term.'
  },
  {
    step: 7,
    name: 'Physics Consistency Report',
    status: 'IMPLEMENTED',
    description: 'Summarize physical realism with labeled status badge.',
    detail: 'StatusBadge: "✓ Stable" or "⚠ Review Required" — not a guarantee of physical correctness but a prototype consistency check. Reports min/max N², mean density gradient, inversion depths.'
  },
  {
    step: 8,
    name: 'Probabilistic Uncertainty (MC-Dropout / Ensemble)',
    status: 'PLANNED',
    description: 'Calibrated 1σ/2σ confidence bounds on reconstructed T and S profiles.',
    detail: 'Current: "Uncertainty model not calibrated" — no fabricated intervals displayed. Production: MC-Dropout (Gal & Ghahramani 2016) or Deep Ensemble uncertainty quantification trained with GLORYS holdout sets.'
  },
  {
    step: 9,
    name: 'INCOIS LAS & ARGO Observational Validation',
    status: 'IMPLEMENTED',
    description: 'Co-locate ARGO profiles with reconstruction and compute live metrics.',
    detail: 'Haversine nearest-neighbor search (max 350 km) against 120 in-situ ARGO profiling floats and INCOIS Live Access Server (LAS) gridded ARGO climatology. Live RMSE, MAE, Bias, Pearson r computed from actual profile arrays.'
  },
  {
    step: 10,
    name: 'Model Backend (PyTorch / ONNX / API)',
    status: 'PLANNED',
    description: 'Swap in trained neural network weights without frontend modifications.',
    detail: 'OceanEmbedModelInterface abstraction layer ready. When a trained FNO/MAE model is available (PyTorch checkpoint or ONNX Runtime), replace PrototypeOceanEmbedModel with a concrete implementation.'
  },
];

function StatusBadge({ status }: { status: StageStatus }) {
  const config = {
    IMPLEMENTED: { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: <CheckCircle size={11} /> },
    PROTOTYPE:   { color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',   icon: <FlaskConical size={11} /> },
    PLANNED:     { color: 'text-slate-500 border-slate-600/30 bg-slate-800/30',     icon: <Clock size={11} /> },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
}

export function MethodView({ availableVariables, adapterMeta }: MethodViewProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide">Methodology & Technical Architecture</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          SIH26066 Architecture: Multi-Source Satellite Harmonization → Satellite Embedding Engine → 15-Depth Physical Reconstruction
        </p>
      </div>

      {/* 1. Official Multi-Source Satellite Harmonization Matrix */}
      <SatelliteHarmonizationMatrix />

      {/* 2. Satellite Embedding & Deep Learning Engine Inspector */}
      <SatelliteEmbeddingInspector />

      {/* 3. Scientific Data Flow */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-5 overflow-x-auto shadow-lg">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3">
          End-to-End Computational Data Flow
        </div>
        <div className="flex items-center gap-0 text-[11px] font-mono text-slate-400 whitespace-nowrap min-w-max">
          {[
            { label: 'Multi-Satellite\nInputs (OSTIA, SMAP…)', color: 'text-cyan-400' },
            { label: '+', isOp: true },
            { label: 'GLORYS Target\n+ ARGO Ground Truth', color: 'text-amber-400' },
            { label: '→', isOp: true },
            { label: '0.25° Daily\nHarmonization', color: 'text-slate-300' },
            { label: '→', isOp: true },
            { label: 'Satellite Embedding\n(ViT / CNN / FNO)', color: 'text-cyan-400' },
            { label: '→', isOp: true },
            { label: 'Depth Decoder\n(15 Standard Levels)', color: 'text-cyan-400' },
            { label: '→', isOp: true },
            { label: 'UNESCO EOS-80\nPhysics Check', color: 'text-emerald-400' },
            { label: '→', isOp: true },
            { label: 'INCOIS LAS\nValidation Suite', color: 'text-amber-400' },
          ].map((item, i) => (
            <div key={i} className={`${item.isOp ? 'px-3 text-ocean-600 text-base' : 'px-3 py-1.5 bg-ocean-950 border border-ocean-800 rounded text-center leading-tight'} ${item.color ?? ''}`}>
              {item.label?.split('\n').map((l, li) => <div key={li}>{l}</div>)}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Pipeline stages */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">10-Stage Processing Pipeline</div>
        {PIPELINE_STAGES.map(stage => (
          <div key={stage.step} className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-2 shadow">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-mono text-cyan-400 font-bold w-6 shrink-0">#{stage.step}</span>
              <span className="text-sm font-semibold text-slate-200">{stage.name}</span>
              <StatusBadge status={stage.status} />
            </div>
            <p className="text-xs text-slate-300 ml-9">{stage.description}</p>
            <p className="text-[11px] text-slate-400 ml-9 leading-relaxed">{stage.detail}</p>
          </div>
        ))}
      </div>

      {/* 5. Dataset status */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-3 shadow">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">GLORYS12V1 Reference Status</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono">
          <div className="space-y-2">
            <div className="text-slate-300 font-semibold">GLORYS12V1 Multi-Year Reanalysis</div>
            <div className="space-y-1 text-slate-400">
              <div>Product: {adapterMeta.productId}</div>
              <div>Dataset: {adapterMeta.datasetId}</div>
              <div>Resolution: {adapterMeta.resolution}</div>
              <div>Cadence: {adapterMeta.cadence}</div>
              <div>Ocean cells: {adapterMeta.totalOceanCells.toLocaleString()} / {adapterMeta.totalGridCells.toLocaleString()} ({adapterMeta.coveragePercent}%)</div>
              <div className="text-slate-500">DOI: {adapterMeta.doi}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-slate-300 font-semibold">Variable Availability in Local GLORYS File</div>
            <div className="space-y-1">
              {availableVariables.map(v => (
                <div key={v.key} className="flex items-center justify-between">
                  <span className="text-slate-400">{v.fullName}</span>
                  {v.availableInGlorys ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Ingested</span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-1"><AlertCircle size={10} /> External satellite stream required</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Scientific limitations & citations */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-4 space-y-3 shadow text-[11px]">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">Scientific Limitations & Integrity</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400">
          {[
            'Prototype labels are explicitly preserved. Model abstraction layer ready for trained PyTorch/ONNX weights.',
            'Target depths strictly observe the 15 levels: (0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000m).',
            'Wind U/V fields require CCMP/ASCAT atmospheric scatterometer streams; unavailable in oceanic physics GLORYS file.',
            'ARGO in-situ validation uses 120 independent floats from the INCOIS/Coriolis network with zero data leakage.',
            'Density is computed using UNESCO EOS-80 with Saunders (1981) pressure conversion and Brunt-Väisälä N² stability.',
          ].map((limitation, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle size={11} className="text-slate-500 mt-0.5 shrink-0" />
              <span>{limitation}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-ocean-800 text-[10px] font-mono text-slate-500 space-y-0.5">
          <div>• OSTIA: doi:10.48670/moi-00168 · SMAP: doi:10.48670/moi-00051 · DUACS: doi:10.48670/moi-00145</div>
          <div>• GLORYS12V1: Copernicus Marine, doi:10.48670/moi-00021 · INCOIS LAS: las.incois.gov.in</div>
        </div>
      </div>
    </div>
  );
}
