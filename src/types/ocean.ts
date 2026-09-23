export type OceanRegion = 'Bay of Bengal' | 'Arabian Sea';

export const STANDARD_DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000] as const;
export type StandardDepth = typeof STANDARD_DEPTHS[number];

export type PrimaryView = 'monitor' | 'reconstruction' | 'validation' | 'method';

export type PipelineStageStatus = 'IMPLEMENTED' | 'PROTOTYPE' | 'PLANNED';

export type SurfaceVariableKey = 
  | 'SST'
  | 'SSS'
  | 'SSH'
  | 'currentU'
  | 'currentV'
  | 'windU'
  | 'windV';

export interface SurfaceVariableMeta {
  key: SurfaceVariableKey;
  name: string;
  fullName: string;
  unit: string;
  resolution: string;
  sourceDataset: string;
  availableInGlorys: boolean;
  unavailableReason?: string;
  min: number;
  max: number;
  palette: 'thermal' | 'haline' | 'diverging' | 'velocity' | 'wind';
}

export interface OceanSurfaceState {
  lat: number;
  lon: number;
  region: OceanRegion;
  date: string;
  SST?: number | null;      // °C (GLORYS thetao)
  SSS?: number | null;      // PSU (GLORYS so)
  SSH?: number | null;      // m (GLORYS zos)
  currentU?: number | null; // m/s (GLORYS uo)
  currentV?: number | null; // m/s (GLORYS vo)
  windU?: number | null;    // m/s (External scatterometer/ERA5)
  windV?: number | null;    // m/s
  MLD?: number | null;      // m (GLORYS mlotst)
  isMissingData?: boolean;
}

export interface ThermohalineDepthPoint {
  depth: StandardDepth;          // meters (positive downward convention)
  pressureDbar: number;          // dbar
  
  // OceanEmbed Prototype Reconstruction
  reconstructedTemp: number;     // °C
  reconstructedSalinity: number; // PSU
  reconstructedDensity: number;  // kg/m³ (UNESCO 1983 EOS-80)
  
  // GLORYS Reference Reanalysis (doi:10.48670/moi-00021)
  glorysRefTemp: number;         // °C
  glorysRefSalinity: number;     // PSU
  glorysRefDensity: number;      // kg/m³
  
  // Observational Validation (In-Situ ARGO Float)
  argoObservedTemp?: number | null; // °C
  argoObservedSalinity?: number | null; // PSU (Explicitly noted if unsupplied)
  
  // Physics Metrics
  densityGradientDrhoDz: number; // kg/m⁴ (positive downward: drho/dz > 0 indicates stable)
  buoyancyFrequencyN2: number;   // s⁻² (N² > 0 indicates static stability)
  isStaticallyStable: boolean;
  
  // Error metrics at depth
  tempDiffAgainstGlorys: number;
  tempDiffAgainstArgo?: number | null;
}

export interface PhysicalConsistencyReport {
  overallStable: boolean;
  statusBadge: '✓ Stable' | '⚠ Review Required';
  statusExplanation: string;
  minN2: number;
  maxN2: number;
  meanDensityGradient: number;
  convectiveInversionCount: number;
  inversionDepths: number[];
  formulationCitation: string;
}

export interface UncertaintyMetadata {
  isCalibrated: boolean;
  statusText: 'Uncertainty model not calibrated' | 'Calibrated MC-Dropout 1σ/2σ';
  confidenceCategory: 'High' | 'Medium' | 'Low' | 'Uncalibrated';
  temp1SigmaBand: Record<StandardDepth, number>; // °C
  salinity1SigmaBand: Record<StandardDepth, number>; // PSU
}

export interface ArgoValidationMatch {
  floatId: string;
  wmo: string;
  platformType: string;
  qcFlag: string;
  lat: number;
  lon: number;
  date: string;
  distanceKm: number;
  timeDeltaHours: number;
  isDirectSpatialMatch: boolean;
  depths: StandardDepth[];
  observedTemp: number[];
  observedSalinityAvailable: boolean;
  observedSalinityStatus: string;
}

export interface ValidationMetrics {
  matchedFloatCount: number;
  meanMatchingDistanceKm: number;
  rmse: number;
  mae: number;
  bias: number;
  correlation: number;
  epipelagicRmse: number; // 0-200m
  mesopelagicRmse: number; // 200-1000m
}

export interface LatentEmbeddingRepresentation {
  embeddingDim: number;
  vector: number[];
  norm: number;
  thermalHeaveProxy: number;
  halineStratificationProxy: number;
  geostrophicShearProxy: number;
  mode: 'Prototype Ocean Representation' | 'Trained Weights Active';
}

export interface ModelInferencePackage {
  surfaceState: OceanSurfaceState;
  targetDepth: StandardDepth;
  profile: ThermohalineDepthPoint[];
  physicsReport: PhysicalConsistencyReport;
  uncertainty: UncertaintyMetadata;
  embedding: LatentEmbeddingRepresentation;
  argoMatch?: ArgoValidationMatch | null;
  inferenceType: 'Prototype Reconstruction';
  glorysCitation: string;
  executionTimeMs: number;
}
