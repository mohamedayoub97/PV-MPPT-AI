import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { trimf, trapmf } from '../utils/physics';
import { C, chartOptions } from '../utils/colors';

export default function FuzzySection() {
  const [eNorm, setENorm] = useState(0);

  const xArr = Array.from({ length: 200 }, (_, i) => -1 + i * 0.01);
  const mfs = {
    NB: xArr.map(x => trapmf(x,-1,-1,-0.7,-0.3)),
    NS: xArr.map(x => trimf(x,-0.5,-0.2,0)),
    ZE: xArr.map(x => trimf(x,-0.15,0,0.15)),
    PS: xArr.map(x => trimf(x,0,0.2,0.5)),
    PB: xArr.map(x => trapmf(x,0.3,0.7,1,1))
  };

  const muNB = trapmf(eNorm,-1,-1,-0.7,-0.3);
  const muNS = trimf(eNorm,-0.5,-0.2,0);
  const muZE = trimf(eNorm,-0.15,0,0.15);
  const muPS = trimf(eNorm,0,0.2,0.5);
  const muPB = trapmf(eNorm,0.3,0.7,1,1);
  const out = (-1 * muNB - 0.3 * muNS + 0 * muZE + 0.3 * muPS + 1 * muPB) / (Math.max(1e-9, muNB+muNS+muZE+muPS+muPB));

  const ds = [
    { label:'NB (Negative Big)', data:xArr.map((v,i)=>({x:v,y:mfs.NB[i]})), borderColor:C.red, pointRadius:0, borderWidth:2, tension:0.2 },
    { label:'NS (Negative Small)', data:xArr.map((v,i)=>({x:v,y:mfs.NS[i]})), borderColor:C.orange, pointRadius:0, borderWidth:2, tension:0.2 },
    { label:'ZE (Zero)', data:xArr.map((v,i)=>({x:v,y:mfs.ZE[i]})), borderColor:C.green, pointRadius:0, borderWidth:2, tension:0.2 },
    { label:'PS (Positive Small)', data:xArr.map((v,i)=>({x:v,y:mfs.PS[i]})), borderColor:C.blue, pointRadius:0, borderWidth:2, tension:0.2 },
    { label:'PB (Positive Big)', data:xArr.map((v,i)=>({x:v,y:mfs.PB[i]})), borderColor:C.purple, pointRadius:0, borderWidth:2, tension:0.2 },
    { label:`Entrée E=${eNorm.toFixed(2)}`, data:[{x:eNorm,y:0},{x:eNorm,y:1}], borderColor:'rgba(255,255,255,.5)', borderWidth:2, borderDash:[4,4], pointRadius:0 }
  ];

  const scales = {
    x: { type: 'linear', min: -1, max: 1, title: { display: true, text: 'E = dP/dV (normalisé)', color: C.muted }, grid: chartOptions.scales.x.grid, ticks: chartOptions.scales.x.ticks },
    y: { min: 0, max: 1.05, title: { display: true, text: "Degré d'appartenance µ", color: C.muted }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks }
  };

  return (
    <section id="fuzzy" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">05</div>
          <h2 className="text-4xl font-bold font-outfit">Logique <span className="text-green-500 glow-text">Floue (FLC)</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Contrôle robuste basé sur la fuzzification de l'erreur (dP/dV) via Inférence de Mamdani.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 glass p-8 rounded-3xl space-y-6">
            <div className="space-y-4">
              <label className="flex justify-between text-sm text-gray-400 font-mono"><span>Erreur E</span><span className="text-primary-cyan">{eNorm.toFixed(2)}</span></label>
              <input type="range" min="-100" max="100" step="1" value={eNorm * 100} onChange={(e) => setENorm(Number(e.target.value)/100)} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-black/30 p-4 rounded-xl text-center"><div className="text-xs text-gray-500 mb-1">µ(NB)</div><div className="text-red-400 font-bold">{muNB.toFixed(2)}</div></div>
              <div className="bg-black/30 p-4 rounded-xl text-center"><div className="text-xs text-gray-500 mb-1">µ(NS)</div><div className="text-orange-400 font-bold">{muNS.toFixed(2)}</div></div>
              <div className="bg-black/30 p-4 rounded-xl text-center"><div className="text-xs text-gray-500 mb-1">µ(ZE)</div><div className="text-green-400 font-bold">{muZE.toFixed(2)}</div></div>
              <div className="bg-black/30 p-4 rounded-xl text-center"><div className="text-xs text-gray-500 mb-1">µ(PS)</div><div className="text-blue-400 font-bold">{muPS.toFixed(2)}</div></div>
              <div className="bg-black/30 p-4 rounded-xl text-center col-span-2"><div className="text-xs text-gray-500 mb-1">Inférence Mamdani (Sortie V)</div><div className="text-xl text-purple-400 font-bold">{(out * 4).toFixed(3)} V</div></div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 glass p-6 rounded-3xl h-[400px]">
            <Line data={{ datasets: ds as any }} options={{ ...chartOptions, scales } as any} />
          </div>
        </div>
      </div>
    </section>
  );
}
