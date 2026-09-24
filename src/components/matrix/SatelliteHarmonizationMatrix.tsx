import React from 'react';
import { Satellite, ExternalLink, CheckCircle, Database, Layers, ArrowRight } from 'lucide-react';

interface DatasetRow {
  variable: string;
  symbol: string;
  product: string;
  nativeRes: string;
  targetRes: string;
  regriddingMethod: string;
  provider: string;
  doiOrUrl: string;
  status: 'ACTIVE_INGESTED' | 'STANDARDIZED' | 'EXTERNAL_API';
}

const DATASET_MATRIX: DatasetRow[] = [
  {
    variable: 'Sea Surface Temperature',
    symbol: 'SST',
    product: 'OSTIA Foundation SST',
    nativeRes: '0.05° Grid',
    targetRes: '0.25° × 0.25° Daily',
    regriddingMethod: 'Bilinear 2D spatial interpolation + cloud-gap mask',
    provider: 'Copernicus Marine (MOI)',
    doiOrUrl: 'https://doi.org/10.48670/moi-00168',
    status: 'ACTIVE_INGESTED',
  },
  {
    variable: 'Sea Surface Salinity',
    symbol: 'SSS',
    product: 'SMAP / SMOS L4 SSS',
    nativeRes: '0.125° Grid',
    targetRes: '0.25° × 0.25° Daily',
    regriddingMethod: 'Area-weighted conservative regridding',
    provider: 'Copernicus Marine / NASA JPL',
    doiOrUrl: 'https://doi.org/10.48670/moi-00051',
    status: 'ACTIVE_INGESTED',
  },
  {
    variable: 'Sea Surface Height / SLA',
    symbol: 'SSH / SLA',
    product: 'DUACS Multi-Mission Altimeter',
    nativeRes: '0.25° Grid',
    targetRes: '0.25° × 0.25° Daily',
    regriddingMethod: 'Native grid matching (L4 gridded sea level anomaly)',
    provider: 'Copernicus Marine (MOI)',
    doiOrUrl: 'https://doi.org/10.48670/moi-00145',
    status: 'ACTIVE_INGESTED',
  },
  {
    variable: 'Surface Ocean Currents (U, V)',
    symbol: 'Currents U, V',
    product: 'OSCAR L4 Ocean Surface Currents V2.0',
    nativeRes: '0.25° Grid',
    targetRes: '0.25° × 0.25° Daily',
    regriddingMethod: 'Geostrophic + Ekman current vector harmonization',
    provider: 'NASA PO.DAAC / JPL',
    doiOrUrl: 'https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_FINAL_V2.0',
    status: 'ACTIVE_INGESTED',
  },
  {
    variable: 'Surface 10m Winds (U, V)',
    symbol: 'Winds U, V',
    product: 'CCMP V3.1 & ASCAT-Coastal',
    nativeRes: '0.25° Grid',
    targetRes: '0.25° × 0.25° Daily',
    regriddingMethod: '6-hourly to daily diurnal vector averaging',
    provider: 'NASA PO.DAAC / EUMETSAT',
    doiOrUrl: 'https://podaac.jpl.nasa.gov/dataset/CCMP_WINDS_10M6HR_L4_V3.1',
    status: 'STANDARDIZED',
  },
  {
    variable: 'Subsurface Temperature (Target)',
    symbol: 'T(z) [15 depths]',
    product: 'GLORYS12V1 Global Ocean Reanalysis',
    nativeRes: '0.083° × 50 levels',
    targetRes: '0.25° × 15 standard depths',
    regriddingMethod: 'Vertical spline extraction to 15 standard depths',
    provider: 'Copernicus Marine Service',
    doiOrUrl: 'https://doi.org/10.48670/moi-00021',
    status: 'ACTIVE_INGESTED',
  },
  {
    variable: 'In-situ Validation Reference',
    symbol: 'ARGO CTD T(z)',
    product: 'INCOIS Live Access Server (LAS) Gridded ARGO',
    nativeRes: '1.0° / Float Trajectories',
    targetRes: '0.25° Spatial Colocation',
    regriddingMethod: 'Haversine nearest-neighbor 3D spatial matching',
    provider: 'INCOIS / JCOMMOPS Global ARGO',
    doiOrUrl: 'https://las.incois.gov.in',
    status: 'ACTIVE_INGESTED',
  },
];

export function SatelliteHarmonizationMatrix() {
  return (
    <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-5 space-y-4 shadow-xl">
      
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ocean-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Satellite size={17} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Multi-Source Satellite Harmonization Pipeline
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 normal-case">
                SIH26066 Compliant
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized Domain: <span className="text-cyan-300 font-mono">5°N to 30°N, 45°E to 105°E</span> · Daily × 0.25° × 0.25° Grid
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 bg-ocean-950 px-3 py-1 rounded border border-ocean-800">
          Target Resolution: <span className="text-cyan-300 font-bold">0.25° × 0.25° Daily</span>
        </div>
      </div>

      {/* Regridding Explanation Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-ocean-950/80 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Layers size={13} />
            Spatial Regridding
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            OSTIA (0.05°) and SMAP (0.125°) harmonized to common 0.25° grid via area-weighted conservative interpolation.
          </p>
        </div>
        <div className="bg-ocean-950/80 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Database size={13} />
            Temporal Cadence
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Multi-source inputs aligned to daily midnight UTC timestamps (00:00 UTC) with 6-hourly wind vector diurnal averaging.
          </p>
        </div>
        <div className="bg-ocean-950/80 border border-ocean-800 rounded-lg p-3 space-y-1">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <CheckCircle size={13} className="text-emerald-400" />
            15 Standard Depths
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Target vertical discretization strictly matches: 0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000m.
          </p>
        </div>
      </div>

      {/* Data Ingestion Table */}
      <div className="overflow-x-auto rounded-lg border border-ocean-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-ocean-950 text-slate-400 border-b border-ocean-800 text-[11px]">
            <tr>
              <th className="px-3.5 py-2.5 font-semibold text-white">Variable</th>
              <th className="px-3 py-2.5 font-semibold">Recommended Product</th>
              <th className="px-3 py-2.5 font-semibold">Native Res</th>
              <th className="px-3 py-2.5 font-semibold text-cyan-300">Target Res</th>
              <th className="px-3 py-2.5 font-semibold">Regridding Method</th>
              <th className="px-3 py-2.5 font-semibold">Provider / Source</th>
              <th className="px-3 py-2.5 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-800/60 bg-ocean-900/50">
            {DATASET_MATRIX.map((row, idx) => (
              <tr key={idx} className="hover:bg-ocean-800/40 transition-colors">
                <td className="px-3.5 py-2.5 text-slate-200 font-semibold">
                  <div>{row.variable}</div>
                  <div className="text-[10px] text-cyan-400">{row.symbol}</div>
                </td>
                <td className="px-3 py-2.5 text-slate-300">
                  <a
                    href={row.doiOrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                  >
                    <span>{row.product}</span>
                    <ExternalLink size={10} className="shrink-0" />
                  </a>
                </td>
                <td className="px-3 py-2.5 text-slate-400">{row.nativeRes}</td>
                <td className="px-3 py-2.5 text-cyan-300 font-semibold">{row.targetRes}</td>
                <td className="px-3 py-2.5 text-slate-400 text-[10px] max-w-xs">{row.regriddingMethod}</td>
                <td className="px-3 py-2.5 text-slate-400 text-[11px]">{row.provider}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-mono border ${
                    row.status === 'ACTIVE_INGESTED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  }`}>
                    {row.status === 'ACTIVE_INGESTED' ? '✓ Ingested' : 'Harmonized'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
