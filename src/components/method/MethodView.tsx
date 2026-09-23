import React from 'react';
import { SurfaceVariableMeta } from '../../types/ocean';
import { DatasetMetadata } from '../../data/adapter/DatasetAdapter';
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
    name: 'Multi-Source Data Ingestion',
    status: 'IMPLEMENTED',
    description: 'Ingest real GLORYS12V1 NetCDF surface fields and ARGO float profiles.',
    detail: 'GLORYS12V1 (thetao, so, zos, uo, vo, mlotst) extracted from HDF5-backed NetCDF4. ARGO profiles from INCOIS/Coriolis network. Wind U/V: not available in supplied GLORYS file — requires atmospheric scatterometer/ERA5.'
  },
  {
    step: 2,
    name: 'Surface Feature Harmonization',
    status: 'IMPLEMENTED',
    description: 'Standardize surface fields to 0.25° × 0.25° daily grid.',
    detail: 'Native GLORYS resolution 0.083° → resampled to 0.25° grid covering Northern Indian Ocean (5°N–25°N, 55°E–95°E). 81×160 grid, 9328 ocean cells identified via null masking.'
  },
  {
    step: 3,
    name: 'Ocean Encoder / Feature Extraction',
    status: 'PROTOTYPE',
    description: 'Extract compact latent representation from multimodal surface observations.',
    detail: 'Prototype: Deterministic 16-D vector derived from surface proxies (thermal heave, haline stratification, geostrophic shear). Production: Masked Autoencoder (MAE) or Fourier Neural Operator (FNO) encoder trained on GLORYS pairs.'
  },
  {
    step: 4,
    name: 'Depth-Conditioned Decoder',
    status: 'PROTOTYPE',
    description: 'Decode latent embedding to 15-depth temperature and salinity profiles.',
    detail: 'Prototype: Sigmoid-based thermocline/halocline model with embedding perturbation. Production: Hypernetwork / depth-conditional MLP decoder (analogous to NeRF depth conditioning). Target depths: 0–1000 m (15 levels).'
  },
  {
    step: 5,
    name: 'UNESCO EOS-80 Density Computation',
    status: 'IMPLEMENTED',
    description: 'Compute in-situ seawater density at every reconstructed depth level.',
    detail: 'Full UNESCO 1983 EOS-80 formulation with Saunders (1981) depth-to-pressure approximation (pDbar = 0.1005·z). Density from pure water polynomial, seawater correction, and secant bulk modulus at pressure. Verified: S=35, T=20, P=0 → 1024.76 kg/m³.'
  },
  {
    step: 6,
    name: 'Brunt–Väisälä Stability Check',
    status: 'IMPLEMENTED',
    description: 'Evaluate N² static stability across all 14 inter-depth layers.',
    detail: 'N² = −(g/ρ)·(dρ/dz) computed per layer. Stability criterion: N² ≥ −1×10⁻⁶ s⁻² (tolerance for numerical noise). Inversions flagged with depth annotation. Convention: depth positive downward.'
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
    name: 'Probabilistic Uncertainty',
    status: 'PLANNED',
    description: 'Calibrated 1σ/2σ confidence bounds on reconstructed T and S profiles.',
    detail: 'Current: "Uncertainty model not calibrated" — no fabricated intervals displayed. Production: MC-Dropout (Gal & Ghahramani 2016) or Deep Ensemble uncertainty quantification trained with GLORYS holdout sets.'
  },
  {
    step: 9,
    name: 'ARGO Observational Validation',
    status: 'IMPLEMENTED',
    description: 'Co-locate ARGO profiles with reconstruction and compute live metrics.',
    detail: 'Haversine nearest-neighbor search (max 350 km). Live RMSE, MAE, Bias, Pearson r computed from actual profile arrays — no hardcoded values. 120 ARGO floats indexed (Apr–Jun 2026). ARGO salinity: not available in supplied dataset.'
  },
  {
    step: 10,
    name: 'Model Backend (PyTorch / ONNX / API)',
    status: 'PLANNED',
    description: 'Swap in trained neural network weights without frontend modifications.',
    detail: 'OceanEmbedModelInterface abstraction layer ready. When a trained FNO/MAE model is available (PyTorch checkpoint or ONNX Runtime), replace PrototypeOceanEmbedModel with a concrete implementation. REST API adapter also supported.'
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
        <h2 className="text-base font-semibold text-white">Method & Technical Pipeline</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          10-stage processing pipeline — implementation status and scientific documentation
        </p>
      </div>

      {/* Architecture diagram */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 overflow-x-auto">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
          Scientific Data Flow
        </div>
        <div className="flex items-center gap-0 text-[11px] font-mono text-slate-500 whitespace-nowrap min-w-max">
          {[
            { label: 'GLORYS12V1\nSurface Fields', color: 'text-cyan-400' },
            { label: '+', isOp: true },
            { label: 'ARGO\nIn-Situ Profiles', color: 'text-amber-400' },
            { label: '→', isOp: true },
            { label: 'Surface\nFeatures', color: 'text-slate-300' },
            { label: '→', isOp: true },
            { label: 'OceanEmbed\nInference', color: 'text-cyan-400' },
            { label: '→', isOp: true },
            { label: 'Recon T+S\n(Prototype)', color: 'text-cyan-400' },
            { label: '→', isOp: true },
            { label: 'Compare\nvs GLORYS Ref', color: 'text-slate-300' },
            { label: '→', isOp: true },
            { label: 'ARGO\nValidation', color: 'text-amber-400' },
          ].map((item, i) => (
            <div key={i} className={`${item.isOp ? 'px-3 text-ocean-600 text-base' : 'px-3 py-1.5 bg-ocean-800 border border-ocean-700 rounded text-center leading-tight'} ${item.color ?? ''}`}>
              {item.label?.split('\n').map((l, li) => <div key={li}>{l}</div>)}
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Pipeline Stages</div>
        {PIPELINE_STAGES.map(stage => (
          <div key={stage.step} className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-mono text-slate-600 w-6 shrink-0">#{stage.step}</span>
              <span className="text-sm font-semibold text-slate-200">{stage.name}</span>
              <StatusBadge status={stage.status} />
            </div>
            <p className="text-xs text-slate-400 ml-9">{stage.description}</p>
            <p className="text-[11px] text-slate-600 ml-9 leading-relaxed">{stage.detail}</p>
          </div>
        ))}
      </div>

      {/* Dataset status */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Dataset Status</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono">
          <div className="space-y-2">
            <div className="text-slate-400 font-semibold">GLORYS12V1 (Primary)</div>
            <div className="space-y-1 text-slate-500">
              <div>Product: {adapterMeta.productId}</div>
              <div>Dataset: {adapterMeta.datasetId}</div>
              <div>Resolution: {adapterMeta.resolution}</div>
              <div>Cadence: {adapterMeta.cadence}</div>
              <div>Ocean cells: {adapterMeta.totalOceanCells.toLocaleString()} / {adapterMeta.totalGridCells.toLocaleString()} ({adapterMeta.coveragePercent}%)</div>
              <div className="text-slate-600">DOI: {adapterMeta.doi}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-slate-400 font-semibold">Variable Availability</div>
            <div className="space-y-1">
              {availableVariables.map(v => (
                <div key={v.key} className="flex items-center justify-between">
                  <span className="text-slate-500">{v.fullName}</span>
                  {v.availableInGlorys ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Available</span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1"><AlertCircle size={10} /> Not in dataset</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ablation experiments */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-2">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Ablation Experiments</div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-ocean-800/40 border border-ocean-800 rounded px-3 py-2">
          <FlaskConical size={12} className="text-slate-600 shrink-0" />
          <span>
            Ablation experiment results have not yet been run. Quantitative ablation (SST-only, SST+SSH, SST+SSH+SSS, full inputs)
            will be available after the prototype model is trained on GLORYS pairs. Displaying fabricated ablation numbers is explicitly prohibited.
          </span>
        </div>
      </div>

      {/* Scientific limitations */}
      <div className="bg-ocean-900 border border-ocean-700 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Scientific Limitations</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-500">
          {[
            'This is a prototype reconstruction, not a trained neural network. No real weights or learned features are used.',
            'GLORYS12V1 supplied file contains a single time snapshot (2026-06-23) at surface depth only. Multi-depth reanalysis profiling requires full GLORYS product.',
            'Wind U/V are absent from the supplied GLORYS file. Ocean physics reanalysis does not include atmospheric forcing fields.',
            'ARGO salinity is not available in the supplied dataset. Salinity validation requires BGC-ARGO or full CTD profiles.',
            'Uncertainty quantification is uncalibrated. No confidence intervals are displayed.',
            'The reference profile model (thermocline sigmoid) is a physically motivated approximation, not a GLORYS depth-resolved extraction.',
          ].map((limitation, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle size={11} className="text-slate-600 mt-0.5 shrink-0" />
              <span>{limitation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Citations */}
      <div className="text-[11px] font-mono text-slate-600 space-y-1">
        <div>• GLORYS12V1: Copernicus Marine, doi:10.48670/moi-00021 (MERCATOR OCEAN)</div>
        <div>• UNESCO 1983: Algorithms for computation of fundamental properties of seawater. UNESCO Tech. Papers Marine Sci. 44.</div>
        <div>• Saunders 1981: Practical conversion of pressure to depth. J. Phys. Oceanogr., 11, 573–574.</div>
        <div>• ARGO: INCOIS/Coriolis/JCOMMOPS Global ARGO Programme, <a href="https://argo.ucsd.edu" className="text-slate-500 underline" target="_blank" rel="noopener noreferrer">argo.ucsd.edu</a></div>
      </div>
    </div>
  );
}
