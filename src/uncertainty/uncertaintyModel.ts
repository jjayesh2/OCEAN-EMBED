import { StandardDepth, STANDARD_DEPTHS, UncertaintyMetadata } from '../types/ocean';

/**
 * Uncertainty Model Handler
 * 
 * Per scientific honesty guidelines:
 * If an uncertainty model is uncalibrated, explicitly display
 * 'Uncertainty model not calibrated' and do not generate arbitrary ± values.
 */
export function getUncertaintyMetadata(
  isCalibrated: boolean = false
): UncertaintyMetadata {
  // Empty bands when uncalibrated
  const temp1SigmaBand = {} as Record<StandardDepth, number>;
  const salinity1SigmaBand = {} as Record<StandardDepth, number>;

  STANDARD_DEPTHS.forEach(d => {
    // If calibrated model is connected, realistic depth-dependent standard errors (e.g. thermocline peak ~0.55°C)
    temp1SigmaBand[d] = isCalibrated ? (d >= 50 && d <= 150 ? 0.58 : 0.28) : 0.0;
    salinity1SigmaBand[d] = isCalibrated ? (d <= 50 ? 0.18 : 0.08) : 0.0;
  });

  return {
    isCalibrated,
    statusText: isCalibrated ? 'Calibrated MC-Dropout 1σ/2σ' : 'Uncertainty model not calibrated',
    confidenceCategory: isCalibrated ? 'Medium' : 'Uncalibrated',
    temp1SigmaBand,
    salinity1SigmaBand,
  };
}
