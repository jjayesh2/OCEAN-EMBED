import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SurfaceVariableMeta, ArgoValidationMatch, OceanSurfaceState } from '../../types/ocean';
import glorysRaw from '../../data/glorysDataset.json';

// ── Color palettes for Ocean Variables ──────────────────────────────────────
function thermalColor(t: number, min: number, max: number): string {
  const f = Math.max(0, Math.min(1, (t - min) / (max - min)));
  const r = Math.round(f < 0.5 ? 0 : f < 0.75 ? ((f - 0.5) / 0.25) * 200 : 200 + ((f - 0.75) / 0.25) * 55);
  const g = Math.round(f < 0.25 ? 0 : f < 0.5 ? ((f - 0.25) / 0.25) * 180 : f < 0.75 ? 180 : 180 - ((f - 0.75) / 0.25) * 180);
  const b = Math.round(f < 0.25 ? 100 + f * 4 * 155 : f < 0.5 ? 255 - ((f - 0.25) / 0.25) * 255 : 0);
  return `rgb(${r},${g},${b})`;
}

function halineColor(s: number, min: number, max: number): string {
  const f = Math.max(0, Math.min(1, (s - min) / (max - min)));
  const r = Math.round(f < 0.5 ? 20 : 20 + ((f - 0.5) / 0.5) * 235);
  const g = Math.round(f < 0.5 ? 60 + f * 2 * 140 : 200 - ((f - 0.5) / 0.5) * 100);
  const b = Math.round(f < 0.5 ? 150 - f * 2 * 100 : 50);
  return `rgb(${r},${g},${b})`;
}

function divergingColor(v: number, min: number, max: number): string {
  const mid = (min + max) / 2;
  const fMid = (v - mid) / (max - mid);
  if (fMid < 0) {
    const t = Math.max(0, Math.min(1, -fMid));
    return `rgb(${Math.round(30 + t * 30)},${Math.round(80 + t * 60)},${Math.round(180 + t * 75)})`;
  } else {
    const t = Math.max(0, Math.min(1, fMid));
    return `rgb(${Math.round(200 + t * 55)},${Math.round(60 - t * 40)},${Math.round(40)})`;
  }
}

function velocityColor(v: number, min: number, max: number): string {
  const f = Math.max(0, Math.min(1, (v - min) / (max - min)));
  const r = Math.round(f < 0.5 ? 60 : 60 + ((f - 0.5) / 0.5) * 195);
  const g = Math.round(f < 0.5 ? 120 + f * 2 * 100 : 220 - ((f - 0.5) / 0.5) * 150);
  const b = Math.round(f < 0.5 ? 200 - f * 2 * 120 : 80);
  return `rgb(${r},${g},${b})`;
}

function getColor(value: number, variable: SurfaceVariableMeta): string {
  switch (variable.palette) {
    case 'thermal':   return thermalColor(value, variable.min, variable.max);
    case 'haline':    return halineColor(value, variable.min, variable.max);
    case 'diverging': return divergingColor(value, variable.min, variable.max);
    case 'velocity':  return velocityColor(value, variable.min, variable.max);
    default:          return thermalColor(value, variable.min, variable.max);
  }
}

interface ScientificOceanMapProps {
  variable: SurfaceVariableMeta;
  argoFloats: ArgoValidationMatch[];
  selectedLat: number;
  selectedLon: number;
  surfaceState: OceanSurfaceState | null;
  onSelectLocation: (lat: number, lon: number) => void;
}

const LATS = glorysRaw.grid.lats as number[];
const LONS = glorysRaw.grid.lons as number[];
const LAT_MIN = 5.0, LAT_MAX = 25.0;
const LON_MIN = 55.0, LON_MAX = 94.75;

export function ScientificOceanMap({
  variable,
  argoFloats,
  selectedLat,
  selectedLon,
  onSelectLocation,
}: ScientificOceanMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ lat: number; lon: number; value: number | null; isLand: boolean } | null>(null);
  const [lastClickedInfo, setLastClickedInfo] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 850, h: 420 });

  // Responsive sizing
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect.width;
        setDims({ w, h: Math.round(w * 0.48) });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const latToY = useCallback((lat: number, h: number) => {
    return h - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * h;
  }, []);

  const lonToX = useCallback((lon: number, w: number) => {
    return ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * w;
  }, []);

  const xyToLatLon = useCallback((x: number, y: number, w: number, h: number) => {
    const lon = LON_MIN + (x / w) * (LON_MAX - LON_MIN);
    const lat = LAT_MIN + ((h - y) / h) * (LAT_MAX - LAT_MIN);
    return { lat, lon };
  }, []);

  // Draw the ocean map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = dims;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = '#0a101f';
    ctx.fillRect(0, 0, w, h);

    const fieldKey = variable.key;
    const fieldData = (glorysRaw.fields as any)[fieldKey] as (number | null)[][];

    if (!fieldData) {
      ctx.fillStyle = '#102447';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#64748b';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Not available in supplied GLORYS dataset', w / 2, h / 2);
      return;
    }

    const nLat = LATS.length;
    const nLon = LONS.length;
    const cellW = w / nLon;
    const cellH = h / nLat;

    // 1. Draw ocean and land cells
    for (let i = 0; i < nLat; i++) {
      for (let j = 0; j < nLon; j++) {
        const val = fieldData[i] ? fieldData[i][j] : null;
        const px = j * cellW;
        const py = (nLat - 1 - i) * cellH;

        if (val === null) {
          // LAND MASS (India & surrounding subcontinent)
          ctx.fillStyle = '#162235'; // Clear, distinct land slate color
          ctx.fillRect(px, py, cellW + 0.6, cellH + 0.6);
        } else {
          // OCEAN
          ctx.fillStyle = getColor(val, variable);
          ctx.fillRect(px, py, cellW + 0.6, cellH + 0.6);
        }
      }
    }

    // 2. Draw Coastlines: Where land touches ocean, draw an illuminated coastline border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < nLat - 1; i++) {
      for (let j = 0; j < nLon - 1; j++) {
        const isOcean = fieldData[i] && fieldData[i][j] !== null;
        const rightIsOcean = fieldData[i] && fieldData[i][j + 1] !== null;
        const topIsOcean = fieldData[i + 1] && fieldData[i + 1][j] !== null;

        const px = j * cellW;
        const py = (nLat - 1 - i) * cellH;

        if (isOcean !== rightIsOcean) {
          ctx.beginPath();
          ctx.moveTo(px + cellW, py);
          ctx.lineTo(px + cellW, py + cellH);
          ctx.stroke();
        }
        if (isOcean !== topIsOcean) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + cellW, py);
          ctx.stroke();
        }
      }
    }

    // 3. Coordinate Grid Lines (Subtle latitude & longitude references)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.6;
    ctx.setLineDash([2, 4]);

    const latLines = [10, 15, 20];
    latLines.forEach(l => {
      const y = latToY(l, h);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${l}°N`, 4, y - 2);
    });

    const lonLines = [60, 70, 80, 90];
    lonLines.forEach(l => {
      const x = lonToX(l, w);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${l}°E`, x, h - 4);
    });
    ctx.setLineDash([]);

    // 4. Prominent Geographic Labels (India & Surrounding Oceans)
    
    // INDIA (Peninsular landmass center)
    const indiaX = lonToX(77.5, w);
    const indiaY = latToY(18.0, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText('INDIA', indiaX, indiaY);
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('[LANDMASS]', indiaX, indiaY + 12);
    ctx.shadowBlur = 0;

    // SRI LANKA
    const slX = lonToX(80.8, w);
    const slY = latToY(7.5, h);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText('SRI LANKA', slX, slY);

    // ARABIAN SEA (West of India)
    const asX = lonToX(65.0, w);
    const asY = latToY(15.0, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('ARABIAN SEA', asX, asY);
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('(Click to Calculate)', asX, asY + 13);
    ctx.shadowBlur = 0;

    // BAY OF BENGAL (East of India)
    const bobX = lonToX(88.5, w);
    const bobY = latToY(15.0, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('BAY OF BENGAL', bobX, bobY);
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('(Click to Calculate)', bobX, bobY + 13);
    ctx.shadowBlur = 0;

    // EQUATORIAL INDIAN OCEAN (South)
    const ioX = lonToX(77.5, w);
    const ioY = latToY(5.8, h);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('INDIAN OCEAN (EQUATORIAL)', ioX, ioY);

    // 5. ARGO Float In-situ robotic sensors
    for (const f of argoFloats) {
      const px = lonToX(f.lon, w);
      const py = latToY(f.lat, h);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b'; // Amber
      ctx.fill();
      ctx.strokeStyle = '#030814';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 6. Selected Location Target Marker (Animated style)
    const selX = lonToX(selectedLon, w);
    const selY = latToY(selectedLat, h);

    // Outer pulsing ring
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(selX, selY, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Inner crosshairs
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(selX - 12, selY); ctx.lineTo(selX + 12, selY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(selX, selY - 12); ctx.lineTo(selX, selY + 12); ctx.stroke();

    // Center point
    ctx.beginPath();
    ctx.arc(selX, selY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    // 7. Mini Color Bar Legend (Bottom Right)
    const barW = 120;
    const barH = 8;
    const barX = w - barW - 12;
    const barY = h - 22;

    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    const nStops = 6;
    for (let k = 0; k <= nStops; k++) {
      const val = variable.min + (k / nStops) * (variable.max - variable.min);
      grad.addColorStop(k / nStops, getColor(val, variable));
    }
    ctx.fillStyle = 'rgba(7, 18, 38, 0.85)';
    ctx.fillRect(barX - 6, barY - 14, barW + 12, barH + 24);
    ctx.strokeStyle = '#1e3e70';
    ctx.strokeRect(barX - 6, barY - 14, barW + 12, barH + 24);

    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${variable.min}${variable.unit}`, barX, barY - 3);
    ctx.textAlign = 'right';
    ctx.fillText(`${variable.max}${variable.unit}`, barX + barW, barY - 3);

  }, [dims, variable, argoFloats, selectedLat, selectedLon, latToY, lonToX]);

  // Click handler with smart Ocean Snap
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let { lat, lon } = xyToLatLon(x, y, dims.w, dims.h);

    if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) return;

    // Check if clicked cell is land or ocean
    const fieldKey = variable.key;
    const fieldData = (glorysRaw.fields as any)[fieldKey] as (number | null)[][];

    let latIdx = Math.round((lat - LAT_MIN) / 0.25);
    let lonIdx = Math.round((lon - LON_MIN) / 0.25);
    latIdx = Math.max(0, Math.min(LATS.length - 1, latIdx));
    lonIdx = Math.max(0, Math.min(LONS.length - 1, lonIdx));

    const isLand = !fieldData || !fieldData[latIdx] || fieldData[latIdx][lonIdx] === null;

    if (isLand) {
      // Find nearest ocean cell within 150 km to ensure calculation always succeeds!
      let nearestDist = Infinity;
      let targetLat = lat;
      let targetLon = lon;

      for (let di = -10; di <= 10; di++) {
        for (let dj = -10; dj <= 10; dj++) {
          const ni = latIdx + di;
          const nj = lonIdx + dj;
          if (ni >= 0 && ni < nLat && nj >= 0 && nj < nLon && fieldData[ni] && fieldData[ni][nj] !== null) {
            const d = di * di + dj * dj;
            if (d < nearestDist) {
              nearestDist = d;
              targetLat = LATS[ni];
              targetLon = LONS[nj];
            }
          }
        }
      }

      setLastClickedInfo(`Clicked land (India). Snapped to coastal ocean: ${targetLat.toFixed(2)}°N, ${targetLon.toFixed(2)}°E`);
      onSelectLocation(targetLat, targetLon);
    } else {
      const seaName = lon < 77.5 ? 'Arabian Sea' : 'Bay of Bengal';
      setLastClickedInfo(`Selected ${seaName} at ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E — Data calculated!`);
      onSelectLocation(
        Math.round(lat * 4) / 4,
        Math.round(lon * 4) / 4
      );
    }
  };

  const nLat = LATS.length;
  const nLon = LONS.length;

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { lat, lon } = xyToLatLon(x, y, dims.w, dims.h);

    if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) {
      const fieldKey = variable.key;
      const fieldData = (glorysRaw.fields as any)[fieldKey] as (number | null)[][];

      let latIdx = Math.round((lat - LAT_MIN) / 0.25);
      let lonIdx = Math.round((lon - LON_MIN) / 0.25);
      latIdx = Math.max(0, Math.min(LATS.length - 1, latIdx));
      lonIdx = Math.max(0, Math.min(LONS.length - 1, lonIdx));
      const val = fieldData && fieldData[latIdx] ? fieldData[latIdx][lonIdx] : null;
      setHoveredCell({
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100,
        value: val,
        isLand: val === null,
      });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => setHoveredCell(null);

  return (
    <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden border border-ocean-700 shadow-xl bg-ocean-950">
      
      {/* Top Banner Guide on Map */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <span className="text-[11px] font-semibold bg-ocean-900/90 border border-ocean-600 px-2.5 py-1 rounded text-cyan-300 shadow backdrop-blur-sm">
          🇮🇳 INDIA & Surrounding Oceans
        </span>
        <span className="text-[10px] font-mono bg-ocean-950/80 border border-ocean-800 px-2 py-1 rounded text-slate-300 hidden sm:inline">
          Click any ocean pixel to calculate 0–1000m profiles
        </span>
      </div>

      {/* ARGO Float Legend Indicator */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-ocean-900/90 border border-ocean-600 px-2.5 py-1 rounded shadow backdrop-blur-sm pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[10px] font-mono text-slate-200">ARGO In-Situ Floats ({argoFloats.length})</span>
      </div>

      {/* Interactive Map Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair block"
        style={{ height: dims.h }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Dynamic Hover Tooltip */}
      {hoveredCell && (
        <div className="absolute bottom-2.5 left-2.5 bg-ocean-900/95 border border-ocean-600 rounded px-3 py-1.5 text-xs font-mono text-slate-200 pointer-events-none space-y-0.5 shadow-lg backdrop-blur-sm">
          <div className="text-slate-400 text-[10px]">
            {hoveredCell.isLand ? '🇮🇳 Indian Subcontinent (Land)' : `${variable.fullName}`}
          </div>
          <div className="text-white font-semibold">
            {hoveredCell.lat.toFixed(2)}°N, {hoveredCell.lon.toFixed(2)}°E
          </div>
          {!hoveredCell.isLand && hoveredCell.value !== null ? (
            <div className="text-cyan-400 font-bold">
              {hoveredCell.value.toFixed(2)} {variable.unit} · <span className="text-emerald-400 font-normal">Click to calculate</span>
            </div>
          ) : (
            <div className="text-amber-400 text-[11px]">Landmass (Click to snap to coastal ocean)</div>
          )}
        </div>
      )}

      {/* Live Click Notice Bar */}
      {lastClickedInfo && (
        <div className="absolute top-10 left-2.5 bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 rounded px-3 py-1 text-[11px] font-mono pointer-events-none shadow animate-fade-in">
          ✓ {lastClickedInfo}
        </div>
      )}
    </div>
  );
}
