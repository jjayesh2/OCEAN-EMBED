import { StandardDepth, STANDARD_DEPTHS, PhysicalConsistencyReport } from '../types/ocean';
import { calculateSeawaterDensity, depthToPressureDbar } from './seawaterDensity';
import { computeLayerStability } from './verticalStability';

export function evaluateProfilePhysicalConsistency(
  temps: Record<StandardDepth, number>,
  salinities: Record<StandardDepth, number>
): PhysicalConsistencyReport {
  let convectiveInversions = 0;
  const inversionDepths: number[] = [];
  let minN2 = Infinity;
  let maxN2 = -Infinity;
  let sumGradient = 0;
  let count = 0;

  for (let i = 0; i < STANDARD_DEPTHS.length - 1; i++) {
    const d1 = STANDARD_DEPTHS[i];
    const d2 = STANDARD_DEPTHS[i + 1];

    const p1 = depthToPressureDbar(d1);
    const p2 = depthToPressureDbar(d2);

    const rho1 = calculateSeawaterDensity(salinities[d1], temps[d1], p1);
    const rho2 = calculateSeawaterDensity(salinities[d2], temps[d2], p2);

    const layer = computeLayerStability(d1, rho1, d2, rho2);

    if (layer.N2 < minN2) minN2 = layer.N2;
    if (layer.N2 > maxN2) maxN2 = layer.N2;

    sumGradient += layer.drhoDz;
    count++;

    if (!layer.isStable) {
      convectiveInversions++;
      inversionDepths.push(d2);
    }
  }

  const overallStable = convectiveInversions === 0;

  const statusBadge = overallStable ? '✓ Stable' : '⚠ Review Required';

  const statusExplanation = overallStable
    ? 'Profile passes the selected stability check. In-situ density increases with depth across all 15 standard levels (N² > 0).'
    : `Physically inconsistent stratification detected. Localized density inversion (N² < 0) identified at ${inversionDepths.join(', ')}m depth.`;

  return {
    overallStable,
    statusBadge,
    statusExplanation,
    minN2: Number(minN2.toExponential(3)),
    maxN2: Number(maxN2.toExponential(3)),
    meanDensityGradient: Number((sumGradient / (count || 1)).toFixed(5)),
    convectiveInversionCount: convectiveInversions,
    inversionDepths,
    formulationCitation: 'UNESCO 1983 (EOS-80, Tech Papers Marine Sci 44) with positive-downward hydrostatic pressure',
  };
}
