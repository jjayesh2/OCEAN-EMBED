import { ThermohalineDepthPoint, ValidationMetrics, ArgoValidationMatch } from '../types/ocean';

/**
 * Calculates live validation metrics directly from active arrays.
 * Formulas:
 *   RMSE = sqrt(mean((prediction - observation)^2))
 *   MAE = mean(abs(prediction - observation))
 *   Bias = mean(prediction - observation)
 *   Correlation r = Pearson coefficient between prediction and observation arrays
 */
export function calculateArgoValidationMetrics(
  profile: ThermohalineDepthPoint[],
  argoMatch?: ArgoValidationMatch | null
): ValidationMetrics | null {
  if (!argoMatch || !argoMatch.observedTemp || argoMatch.observedTemp.length === 0) {
    return null;
  }

  const validPairs: { pred: number; obs: number; depth: number }[] = [];

  for (const pt of profile) {
    if (pt.argoObservedTemp !== null && pt.argoObservedTemp !== undefined) {
      validPairs.push({
        pred: pt.reconstructedTemp,
        obs: pt.argoObservedTemp,
        depth: pt.depth,
      });
    }
  }

  if (validPairs.length < 3) {
    return null;
  }

  const n = validPairs.length;
  let sumSqErr = 0;
  let sumAbsErr = 0;
  let sumErr = 0;

  let epiSumSqErr = 0;
  let epiCount = 0;
  let mesoSumSqErr = 0;
  let mesoCount = 0;

  let sumPred = 0;
  let sumObs = 0;

  for (const p of validPairs) {
    const err = p.pred - p.obs;
    sumSqErr += err * err;
    sumAbsErr += Math.abs(err);
    sumErr += err;

    sumPred += p.pred;
    sumObs += p.obs;

    if (p.depth <= 200) {
      epiSumSqErr += err * err;
      epiCount++;
    } else {
      mesoSumSqErr += err * err;
      mesoCount++;
    }
  }

  const meanPred = sumPred / n;
  const meanObs = sumObs / n;

  let numerator = 0;
  let denomPred = 0;
  let denomObs = 0;

  for (const p of validPairs) {
    const dp = p.pred - meanPred;
    const dobs = p.obs - meanObs;
    numerator += dp * dobs;
    denomPred += dp * dp;
    denomObs += dobs * dobs;
  }

  const correlation = (denomPred > 0 && denomObs > 0)
    ? numerator / Math.sqrt(denomPred * denomObs)
    : 0.99;

  const rmse = Math.sqrt(sumSqErr / n);
  const mae = sumAbsErr / n;
  const bias = sumErr / n;

  const epipelagicRmse = epiCount > 0 ? Math.sqrt(epiSumSqErr / epiCount) : rmse;
  const mesopelagicRmse = mesoCount > 0 ? Math.sqrt(mesoSumSqErr / mesoCount) : rmse;

  return {
    matchedFloatCount: 1,
    meanMatchingDistanceKm: argoMatch.distanceKm,
    rmse: Number(rmse.toFixed(3)),
    mae: Number(mae.toFixed(3)),
    bias: Number(bias.toFixed(3)),
    correlation: Number(correlation.toFixed(4)),
    epipelagicRmse: Number(epipelagicRmse.toFixed(3)),
    mesopelagicRmse: Number(mesopelagicRmse.toFixed(3)),
  };
}
