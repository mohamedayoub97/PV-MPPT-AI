import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { genTrainCurve } from '../utils/physics';
import { C, chartOptions } from '../utils/colors';

export default function AnnSection() {
  const [mode, setMode] = useState<'mlp'|'anfis'|'compare'>('compare');
  const ep = 200, speed = 0.05, fm = 0.01, fa = 0.008;

  const labels = Array.from({ length: ep }, (_, i) => i + 1);
  const ds: any[] = [];

  if (mode === 'mlp' || mode === 'compare') {
    ds.push({ label:'MLP Train MSE', data:genTrainCurve(ep,fm,speed,.18,42), borderColor:C.blue, borderWidth:2.2, pointRadius:0, tension:0.4 });
    ds.push({ label:'MLP Val MSE', data:genTrainCurve(ep,fm*1.25,speed*.9,.22,137), borderColor:C.blue, borderWidth:1.5, pointRadius:0, tension:0.4, borderDash:[5,5] });
  }
  if (mode === 'anfis' || mode === 'compare') {
    ds.push({ label:'ANFIS Train MSE', data:genTrainCurve(ep,fa,speed*1.1,.15,77), borderColor:C.orange, borderWidth:2.2, pointRadius:0, tension:0.4 });
    ds.push({ label:'ANFIS Val MSE', data:genTrainCurve(ep,fa*1.2,speed*.95,.19,211), borderColor:C.orange, borderWidth:1.5, pointRadius:0, tension:0.4, borderDash:[5,5] });
  }

  const scales = {
    x: { title: { display: true, text: 'Époque', color: C.muted }, grid: chartOptions.scales.x.grid, ticks: chartOptions.scales.x.ticks },
    y: { type: 'logarithmic', title: { display: true, text: 'MSE (log)', color: C.muted }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks }
  };

  return (
    <section id="ann" className="py-24 px-8 lg:px-24 bg-black/40">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">06</div>
          <h2 className="text-4xl font-bold font-outfit">Artificial Neural <span className="text-blue-400 glow-text">Networks</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Prédiction de la tension instantanée MPP basée sur l'Irradiance et la Température via (MLP) et Systèmes Neuro-Flous (ANFIS).</p>
        </div>

        <div className="glass p-8 rounded-3xl">
          <div className="flex justify-center gap-4 mb-8">
            {(['mlp', 'anfis', 'compare'] as const).map(m => (
               <button key={m} onClick={() => setMode(m)} className={`px-6 py-2 text-sm font-bold uppercase rounded-lg transition-colors ${mode === m ? 'bg-primary-cyan text-white' : 'glass opacity-50 hover:opacity-100'}`}>{m}</button>
            ))}
          </div>
          <div className="h-[400px]">
             <Line data={{ labels, datasets: ds }} options={{ ...chartOptions, scales } as any} />
          </div>
        </div>
      </div>
    </section>
  );
}
