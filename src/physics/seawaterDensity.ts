/**
 * UNESCO 1983 International Equation of State for Seawater (EOS-80)
 * Technical Papers in Marine Science No. 44, UNESCO, Paris.
 * 
 * Computes in-situ density rho(S, T, p) [kg/m³] from:
 *   S: Practical Salinity [PSU]
 *   T: In-situ Temperature [°C, IPTS-68 / ITS-90]
 *   p: Gauge Pressure [dbar]
 */

/**
 * Pure water density at atmospheric pressure (SMOW)
 */
export function pureWaterDensity(t: number): number {
  return (
    999.842594 +
    6.793952e-2 * t -
    9.095290e-3 * Math.pow(t, 2) +
    1.001685e-4 * Math.pow(t, 3) -
    1.120083e-6 * Math.pow(t, 4) +
    6.536332e-9 * Math.pow(t, 5)
  );
}

/**
 * Standard seawater density at atmospheric pressure (p = 0 dbar)
 */
export function standardSeawaterDensityZeroPressure(s: number, t: number): number {
  const rho_w = pureWaterDensity(t);

  const A =
    8.24493e-1 -
    4.0899e-3 * t +
    7.6438e-5 * Math.pow(t, 2) -
    8.2467e-7 * Math.pow(t, 3) +
    5.3875e-9 * Math.pow(t, 4);

  const B = -5.72466e-3 + 1.0227e-4 * t - 1.6546e-6 * Math.pow(t, 2);

  const C = 4.8314e-4;

  return rho_w + A * s + B * Math.pow(s, 1.5) + C * Math.pow(s, 2);
}

/**
 * Full in-situ seawater density at pressure p (dbar)
 * Uses high-pressure secant bulk modulus K(S, T, p)
 * Note: 1 dbar = 0.1 bar = 10^4 Pa
 */
export function calculateSeawaterDensity(s: number, t: number, pDbar: number = 0): number {
  const rho_0 = standardSeawaterDensityZeroPressure(s, t);

  if (pDbar <= 0) {
    return Number(rho_0.toFixed(3));
  }

  // Convert dbar to bar for standard EOS-80 secant bulk modulus formulas: 1 dbar = 0.1 bar
  const pBar = pDbar * 0.1;

  // Secant bulk modulus at p = 0 bar
  const e = 19652.21 + 148.4206 * t - 2.327105 * Math.pow(t, 2) + 1.360477e-2 * Math.pow(t, 3) - 5.155288e-5 * Math.pow(t, 4);
  const f = 54.6746 - 0.603459 * t + 1.09987e-2 * Math.pow(t, 2) - 6.1670e-5 * Math.pow(t, 3);
  const g_k = 7.944e-2 + 1.6483e-2 * t - 5.3009e-4 * Math.pow(t, 2);
  const K0 = e + f * s + g_k * Math.pow(s, 1.5);

  // Pressure dependence of bulk modulus
  const h_k = 3.239908 + 1.43713e-3 * t + 1.16092e-4 * Math.pow(t, 2) - 5.77905e-7 * Math.pow(t, 3);
  const i_k = 2.2838e-3 - 1.0981e-5 * t - 1.6078e-6 * Math.pow(t, 2);
  const j_k = 1.91075e-4;

  const K =
    K0 +
    (h_k + i_k * s + j_k * Math.pow(s, 1.5)) * pBar +
    (8.50935e-5 - 6.12293e-6 * t + 5.2787e-8 * Math.pow(t, 2)) * Math.pow(pBar, 2);

  const rho = rho_0 / (1.0 - pBar / K);
  return Number(rho.toFixed(3));
}

/**
 * Converts depth [m] to hydrostatic pressure [dbar]
 * Standard oceanographic hydrostatic approximation: p ≈ 0.1005 * z (Saunders 1981)
 */
export function depthToPressureDbar(depthMeters: number): number {
  return Number((0.1005 * depthMeters).toFixed(2));
}
