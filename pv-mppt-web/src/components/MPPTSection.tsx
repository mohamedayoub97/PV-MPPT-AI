import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';

export default function MPPTSection() {
  const [algo, setAlgo] = useState<'po' | 'ann'>('ann');
  
  // Simulated tracking points based on algo choice
  const trackingData = algo === 'ann' ? 
    [10, 40, 75, 84, 84.8, 85, 85, 85, 85] : 
    [10, 30, 50, 65, 78, 86, 82, 86, 83, 85, 84];

  const data = {
    labels: Array.from({length: trackingData.length}, (_, i) => i * 10),
    datasets: [
      {
        label: `Puissance Trackée - ${algo.toUpperCase()}`,
        data: trackingData,
        borderColor: algo === 'ann' ? '#a855f7' : '#f97316',
        backgroundColor: algo === 'ann' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(249, 115, 22, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        stepped: algo === 'po' ? true : false,
      },
      {
        label: 'P_MPP Réel (85W)',
        data: Array(trackingData.length).fill(85),
        borderColor: '#14b8a6',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Temps (ms)', color: '#888' }, grid: { color: '#222' } },
      y: { min: 0, max: 100, title: { display: true, text: 'Puissance (W)', color: '#888' }, grid: { color: '#222' } }
    },
    plugins: {
      legend: { labels: { color: '#eee', font: { family: 'JetBrains Mono' } } }
    }
  };

  return (
    <section id="mppt" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold font-outfit">
            Comparaison <span className="gradient-text from-accent-purple to-accent-pink glow-text">MPPT IA vs Classique</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Visualisez la rapidité de convergence. Les algorithmes Deep Learning (Transformer, CNN-LSTM) trouvent le point de puissance maximale instantanément sans l'oscillation (ripple) typique du P&O.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Controls */}
          <div className="w-full lg:w-1/3 glass p-8 rounded-3xl flex flex-col justify-center space-y-6">
            <h3 className="text-xl font-bold text-white mb-2">Sélectionner l'Algorithme</h3>
            
            <button 
              onClick={() => setAlgo('ann')}
              className={`p-4 rounded-xl font-mono transition-all text-left border ${
                algo === 'ann' 
                ? 'bg-accent-purple/20 border-accent-purple text-accent-purple glow-text' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              <div className="font-bold text-lg">ANN / Transformer</div>
              <div className="text-xs opacity-70 mt-1">Convergence: &lt; 20ms • Ripple: 0%</div>
            </button>
            
            <button 
              onClick={() => setAlgo('po')}
              className={`p-4 rounded-xl font-mono transition-all text-left border ${
                algo === 'po' 
                ? 'bg-accent-orange/20 border-accent-orange text-accent-orange glow-text' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              <div className="font-bold text-lg">Perturb & Observe</div>
              <div className="text-xs opacity-70 mt-1">Convergence: ~100ms • Ripple: Moyen</div>
            </button>
          </div>

          {/* Chart */}
          <div className="w-full lg:w-2/3 glass p-8 rounded-3xl h-[350px] relative">
            <Line data={data} options={options} />
          </div>
        </div>
      </div>
    </section>
  );
}
