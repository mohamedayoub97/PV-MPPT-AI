import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { arrayCurve, arrayCurveShaded } from '../utils/physics';
import { C, chartOptions } from '../utils/colors';

export default function ArraySection() {
  const [mode, setMode] = useState<'multi' | 'iv' | 'pv' | 'both'>('multi');
  const [shadeLevel, setShadeLevel] = useState(0);

  const Ns = 2, Np = 3, G = 1000, T = 25;
  const cur = arrayCurve(Ns, Np, G, T, 160);
  
  const ds: any[] = [];
  let scales: any = {
    x: { type: 'linear', title: { display: true, text: `Tension réseau (V) — Ns=${Ns}`, color: C.muted }, grid: chartOptions.scales.x.grid, ticks: chartOptions.scales.x.ticks, min: 0 }
  };

  if (shadeLevel > 0) {
    const cS = arrayCurveShaded(Ns, Np, G, T, shadeLevel, 220);
    const Pmax = Math.max(...cS.P);
    const Pidx = cS.P.indexOf(Pmax);
    
    // LMP calculation
    let lmpP = 0, lmpV = 0;
    for (let i = 3; i < cS.P.length - 3; i++) {
      const avg = (cS.P[i-2] + cS.P[i-1] + cS.P[i] + cS.P[i+1] + cS.P[i+2]) / 5;
      if (avg > cS.P[i-1] && avg > cS.P[i+1] && cS.V[i] < cS.V[Pidx] * 0.72 && avg > lmpP) {
        lmpP = avg; lmpV = cS.V[i];
      }
    }
    
    ds.push({ label: `P-V ombré ${shadeLevel}%`, data: cS.V.map((v, i) => ({ x: v, y: cS.P[i] })), borderColor: C.orange, backgroundColor: 'rgba(249,115,22,.08)', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 });
    ds.push({ label: 'P-V sans ombrage (réf)', data: cur.V.map((v, i) => ({ x: v, y: cur.P[i] })), borderColor: '#363655', borderDash: [5, 5], borderWidth: 1.5, fill: false, tension: 0.3, pointRadius: 0 });
    ds.push({ label: `GMP=${Pmax.toFixed(1)} W`, data: [{ x: cS.V[Pidx], y: Pmax }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 9, showLine: false });
    if (lmpP > 50) ds.push({ label: `LMP=${lmpP.toFixed(1)} W`, data: [{ x: lmpV, y: lmpP }], borderColor: C.red, backgroundColor: C.red, pointRadius: 7, showLine: false });
    
    scales.yP = { title: { display: true, text: 'Puissance réseau P (W)', color: C.muted }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks, min: 0 };
  } else {
    if (mode === 'multi') {
      const Gs = [200, 400, 600, 800, 1000, 1200];
      const cols = ['#5c5a78', '#7c6af7', C.purple, C.blue, C.teal, C.gold];
      Gs.forEach((g, gi) => {
        const cm = arrayCurve(Ns, Np, g, T, 120);
        ds.push({ label: `G=${g} W/m²`, data: cm.V.map((v, i) => ({ x: v, y: cm.P[i] })), borderColor: cols[gi], borderWidth: gi === 4 ? 2.5 : 1.8, pointRadius: 0, tension: 0.3, fill: false });
      });
      scales.yP = { title: { display: true, text: 'Puissance réseau P (W)', color: C.muted }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks, min: 0 };
    } else {
      if (mode === 'iv' || mode === 'both') {
        ds.push({ label: `I-V réseau`, data: cur.V.map((v, i) => ({ x: v, y: cur.I[i] })), borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.07)', fill: mode === 'iv', tension: 0.3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yI' });
        ds.push({ label: `MPP`, data: [{ x: cur.Vmpp, y: cur.Impp }], borderColor: C.orange, backgroundColor: C.orange, pointRadius: 8, showLine: false, yAxisID: 'yI' });
        scales.yI = { type: 'linear', position: 'left', title: { display: true, text: `Courant I (A)`, color: C.blue }, grid: chartOptions.scales.y.grid, ticks: { color: C.blue }, min: 0 };
      }
      if (mode === 'pv' || mode === 'both') {
        ds.push({ label: `P-V réseau`, data: cur.V.map((v, i) => ({ x: v, y: cur.P[i] })), borderColor: C.green, backgroundColor: 'rgba(34,197,94,.07)', fill: mode === 'pv', tension: 0.3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yP' });
        ds.push({ label: `MPP=${cur.Pmpp.toFixed(1)}W`, data: [{ x: cur.Vmpp, y: cur.Pmpp }], borderColor: C.gold, backgroundColor: C.gold, pointRadius: 8, showLine: false, yAxisID: 'yP' });
        scales.yP = { type: 'linear', position: mode === 'both' ? 'right' : 'left', title: { display: true, text: 'Puissance P (W)', color: C.green }, ticks: { color: C.green }, min: 0 };
      }
    }
  }

  return (
    <section id="reseau" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">03</div>
          <h2 className="text-4xl font-bold font-outfit">Réseau <span className="text-primary-cyan glow-text">Multi-Modules</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Simulation de strings en série/parallèle et analyse du comportement sous <b>ombrage partiel</b> (apparition de Maxima Locaux Multiples).
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 glass p-8 rounded-3xl space-y-6">
            <h3 className="font-bold text-lg border-b border-white/10 pb-2">Conditions Nominales</h3>
            <div className="flex gap-2">
              {(['multi', 'iv', 'pv', 'both'] as const).map(m => (
                 <button key={m} onClick={() => { setMode(m); setShadeLevel(0); }} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg ${mode === m && shadeLevel === 0 ? 'bg-primary-cyan text-white' : 'glass opacity-60'}`}>{m}</button>
              ))}
            </div>
            
            <h3 className="font-bold text-lg border-b border-white/10 pb-2 mt-8">Ombrage Partiel (Shading)</h3>
            <div className="flex gap-2 flex-wrap">
              {[0, 20, 40, 60, 80].map(lvl => (
                 <button key={lvl} onClick={() => setShadeLevel(lvl)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${shadeLevel === lvl ? 'bg-accent-orange text-white' : 'glass opacity-60'}`}>{lvl}%</button>
              ))}
            </div>
            {shadeLevel > 0 && (
              <div className="bg-black/40 p-4 rounded-xl space-y-2 mt-4 text-sm font-mono text-gray-400">
                <div className="flex justify-between"><span>Global P_MPP:</span><span className="text-gold font-bold">{Math.max(...arrayCurveShaded(Ns, Np, G, T, shadeLevel, 220).P).toFixed(1)} W</span></div>
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-2/3 glass p-6 rounded-3xl h-[450px]">
            <Line data={{ datasets: ds as any }} options={{ ...chartOptions, scales }} />
          </div>
        </div>
      </div>
    </section>
  );
}
