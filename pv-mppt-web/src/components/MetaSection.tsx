import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { arrayCurveShaded } from '../utils/physics';
import { C, chartOptions } from '../utils/colors';

function runMetaOptimizer(mode: string, Parr: number[], np: number, w: number, maxIt: number) {
  const nPts = Parr.length;
  let gbs = 0, rng = Date.now() % 10000;
  const lcg = (s: number) => (1664525 * s + 1013904223) & 0xffffffff;
  const rnd = () => { rng = lcg(rng); return (rng >>> 0) / 4294967296; };
  let pos = Array.from({ length: np }, () => Math.floor(rnd() * nPts));
  let vel = Array.from({ length: np }, () => 0);
  let pbest = [...pos];
  let pbestSc = pos.map(i => Math.max(0, Parr[i] || 0));
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

export default function MetaSection() {
  const [shadeMode, setShadeMode] = useState(40);
  const maxIt = 50;
  const P_shaded = arrayCurveShaded(2, 3, 1000, 25, shadeMode, 100).P;

  const resPSO = runMetaOptimizer('pso', P_shaded, 4, 0.4, maxIt);
  const resGWO = runMetaOptimizer('gwo', P_shaded, 4, 0.4, maxIt);
  const resGA = runMetaOptimizer('ga', P_shaded, 4, 0.4, maxIt);
  
  const gmp = Math.max(...P_shaded);

  const ds = [
    { label: 'GMP Théorique', data: Array(maxIt).fill(gmp), borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderDash: [5,5], pointRadius: 0, tension: 0 },
    { label: 'PSO (Particle Swarm)', data: resPSO.convHist, borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.08)', fill: true, borderWidth: 2, pointRadius: 0, tension: 0.3, yAxisID: 'y' },
    { label: 'GWO (Grey Wolf)', data: resGWO.convHist, borderColor: C.orange, backgroundColor: 'rgba(249,115,22,.08)', fill: true, borderWidth: 2, pointRadius: 0, tension: 0.3, yAxisID: 'y' },
    { label: 'GA (Genetic Algo)', data: resGA.convHist, borderColor: C.purple, backgroundColor: 'transparent', fill: false, borderWidth: 1.5, pointRadius: 0, tension: 0.3, borderDash: [4,4], yAxisID: 'y' }
  ];

  const scales = {
    x: { title: { display: true, text: 'Itérations', color: C.muted }, grid: chartOptions.scales.x.grid, ticks: chartOptions.scales.x.ticks },
    y: { title: { display: true, text: 'Puissance (W)', color: C.muted }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks }
  };

  return (
    <section id="meta" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">04</div>
          <h2 className="text-4xl font-bold font-outfit">Métaheuristiques <span className="text-primary-cyan glow-text">& Essaims</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Optimisation globale stochastique sous ombrage partiel. GWO montre une meilleure balance exploration/exploitation que PSO.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 glass p-8 rounded-3xl space-y-6">
            <div className="space-y-4">
              <label className="flex justify-between text-sm text-gray-400 font-mono"><span>Ombrage</span><span className="text-primary-cyan">{shadeMode}%</span></label>
              <input type="range" min="10" max="90" step="10" value={shadeMode} onChange={(e) => setShadeMode(Number(e.target.value))} className="w-full" />
            </div>

            <div className="bg-black/30 p-4 rounded-xl space-y-2 font-mono text-sm text-gray-400 mt-6 border border-white/5">
              <div className="flex justify-between"><span>GMP Théorique:</span><span className="text-gold font-bold">{gmp.toFixed(1)} W</span></div>
              <div className="flex justify-between"><span>PSO Final:</span><span className="text-blue-400 font-bold">{resPSO.gbs.toFixed(1)} W</span></div>
              <div className="flex justify-between"><span>GWO Final:</span><span className="text-orange-400 font-bold">{resGWO.gbs.toFixed(1)} W</span></div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 glass p-6 rounded-3xl h-[400px]">
             <Line data={{ labels: Array.from({ length: maxIt }, (_, i) => i + 1), datasets: ds }} options={{ ...chartOptions, scales }} />
          </div>
        </div>
      </div>
    </section>
  );
}
