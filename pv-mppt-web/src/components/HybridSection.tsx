import { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { genNoise, arrayCurve } from '../utils/physics';
import { C, chartOptions } from '../utils/colors';

export default function HybridSection() {
  const [mode, setMode] = useState<'cnnlstm'|'transformer'|'compare'>('transformer');

  const cnnEff = 99.1, tfEff = 99.3;
  const cnnRMSE = 0.08, tfRMSE = 0.05;

  const methods = ['P&O','INC','PSO','GWO','MLP','ANFIS','LSTM','GRU', mode==='transformer'?'Transformer':'CNN-LSTM'];
  const effs = [95.2,96.0,97.8,98.2,98.3,98.5,98.9,98.7, mode==='transformer'?tfEff:cnnEff];
  const bc = methods.map((_,i) => i<4?C.muted:i<6?C.green:i<8?C.purple:C.orange);

  const barData = {
    labels: methods,
    datasets: [{ label:'η (%)', data:effs, backgroundColor:bc.map(c=>c+'cc'), borderColor:bc, borderWidth:1, borderRadius:4 }]
  };

  const scaleBar = {
    x: { ticks: { color: C.muted, maxRotation: 45 }, grid: { display: false } },
    y: { min: 93, max: 100.5, title: { display: true, text: 'Rendement η (%)', color: C.muted }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks }
  };

  const Pbase = arrayCurve(2, 3, 1000, 25, 80).Pmpp;
  const npts = 60;
  const labels = Array.from({ length: npts }, (_, i) => i);
  const actual = Array.from({ length: npts }, (_, i) => Pbase * (0.7 + 0.22*Math.sin(2*Math.PI*i/npts) + 0.1*Math.sin(6*Math.PI*i/npts)));
  const pDs: any[] = [{ label:'Réel', data:actual, borderColor:'#eceaf8', borderWidth:2.5, pointRadius:0, tension:0.3 }];
  if (mode==='cnnlstm' || mode==='compare') pDs.push({ label:`CNN-LSTM`, data:actual.map((v,i)=>v+genNoise(1,cnnRMSE*40,i*11)[0]), borderColor:C.orange, borderWidth:2, pointRadius:0, tension:0.3, borderDash:[5,3] });
  if (mode==='transformer' || mode==='compare') pDs.push({ label:`Transformer`, data:actual.map((v,i)=>v+genNoise(1,tfRMSE*40,i*17)[0]), borderColor:C.purple, borderWidth:2, pointRadius:0, tension:0.3, borderDash:[3,3] });

  const scalePred = {
    x: { title: { display: true, text: 'Pas de temps', color: C.muted }, grid: chartOptions.scales.x.grid, ticks: chartOptions.scales.x.ticks },
    y: { title: { display: true, text: 'P_MPP réseau (W)', color: C.muted }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks }
  };

  return (
    <section id="hybrid" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">08</div>
          <h2 className="text-4xl font-bold font-outfit">Modèles <span className="text-orange-400 glow-text">Hybrides SOA</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">L'état de l'art du tracking avec CNN-LSTM hybrides et l'architecture "Attention Is All You Need" (Transformer).</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="flex gap-2 mb-4">
              {(['cnnlstm', 'transformer', 'compare'] as const).map(m => (
                 <button key={m} onClick={() => setMode(m)} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg ${mode === m ? 'bg-orange-500 text-white' : 'glass opacity-60'}`}>{m}</button>
              ))}
            </div>
            <div className="h-[350px]">
              <Line data={{ labels, datasets: pDs }} options={{ ...chartOptions, scales: scalePred } as any} />
            </div>
          </div>
          
          <div className="glass p-6 rounded-3xl space-y-4">
             <div className="h-[350px] mt-10">
              <Bar data={barData} options={{ ...chartOptions, plugins: { legend: { display: false } }, scales: scaleBar } as any} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
