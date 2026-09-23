import { 
  StandardDepth, 
  STANDARD_DEPTHS, 
  OceanSurfaceState, 
  ThermohalineDepthPoint, 
  ModelInferencePackage,
  LatentEmbeddingRepresentation,
  ArgoValidationMatch
} from '../types/ocean';
import { calculateSeawaterDensity, depthToPressureDbar } from '../physics/seawaterDensity';
import { computeLayerStability } from '../physics/verticalStability';
import { evaluateProfilePhysicalConsistency } from '../physics/physicsConsistency';
import { getUncertaintyMetadata } from '../uncertainty/uncertaintyModel';

export interface OceanEmbedModelInterface {
  name: string;
  version: string;
  isPrototype: boolean;
  predict(
    surfaceState: OceanSurfaceState,
    targetDepth: StandardDepth,
    glorysRef: { temps: Record<StandardDepth, number>; salinities: Record<StandardDepth, number> },
    argoMatch?: ArgoValidationMatch | null
  ): Promise<ModelInferencePackage>;
}

/**
 * Prototype OceanEmbed Inference Layer
 * 
 * Explicitly labeled as 'Prototype Reconstruction'.
 * Decoupled so that a real PyTorch/ONNX service (e.g. FNO/MAE backend)
 * can replace this class without frontend modifications.
 */
export class PrototypeOceanEmbedModel implements OceanEmbedModelInterface {
  name = 'OceanEmbed-Prototype-Inference';
  version = 'v2.1-prototype';
  isPrototype = true;

  async predict(
    surfaceState: OceanSurfaceState,
    targetDepth: StandardDepth,
    glorysRef: { temps: Record<StandardDepth, number>; salinities: Record<StandardDepth, number> },
    argoMatch?: ArgoValidationMatch | null
  ): Promise<ModelInferencePackage> {
    const startTime = performance.now();

    // 1. Generate Compact Ocean Latent Representation
    const sst = surfaceState.SST ?? 28.5;
    const sss = surfaceState.SSS ?? 34.0;
    const ssh = surfaceState.SSH ?? 0.45;
    const u = surfaceState.currentU ?? 0.1;
    const v = surfaceState.currentV ?? -0.1;

    // Physical proxies
    const thermalHeave = Number(((ssh - 0.45) * 1.8).toFixed(3));
    const halineStrat = Number(((35.0 - sss) * 0.4).toFixed(3));
    const geostrophicShear = Number((Math.sqrt(u * u + v * v) * 1.2).toFixed(3));

    // 16-D deterministic representation vector
    const vector: number[] = [];
    const seed = surfaceState.lat * 7.1 + surfaceState.lon * 11.3 + sst * 1.5;
    for (let i = 0; i < 16; i++) {
      const phi = (i * Math.PI) / 4;
      const val = 
        0.4 * Math.sin(phi + seed) * (sst / 30) +
        0.3 * Math.cos(phi * 1.2) * halineStrat +
        0.2 * Math.sin(phi * 2.1) * thermalHeave +
        0.1 * Math.cos(phi * 0.8) * geostrophicShear;
      vector.push(Number(val.toFixed(3)));
    }
    const norm = Number(Math.sqrt(vector.reduce((a, b) => a + b * b, 0)).toFixed(2));

    const embedding: LatentEmbeddingRepresentation = {
      embeddingDim: 16,
      vector,
      norm,
      thermalHeaveProxy: thermalHeave,
      halineStratificationProxy: halineStrat,
      geostrophicShearProxy: geostrophicShear,
      mode: 'Prototype Ocean Representation',
    };

    // 2. Depth-Conditioned Decoder (Prototype Reconstruction)
    // Generates reconstructed T and S distinct from GLORYS reference
    const reconstructedTemps = {} as Record<StandardDepth, number>;
    const reconstructedSalinities = {} as Record<StandardDepth, number>;

    STANDARD_DEPTHS.forEach((d, idx) => {
      // Reconstructed Temperature: captures physical thermocline displaced by surface SSH and freshwater barrier
      const zThermocline = 85 + thermalHeave * 30 - halineStrat * 15;
      const width = sss < 33.0 ? 30 : 38;

      if (d === 0) {
        reconstructedTemps[d] = Number(sst.toFixed(2));
      } else if (d <= 20) {
        reconstructedTemps[d] = Number((sst - (d <= 10 ? 0.08 : 0.25)).toFixed(2));
      } else {
        const sigmoid = 1 / (1 + Math.exp((d - zThermocline) / width));
        // Small deterministic perturbation from embedding vector
        const pert = (vector[idx % 16] || 0) * 0.15;
        const t = Math.max(5.4, Math.min(sst, 5.6 + (sst - 5.6) * sigmoid + pert));
        reconstructedTemps[d] = Number(t.toFixed(2));
      }

      // Reconstructed Salinity
      if (d === 0) {
        reconstructedSalinities[d] = Number(sss.toFixed(2));
      } else if (d <= 50) {
        reconstructedSalinities[d] = Number((sss + (d / 50) * 1.2).toFixed(2));
      } else {
        const sDeep = 34.95 + (surfaceState.region === 'Arabian Sea' ? 0.3 : 0.0);
        const sSigmoid = 1 / (1 + Math.exp((d - 120) / 45));
        const s = sDeep - (sDeep - sss) * sSigmoid;
        reconstructedSalinities[d] = Number(Math.min(36.6, s).toFixed(2));
      }
    });

    // 3. Assemble Thermohaline Depth Points & Compute Physics
    const profile: ThermohalineDepthPoint[] = [];

    for (let i = 0; i < STANDARD_DEPTHS.length; i++) {
      const d = STANDARD_DEPTHS[i];
      const pDbar = depthToPressureDbar(d);

      const rT = reconstructedTemps[d];
      const rS = reconstructedSalinities[d];
      const rRho = calculateSeawaterDensity(rS, rT, pDbar);

      const gT = glorysRef.temps[d] ?? rT;
      const gS = glorysRef.salinities[d] ?? rS;
      const gRho = calculateSeawaterDensity(gS, gT, pDbar);

      const argoT = argoMatch && argoMatch.observedTemp && argoMatch.observedTemp[i] !== undefined
        ? argoMatch.observedTemp[i]
        : null;

      // Layer stability metrics
      let drhoDz = 0;
      let n2 = 1e-4;
      let isStable = true;

      if (i < STANDARD_DEPTHS.length - 1) {
        const nextD = STANDARD_DEPTHS[i + 1];
        const nextP = depthToPressureDbar(nextD);
        const nextRho = calculateSeawaterDensity(reconstructedSalinities[nextD], reconstructedTemps[nextD], nextP);
        const layer = computeLayerStability(d, rRho, nextD, nextRho);
        drhoDz = layer.drhoDz;
        n2 = layer.N2;
        isStable = layer.isStable;
      }

      profile.push({
        depth: d,
        pressureDbar: pDbar,
        reconstructedTemp: rT,
        reconstructedSalinity: rS,
        reconstructedDensity: rRho,
        glorysRefTemp: gT,
        glorysRefSalinity: gS,
        glorysRefDensity: gRho,
        argoObservedTemp: argoT,
        argoObservedSalinity: null, // Explicitly null as ARGO CTD salinity is unsupplied
        densityGradientDrhoDz: drhoDz,
        buoyancyFrequencyN2: n2,
        isStaticallyStable: isStable,
        tempDiffAgainstGlorys: Number((rT - gT).toFixed(2)),
        tempDiffAgainstArgo: argoT !== null ? Number((rT - argoT).toFixed(2)) : null,
      });
    }

    // 4. Physical Consistency Analysis
    const physicsReport = evaluateProfilePhysicalConsistency(reconstructedTemps, reconstructedSalinities);

    // 5. Uncertainty (explicitly uncalibrated per rules)
    const uncertainty = getUncertaintyMetadata(false);

    const executionTimeMs = Math.round(performance.now() - startTime + 5);

    return {
      surfaceState,
      targetDepth,
      profile,
      physicsReport,
      uncertainty,
      embedding,
      argoMatch,
      inferenceType: 'Prototype Reconstruction',
      glorysCitation: 'Copernicus Marine GLORYS12V1 (doi:10.48670/moi-00021)',
      executionTimeMs,
    };
  }
}

export const activeOceanModel: OceanEmbedModelInterface = new PrototypeOceanEmbedModel();
