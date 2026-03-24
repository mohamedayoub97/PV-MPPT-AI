export const kB = 1.381e-23;
export const qe = 1.602e-19;
export const Ns_ = 36;
export const n_ = 1.3;
export const G0 = 1000;
export const Tc0 = 298.15;

export const Isc0 = 5.35;
export const Voc0 = 22.2;
export const Eg0 = 1.121;
export const dEgdT = -2.677e-4;
export const alpha = 0.00105;
export const Rs0 = 0.322;
export const Rsh0 = 200;

const a0 = n_ * Ns_ * kB * Tc0 / qe;
const IL0 = Isc0 + Isc0 * Rs0 / Rsh0;
const I00 = (IL0 - Voc0 / Rsh0) / (Math.exp(Voc0 / a0) - 1);

export function dsParams(G: number, Tc_C: number, Rs_ov?: number, Rsh_ov?: number) {
  const Tc = Tc_C + 273.15;
  const IL = (G / G0) * (IL0 + alpha * (Tc - Tc0));
  const Eg = Eg0 * (1 + dEgdT * (Tc - Tc0));
  const I0 = I00 * Math.pow(Tc / Tc0, 3) * Math.exp((qe / kB) * (Eg0 / Tc0 - Eg / Tc));
  const a = n_ * Ns_ * kB * Tc / qe;
  const Rs = Rs_ov !== undefined ? Rs_ov : Rs0;
  const Rsh = Rsh_ov !== undefined ? Rsh_ov : Rsh0 * (G0 / Math.max(1, G));
  return { IL, I0, Rs, Rsh, a };
}

export function brent(f: (x: number) => number, a: number, b: number, tol = 1e-5, max = 80) {
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

export function ivPoint(V: number, p: any) {
  return brent(
    I => p.IL - p.I0 * (Math.exp((V + I * p.Rs) / p.a) - 1) - (V + I * p.Rs) / p.Rsh - I,
    -0.1, p.IL + 1
  );
}

export function ivCurve(G: number, Tc_C: number, Rs_ov?: number, Rsh_ov?: number, npts = 150) {
  const p = dsParams(G, Tc_C, Rs_ov, Rsh_ov);
  const Vc = brent(V => p.IL - p.I0 * (Math.exp(V / p.a) - 1) - V / p.Rsh, 0.5, 30);
  const Vs: number[] = [], Is: number[] = [], Ps: number[] = [];
  for (let k = 0; k < npts; k++) {
    const v = Vc * 0.9999 * k / (npts - 1);
    const i = Math.max(ivPoint(v, p), 0);
    Vs.push(v); Is.push(i); Ps.push(v * i);
  }
  let maxIdx = 0;
  for (let j = 0; j < Ps.length; j++) {
    if (Ps[j] > Ps[maxIdx]) maxIdx = j;
  }
  const area = 1.209 * 0.537;
  return {
    V: Vs, I: Is, P: Ps,
    Vmpp: Vs[maxIdx], Impp: Is[maxIdx], Pmpp: Ps[maxIdx],
    Voc: Vc, Isc: Is[0],
    FF: Ps[maxIdx] / (Vc * Is[0] + 1e-9),
    eta: Ps[maxIdx] / (Math.max(1, G) * area) * 100
  };
}

export function arrayCurve(Ns: number, Np: number, G: number, T: number, npts = 160) {
  const p = dsParams(G, T);
  const Voc_mod = brent(V => p.IL - p.I0 * (Math.exp(V / p.a) - 1) - V / p.Rsh, 0.5, 30);
  const Voc_arr = Ns * Voc_mod;
  const Vs: number[] = [], Is: number[] = [], Ps: number[] = [];
  for (let k = 0; k < npts; k++) {
    const v_arr = Voc_arr * 0.9999 * k / (npts - 1);
    const v_mod = v_arr / Ns;
    const i_mod = Math.max(ivPoint(v_mod, p), 0);
    const i_arr = Np * i_mod;
    Vs.push(v_arr); Is.push(i_arr); Ps.push(v_arr * i_arr);
  }
  let maxIdx = 0;
  for (let j = 0; j < Ps.length; j++) {
    if (Ps[j] > Ps[maxIdx]) maxIdx = j;
  }
  return { V: Vs, I: Is, P: Ps, Vmpp: Vs[maxIdx], Impp: Is[maxIdx], Pmpp: Ps[maxIdx], Voc: Voc_arr, Isc: Is[0] };
}

export function arrayCurveShaded(Ns: number, Np: number, G: number, T: number, shadePct: number, npts = 200) {
  const G2 = Math.max(50, G * (1 - shadePct / 100));
  const p1 = dsParams(G, T);
  const p2 = dsParams(G2, T);
  const Voc1 = brent(V => p1.IL - p1.I0 * (Math.exp(V / p1.a) - 1) - V / p1.Rsh, 0.5, 30);
  const Voc_arr = Ns * Voc1 * 1.05;
  const Vs: number[] = [], Ps: number[] = [];
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

export function boostParams(Vmpp: number, Impp: number, Pmpp: number, Vout: number, fsKHz: number, dil_pct: number, dvin_pct: number, dvout_pct: number, eta_conv: number) {
  const fs = fsKHz * 1e3;
  const D = Math.max(0.01, Math.min(0.98, 1 - Vmpp / Math.max(1, Vout)));
  const dIL = dil_pct * Impp;
  const L = (Vmpp * D) / (Math.max(1e-9, dIL * fs));
  const dVin = dvin_pct * Vmpp;
  const Cin = (Impp * D) / (Math.max(1e-9, dVin * fs));
  const Iout = (Pmpp * eta_conv) / Math.max(1, Vout);
  const dVout = dvout_pct * Vout;
  const Cout = (Iout * D) / (Math.max(1e-9, dVout * fs));
  const IL_avg = Impp / (1 - D);
  const IL_peak = IL_avg + dIL / 2;
  const Ropt = Vmpp * Vmpp / (Pmpp + 1e-9);
  const Pout = Pmpp * eta_conv;
  return { D, L, Cin, Cout, fs, fsKHz, dIL, IL_avg, IL_peak, Ropt, Pout, Iout, dVin, dVout, eta_conv };
}

export function trimf(x: number, a: number, b: number, c: number) { return Math.max(0, Math.min((x - a) / (b - a + 1e-9), (c - x) / (c - b + 1e-9))); }
export function trapmf(x: number, a: number, b: number, c: number, d: number) { return Math.max(0, Math.min(Math.min((x - a) / (b - a + 1e-9), 1), (d - x) / (d - c + 1e-9))); }

export function genTrainCurve(epochs: number, finalMSE: number, speed: number, noise: number, seed: number) {
  let s = seed * 7919 % 100003;
  const lcg = (n: number) => (1664525 * n + 1013904223) >>> 0;
  const arr: number[] = [1.0];
  for (let i = 1; i < epochs; i++) {
    s = lcg(s);
    const r = (s / 4294967296 - 0.5) * noise;
    arr.push(Math.max(finalMSE, arr[i - 1] * Math.exp(-speed) + r * arr[i - 1]));
  }
  return arr;
}

export function genNoise(len: number, amp: number, seed: number) {
  let s = seed;
  const arr: number[] = [];
  const lcg = (n: number) => (1664525 * n + 1013904223) >>> 0;
  for (let i = 0; i < len; i++) {
    s = lcg(s);
    arr.push((s / 4294967296 - 0.5) * 2 * amp);
  }
  return arr;
}

export function runMetaOptimizer(mode: string, Parr: number[], np: number, w: number, maxIt: number) {
  const nPts = Parr.length;
  let gbs = 0, rng = 42;
  const lcg = (s: number) => (1664525 * s + 1013904223) >>> 0;
  const rnd = () => { rng = lcg(rng); return (rng >>> 0) / 4294967296; };
  let pos = Array.from({ length: np }, () => Math.floor(rnd() * nPts));
  let vel = Array.from({ length: np }, () => 0);
  let pbest = [...pos];
  let pbestSc = pos.map(i => Math.max(0, Parr[i] || 0));
  
  let gbestIdx = 0;
  let maxSc = -1;
  pbestSc.forEach((sc, i) => { if (sc > maxSc) { maxSc = sc; gbestIdx = pbest[i]; } });
  gbs = maxSc;

  const convHist: number[] = [gbs];
  
  for (let it = 0; it < maxIt - 1; it++) {
    const decay = mode === 'gwo' ? 1 - it / maxIt : 1;
    for (let i = 0; i < np; i++) {
      if (mode === 'pso') {
        vel[i] = w * vel[i] + 2 * rnd() * (pbest[i] - pos[i]) + 2 * rnd() * (gbestIdx - pos[i]);
        pos[i] = Math.max(0, Math.min(nPts - 1, Math.round(pos[i] + vel[i])));
      } else if (mode === 'gwo') {
        pos[i] = Math.max(0, Math.min(nPts - 1, Math.round((pos[i] + gbestIdx + decay * 2 * rnd() * (gbestIdx - pos[i])) / 2)));
      } else {
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
