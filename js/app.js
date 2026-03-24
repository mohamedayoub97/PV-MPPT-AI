/**
 * app.js — Application orchestration
 * Manages global state, initialization, hero scene, UI events
 * Loaded LAST — depends on physics.js and charts.js
 */

// ════════════════════════════════════════════
// GLOBAL ARRAY STATE (declared in physics.js)
// ════════════════════════════════════════════
// ARR_NS, ARR_NP, ARR_G, ARR_T are globals from physics.js

// ════════════════════════════════════════════
// THEME TOGGLE
// ════════════════════════════════════════════
function toggleTheme() {
  document.body.classList.toggle('light');
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
  // Redraw all charts after theme switch
  setTimeout(redrawAll, 60);
}

function redrawAll() {
  showPVChart(pvMode);
  updateIV();
  updateArrayChart();
  updateArrayShadeChart();
  updateBoost();
  runMPPT();
  runMeta();
  updateFuzzy();
  rerunANN();
  updateRNN();
  updateHybrid();
  renderComparison();
  renderTable();
}

// ════════════════════════════════════════════
// SCROLL: PROGRESS BAR + NAV ACTIVE
// ════════════════════════════════════════════
window.addEventListener('scroll', () => {
  const d = document.documentElement;
  const el = document.getElementById('pb');
  if (el) el.style.width = (d.scrollTop / (d.scrollHeight - d.clientHeight) * 100) + '%';

  const secIds = ['s1','s2','s_array','s_boost','s3','s4','s5','s6','s7','s8','s9','s10'];
  const btns   = document.querySelectorAll('.nav-btn');
  let cur = 0;
  secIds.forEach((id, i) => {
    const sec = document.getElementById(id);
    if (sec && sec.getBoundingClientRect().top < 110) cur = i;
  });
  btns.forEach((b, i) => b.classList.toggle('active', i === cur));
});

// ════════════════════════════════════════════
// INTERSECTION OBSERVER — reveal sections
// ════════════════════════════════════════════
const secObserver = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.05 }
);
document.querySelectorAll('section.sec').forEach(s => secObserver.observe(s));

// ════════════════════════════════════════════
// NAV SMOOTH SCROLL
// ════════════════════════════════════════════
function goSec(id) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 56, behavior: 'smooth' });
}

// ════════════════════════════════════════════
// HERO SPOTLIGHT
// ════════════════════════════════════════════
(function initSpotlight() {
  const hero = document.getElementById('heroHdr');
  const spot = document.getElementById('heroSpot');
  if (!hero || !spot) return;
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    spot.style.left    = (e.clientX - r.left) + 'px';
    spot.style.top     = (e.clientY - r.top)  + 'px';
    spot.style.opacity = '1';
  });
  hero.addEventListener('mouseleave', () => { spot.style.opacity = '0'; });
})();

// ════════════════════════════════════════════
// HERO 3D PANEL — fill cells dynamically
// ════════════════════════════════════════════
(function buildHeroCells() {
  const grid = document.getElementById('heroPvGrid');
  if (!grid) return;
  for (let i = 0; i < 20; i++) {
    const cell = document.createElement('div');
    cell.className = 'pv-cell';
    grid.appendChild(cell);
  }
})();

// ════════════════════════════════════════════
// PV ARRAY CONFIGURATOR
// ════════════════════════════════════════════
function onCfgChange() {
  ARR_NS = Math.max(1, Math.min(20, parseInt(document.getElementById('cfg_ns').value) || 2));
  ARR_NP = Math.max(1, Math.min(20, parseInt(document.getElementById('cfg_np').value) || 3));
  ARR_G  = Math.max(50, Math.min(1200, parseFloat(document.getElementById('cfg_g').value) || 1000));
  ARR_T  = Math.max(0,  Math.min(80,   parseFloat(document.getElementById('cfg_t').value)  || 25));
  updateArrayAll();
}

function updateArrayViz() {
  const viz = document.getElementById('arrayViz');
  if (!viz) return;
  viz.innerHTML = '';
  const maxP = Math.min(ARR_NP, 8);
  const maxS = Math.min(ARR_NS, 10);

  for (let p = 0; p < maxP; p++) {
    const str = document.createElement('div');
    str.className = 'array-string';
    for (let s = 0; s < maxS; s++) {
      const m = document.createElement('div');
      m.className = 'module-icon';
      str.appendChild(m);
      if (s < maxS - 1) {
        const plus = document.createElement('span');
        plus.className = 'str-plus';
        plus.textContent = '+';
        str.appendChild(plus);
      }
    }
    if (maxS < ARR_NS) {
      const d = document.createElement('span');
      d.className = 'str-plus';
      d.style.color = 'var(--text3)'; d.style.fontSize = '.65rem';
      d.textContent = `…+${ARR_NS - maxS}`;
      str.appendChild(d);
    }
    viz.appendChild(str);
    if (p < maxP - 1) {
      const pp = document.createElement('div');
      pp.className = 'par-plus'; pp.textContent = '‖';
      viz.appendChild(pp);
    }
  }
  if (maxP < ARR_NP) {
    const d = document.createElement('div');
    d.className = 'par-plus'; d.style.color = 'var(--text3)'; d.style.fontSize = '.7rem';
    d.textContent = `…+${ARR_NP - maxP} strings`;
    viz.appendChild(d);
  }
}

function updateArrayKPIs() {
  const cur = arrayCurve(ARR_NS, ARR_NP, ARR_G, ARR_T, 120);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('ak_pmax',  cur.Pmpp.toFixed(1) + ' W');
  set('ak_voc',   cur.Voc.toFixed(1)  + ' V');
  set('ak_isc',   cur.Isc.toFixed(2)  + ' A');
  set('ak_vmpp',  cur.Vmpp.toFixed(1) + ' V');
  set('ak_impp',  cur.Impp.toFixed(2) + ' A');
  set('ak_total', ARR_NS * ARR_NP + ' modules');
  set('arr_pmpp', cur.Pmpp.toFixed(1) + ' W');
  set('arr_vmpp', cur.Vmpp.toFixed(1) + ' V');
  set('arr_impp', cur.Impp.toFixed(2) + ' A');
  set('arr_voc',  cur.Voc.toFixed(1)  + ' V');
  set('arr_isc',  cur.Isc.toFixed(2)  + ' A');
  set('arr_total', (ARR_NS * ARR_NP * 85) + ' W (nominal)');
}

function updateArrayAll() {
  updateArrayViz();
  updateArrayKPIs();
  updateArrayChart();
  updateArrayShadeChart();
  updateBoost();
  runMPPT();
  runMeta();
  updateRNN();
  updateHybrid();
  // Update dynamic labels
  const label = `${ARR_NS}s×${ARR_NP}p`;
  const up = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  up('arrayChartTitle', `Courbes réseau ${label} (${ARR_NS * ARR_NP} modules)`);
  up('mpptTitle',       `Convergence MPPT — Réseau ${label}`);
  up('metaTitle',       `PSO/GWO/GA — Convergence GMP réseau ${label}`);
  up('lstmTitle',       `Prédiction P_MPP réseau ${label}`);
}

// ════════════════════════════════════════════
// BOOST CONVERTER UPDATE
// ════════════════════════════════════════════
function updateBoost() {
  const ctx1 = document.getElementById('chartBoost1');
  const ctx2 = document.getElementById('chartBoost2');
  if (!ctx1 || !ctx2) return;

  const cur      = arrayCurve(ARR_NS, ARR_NP, ARR_G, ARR_T, 120);
  const VoutRaw  = parseFloat(document.getElementById('b_vout').value) || 48;
  const Vout     = Math.max(cur.Vmpp * 1.05, VoutRaw);
  const p        = boostParams(
    cur.Vmpp, cur.Impp, cur.Pmpp, Vout,
    parseFloat(document.getElementById('b_fs').value)    || 20,
    (parseFloat(document.getElementById('b_dil').value)  || 30) / 100,
    (parseFloat(document.getElementById('b_dvin').value) || 1)  / 100,
    (parseFloat(document.getElementById('b_dvout').value)|| 1)  / 100,
    (parseFloat(document.getElementById('b_eff').value)  || 95) / 100
  );

  // Store for renderBoostChart2 access
  window._boostP = p;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('bk_d',     (p.D * 100).toFixed(1) + '%');
  set('bk_L',     (p.L * 1e3).toFixed(3) + ' mH');
  set('bk_Cin',   (p.Cin  * 1e6).toFixed(1) + ' µF');
  set('bk_Cout',  (p.Cout * 1e6).toFixed(1) + ' µF');
  set('bk_Iavg',  p.IL_avg.toFixed(2)  + ' A');
  set('bk_Ipeak', p.IL_peak.toFixed(2) + ' A');
  set('bk_Ropt',  p.Ropt.toFixed(2) + ' Ω');
  set('bk_Pout',  p.Pout.toFixed(1) + ' W');
  set('bst_vin',  cur.Vmpp.toFixed(1) + ' V');
  set('bst_vout', Vout.toFixed(1) + ' V');
  set('bst_d',    (p.D * 100).toFixed(1) + '%');
  set('bst_iout', p.Iout.toFixed(2) + ' A');

  renderBoostChart1();
  renderBoostChart2();
}

// Also expose eta_conv to renderBoostChart2
const _origBoostParams = boostParams;
// (boostParams already returns all needed fields)

// ════════════════════════════════════════════
// MPPT CONVERGENCE (S3)
// ════════════════════════════════════════════
let mpptMode = 'po';

function selectMPPT(m, btn) {
  mpptMode = m;
  document.querySelectorAll('#s3 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  runMPPT();
}

function runMPPT() {
  const G   = parseFloat(document.getElementById('G_sim').value) || 1000;
  const T   = parseFloat(document.getElementById('T_sim').value) || 25;
  const dV  = (parseFloat(document.getElementById('dV_sl').value) || 50) / 100;
  const nit = parseInt(document.getElementById('nit_sl').value) || 100;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('G_sim_val', G); set('T_sim_val', T); set('dV_val', dV.toFixed(2)); set('nit_val', nit);

  const rpo = simulatePO(ARR_NS, ARR_NP, G, T, dV, nit);
  const rin = simulateINC(ARR_NS, ARR_NP, G, T, dV, nit);
  set('eff_po',    rpo.eta.toFixed(1) + '%');
  set('eff_inc',   rin.eta.toFixed(1) + '%');
  set('pm_theory', rpo.Pm.toFixed(1)  + ' W');
  set('conv_po',   rpo.conv);
  set('conv_inc',  rin.conv);

  const labels = Array.from({ length: nit + 1 }, (_, i) => i);
  const ds     = [];
  if (mpptMode === 'po'   || mpptMode === 'both') ds.push({ label:`P&O (η=${rpo.eta.toFixed(1)}%)`, data:rpo.P, borderColor:C.orange, borderWidth:2.5, pointRadius:0, tension:.2 });
  if (mpptMode === 'inc'  || mpptMode === 'both') ds.push({ label:`INC (η=${rin.eta.toFixed(1)}%)`, data:rin.P, borderColor:C.blue,   borderWidth:2.5, pointRadius:0, tension:.2, borderDash: mpptMode==='both'?[6,3]:undefined });
  ds.push({ label:`P_MPP=${rpo.Pm.toFixed(1)}W`, data:Array(nit+1).fill(rpo.Pm), borderColor:'#363655', borderWidth:1, borderDash:[5,5], pointRadius:0 });

  mkChart('chartMPPT', 'line', { labels, datasets: ds }, {
    scales: {
      x: { title: { display: true, text: 'Itération', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } },
      y: { title: { display: true, text: 'Puissance réseau (W)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } }
    }
  });
}

// ════════════════════════════════════════════
// META OPTIMIZATION (S4)
// ════════════════════════════════════════════
let metaMode = 'pso';

function selectMeta(m, btn) {
  metaMode = m;
  document.querySelectorAll('#s4 .btn-row .btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const lbl = document.getElementById('meta_label');
  if (lbl) lbl.textContent = m.toUpperCase();
  runMeta();
}

function runMeta() {
  const np     = parseInt(document.getElementById('np_sl').value)   || 8;
  const w      = (parseInt(document.getElementById('w_sl').value)   || 70) / 100;
  const maxIt  = parseInt(document.getElementById('mxit_sl').value) || 50;
  const shade  = parseInt(document.getElementById('shade_sl').value)|| 50;

  const cFull  = arrayCurve(ARR_NS, ARR_NP, ARR_G, ARR_T, 200);
  const cS     = shade > 0 ? arrayCurveShaded(ARR_NS, ARR_NP, ARR_G, ARR_T, shade, 200) : null;
  const Vrange = cS ? cS.V : cFull.V;
  const Parr   = cS ? cS.P : cFull.P;
  const Pmax   = Math.max(...Parr);
  const Pidx   = Parr.indexOf(Pmax);
  const Vgmp   = Vrange[Pidx];

  // P-V chart
  const pvDs = [
    { label: 'P-V réseau ombré', data: Vrange.map((v, i) => ({ x: v, y: Parr[i] })), borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.09)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2, parsing: false },
    { label: `GMP=${Pmax.toFixed(1)}W`, data: [{ x: Vgmp, y: Pmax }], borderColor: C.orange, backgroundColor: C.orange, pointRadius: 9, pointStyle: 'star', showLine: false, parsing: false }
  ];
  if (CH.chartPSO_pv) CH.chartPSO_pv.destroy();
  const ctx1 = document.getElementById('chartPSO_pv');
  if (ctx1) {
    CH.chartPSO_pv = new Chart(ctx1, {
      type: 'line', data: { datasets: pvDs },
      options: { responsive: true, maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 9 } } }, tooltip: TT },
        scales: { x: { type: 'linear', title: { display: true, text: 'V réseau (V)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } }, y: { title: { display: true, text: 'P (W)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF }, min: 0 } } }
    });
  }

  // Optimization
  const result = runMetaOptimizer(metaMode, Parr, np, w, maxIt);
  const color  = metaMode === 'pso' ? C.blue : metaMode === 'gwo' ? C.green : C.orange;

  if (CH.chartPSO_conv) CH.chartPSO_conv.destroy();
  const ctx2 = document.getElementById('chartPSO_conv');
  if (ctx2) {
    CH.chartPSO_conv = new Chart(ctx2, {
      type: 'line',
      data: { labels: Array.from({ length: maxIt }, (_, i) => i), datasets: [
        { label: `${metaMode.toUpperCase()} best`, data: result.convHist, borderColor: color, borderWidth: 2.5, pointRadius: 0, tension: .3 },
        { label: 'GMP cible', data: Array(maxIt).fill(Pmax), borderColor: '#363655', borderWidth: 1, borderDash: [5, 5], pointRadius: 0 }
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9b99b6', font: { size: 9 } } }, tooltip: TT },
        scales: { x: { title: { display: true, text: 'Itération', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF } }, y: { title: { display: true, text: 'P best (W)', color: C.muted }, grid: GR, ticks: { color: C.muted, font: TF }, min: 0 } } }
    });
  }

  const set   = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const iters = result.convHist.findIndex(v => v >= Pmax * 0.98);
  set('gmp_found',  result.gbs.toFixed(1) + ' W');
  set('meta_iters', iters > 0 ? iters + ' it.' : '> ' + maxIt);
  set('meta_eff',   (result.gbs / Pmax * 100).toFixed(1) + '%');
}

// ════════════════════════════════════════════
// INITIALIZATION — DOMContentLoaded
// ════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', function () {
  // S1 — PV Market
  showPVChart('capacite');
  document.querySelectorAll('#s1 .btn-row .btn')[0].classList.add('active');

  // S2 — Single module
  updateIV();

  // s_array — Array configurator (sets ARR_* then runs all dependent charts)
  updateArrayAll();

  // s_boost — Boost converter (called inside updateArrayAll, but also init here)
  updateBoost();

  // s3 — MPPT
  runMPPT();

  // s4 — Meta
  runMeta();

  // s5 — Fuzzy
  updateFuzzy();

  // s6 — ANN
  rerunANN();

  // s7 — RNN
  updateRNN();

  // s8 — Hybrid
  updateHybrid();

  // s9 — Comparison
  renderComparison();
  renderTable();

  console.log('✅ PV MPPT IA — All charts initialized');
});
