/**
 * Vertical Water Column Static Stability & Brunt-Väisälä Frequency
 * Convention: Depth z is positive downward [meters].
 * Density rho increases downward in a statically stable water column: drho/dz > 0.
 * 
 * Buoyancy Frequency squared:
 *   N² = (g / rho_0) * (drho / dz)  [s⁻²]
 * 
 * Static Stability Criterion:
 *   N² > 0  => Statically stable (buoyant restoring force)
 *   N² = 0  => Neutrally stratified / fully mixed
 *   N² < 0  => Convectively unstable / density inversion
 */

export interface LayerStabilityResult {
  depthUpper: number;
  depthLower: number;
  dz: number;
  drho: number;
  drhoDz: number;
  N2: number;
  isStable: boolean;
}

export const GRAVITY_G = 9.81; // m/s²
export const RHO_REF_0 = 1025.0; // kg/m³ standard reference density

export function computeLayerStability(
  z1: number,
  rho1: number,
  z2: number,
  rho2: number
): LayerStabilityResult {
  const dz = z2 - z1; // positive downward: z2 > z1
  const drho = rho2 - rho1;
  const drhoDz = dz > 0 ? drho / dz : 0;

  // N² = (g / rho_0) * (drho / dz)
  const N2 = (GRAVITY_G / RHO_REF_0) * drhoDz;

  // Numerical tolerance for neutral stratification
  const isStable = N2 >= -1e-6;

  return {
    depthUpper: z1,
    depthLower: z2,
    dz,
    drho: Number(drho.toFixed(4)),
    drhoDz: Number(drhoDz.toFixed(6)),
    N2: Number(N2.toExponential(3)),
    isStable,
  };
}
