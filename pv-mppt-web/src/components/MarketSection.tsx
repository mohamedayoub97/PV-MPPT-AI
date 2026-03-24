import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { C, chartOptions } from '../utils/colors';

const years = Array.from({ length: 27 }, (_, i) => 2000 + i);
const dataCapacity = [1.4,1.7,2.0,2.3,2.7,3.3,4.5,6.0,14,22,38,68,97,133,176,227,291,384,493,593,710,936,1177,1419,1632,1870,2100];
const dataCost = [4.5,4.2,4.0,3.8,3.6,3.4,3.2,3.0,2.8,2.5,2.0,1.5,0.9,0.7,0.65,0.6,0.5,0.4,0.35,0.30,0.28,0.26,0.24,0.22,0.21,0.20,0.19];
const dataLcoe = [0.40,0.38,0.36,0.34,0.32,0.30,0.27,0.24,0.20,0.17,0.13,0.10,0.08,0.07,0.065,0.06,0.055,0.05,0.045,0.04,0.035,0.032,0.030,0.028,0.025,0.022,0.020];

export default function MarketSection() {
  const [mode, setMode] = useState<'capacite' | 'cout' | 'lcoe'>('capacite');

  let yTitle = 'GW';
  let dsData = dataCapacity;
  let color = C.blue;
  let fillCol = 'rgba(79,142,247,.09)';
  
  if (mode === 'cout') { yTitle = 'USD/Wc'; dsData = dataCost; color = C.orange; fillCol = 'rgba(249,115,22,.09)'; }
  else if (mode === 'lcoe') { yTitle = 'USD/kWh'; dsData = dataLcoe; color = C.green; fillCol = 'rgba(34,197,94,.09)'; }

  const chartData = {
    labels: years,
    datasets: [{
      label: mode.toUpperCase(),
      data: dsData,
      borderColor: color, backgroundColor: fillCol,
      fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: color
    }]
  };

  const scales = {
    x: { title: { display: true, text: 'Année', color: C.muted }, grid: chartOptions.scales.x.grid, ticks: chartOptions.scales.x.ticks },
    y: { title: { display: true, text: yTitle, color: C.muted }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks }
  };

  return (
    <section id="contexte" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-end justify-between mb-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold mb-4">Croissance <span className="text-primary-cyan glow-text">Mondiale du PV</span></h2>
            <p className="opacity-80 text-lg leading-relaxed">
              L'énergie solaire connaît une croissance exponentielle avec la baisse des coûts d'installation.
              L'extraction optimisée (MPPT) devient d'autant plus cruciale pour de telles capacités installées.
            </p>
          </div>
          <div className="flex gap-4">
            {(['capacite', 'cout', 'lcoe'] as const).map(m => (
               <button
                 key={m}
                 onClick={() => setMode(m)}
                 className={`px-4 py-2 text-sm font-bold uppercase rounded-lg transition-colors ${mode === m ? 'glass border-white/20 text-white' : 'glass opacity-50 hover:opacity-100'}`}
               >
                 {m}
               </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[400px] glass p-6 rounded-3xl">
          <Line data={chartData} options={{ ...chartOptions, scales }} />
        </div>
      </div>
    </section>
  );
}
