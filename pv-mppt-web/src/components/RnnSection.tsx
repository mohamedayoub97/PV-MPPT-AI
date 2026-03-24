import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { genTrainCurve, genNoise, arrayCurve } from '../utils/physics';
import { C, chartOptions } from '../utils/colors';

export default function RnnSection() {
  const [view, setView] = useState<'pred'|'error'|'mse'>('pred');
  
  const lstmRMSE = 0.12, gruRMSE = 0.15, mlpRMSE = 0.20;
  const Pbase = arrayCurve(2, 3, 1000, 25, 80).Pmpp;
  const npts = 96;
  const labels = Array.from({ length: npts }, (_, i) => i * 15 + ' min');
  const actual = Array.from({ length: npts }, (_, i) => Pbase * (0.7 + 0.25*Math.sin(2*Math.PI*i/96) + 0.12*Math.sin(4*Math.PI*i/96)) + genNoise(1, Pbase*0.04, i+17)[0]);

  const ds: any[] = [];
  const scales: any = {
    x: { title: { display: true, text: 'Temps (min)' }, grid: chartOptions.scales.x.grid, ticks: { ...chartOptions.scales.x.ticks, maxTicksLimit: 12 } }
  };

  if (view === 'pred') {
    ds.push(
      { label:`Réel`, data:actual, borderColor:'#eceaf8', borderWidth:2.5, pointRadius:0, tension:0.3 },
      { label:'LSTM', data:actual.map((v,i)=>v*(1+genNoise(1,lstmRMSE/80,i*7)[0])), borderColor:C.purple, borderWidth:2, pointRadius:0, tension:0.3 },
      { label:'GRU', data:actual.map((v,i)=>v*(1+genNoise(1,gruRMSE/80,i*13)[0])), borderColor:C.green, borderWidth:2, pointRadius:0, tension:0.3, borderDash:[4,4] },
      { label:'MLP', data:actual.map((v,i)=>v*(1+genNoise(1,mlpRMSE/80,i*19)[0])), borderColor:C.orange, borderWidth:1.8, pointRadius:0, tension:0.3, borderDash:[8,4] }
    );
    scales.y = { title: { display: true, text: 'P_MPP réseau (W)' }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks };
  } else if (view === 'error') {
    ds.push(
      { label:'LSTM |erreur|', data:actual.map((v,i)=>Math.abs(v-v*(1+genNoise(1,lstmRMSE/80,i*7)[0]))), borderColor:C.purple, backgroundColor:'rgba(167,139,250,.09)', fill:true, borderWidth:2, pointRadius:0, tension:0.3 },
      { label:'GRU |erreur|', data:actual.map((v,i)=>Math.abs(v-v*(1+genNoise(1,gruRMSE/80,i*13)[0]))), borderColor:C.green, backgroundColor:'rgba(34,197,94,.06)', fill:true, borderWidth:2, pointRadius:0, tension:0.3, borderDash:[4,4] }
    );
    scales.y = { title: { display: true, text: '|Erreur| (W)' }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks };
  } else {
    const ep = 100;
    ds.push(
      { label:'LSTM MSE', data:genTrainCurve(ep,lstmRMSE*lstmRMSE,0.06,0.2,99), borderColor:C.purple, borderWidth:2.2, pointRadius:0, tension:0.4 },
      { label:'GRU MSE', data:genTrainCurve(ep,gruRMSE*gruRMSE,0.07,0.22,55), borderColor:C.green, borderWidth:2.2, pointRadius:0, tension:0.4, borderDash:[4,4] }
    );
    scales.x.title.text = 'Époque';
    scales.y = { type: 'logarithmic', title: { display: true, text: 'MSE (log)' }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks };
  }

  return (
    <section id="rnn" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">07</div>
          <h2 className="text-4xl font-bold font-outfit">Séquences <span className="text-purple-400 glow-text">LSTM & GRU</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Prédiction temporelle résiliente face aux fluctuations atmosphériques rapides (Recurrent Neural Networks).</p>
        </div>

        <div className="glass p-8 rounded-3xl">
          <div className="flex justify-center gap-4 mb-8">
            {(['pred', 'error', 'mse'] as const).map(m => (
               <button key={m} onClick={() => setView(m)} className={`px-6 py-2 text-sm font-bold uppercase rounded-lg transition-colors ${view === m ? 'bg-purple-500 text-white' : 'glass opacity-50 hover:opacity-100'}`}>{m}</button>
            ))}
          </div>
          <div className="h-[400px]">
            <Line data={{ labels: (view === 'mse' ? Array.from({length:100},(_,i)=>i+1) : labels) as any, datasets: ds }} options={{ ...chartOptions, scales } as any} />
          </div>
        </div>
      </div>
    </section>
  );
}
