import { 
  OceanRegion, 
  StandardDepth, 
  SurfaceVariableKey, 
  SurfaceVariableMeta, 
  OceanSurfaceState, 
  ThermohalineDepthPoint,
  ArgoValidationMatch 
} from '../../types/ocean';

export interface DatasetSpatialBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  latStep: number;
  lonStep: number;
}

export interface DatasetMetadata {
  title: string;
  source: string;
  doi: string;
  productId: string;
  datasetId: string;
  resolution: string;
  cadence: string;
  totalOceanCells: number;
  totalGridCells: number;
  coveragePercent: number;
}

/**
 * Standardized OceanEmbed Dataset Adapter Interface
 * Decouples the application from raw data files (NetCDF, GRIB, NPZ, JSON).
 */
export interface DatasetAdapter {
  loadDataset(): Promise<void>;
  getMetadata(): DatasetMetadata;
  getAvailableVariables(): SurfaceVariableMeta[];
  getDates(): string[];
  getDepths(): readonly StandardDepth[];
  getSpatialBounds(): DatasetSpatialBounds;
  
  // Surface spatial raster fields
  getSurfaceFieldValue(variable: SurfaceVariableKey, lat: number, lon: number, date: string): number | null;
  getMissingDataCoverage(date: string): { totalCells: number; oceanCells: number; missingPercent: number; observedPercent: number };
  
  // Point inspection
  getPointSurfaceState(lat: number, lon: number, region: OceanRegion, date: string): OceanSurfaceState;
  
  // Reference vs Reconstruction profiles
  getReferenceProfile(lat: number, lon: number, date: string): {
    temps: Record<StandardDepth, number>;
    salinities: Record<StandardDepth, number>;
  };

  // In-situ observational validation
  findNearestArgoObservation(
    lat: number,
    lon: number,
    date: string,
    maxDistanceKm?: number
  ): ArgoValidationMatch | null;

  getAllArgoObservations(region?: OceanRegion): ArgoValidationMatch[];
}
