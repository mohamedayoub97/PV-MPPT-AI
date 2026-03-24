/**
 * charts.js — Chart.js rendering engine
 * All chart creation and update functions
 */

// ── Chart registry ──
const CH = {};

// ── Color palette ──
const C = {
  blue:   '#4f8ef7', orange: '#f97316', green: '#22c55e',
  gold:   '#f5c842', purple: '#a78bfa', teal:  '#2dd4bf',
  red:    '#ef4444', pink:   '#f472b6', muted: '#58567a'
};

// ── Default tooltip ──
const TT = {
  backgroundColor: 'rgba(7,7,14,.96)',
  titleColor: '#f5c842', bodyColor: '#9b99b6',
  borderColor: '#252540', borderWidth: 1, padding: 10
};

// ── Default grid ──
const GR = { color: 'rgba(37,37,64,0.55)' };

// ── Default tick font ──
const TF = { family: "'JetBrains Mono', monospace", size: 9 };

/**
 * Factory: create or replace a Chart.js chart
 */
function mkChart(id, type, data, extraOpts) {
  if (CH[id]) CH[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) { console.warn('Canvas not found:', id); return null; }
  CH[id] = new Chart(ctx, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#9b99b6', font: { family: "'Space Grotesk', sans-serif", size: 10 } } },
        tooltip: TT
      },
      scales: {
        x: { grid: GR, ticks: { color: C.muted, font: TF } },
        y: { grid: GR, ticks: { color: C.muted, font: TF } }
      },
      animation: { duration: 320 },
      ...extraOpts
    }
  });
  return CH[id];
}

// ════════════════════════════════════════════
// PV MARKET (S1)
// ════════════════════════════════════════════
const pvMarketData = {
  capacite: {
    labels: Array.from({ length: 27 }, (_, i) => 2000 + i),
    datasets: [{
      label: 'Capacité GW',
      data: [1.4,1.7,2.0,2.3,2.7,3.3,4.5,6.0,14,22,38,68,97,133,176,227,291,384,493,593,710,936,1177,1419,1632,1870,2100],
      borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.09)',
      fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: C.blue
    }]
  },
  cout: {
    labels: Array.from({ length: 27 }, (_, i) => 2000 + i),
    datasets: [{
      label: 'Prix USD/Wc',
      data: [4.5,4.2,4.0,3.8,3.6,3.4,3.2,3.0,2.8,2.5,2.0,1.5,0.9,0.7,0.65,0.6,0.5,0.4,0.35,0.30,0.28,0.26,0.24,0.22,0.21,0.20,0.19],
      borderColor: C.orange, backgroundColor: 'rgba(249,115,22,.09)',
      fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: C.orange
    }]
  },
  lcoe: {
    labels: Array.from({ length: 27 }, (_, i) => 2000 + i),
    datasets: [{
      label: 'LCOE USD/kWh',
      data: [.40,.38,.36,.34,.32,.30,.27,.24,.20,.17,.13,.10,.08,.07,.065,.06,.055,.05,.045,.04,.035,.032,.030,.028,.025,.022,.020],
      borderColor: C.green, backgroundColor: 'rgba(34,197,94,.09)',
      fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: C.green
    }]
  }
};

let pvMode = 'capacite';

function showPVChart(m, btn) {
  pvMode = m || pvMode;
  document.querySelectorAll('#s1 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const ylabels = { capacite: 'GW', cout: 'USD/Wc', lcoe: 'USD/kWh' };
  mkChart('chartPV', 'line', pvMarketData[pvMode], {
    scales: {
      x: { title: { display: true, text: 'Année', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } },
      y: { title: { display: true, text: ylabels[pvMode], color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } }
    }
  });
}

// ════════════════════════════════════════════
// SINGLE MODULE I-V / P-V (S2)
// ════════════════════════════════════════════
let ivMode = 'iv';

function setIVmode(m, btn) {
  ivMode = m;
  document.querySelectorAll('#s2 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  updateIV();
}

function updateIV() {
  const G   = parseFloat(document.getElementById('G_sl').value)   || 1000;
  const T   = parseFloat(document.getElementById('T_sl').value)   || 25;
  const Rs  = parseFloat(document.getElementById('Rs_sl').value)  / 100;
  const Rsh = parseFloat(document.getElementById('Rsh_sl').value) || 200;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('G_val', G); set('T_val', T); set('Rs_val', Rs.toFixed(2)); set('Rsh_val', Rsh);

  const cur = ivCurve(G, T, Rs, Rsh, 120);
  const stc = ivCurve(1000, 25, Rs0, Rsh0, 120);

  set('kp_pmpp', cur.Pmpp.toFixed(2) + ' W'); set('kp_vmpp', cur.Vmpp.toFixed(2) + ' V');
  set('kp_impp', cur.Impp.toFixed(3) + ' A'); set('kp_voc',  cur.Voc.toFixed(3)  + ' V');
  set('kp_isc',  cur.Isc.toFixed(3)  + ' A'); set('kp_ff',   (cur.FF * 100).toFixed(1) + '%');
  set('kp_eta',  cur.eta.toFixed(2)  + '%');

  const ds = [];
  if (ivMode === 'iv' || ivMode === 'both') {
    ds.push({ label: `I-V (G=${G}, T=${T}°C)`, data: cur.V.map((v, i) => ({ x: v, y: cur.I[i] })), borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.07)', fill: ivMode === 'iv', tension: .3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yI', parsing: false });
    ds.push({ label: 'MPP', data: [{ x: cur.Vmpp, y: cur.Impp }], borderColor: C.orange, backgroundColor: C.orange, pointRadius: 8, pointStyle: 'star', showLine: false, yAxisID: 'yI', parsing: false });
    if (ivMode === 'both') ds.push({ label: 'I-V STC', data: stc.V.map((v, i) => ({ x: v, y: stc.I[i] })), borderColor: '#363655', borderDash: [5, 5], borderWidth: 1.5, fill: false, tension: .3, pointRadius: 0, yAxisID: 'yI', parsing: false });
  }
  if (ivMode === 'pv' || ivMode === 'both') {
    ds.push({ label: `P-V (G=${G}, T=${T}°C)`, data: cur.V.map((v, i) => ({ x: v, y: cur.P[i] })), borderColor: C.green, backgroundColor: 'rgba(34,197,94,.07)', fill: ivMode === 'pv', tension: .3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yP', parsing: false });
    ds.push({ label: `P_MPP=${cur.Pmpp.toFixed(1)}W`, data: [{ x: cur.Vmpp, y: cur.Pmpp }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 8, pointStyle: 'star', showLine: false, yAxisID: 'yP', parsing: false });
    if (ivMode === 'both') ds.push({ label: 'P-V STC', data: stc.V.map((v, i) => ({ x: v, y: stc.P[i] })), borderColor: '#363655', borderDash: [5, 5], borderWidth: 1.5, fill: false, tension: .3, pointRadius: 0, yAxisID: 'yP', parsing: false });
  }

  const sc = { x: { type: 'linear', title: { display: true, text: 'Tension V (V)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF }, min: 0 } };
  if (ivMode !== 'pv')  sc.yI = { type: 'linear', position: 'left',  title: { display: true, text: 'Courant I (A)',    color: C.blue  }, grid: GR, ticks: { color: C.blue,  font: TF }, min: 0 };
  if (ivMode !== 'iv')  sc.yP = { type: 'linear', position: ivMode === 'both' ? 'right' : 'left', title: { display: true, text: 'Puissance P (W)', color: C.green }, ticks: { color: C.green, font: TF }, min: 0 };

  if (CH.chartIV) CH.chartIV.destroy();
  CH.chartIV = new Chart(document.getElementById('chartIV'), {
    type: 'line', data: { datasets: ds },
    options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: { ...TT, mode: 'index', intersect: false } }, scales: sc, animation: { duration: 300 } }
  });
}

// ════════════════════════════════════════════
// ARRAY CHARTS (s_array)
// ════════════════════════════════════════════
let arrayMode = 'iv';
let arrayShadeLevel = 0;

function setArrayMode(m, btn) {
  arrayMode = m;
  document.querySelectorAll('[data-group="array-mode"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  updateArrayChart();
}

function setShadeLevel(lvl, btn) {
  arrayShadeLevel = lvl;
  document.querySelectorAll('[data-group="shade-level"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  updateArrayShadeChart();
}

function updateArrayChart() {
  const ctx = document.getElementById('chartArray');
  if (!ctx) return;
  const cur = arrayCurve(ARR_NS, ARR_NP, ARR_G, ARR_T, 160);
  const ds  = [];

  if (arrayMode === 'multi') {
    const Gs   = [200, 400, 600, 800, 1000, 1200];
    const cols = ['#5c5a78', '#7c6af7', C.purple, C.blue, C.teal, C.gold];
    Gs.forEach((g, gi) => {
      const cm = arrayCurve(ARR_NS, ARR_NP, g, ARR_T, 120);
      ds.push({ label: `G=${g} W/m²`, data: cm.V.map((v, i) => ({ x: v, y: cm.P[i] })), borderColor: cols[gi], borderWidth: gi === 4 ? 2.5 : 1.8, pointRadius: 0, tension: .3, fill: false, parsing: false });
      ds.push({ data: [{ x: cm.Vmpp, y: cm.Pmpp }], borderColor: cols[gi], backgroundColor: cols[gi], pointRadius: 6, pointStyle: 'star', showLine: false, label: '_nm', parsing: false });
    });
    if (CH.chartArray) CH.chartArray.destroy();
    CH.chartArray = new Chart(ctx, {
      type: 'line', data: { datasets: ds },
      options: { responsive: true, maintainAspectRatio: false, parsing: false,
        plugins: { legend: { labels: { color: '#9b99b6', font: { size: 9 }, filter: i => !i.text.startsWith('_') } }, tooltip: TT },
        scales: {
          x: { type: 'linear', title: { display: true, text: `Tension réseau (V) — Ns=${ARR_NS}`, color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 10 }, min: 0 },
          y: { title: { display: true, text: 'Puissance réseau P (W)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF }, min: 0 }
        }, animation: { duration: 350 }
      }
    });
    return;
  }

  if (arrayMode === 'iv' || arrayMode === 'both') {
    ds.push({ label: `I-V réseau (G=${ARR_G}, T=${ARR_T}°C)`, data: cur.V.map((v, i) => ({ x: v, y: cur.I[i] })), borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.07)', fill: arrayMode === 'iv', tension: .3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yI', parsing: false });
    ds.push({ label: `MPP (${cur.Vmpp.toFixed(1)}V, ${cur.Impp.toFixed(2)}A)`, data: [{ x: cur.Vmpp, y: cur.Impp }], borderColor: C.orange, backgroundColor: C.orange, pointRadius: 8, pointStyle: 'star', showLine: false, yAxisID: 'yI', parsing: false });
  }
  if (arrayMode === 'pv' || arrayMode === 'both') {
    ds.push({ label: `P-V réseau (G=${ARR_G}, T=${ARR_T}°C)`, data: cur.V.map((v, i) => ({ x: v, y: cur.P[i] })), borderColor: C.green, backgroundColor: 'rgba(34,197,94,.07)', fill: arrayMode === 'pv', tension: .3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yP', parsing: false });
    ds.push({ label: `P_MPP=${cur.Pmpp.toFixed(1)} W`, data: [{ x: cur.Vmpp, y: cur.Pmpp }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 8, pointStyle: 'star', showLine: false, yAxisID: 'yP', parsing: false });
  }

  const sc = { x: { type: 'linear', title: { display: true, text: `Tension réseau (V) — Ns=${ARR_NS}`, color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF }, min: 0 } };
  if (arrayMode !== 'pv')  sc.yI = { type: 'linear', position: 'left',  title: { display: true, text: `Courant réseau (A) — Np=${ARR_NP}`, color: C.blue  }, grid: GR, ticks: { color: C.blue,  font: TF }, min: 0 };
  if (arrayMode !== 'iv')  sc.yP = { type: 'linear', position: arrayMode === 'both' ? 'right' : 'left', title: { display: true, text: 'Puissance réseau (W)', color: C.green }, ticks: { color: C.green, font: TF }, min: 0 };

  if (CH.chartArray) CH.chartArray.destroy();
  CH.chartArray = new Chart(ctx, {
    type: 'line', data: { datasets: ds },
    options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: { ...TT, mode: 'index', intersect: false } }, scales: sc, animation: { duration: 350 } }
  });
}

function updateArrayShadeChart() {
  const ctx   = document.getElementById('chartArrayShade');
  if (!ctx) return;
  const cFull = arrayCurve(ARR_NS, ARR_NP, ARR_G, ARR_T, 160);
  const ds    = [];
  const set   = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  if (arrayShadeLevel === 0) {
    ds.push({ label: 'P-V réseau (sans ombrage)', data: cFull.V.map((v, i) => ({ x: v, y: cFull.P[i] })), borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.09)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2, parsing: false });
    ds.push({ label: `GMP=${cFull.Pmpp.toFixed(1)} W`, data: [{ x: cFull.Vmpp, y: cFull.Pmpp }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 9, pointStyle: 'star', showLine: false, parsing: false });
    set('shade_gmp', cFull.Pmpp.toFixed(1) + ' W'); set('shade_lmp', '—'); set('shade_loss', '0%');
  } else {
    const cS   = arrayCurveShaded(ARR_NS, ARR_NP, ARR_G, ARR_T, arrayShadeLevel, 220);
    const Pmax = Math.max(...cS.P);
    const Pidx = cS.P.indexOf(Pmax);
    // Find local max (LMP)
    let lmpP = 0, lmpV = 0;
    for (let i = 3; i < cS.P.length - 3; i++) {
      const avg = (cS.P[i-2] + cS.P[i-1] + cS.P[i] + cS.P[i+1] + cS.P[i+2]) / 5;
      if (avg > cS.P[i-1] && avg > cS.P[i+1] && cS.V[i] < cS.V[Pidx] * 0.72 && avg > lmpP) {
        lmpP = avg; lmpV = cS.V[i];
      }
    }
    ds.push({ label: `P-V ombré ${arrayShadeLevel}%`, data: cS.V.map((v, i) => ({ x: v, y: cS.P[i] })), borderColor: C.orange, backgroundColor: 'rgba(249,115,22,.08)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2, parsing: false });
    ds.push({ label: 'P-V sans ombrage (réf)', data: cFull.V.map((v, i) => ({ x: v, y: cFull.P[i] })), borderColor: '#363655', borderDash: [5, 5], borderWidth: 1.5, fill: false, tension: .3, pointRadius: 0, parsing: false });
    ds.push({ label: `GMP=${Pmax.toFixed(1)} W`, data: [{ x: cS.V[Pidx], y: Pmax }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 9, pointStyle: 'star', showLine: false, parsing: false });
    if (lmpP > 50) ds.push({ label: `LMP=${lmpP.toFixed(1)} W`, data: [{ x: lmpV, y: lmpP }], borderColor: C.red, backgroundColor: C.red, pointRadius: 7, pointStyle: 'triangle', showLine: false, parsing: false });
    set('shade_gmp', Pmax.toFixed(1) + ' W');
    set('shade_lmp', lmpP > 50 ? lmpP.toFixed(1) + ' W' : '—');
    set('shade_loss', ((1 - Pmax / cFull.Pmpp) * 100).toFixed(1) + '%');
  }

  if (CH.chartArrayShade) CH.chartArrayShade.destroy();
  CH.chartArrayShade = new Chart(ctx, {
    type: 'line', data: { datasets: ds },
    options: { responsive: true, maintainAspectRatio: false, parsing: false,
      plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: { ...TT, mode: 'index', intersect: false } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Tension réseau (V)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF }, min: 0 },
        y: { title: { display: true, text: 'Puissance réseau (W)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF }, min: 0 }
      }, animation: { duration: 350 }
    }
  });
}

// ════════════════════════════════════════════
// BOOST CONVERTER CHARTS (s_boost)
// ════════════════════════════════════════════
let boostChartMode  = 'duty';
let boostChart2Mode = 'wave';

function setBoostChart(mode, btn) {
  boostChartMode = mode;
  document.querySelectorAll('[data-group="boost1"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBoostChart1();
}

function setBoostChart2(mode, btn) {
  boostChart2Mode = mode;
  document.querySelectorAll('[data-group="boost2"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBoostChart2();
}

function renderBoostChart1() {
  const ctx = document.getElementById('chartBoost1');
  if (!ctx) return;
  const cur  = arrayCurve(ARR_NS, ARR_NP, ARR_G, ARR_T, 120);
  const Vout = Math.max(cur.Vmpp * 1.05, parseFloat(document.getElementById('b_vout').value) || 48);
  const p    = boostParams(cur.Vmpp, cur.Impp, cur.Pmpp, Vout,
    parseFloat(document.getElementById('b_fs').value)    || 20,
    (parseFloat(document.getElementById('b_dil').value)  || 30) / 100,
    (parseFloat(document.getElementById('b_dvin').value) || 1)  / 100,
    (parseFloat(document.getElementById('b_dvout').value)|| 1)  / 100,
    (parseFloat(document.getElementById('b_eff').value)  || 95) / 100);

  if (CH.chartBoost1) CH.chartBoost1.destroy();

  if (boostChartMode === 'duty') {
    const Vouts = Array.from({ length: 80 }, (_, i) => cur.Vmpp * 1.02 + i * (cur.Vmpp * 6 - cur.Vmpp * 1.02) / 79);
    const Ds    = Vouts.map(v => Math.max(0.01, Math.min(0.98, 1 - cur.Vmpp / v)));
    const Gains = Vouts.map(v => v / cur.Vmpp);
    CH.chartBoost1 = new Chart(ctx, {
      type: 'line',
      data: { labels: Vouts.map(v => v.toFixed(0)), datasets: [
        { label: 'D = 1 − V_MPP/V_out', data: Ds, borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.08)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yD' },
        { label: 'Gain G = V_out/V_MPP', data: Gains, borderColor: C.orange, backgroundColor: 'transparent', tension: .4, pointRadius: 0, borderWidth: 2, yAxisID: 'yG' },
        { label: `▲ D=${(p.D*100).toFixed(1)}% @ V_out=${Vout.toFixed(1)}V`, data: [{ x: Vout.toFixed(0), y: p.D }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 10, pointStyle: 'star', showLine: false, yAxisID: 'yD' }
      ]},
      options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: TT },
        scales: {
          x: { title: { display: true, text: 'Tension de sortie V_out (V)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 10 } },
          yD: { type: 'linear', position: 'left', min: 0, max: 1, title: { display: true, text: 'Rapport cyclique D', color: C.blue }, grid: GR, ticks: { color: C.blue, font: TF } },
          yG: { type: 'linear', position: 'right', min: 1, title: { display: true, text: 'Gain G', color: C.orange }, grid: { display: false }, ticks: { color: C.orange, font: TF } }
        }}
    });

  } else if (boostChartMode === 'inductor') {
    const fss  = Array.from({ length: 60 }, (_, i) => 1 + i * 199 / 59);
    const dils = [0.1, 0.2, 0.3, 0.4, 0.5];
    const cols = [C.red, C.orange, C.blue, C.green, C.purple];
    const ds   = dils.map((dil, i) => ({
      label: `ΔiL=${dil*100}% I_MPP`,
      data: fss.map(f => (cur.Vmpp * p.D / (dil * cur.Impp * f * 1e3)) * 1e3),
      borderColor: cols[i], backgroundColor: 'transparent',
      tension: .4, pointRadius: 0, borderWidth: i === 2 ? 2.5 : 1.8,
      borderDash: i === 2 ? undefined : [4, 3]
    }));
    ds.push({ label: `▲ L=${(p.L*1e3).toFixed(3)} mH`, data: [{ x: p.fsKHz, y: p.L * 1e3 }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 10, pointStyle: 'star', showLine: false, parsing: false });
    CH.chartBoost1 = new Chart(ctx, {
      type: 'line', data: { labels: fss.map(f => f.toFixed(0)), datasets: ds },
      options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: TT },
        scales: { x: { title: { display: true, text: 'Fréquence fs (kHz)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 10 } }, y: { title: { display: true, text: 'Inductance L (mH)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } } } }
    });

  } else if (boostChartMode === 'caps') {
    const fss  = Array.from({ length: 60 }, (_, i) => 1 + i * 199 / 59);
    const Cins = fss.map(f => (cur.Impp * p.D / (0.01 * cur.Vmpp * f * 1e3)) * 1e6);
    const Couts= fss.map(f => (p.Iout * p.D / (0.01 * Vout * f * 1e3)) * 1e6);
    CH.chartBoost1 = new Chart(ctx, {
      type: 'line', data: { labels: fss.map(f => f.toFixed(0)), datasets: [
        { label: 'C_in (µF) — ΔVin=1%',  data: Cins,  borderColor: C.blue,   backgroundColor: 'rgba(79,142,247,.08)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5 },
        { label: 'C_out (µF) — ΔVout=1%', data: Couts, borderColor: C.orange, backgroundColor: 'rgba(249,115,22,.08)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5 },
        { label: `▲ C_in=${(p.Cin*1e6).toFixed(1)}µF`,  data: [{ x: p.fsKHz, y: p.Cin*1e6 }],  borderColor: C.green, backgroundColor: C.green, pointRadius: 9, pointStyle: 'star', showLine: false, parsing: false },
        { label: `▲ C_out=${(p.Cout*1e6).toFixed(1)}µF`, data: [{ x: p.fsKHz, y: p.Cout*1e6 }], borderColor: C.gold,  backgroundColor: C.gold,  pointRadius: 9, pointStyle: 'star', showLine: false, parsing: false }
      ]},
      options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: TT },
        scales: { x: { title: { display: true, text: 'Fréquence fs (kHz)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 10 } }, y: { title: { display: true, text: 'Capacité (µF)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } } } }
    });

  } else { // sweep
    const Ds      = Array.from({ length: 80 }, (_, i) => 0.02 + i * 0.95 / 79);
    const Vouts_d = Ds.map(d => Math.min(cur.Vmpp / (1 - d), cur.Vmpp * 20));
    const ILavgs  = Ds.map(d => Math.min(cur.Impp / (1 - d), cur.Impp * 15));
    CH.chartBoost1 = new Chart(ctx, {
      type: 'line',
      data: { labels: Ds.map(d => (d * 100).toFixed(1)), datasets: [
        { label: 'V_out (V)',      data: Vouts_d.map((v, i) => ({ x: Ds[i]*100, y: v })), borderColor: C.blue,   backgroundColor: 'transparent', tension: .3, pointRadius: 0, borderWidth: 2, yAxisID: 'yV', parsing: false },
        { label: 'I_L moyen (A)', data: ILavgs.map((v, i)  => ({ x: Ds[i]*100, y: v })), borderColor: C.orange, backgroundColor: 'transparent', tension: .3, pointRadius: 0, borderWidth: 2, yAxisID: 'yI', parsing: false },
        { label: `▲ D=${(p.D*100).toFixed(1)}%`, data: [{ x: p.D*100, y: Vout }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 9, pointStyle: 'star', showLine: false, yAxisID: 'yV', parsing: false }
      ]},
      options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: TT },
        scales: {
          x:  { title: { display: true, text: 'Rapport cyclique D (%)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 10 } },
          yV: { type: 'linear', position: 'left',  title: { display: true, text: 'V_out (V)',      color: C.blue   }, grid: GR, ticks: { color: C.blue,   font: TF } },
          yI: { type: 'linear', position: 'right', title: { display: true, text: 'I_L moyen (A)', color: C.orange }, grid: { display: false }, ticks: { color: C.orange, font: TF } }
        }}
    });
  }
}

function renderBoostChart2() {
  const ctx = document.getElementById('chartBoost2');
  if (!ctx) return;
  const cur  = arrayCurve(ARR_NS, ARR_NP, ARR_G, ARR_T, 120);
  const Vout = Math.max(cur.Vmpp * 1.05, parseFloat(document.getElementById('b_vout').value) || 48);
  const p    = boostParams(cur.Vmpp, cur.Impp, cur.Pmpp, Vout,
    parseFloat(document.getElementById('b_fs').value)    || 20,
    (parseFloat(document.getElementById('b_dil').value)  || 30) / 100,
    (parseFloat(document.getElementById('b_dvin').value) || 1)  / 100,
    (parseFloat(document.getElementById('b_dvout').value)|| 1)  / 100,
    (parseFloat(document.getElementById('b_eff').value)  || 95) / 100);

  if (CH.chartBoost2) CH.chartBoost2.destroy();

  if (boostChart2Mode === 'wave') {
    const nC = 3, nPt = 120, T = 1 / p.fs;
    const times = [], iLs = [], vLs = [], iDs = [];
    for (let k = 0; k < nC * nPt; k++) {
      const t  = k / (nC * nPt) * nC * T;
      const ph = (t % T) / T;
      times.push((t * 1e6).toFixed(3));
      if (ph < p.D) {
        iLs.push(p.IL_avg - p.dIL / 2 + p.dIL * ph / p.D);
        vLs.push(cur.Vmpp); iDs.push(0);
      } else {
        const pOff = (ph - p.D) / (1 - p.D);
        iLs.push(p.IL_avg + p.dIL / 2 - p.dIL * pOff);
        vLs.push(cur.Vmpp - Vout);
        iDs.push(p.IL_avg + p.dIL / 2 - p.dIL * pOff);
      }
    }
    CH.chartBoost2 = new Chart(ctx, {
      type: 'line', data: { labels: times, datasets: [
        { label: 'i_L(t) — Courant inducteur (A)', data: iLs, borderColor: C.blue,   backgroundColor: 'rgba(79,142,247,.07)', fill: true,  tension: 0, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yI' },
        { label: 'v_L(t) — Tension inducteur (V)', data: vLs, borderColor: C.orange, backgroundColor: 'transparent',           tension: 0, pointRadius: 0, borderWidth: 1.8, borderDash: [3,3], yAxisID: 'yV' },
        { label: 'i_D(t) — Courant diode (A)',     data: iDs, borderColor: C.green,  backgroundColor: 'rgba(34,197,94,.06)',   fill: true,  tension: 0, pointRadius: 0, borderWidth: 1.5, yAxisID: 'yI' }
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: TT },
        scales: {
          x:  { title: { display: true, text: `Temps (µs) — fs=${p.fsKHz}kHz, D=${(p.D*100).toFixed(1)}%`, color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 12 } },
          yI: { type: 'linear', position: 'left',  title: { display: true, text: 'Courant (A)',            color: C.blue   }, grid: GR, ticks: { color: C.blue,   font: TF } },
          yV: { type: 'linear', position: 'right', title: { display: true, text: 'Tension inducteur (V)', color: C.orange }, grid: { display: false }, ticks: { color: C.orange, font: TF } }
        }}
    });

  } else if (boostChart2Mode === 'Lmap') {
    const fss  = Array.from({ length: 50 }, (_, i) => 1 + i * 199 / 49);
    const Dv   = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, parseFloat(p.D.toFixed(2))];
    const uD   = [...new Set(Dv.map(d => parseFloat(d.toFixed(2))))];
    const cols = [C.muted, '#7c6af7', C.purple, C.blue, C.teal, C.green, C.gold];
    const ds   = uD.map((d, i) => ({
      label: d === parseFloat(p.D.toFixed(2)) ? `D=${(d*100).toFixed(1)}% (votre réseau)` : `D=${(d*100).toFixed(0)}%`,
      data: fss.map(f => (cur.Vmpp * d / (0.3 * cur.Impp * f * 1e3)) * 1e3),
      borderColor: cols[i % cols.length], backgroundColor: 'transparent',
      tension: .3, pointRadius: 0, borderWidth: d === parseFloat(p.D.toFixed(2)) ? 3 : 1.5,
      borderDash: d === parseFloat(p.D.toFixed(2)) ? undefined : [4, 3]
    }));
    CH.chartBoost2 = new Chart(ctx, {
      type: 'line', data: { labels: fss.map(f => f.toFixed(0)), datasets: ds },
      options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 9 } } }, tooltip: TT },
        scales: { x: { title: { display: true, text: 'Fréquence fs (kHz)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 10 } }, y: { title: { display: true, text: 'Inductance L (mH) — ΔiL=30%', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } } } }
    });

  } else if (boostChart2Mode === 'Cmap') {
    const dvPcts = Array.from({ length: 50 }, (_, i) => 0.1 + i * 4.9 / 49);
    const fList  = [5, 10, 20, 50, 100];
    const colsCm = [C.red, C.orange, C.blue, C.green, C.teal];
    const ds3    = fList.map((fk, i) => ({
      label: `fs=${fk}kHz`,
      data: dvPcts.map(dv => (p.Iout * p.D / (dv / 100 * Vout * fk * 1e3)) * 1e6),
      borderColor: colsCm[i], backgroundColor: 'transparent', tension: .3, pointRadius: 0, borderWidth: 2
    }));
    CH.chartBoost2 = new Chart(ctx, {
      type: 'line', data: { labels: dvPcts.map(d => d.toFixed(1)), datasets: ds3 },
      options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: TT },
        scales: { x: { title: { display: true, text: 'Ondulation ΔV_out (%)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 10 } }, y: { title: { display: true, text: 'C_out (µF)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } } } }
    });

  } else { // eta vs load
    const loads = Array.from({ length: 60 }, (_, i) => 5 + i * 95 / 59);
    const etas  = loads.map(l => Math.max(0.7, Math.min(0.995, p.eta_conv - 0.02*(1-l/100) - 0.015*(l/100)*(1-p.D))) * 100);
    const Pouts = loads.map(l => p.Pout * l / 100);
    CH.chartBoost2 = new Chart(ctx, {
      type: 'line', data: { labels: loads.map(l => l.toFixed(0)), datasets: [
        { label: 'η conv. (%)',  data: etas,  borderColor: C.green, backgroundColor: 'rgba(34,197,94,.09)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yEta' },
        { label: 'P_out (W)', data: Pouts, borderColor: C.blue,  backgroundColor: 'transparent', tension: .4, pointRadius: 0, borderWidth: 1.8, borderDash: [4,3], yAxisID: 'yP'   }
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 10 } } }, tooltip: TT },
        scales: {
          x:    { title: { display: true, text: 'Charge (% nominale)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF, maxTicksLimit: 10 } },
          yEta: { type: 'linear', position: 'left',  min: 60, max: 100, title: { display: true, text: 'η (%)',    color: C.green }, grid: GR, ticks: { color: C.green, font: TF } },
          yP:   { type: 'linear', position: 'right', title: { display: true, text: 'P_out (W)', color: C.blue  }, grid: { display: false }, ticks: { color: C.blue, font: TF } }
        }}
    });
  }
}

// ════════════════════════════════════════════
// FUZZY (S5)
// ════════════════════════════════════════════
let fuzzyVar = 'E';

function setFuzzy(v, btn) {
  fuzzyVar = v;
  document.querySelectorAll('#s5 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  updateFuzzy();
}

function updateFuzzy() {
  const eNorm = (parseFloat(document.getElementById('fuzzy_e_sl').value) || 0) / 100;
  const set   = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('fuzzy_e_val', eNorm.toFixed(2));
  const xArr = Array.from({ length: 200 }, (_, i) => -1 + i * 0.01);
  const mfs  = { NB: xArr.map(x => trapmf(x,-1,-1,-.7,-.3)), NS: xArr.map(x => trimf(x,-.5,-.2,0)), ZE: xArr.map(x => trimf(x,-.15,0,.15)), PS: xArr.map(x => trimf(x,0,.2,.5)), PB: xArr.map(x => trapmf(x,.3,.7,1,1)) };
  const muNB = trapmf(eNorm,-1,-1,-.7,-.3), muNS = trimf(eNorm,-.5,-.2,0), muZE = trimf(eNorm,-.15,0,.15), muPS = trimf(eNorm,0,.2,.5), muPB = trapmf(eNorm,.3,.7,1,1);
  set('mu_nb', muNB.toFixed(2)); set('mu_ns', muNS.toFixed(2)); set('mu_ze', muZE.toFixed(2)); set('mu_ps', muPS.toFixed(2)); set('mu_pb', muPB.toFixed(2));
  const out = (-1*muNB - .3*muNS + 0*muZE + .3*muPS + 1*muPB) / (muNB+muNS+muZE+muPS+muPB+1e-9);
  set('fuzzy_out', (out * 2 * ARR_NS).toFixed(3) + ' V');
  if (CH.chartFuzzy) CH.chartFuzzy.destroy();
  const ctx = document.getElementById('chartFuzzy'); if (!ctx) return;
  CH.chartFuzzy = new Chart(ctx, {
    type: 'line',
    data: { datasets: [
      { label:'NB', data:xArr.map((v,i)=>({x:v,y:mfs.NB[i]})), borderColor:C.red,    pointRadius:0, borderWidth:2, fill:false, tension:.2, parsing:false },
      { label:'NS', data:xArr.map((v,i)=>({x:v,y:mfs.NS[i]})), borderColor:C.orange, pointRadius:0, borderWidth:2, fill:false, tension:.2, parsing:false },
      { label:'ZE', data:xArr.map((v,i)=>({x:v,y:mfs.ZE[i]})), borderColor:C.green,  pointRadius:0, borderWidth:2, fill:false, tension:.2, parsing:false },
      { label:'PS', data:xArr.map((v,i)=>({x:v,y:mfs.PS[i]})), borderColor:C.blue,   pointRadius:0, borderWidth:2, fill:false, tension:.2, parsing:false },
      { label:'PB', data:xArr.map((v,i)=>({x:v,y:mfs.PB[i]})), borderColor:C.purple, pointRadius:0, borderWidth:2, fill:false, tension:.2, parsing:false },
      { label:`E=${eNorm.toFixed(2)}`, data:[{x:eNorm,y:0},{x:eNorm,y:1}], borderColor:'rgba(255,255,255,.5)', borderWidth:2, borderDash:[4,4], pointRadius:0, parsing:false }
    ]},
    options: { responsive:true, maintainAspectRatio:false, parsing:false, plugins:{legend:{labels:{color:'#9b99b6',font:{size:10}}},tooltip:TT},
      scales:{ x:{type:'linear',min:-1,max:1,title:{display:true,text:'E = dP/dV (normalisé)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}}, y:{min:0,max:1.05,title:{display:true,text:"Degré d'appartenance µ",color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }}
  });
}

// ════════════════════════════════════════════
// ANN (S6)
// ════════════════════════════════════════════
let annMode = 'mlp';

function selectANN(m, btn) {
  annMode = m;
  document.querySelectorAll('#s6 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  rerunANN();
}

function rerunANN() {
  const ep     = parseFloat(document.getElementById('epochs_sl').value)  || 200;
  const lr     = (parseFloat(document.getElementById('lr_sl').value)     || 10) / 10000;
  const layers = parseFloat(document.getElementById('layers_sl').value)  || 3;
  const neurons= parseFloat(document.getElementById('neurons_sl').value) || 32;
  const speed  = lr * 5 + layers * 0.002 + neurons * 0.00005;
  const fm     = Math.max(0.001, 0.025 - neurons * 0.0001 - layers * 0.002);
  const fa     = fm * 0.82;
  const labels = Array.from({ length: ep }, (_, i) => i + 1);
  const ds     = [];
  if (annMode === 'mlp' || annMode === 'compare') {
    ds.push({ label:'MLP Train MSE', data:genTrainCurve(ep,fm,speed,.18,42),  borderColor:C.blue,   borderWidth:2.2, pointRadius:0, tension:.4 });
    ds.push({ label:'MLP Val MSE',   data:genTrainCurve(ep,fm*1.25,speed*.9,.22,137), borderColor:C.blue,   borderWidth:1.5, pointRadius:0, tension:.4, borderDash:[5,5] });
  }
  if (annMode === 'anfis' || annMode === 'compare') {
    ds.push({ label:'ANFIS Train MSE', data:genTrainCurve(ep,fa,speed*1.1,.15,77),   borderColor:C.orange, borderWidth:2.2, pointRadius:0, tension:.4 });
    ds.push({ label:'ANFIS Val MSE',   data:genTrainCurve(ep,fa*1.2,speed*.95,.19,211), borderColor:C.orange, borderWidth:1.5, pointRadius:0, tension:.4, borderDash:[5,5] });
  }
  mkChart('chartANN','line',{ labels, datasets:ds }, {
    scales:{ x:{title:{display:true,text:'Époque',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}}, y:{type:'logarithmic',title:{display:true,text:'MSE (log)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }
  });
}

// ════════════════════════════════════════════
// RNN (S7)
// ════════════════════════════════════════════
let rnnView = 'pred';

function setRNNview(v, btn) {
  rnnView = v;
  document.querySelectorAll('#s7 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  updateRNN();
}

function updateRNN() {
  const lstmL    = parseFloat(document.getElementById('lstml_sl').value) || 2;
  const lstmU    = parseFloat(document.getElementById('lstmu_sl').value) || 64;
  const drop     = (parseFloat(document.getElementById('drop_sl').value) || 20) / 100;
  const lstmRMSE = Math.max(0.08, 0.22 - lstmL*0.025 - lstmU*0.0005 + drop*0.1);
  const gruRMSE  = lstmRMSE * 1.25;
  const mlpRMSE  = lstmRMSE * 1.6;
  const r2       = Math.min(0.999, 1 - lstmRMSE*lstmRMSE / 0.04);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('lstm_rmse', lstmRMSE.toFixed(3)+' W'); set('gru_rmse', gruRMSE.toFixed(3)+' W');
  set('mlp_rmse',  mlpRMSE.toFixed(3)+' W');  set('lstm_r2', r2.toFixed(3));

  const Pbase  = arrayCurve(ARR_NS, ARR_NP, 1000, 25, 80).Pmpp;
  const npts   = 96;
  const labels = Array.from({ length: npts }, (_, i) => i * 15 + ' min');
  const actual = Array.from({ length: npts }, (_, i) =>
    Pbase * (0.7 + 0.25*Math.sin(2*Math.PI*i/96) + 0.12*Math.sin(4*Math.PI*i/96)) + genNoise(1, Pbase*0.04, i+17)[0]);

  if (rnnView === 'pred') {
    mkChart('chartLSTM','line',{ labels, datasets:[
      { label:`Réel réseau ${ARR_NS}s×${ARR_NP}p`, data:actual, borderColor:'#eceaf8', borderWidth:2.5, pointRadius:0, tension:.3 },
      { label:'LSTM', data:actual.map((v,i)=>v*(1+genNoise(1,lstmRMSE/80,i*7)[0])),  borderColor:C.purple, borderWidth:2, pointRadius:0, tension:.3 },
      { label:'GRU',  data:actual.map((v,i)=>v*(1+genNoise(1,gruRMSE/80,i*13)[0])),  borderColor:C.green,  borderWidth:2, pointRadius:0, tension:.3, borderDash:[4,4] },
      { label:'MLP',  data:actual.map((v,i)=>v*(1+genNoise(1,mlpRMSE/80,i*19)[0])),  borderColor:C.orange, borderWidth:1.8, pointRadius:0, tension:.3, borderDash:[8,4] }
    ]},{
      scales:{ x:{title:{display:true,text:'Temps (min)',color:C.muted},grid:GR,ticks:{color:C.muted,maxTicksLimit:12,font:TF}}, y:{title:{display:true,text:'P_MPP réseau (W)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }
    });
  } else if (rnnView === 'error') {
    mkChart('chartLSTM','line',{ labels, datasets:[
      { label:'LSTM |erreur|', data:actual.map((v,i)=>Math.abs(v-v*(1+genNoise(1,lstmRMSE/80,i*7)[0]))),  borderColor:C.purple, backgroundColor:'rgba(167,139,250,.09)', fill:true, borderWidth:2, pointRadius:0, tension:.3 },
      { label:'GRU |erreur|',  data:actual.map((v,i)=>Math.abs(v-v*(1+genNoise(1,gruRMSE/80,i*13)[0]))), borderColor:C.green,  backgroundColor:'rgba(34,197,94,.06)',    fill:true, borderWidth:2, pointRadius:0, tension:.3, borderDash:[4,4] }
    ]},{
      scales:{ x:{title:{display:true,text:'Temps',color:C.muted},grid:GR,ticks:{color:C.muted,maxTicksLimit:12,font:TF}}, y:{title:{display:true,text:'|Erreur| (W)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }
    });
  } else {
    const ep = 100;
    mkChart('chartLSTM','line',{ labels:Array.from({length:ep},(_,i)=>i+1), datasets:[
      { label:'LSTM MSE', data:genTrainCurve(ep,lstmRMSE*lstmRMSE,0.06,.2,99), borderColor:C.purple, borderWidth:2.2, pointRadius:0, tension:.4 },
      { label:'GRU MSE',  data:genTrainCurve(ep,gruRMSE*gruRMSE,0.07,.22,55),  borderColor:C.green,  borderWidth:2.2, pointRadius:0, tension:.4, borderDash:[4,4] }
    ]},{
      scales:{ x:{title:{display:true,text:'Époque',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}}, y:{type:'logarithmic',title:{display:true,text:'MSE (log)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }
    });
  }
}

// ════════════════════════════════════════════
// HYBRID (S8)
// ════════════════════════════════════════════
let hybridMode = 'cnnlstm';

function setHybrid(m, btn) {
  hybridMode = m;
  document.querySelectorAll('#s8 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  updateHybrid();
}

function updateHybrid() {
  const cnnF   = parseFloat(document.getElementById('cnn_f_sl').value)  || 64;
  const heads  = parseFloat(document.getElementById('heads_sl').value)  || 8;
  const dmodel = parseFloat(document.getElementById('dmodel_sl').value) || 128;
  const nblocks= parseFloat(document.getElementById('nblocks_sl').value)|| 4;
  const cnnEff = Math.min(99.5, 97 + cnnF*0.004 + 0.1);
  const tfEff  = Math.min(99.8, 97.5 + heads*0.1 + dmodel*0.002 + nblocks*0.1);
  const cnnRMSE= Math.max(0.08, 0.22 - cnnF*0.0005 - 0.05);
  const tfRMSE = Math.max(0.05, 0.18 - heads*0.005 - dmodel*0.0002 - nblocks*0.01);

  const methods = ['P&O','INC','PSO','GWO','MLP','ANFIS','LSTM','GRU', hybridMode==='transformer'?'Transformer':'CNN-LSTM'];
  const effs    = [95.2,96.0,97.8,98.2,98.3,98.5,98.9,98.7, hybridMode==='transformer'?tfEff:cnnEff];
  const bc      = methods.map((_,i) => i<4?C.muted:i<6?C.green:i<8?C.purple:C.orange);

  if (CH.chartHybrid_eff) CH.chartHybrid_eff.destroy();
  const ctx1 = document.getElementById('chartHybrid_eff');
  if (ctx1) {
    CH.chartHybrid_eff = new Chart(ctx1, {
      type:'bar', data:{ labels:methods, datasets:[{label:'η (%)',data:effs,backgroundColor:bc.map(c=>c+'cc'),borderColor:bc,borderWidth:1,borderRadius:4}]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:TT},
        scales:{ x:{ticks:{color:C.muted,font:TF,maxRotation:45},grid:{display:false}}, y:{min:93,max:100.5,title:{display:true,text:'η (%)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }}
    });
  }

  const Pbase  = arrayCurve(ARR_NS, ARR_NP, 1000, 25, 80).Pmpp;
  const npts   = 60;
  const labels = Array.from({ length: npts }, (_, i) => i);
  const actual = Array.from({ length: npts }, (_, i) => Pbase * (0.7 + 0.22*Math.sin(2*Math.PI*i/npts) + 0.1*Math.sin(6*Math.PI*i/npts)));
  const pDs    = [{ label:'Réel', data:actual, borderColor:'#eceaf8', borderWidth:2.5, pointRadius:0, tension:.3 }];
  if (hybridMode==='cnnlstm'  || hybridMode==='compare') pDs.push({ label:`CNN-LSTM (η=${cnnEff.toFixed(1)}%)`, data:actual.map((v,i)=>v+genNoise(1,cnnRMSE*40,i*11)[0]), borderColor:C.orange, borderWidth:2, pointRadius:0, tension:.3, borderDash:[5,3] });
  if (hybridMode==='transformer'|| hybridMode==='compare') pDs.push({ label:`Transformer (η=${tfEff.toFixed(1)}%)`, data:actual.map((v,i)=>v+genNoise(1,tfRMSE*40,i*17)[0]), borderColor:C.purple, borderWidth:2, pointRadius:0, tension:.3, borderDash:[3,3] });

  if (CH.chartHybrid_pred) CH.chartHybrid_pred.destroy();
  const ctx2 = document.getElementById('chartHybrid_pred');
  if (ctx2) {
    CH.chartHybrid_pred = new Chart(ctx2, {
      type:'line', data:{ labels, datasets:pDs },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#9b99b6',font:{size:9}}},tooltip:TT},
        scales:{ x:{title:{display:true,text:'Pas de temps',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}}, y:{title:{display:true,text:'P_MPP réseau (W)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }}
    });
  }
}

// ════════════════════════════════════════════
// COMPARISON (S9)
// ════════════════════════════════════════════
const allMethods = [
  {name:'P&O',        cat:'conv',eta:95.2,etaS:30,ripple:8.0,speed:80,anti:30,stable:65,data:5, complexity:1},
  {name:'INC',        cat:'conv',eta:96.0,etaS:35,ripple:6.0,speed:78,anti:35,stable:70,data:5, complexity:2},
  {name:'Hill Climb', cat:'conv',eta:94.8,etaS:28,ripple:9.0,speed:75,anti:28,stable:60,data:5, complexity:1},
  {name:'FLC',        cat:'meta',eta:97.5,etaS:65,ripple:3.0,speed:88,anti:55,stable:88,data:30,complexity:5},
  {name:'PSO',        cat:'meta',eta:97.8,etaS:88,ripple:4.0,speed:72,anti:88,stable:80,data:10,complexity:6},
  {name:'GWO',        cat:'meta',eta:98.2,etaS:90,ripple:3.0,speed:74,anti:90,stable:82,data:10,complexity:6},
  {name:'GA',         cat:'meta',eta:97.1,etaS:82,ripple:4.5,speed:68,anti:82,stable:78,data:10,complexity:6},
  {name:'MLP',        cat:'deep',eta:98.3,etaS:72,ripple:2.0,speed:92,anti:72,stable:91,data:80,complexity:5},
  {name:'ANFIS',      cat:'deep',eta:98.5,etaS:78,ripple:2.0,speed:91,anti:78,stable:92,data:70,complexity:6},
  {name:'LSTM',       cat:'deep',eta:98.9,etaS:88,ripple:1.5,speed:85,anti:88,stable:95,data:90,complexity:7},
  {name:'CNN-LSTM',   cat:'deep',eta:99.1,etaS:90,ripple:1.2,speed:88,anti:90,stable:96,data:95,complexity:8},
  {name:'Transformer',cat:'deep',eta:99.3,etaS:87,ripple:1.0,speed:86,anti:87,stable:97,data:95,complexity:9}
];
let filteredMethods = [...allMethods];
let radarMethod = allMethods[10];

function filterMethods(cat, btn) {
  document.querySelectorAll('#s9 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filteredMethods = cat === 'all' ? [...allMethods] : allMethods.filter(m => m.cat === cat);
  renderComparison(); renderTable();
}

function renderComparison() {
  const cats   = { conv: C.muted, meta: C.green, deep: C.purple };
  const bcolors = filteredMethods.map(m => cats[m.cat]);

  if (CH.chartEffBar) CH.chartEffBar.destroy();
  const c1 = document.getElementById('chartEffBar');
  if (c1) CH.chartEffBar = new Chart(c1, {
    type:'bar', data:{ labels:filteredMethods.map(m=>m.name), datasets:[{label:'η (%)',data:filteredMethods.map(m=>m.eta),backgroundColor:bcolors.map(c=>c+'cc'),borderColor:bcolors,borderWidth:1,borderRadius:4}]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:TT},
      scales:{ x:{ticks:{color:C.muted,font:TF,maxRotation:45},grid:{display:false}}, y:{min:90,max:100.5,title:{display:true,text:'η (%)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }}
  });

  if (CH.chartScatter) CH.chartScatter.destroy();
  const c2 = document.getElementById('chartScatter');
  if (c2) CH.chartScatter = new Chart(c2, {
    type:'bubble', data:{ datasets:[{ data:filteredMethods.map(m=>({x:m.ripple,y:m.eta,r:Math.sqrt(m.anti)/3})), backgroundColor:filteredMethods.map(m=>cats[m.cat]+'99'), borderColor:filteredMethods.map(m=>cats[m.cat]), borderWidth:1.5 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{...TT,callbacks:{label:(c)=>{const m=filteredMethods[c.dataIndex];return ` ${m.name}: η=${m.eta}%, ripple=${m.ripple}%`;}}}},
      scales:{ x:{title:{display:true,text:'Ondulation ripple (%)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}}, y:{min:90,max:100.5,title:{display:true,text:'η (%)',color:C.muted},grid:GR,ticks:{color:C.muted,font:TF}} }}
  });

  renderRadar(radarMethod);
}

function renderRadar(m) {
  if (CH.chartRadar) CH.chartRadar.destroy();
  const ctx = document.getElementById('chartRadar'); if (!ctx) return;
  CH.chartRadar = new Chart(ctx, {
    type:'radar',
    data:{ labels:['Efficacité','Vitesse','Anti-ombrage','Stabilité','Sans données','Simplicité'], datasets:[{label:m.name,data:[m.eta,m.speed,m.anti,m.stable,100-m.data,100-m.complexity*10],backgroundColor:'rgba(79,142,247,.12)',borderColor:C.blue,borderWidth:2.5,pointBackgroundColor:C.blue,pointRadius:4}]},
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ r:{min:0,max:100,grid:{color:'#252540'},angleLines:{color:'#252540'},pointLabels:{color:'#9b99b6',font:{family:"'Space Grotesk',sans-serif",size:10}},ticks:{display:false}}},
      plugins:{legend:{labels:{color:'#9b99b6',font:{size:10}}}} }
  });
}

function renderTable() {
  const cM = { conv:'b-conv', meta:'b-meta', deep:'b-deep' };
  const cN = { conv:'Conventionnel', meta:'Métaheuristique', deep:'Deep Learning' };
  const tbody = document.getElementById('comparison_tbody'); if (!tbody) return;
  tbody.innerHTML = filteredMethods.map(m => `
    <tr onclick="radarMethod=allMethods.find(x=>x.name==='${m.name}');renderRadar(radarMethod)">
      <td><strong>${m.name}</strong></td>
      <td><span class="badge ${cM[m.cat]}">${cN[m.cat]}</span></td>
      <td><div class="eff-bar"><div class="eff-fill" style="width:${(m.eta-88)*4}px"></div>${m.eta}%</div></td>
      <td>${m.etaS}%</td><td>${m.ripple}%</td>
      <td>${m.data<20?'Minimal':m.data<60?'Modéré':'Extensif'}</td>
      <td><strong style="color:${m.eta>98.5?C.green:m.eta>97?C.orange:C.muted}">${(m.eta*.3+m.anti*.3+(100-m.ripple*5)*.2+(100-m.complexity*5)*.2).toFixed(1)}</strong></td>
    </tr>`).join('');
}
