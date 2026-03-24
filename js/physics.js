/**
 * physics.js — BP Solar 485J Physical Model
 * De Soto et al. Solar Energy 80(1):78-88, 2006
 * Villalva et al. IEEE Trans. Power Electron. 24(5):1198-1208, 2009
 */

// ── Module constants ──
const kB    = 1.381e-23;   // Boltzmann constant [J/K]
const qe    = 1.602e-19;   // Electron charge [C]
const Ns_   = 36;           // Cells in series per module
const n_    = 1.3;          // Ideality factor
const G0    = 1000;         // Reference irradiance [W/m²]
const Tc0   = 298.15;       // Reference temperature [K]

// BP Solar 485J STC parameters
const Isc0  = 5.35;         // Short-circuit current [A]
const Voc0  = 22.2;         // Open-circuit voltage [V]
const Eg0   = 1.121;        // Band-gap energy Si [eV]
const dEgdT = -2.677e-4;    // Band-gap temperature coefficient
const alpha = 0.00105;      // Isc temperature coefficient [A/K]
const Rs0   = 0.322;        // Series resistance [Ω]
const Rsh0  = 200;          // Shunt resistance at STC [Ω]

// Derived constants
const a0   = n_ * Ns_ * kB * Tc0 / qe;
const IL0  = Isc0 + Isc0 * Rs0 / Rsh0;
const I00  = (IL0 - Voc0 / Rsh0) / (Math.exp(Voc0 / a0) - 1);

/**
 * Compute De Soto parameters at given G, T, Rs, Rsh
 */
function dsParams(G, Tc_C, Rs_ov, Rsh_ov) {
  const Tc  = Tc_C + 273.15;
  const IL  = (G / G0) * (IL0 + alpha * (Tc - Tc0));
  const Eg  = Eg0 * (1 + dEgdT * (Tc - Tc0));
  const I0  = I00 * Math.pow(Tc / Tc0, 3) * Math.exp((qe / kB) * (Eg0 / Tc0 - Eg / Tc));
  const a   = n_ * Ns_ * kB * Tc / qe;
  const Rs  = Rs_ov  !== undefined ? Rs_ov  : Rs0;
  const Rsh = Rsh_ov !== undefined ? Rsh_ov : Rsh0 * (G0 / G);
  return { IL, I0, Rs, Rsh, a };
}

/**
 * Brent's method — find root of f in [a, b]
 */
function brent(f, a, b, tol = 1e-5, max = 80) {
  let fa = f(a), fb = f(b);
  if (fa * fb > 0) return (a + b) / 2;
  let c = a, fc = fa, s;
  for (let i = 0; i < max; i++) {
    if (Math.abs(b - a) < tol) return (a + b) / 2;
    if (fa !== fc && fb !== fc)
      s = (a * fb * fc) / ((fa - fb) * (fa - fc)) + (b * fa * fc) / ((fb - fa) * (fb - fc)) + (c * fa * fb) / ((fc - fa) * (fc - fb));
    else
      s = (a + b) / 2;
    if (s < (3 * a + b) / 4 || s > b || Math.abs(s - b) >= Math.abs(b - c) / 2)
      s = (a + b) / 2;
    const fs = f(s); c = b; fc = fb;
    if (fa * fs < 0) { b = s; fb = fs; } else { a = s; fa = fs; }
    if (Math.abs(fa) < Math.abs(fb)) { [a, b] = [b, a]; [fa, fb] = [fb, fa]; }
  }
  return (a + b) / 2;
}

/**
 * Compute current I at voltage V for a module with params p
 */
function ivPoint(V, p) {
  return brent(
    I => p.IL - p.I0 * (Math.exp((V + I * p.Rs) / p.a) - 1) - (V + I * p.Rs) / p.Rsh - I,
    -0.1, p.IL + 1
  );
}

/**
 * Compute full I-V curve for a SINGLE module
 * Returns { V, I, P, Vmpp, Impp, Pmpp, Voc, Isc, FF, eta }
 */
function ivCurve(G, Tc_C, Rs_ov, Rsh_ov, npts = 150) {
  const p   = dsParams(G, Tc_C, Rs_ov, Rsh_ov);
  const Vc  = brent(V => p.IL - p.I0 * (Math.exp(V / p.a) - 1) - V / p.Rsh, 0.5, 30);
  const Vs  = [], Is = [], Ps = [];
  for (let k = 0; k < npts; k++) {
    const v = Vc * 0.9999 * k / (npts - 1);
    const i = Math.max(ivPoint(v, p), 0);
    Vs.push(v); Is.push(i); Ps.push(v * i);
  }
  let idx = 0;
  Ps.forEach((pp, i) => { if (pp > Ps[idx]) idx = i; });
  const area = 1.209 * 0.537; // module area m² (BP485J)
  return {
    V: Vs, I: Is, P: Ps,
    Vmpp: Vs[idx], Impp: Is[idx], Pmpp: Ps[idx],
    Voc: Vc, Isc: Is[0],
    FF: Ps[idx] / (Vc * Is[0]),
    eta: Ps[idx] / (G * area) * 100
  };
}

/**
 * Compute full I-V curve for an ARRAY of Ns×Np modules
 * V_array = Ns * V_module, I_array = Np * I_module
 */
function arrayCurve(Ns, Np, G, T, npts = 160) {
  const p       = dsParams(G, T);
  const Voc_mod = brent(V => p.IL - p.I0 * (Math.exp(V / p.a) - 1) - V / p.Rsh, 0.5, 30);
  const Voc_arr = Ns * Voc_mod;
  const Vs = [], Is = [], Ps = [];
  for (let k = 0; k < npts; k++) {
    const v_arr = Voc_arr * 0.9999 * k / (npts - 1);
    const v_mod = v_arr / Ns;
    const i_mod = Math.max(ivPoint(v_mod, p), 0);
    const i_arr = Np * i_mod;
    Vs.push(v_arr); Is.push(i_arr); Ps.push(v_arr * i_arr);
  }
  let idx = 0;
  Ps.forEach((pp, i) => { if (pp > Ps[idx]) idx = i; });
  return { V: Vs, I: Is, P: Ps, Vmpp: Vs[idx], Impp: Is[idx], Pmpp: Ps[idx], Voc: Voc_arr, Isc: Is[0] };
}

/**
 * Array P-V curve under partial shading
 * One string shaded to G*(1 - shadePct/100), rest at G
 */
function arrayCurveShaded(Ns, Np, G, T, shadePct, npts = 200) {
  const G2   = Math.max(50, G * (1 - shadePct / 100));
  const p1   = dsParams(G, T);
  const p2   = dsParams(G2, T);
  const Voc1 = brent(V => p1.IL - p1.I0 * (Math.exp(V / p1.a) - 1) - V / p1.Rsh, 0.5, 30);
  const Voc_arr = Ns * Voc1 * 1.05;
  const Vs = [], Ps = [];
  for (let k = 0; k < npts; k++) {
    const v_arr = Voc_arr * 0.999 * k / (npts - 1);
    const v_mod = v_arr / Ns;
    const i_norm = Np > 1 ? (Np - 1) * Math.max(ivPoint(v_mod, p1), 0) : 0;
    const i_shad = Math.max(ivPoint(v_mod, p2), 0);
    Vs.push(v_arr);
    Ps.push(v_arr * (i_norm + i_shad));
  }
  return { V: Vs, P: Ps };
}

/**
 * Compute boost converter parameters from array MPP
 * [Ayop & Tan, Solar Energy 160:322-335, 2018]
 * [Mohan, Undeland & Robbins, Power Electronics, Wiley 2003]
 */
function boostParams(Vmpp, Impp, Pmpp, Vout, fsKHz, dil_pct, dvin_pct, dvout_pct, eta_conv) {
  const fs      = fsKHz * 1e3;
  const D       = Math.max(0.01, Math.min(0.98, 1 - Vmpp / Vout));
  const dIL     = dil_pct * Impp;
  const L       = (Vmpp * D) / (dIL * fs);
  const dVin    = dvin_pct * Vmpp;
  const Cin     = (Impp * D) / (dVin * fs);
  const Iout    = (Pmpp * eta_conv) / Vout;
  const dVout   = dvout_pct * Vout;
  const Cout    = (Iout * D) / (dVout * fs);
  const IL_avg  = Impp / (1 - D);
  const IL_peak = IL_avg + dIL / 2;
  const Ropt    = Vmpp * Vmpp / Pmpp;
  const Pout    = Pmpp * eta_conv;
  return { D, L, Cin, Cout, fs, fsKHz, dIL, IL_avg, IL_peak, Ropt, Pout, Iout, dVin, dVout, eta_conv };
}

/**
 * Simulate P&O MPPT on array
 */
function simulatePO(Ns, Np, G, T, dV_mod, nit) {
  const p       = dsParams(G, T);
  const Voc_mod = brent(V => p.IL - p.I0 * (Math.exp(V / p.a) - 1) - V / p.Rsh, 0.5, 30);
  const Voc_arr = Ns * Voc_mod;
  const getP    = v => { const vm = v / Ns; return Np * vm * Math.max(ivPoint(vm, p), 0); };
  let V_arr = 0.6 * Voc_arr, step = dV_mod * Ns;
  let Pprev = getP(V_arr);
  const Phs = [Pprev];
  let convIt = null;
  const Pm = arrayCurve(Ns, Np, G, T, 80).Pmpp;
  for (let i = 0; i < nit; i++) {
    const Vn = Math.max(0.1, Math.min(V_arr + step, Voc_arr * 0.999));
    const Pn = getP(Vn);
    if (Pn >= Pprev) V_arr = Vn;
    else { step = -step; V_arr = Math.max(0.1, Math.min(V_arr + step, Voc_arr * 0.999)); }
    Pprev = getP(V_arr);
    Phs.push(Pprev);
    if (convIt === null && Pprev >= Pm * 0.99) convIt = i + 1;
  }
  const eta = Phs.slice(Math.floor(nit * 0.6)).reduce((a, b) => a + b, 0)
              / Math.floor(nit * 0.4) / Pm * 100;
  return { P: Phs, eta, conv: convIt || nit, Pm };
}

/**
 * Simulate INC MPPT on array
 */
function simulateINC(Ns, Np, G, T, dV_mod, nit) {
  const p       = dsParams(G, T);
  const Voc_mod = brent(V => p.IL - p.I0 * (Math.exp(V / p.a) - 1) - V / p.Rsh, 0.5, 30);
  const Voc_arr = Ns * Voc_mod;
  const getI    = v => Np * Math.max(ivPoint(v / Ns, p), 0);
  let V_arr = 0.6 * Voc_arr, step = dV_mod * Ns;
  let Iprev = getI(V_arr);
  const Phs = [V_arr * Iprev];
  let convIt = null;
  const Pm = arrayCurve(Ns, Np, G, T, 80).Pmpp;
  for (let i = 0; i < nit; i++) {
    const Vn = Math.max(0.1, Math.min(V_arr + step, Voc_arr * 0.999));
    const In = getI(Vn);
    const dI = In - Iprev, dV_ = Vn - V_arr;
    if (Math.abs(dV_) > 1e-5) {
      const ic = dI / (dV_ + 1e-9), gc = -In / (Vn + 1e-9);
      if (Math.abs(ic - gc) >= 0.02) { if (ic > gc) step = Math.abs(step); else step = -Math.abs(step); }
    }
    V_arr = Vn; Iprev = In;
    const Pc = V_arr * In;
    Phs.push(Pc);
    if (convIt === null && Pc >= Pm * 0.99) convIt = i + 1;
  }
  const eta = Phs.slice(Math.floor(nit * 0.6)).reduce((a, b) => a + b, 0)
              / Math.floor(nit * 0.4) / Pm * 100;
  return { P: Phs, eta, conv: convIt || nit, Pm };
}

/**
 * Metaheuristic optimization on array P-V (PSO/GWO/GA)
 */
function runMetaOptimizer(mode, Parr, np, w, maxIt) {
  const nPts = Parr.length;
  let gbs = 0, rng = Date.now() % 10000;
  const lcg = s => (1664525 * s + 1013904223) & 0xffffffff;
  const rnd = () => { rng = lcg(rng); return (rng >>> 0) / 4294967296; };
  let pos      = Array.from({ length: np }, () => Math.floor(rnd() * nPts));
  let vel      = Array.from({ length: np }, () => 0);
  let pbest    = [...pos];
  let pbestSc  = pos.map(i => Math.max(0, Parr[i] || 0));
  let gbestIdx = pbest[pbestSc.indexOf(Math.max(...pbestSc))];
  gbs = Math.max(...pbestSc);
  const convHist = [gbs];
  for (let it = 0; it < maxIt - 1; it++) {
    const decay = mode === 'gwo' ? 1 - it / maxIt : 1;
    for (let i = 0; i < np; i++) {
      if (mode === 'pso') {
        vel[i] = w * vel[i] + 2 * rnd() * (pbest[i] - pos[i]) + 2 * rnd() * (gbestIdx - pos[i]);
        pos[i] = Math.max(0, Math.min(nPts - 1, Math.round(pos[i] + vel[i])));
      } else if (mode === 'gwo') {
        pos[i] = Math.max(0, Math.min(nPts - 1, Math.round((pos[i] + gbestIdx + decay * 2 * rnd() * (gbestIdx - pos[i])) / 2)));
      } else { // GA
        if (rnd() < 0.7) pos[i] = Math.max(0, Math.min(nPts - 1, Math.round(pbest[i] + (rnd() - 0.5) * 20)));
        else pos[i] = Math.floor(rnd() * nPts);
      }
      const sc = Math.max(0, Parr[pos[i]] || 0);
      if (sc > pbestSc[i]) { pbest[i] = pos[i]; pbestSc[i] = sc; }
      if (sc > gbs) { gbestIdx = pos[i]; gbs = sc; }
    }
    convHist.push(gbs);
  }
  return { gbs, convHist };
}

/**
 * Fuzzy MF functions
 */
function trimf(x, a, b, c) { return Math.max(0, Math.min((x - a) / (b - a + 1e-9), (c - x) / (c - b + 1e-9))); }
function trapmf(x, a, b, c, d) { return Math.max(0, Math.min(Math.min((x - a) / (b - a + 1e-9), 1), (d - x) / (d - c + 1e-9))); }

/**
 * Training curve generator (simulated)
 */
function genTrainCurve(epochs, finalMSE, speed, noise, seed) {
  let s = seed * 7919 % 100003;
  const lcg = n => (1664525 * n + 1013904223) >>> 0;
  const arr = [1.0];
  for (let i = 1; i < epochs; i++) {
    s = lcg(s);
    const r = (s / 4294967296 - 0.5) * noise;
    arr.push(Math.max(finalMSE, arr[i - 1] * Math.exp(-speed) + r * arr[i - 1]));
  }
  return arr;
}

/**
 * Gaussian noise generator
 */
function genNoise(len, amp, seed) {
  let s = seed;
  const arr = [];
  for (let i = 0; i < len; i++) {
    s = (1664525 * s + 1013904223) >>> 0;
    arr.push((s / 4294967296 - 0.5) * 2 * amp);
  }
  return arr;
}

// ════════════════════════════════════════════
// Global array state — declared here so charts.js
// can reference them before app.js loads
// ════════════════════════════════════════════
var ARR_NS = 2;
var ARR_NP = 3;
var ARR_G  = 1000;
var ARR_T  = 25;
