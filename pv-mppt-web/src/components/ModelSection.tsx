import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Cloud, CloudLightning } from 'lucide-react';
import { ivCurve } from '../utils/physics';
import { C, chartOptions } from '../utils/colors';

export default function ModelSection() {
  const [G, setG] = useState(1000);
  const [T, setT] = useState(25);
  const [Rs, setRs] = useState(0.32);
  const [Rsh, setRsh] = useState(200);
  const [mode, setMode] = useState<'iv' | 'pv' | 'both'>('iv');
  const [liveWeather, setLiveWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    if (!liveWeather) return;
    const fetchWeather = async () => {
      try {
        setWeatherError(false);
        const res = await fetch('http://localhost:8000/api/weather/current');
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        const { temperature, is_day, cloud_cover } = data.current;
        setT(Math.round(temperature));
        if (!is_day) setG(0);
        else setG(Math.round(Math.max(100, 1000 - (cloud_cover * 8.5))));
      } catch(e) {
        console.error("Failed to fetch live weather", e);
        setWeatherError(true);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Update every 5 min
    return () => clearInterval(interval);
  }, [liveWeather]);

  const [cur, setCur] = useState(() => ivCurve(G, T, Rs, Rsh));
  const [stc] = useState(() => ivCurve(1000, 25, 0.322, 200));

  useEffect(() => {
    setCur(ivCurve(G, T, Rs, Rsh));
  }, [G, T, Rs, Rsh]);

  const ds = [];
  if (mode === 'iv' || mode === 'both') {
    ds.push({
      label: `I-V (G=${G}, T=${T}°C)`,
      data: cur.V.map((v, i) => ({ x: v, y: cur.I[i] })),
      borderColor: C.blue, backgroundColor: 'rgba(79,142,247,.07)',
      fill: mode === 'iv', tension: 0.3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yI'
    });
    ds.push({
      label: 'MPP', data: [{ x: cur.Vmpp, y: cur.Impp }],
      borderColor: C.orange, backgroundColor: C.orange, pointRadius: 8, showLine: false, yAxisID: 'yI'
    });
    if (mode === 'both') ds.push({
      label: 'I-V STC', data: stc.V.map((v, i) => ({ x: v, y: stc.I[i] })),
      borderColor: '#363655', borderDash: [5, 5], borderWidth: 1.5, fill: false, tension: 0.3, pointRadius: 0, yAxisID: 'yI'
    });
  }
  if (mode === 'pv' || mode === 'both') {
    ds.push({
      label: `P-V (G=${G}, T=${T}°C)`,
      data: cur.V.map((v, i) => ({ x: v, y: cur.P[i] })),
      borderColor: C.green, backgroundColor: 'rgba(34,197,94,.07)',
      fill: mode === 'pv', tension: 0.3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'yP'
    });
    ds.push({
      label: `P_MPP=${cur.Pmpp.toFixed(1)}W`, data: [{ x: cur.Vmpp, y: cur.Pmpp }],
      borderColor: C.gold, backgroundColor: C.gold, pointRadius: 8, showLine: false, yAxisID: 'yP'
    });
    if (mode === 'both') ds.push({
      label: 'P-V STC', data: stc.V.map((v, i) => ({ x: v, y: stc.P[i] })),
      borderColor: '#363655', borderDash: [5, 5], borderWidth: 1.5, fill: false, tension: 0.3, pointRadius: 0, yAxisID: 'yP'
    });
  }

  const scales: any = {
    x: { type: 'linear', title: { display: true, text: 'Tension V (V)', color: C.muted }, grid: chartOptions.scales.x.grid, ticks: chartOptions.scales.x.ticks, min: 0 }
  };
  if (mode !== 'pv') scales.yI = { type: 'linear', position: 'left', title: { display: true, text: 'Courant I (A)', color: C.blue }, grid: chartOptions.scales.y.grid, ticks: { color: C.blue } };
  if (mode !== 'iv') scales.yP = { type: 'linear', position: mode === 'both' ? 'right' : 'left', title: { display: true, text: 'Puissance P (W)', color: C.green }, ticks: { color: C.green } };

  return (
    <section id="modele" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">02</div>
          <h2 className="text-4xl font-bold font-outfit">
            Modèle <span className="text-primary-cyan glow-text">BP Solar 485J</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Modèle physique à une diode (De Soto et al.) pour évaluer la production réelle d'un panneau sous différentes conditions environnementales.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Controls */}
          <div className="w-full lg:w-1/3 glass p-8 rounded-3xl space-y-6">
            <div className="flex bg-black/20 rounded-xl p-1">
              {(['iv', 'pv', 'both'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-bold uppercase rounded-lg transition-colors ${mode === m ? 'bg-primary-cyan text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setLiveWeather(!liveWeather)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase text-sm border transition-all ${
                liveWeather 
                  ? weatherError ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-primary-cyan/20 border-primary-cyan text-primary-cyan glow-text' 
                  : 'glass border-white/10 text-gray-400 hover:text-white hover:border-white/30'
              }`}
            >
              {liveWeather ? <CloudLightning size={18} /> : <Cloud size={18} />}
              {liveWeather ? (weatherError ? 'Météo Live (Erreur)' : 'Météo Live (Tunis) Active') : 'Activer Météo Live (API)'}
            </button>

            <div className={`space-y-4 transition-opacity ${liveWeather ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <label className="flex justify-between text-sm text-gray-400 font-mono"><span>Irradiance G</span><span className="text-primary-cyan">{G} W/m²</span></label>
              <input type="range" min="0" max="1000" step="10" value={G} onChange={(e) => setG(Number(e.target.value))} className="w-full" disabled={liveWeather} />
            </div>
            <div className={`space-y-4 transition-opacity ${liveWeather ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <label className="flex justify-between text-sm text-gray-400 font-mono"><span>Température T</span><span className="text-accent-pink">{T} °C</span></label>
              <input type="range" min="-10" max="80" step="1" value={T} onChange={(e) => setT(Number(e.target.value))} className="w-full" disabled={liveWeather} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-gray-500 font-mono uppercase mb-1">P_MPP</div>
                <div className="text-lg font-bold text-accent-orange">{cur.Pmpp.toFixed(2)} W</div>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-gray-500 font-mono uppercase mb-1">V_MPP / I_MPP</div>
                <div className="text-md font-bold text-primary-cyan">{cur.Vmpp.toFixed(2)}V / {cur.Impp.toFixed(2)}A</div>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-gray-500 font-mono uppercase mb-1">V_oc / I_sc</div>
                <div className="text-md font-bold text-green-400">{cur.Voc.toFixed(2)}V / {cur.Isc.toFixed(2)}A</div>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-gray-500 font-mono uppercase mb-1">Rendement</div>
                <div className="text-lg font-bold text-accent-purple">{cur.eta.toFixed(2)} %</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full lg:w-2/3 glass p-6 rounded-3xl h-[450px]">
            <Line data={{ datasets: ds as any }} options={{ ...chartOptions, scales }} />
          </div>
        </div>
      </div>
    </section>
  );
}
