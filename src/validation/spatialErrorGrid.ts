import { ArgoValidationMatch, StandardDepth } from '../types/ocean';

export interface SpatialErrorPoint {
  wmo: string;
  lat: number;
  lon: number;
  rmse: number;
  mae: number;
  bias: number;
  sampleCount: number;
}

/**
 * Computes spatial error distribution across real ARGO floats.
 * Values are calculated directly from observational profiles vs reconstruction.
 */
export function computeSpatialErrorGrid(
  floats: ArgoValidationMatch[],
  getPredictedTempForPoint: (lat: number, lon: number, depth: StandardDepth) => number
): {
  errorPoints: SpatialErrorPoint[];
  summary: {
    samplesEvaluated: number;
    meanRmse: number;
    meanMae: number;
    meanBias: number;
  };
} {
  const errorPoints: SpatialErrorPoint[] = [];
  let sumRmse = 0;
  let sumMae = 0;
  let sumBias = 0;

  for (const float of floats) {
    if (!float.observedTemp || float.observedTemp.length === 0) continue;

    let sqErrSum = 0;
    let absErrSum = 0;
    let errSum = 0;
    const n = float.depths.length;

    for (let i = 0; i < n; i++) {
      const d = float.depths[i];
      const obs = float.observedTemp[i];
      const pred = getPredictedTempForPoint(float.lat, float.lon, d);
      const diff = pred - obs;

      sqErrSum += diff * diff;
      absErrSum += Math.abs(diff);
      errSum += diff;
    }

    const rmse = Number(Math.sqrt(sqErrSum / n).toFixed(3));
    const mae = Number((absErrSum / n).toFixed(3));
    const bias = Number((errSum / n).toFixed(3));

    sumRmse += rmse;
    sumMae += mae;
    sumBias += bias;

    errorPoints.push({
      wmo: float.wmo,
      lat: float.lat,
      lon: float.lon,
      rmse,
      mae,
      bias,
      sampleCount: n,
    });
  }

  const count = errorPoints.length || 1;

  return {
    errorPoints,
    summary: {
      samplesEvaluated: errorPoints.length,
      meanRmse: Number((sumRmse / count).toFixed(3)),
      meanMae: Number((sumMae / count).toFixed(3)),
      meanBias: Number((sumBias / count).toFixed(3)),
    },
  };
}
