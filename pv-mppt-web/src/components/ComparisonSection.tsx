import { useState } from 'react';
import { Bar, Bubble, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { C, chartOptions } from '../utils/colors';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const allMethods = [
  {name:'P&O',        cat:'conv',eta:95.2,etaS:30,ripple:8.0,speed:80,anti:30,stable:65,data:5, complexity:1},
  {name:'INC',        cat:'conv',eta:96.0,etaS:35,ripple:6.0,speed:78,anti:35,stable:70,data:5, complexity:2},
  {name:'Hill Climb', cat:'conv',eta:94.8,etaS:28,ripple:9.0,speed:75,anti:28,stable:60,data:5, complexity:1},
  {name:'FLC',        cat:'meta',eta:97.5,etaS:65,ripple:3.0,speed:88,anti:55,stable:88,data:30,complexity:5},
  {name:'PSO',        cat:'meta',eta:97.8,etaS:88,ripple:4.0,speed:72,anti:88,stable:80,data:10,complexity:6},
  {name:'GWO',        cat:'meta',eta:98.2,etaS:90,ripple:3.0,speed:74,anti:90,stable:82,data:10,complexity:6},
  {name:'GA',         cat:'meta',eta:97.1,etaS:82,ripple:4.5,speed:68,anti:82,stable:78,data:10,complexity:6},
  {name:'MLP',        cat:'deep',eta:98.3,etaS:72,ripple:2.0,speed:92,anti:72,stable:91,data:80,complexity:5},
  {name:'ANFIS',      cat:'deep',eta:98.5,etaS:78,ripple:2.0,speed:91,anti:78,stable:92,data:70,complexity:6},
  {name:'LSTM',       cat:'deep',eta:98.9,etaS:88,ripple:1.5,speed:85,anti:88,stable:95,data:90,complexity:7},
  {name:'CNN-LSTM',   cat:'deep',eta:99.1,etaS:90,ripple:1.2,speed:88,anti:90,stable:96,data:95,complexity:8},
  {name:'Transformer',cat:'deep',eta:99.3,etaS:87,ripple:1.0,speed:86,anti:87,stable:97,data:95,complexity:9}
];

export default function ComparisonSection() {
  const [cat, setCat] = useState<'all'|'conv'|'meta'|'deep'>('all');
  const [radarMethod, setRadarMethod] = useState(allMethods[11]);

  const filteredMethods = cat === 'all' ? allMethods : allMethods.filter(m => m.cat === cat);
  const cats: any = { conv: C.muted, meta: C.green, deep: C.purple };
  const bcolors = filteredMethods.map(m => cats[m.cat]);

  const barData = {
    labels: filteredMethods.map(m=>m.name),
    datasets: [{ label:'η (%)', data:filteredMethods.map(m=>m.eta), backgroundColor:bcolors.map(c=>c+'cc'), borderColor:bcolors, borderWidth:1, borderRadius:4 }]
  };

  const bubbleData = {
    datasets: [{
      label: 'Performance Scatter',
      data: filteredMethods.map(m => ({ x: m.ripple, y: m.eta, r: Math.sqrt(m.anti)/2 })),
      backgroundColor: bcolors.map(c => c+'99'), borderColor: bcolors, borderWidth: 1.5
    }]
  };

  const radarData = {
    labels:['Efficacité','Vitesse','Anti-ombrage','Stabilité','Sans données','Simplicité'],
    datasets:[{
      label: radarMethod.name,
      data: [radarMethod.eta, radarMethod.speed, radarMethod.anti, radarMethod.stable, 100-radarMethod.data, 100-radarMethod.complexity*10],
      backgroundColor:'rgba(79,142,247,.12)', borderColor:C.blue, borderWidth:2.5, pointBackgroundColor:C.blue, pointRadius:4
    }]
  };

  return (
    <section id="comparaison" className="py-24 px-8 lg:px-24 bg-black/60">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">09</div>
          <h2 className="text-4xl font-bold font-outfit">Comparaison <span className="text-primary-cyan glow-text">Globale MPPT</span></h2>
        </div>

        <div className="flex justify-center gap-4 mb-8 text-sm">
          <button onClick={() => setCat('all')} className={`px-4 py-2 uppercase rounded-lg font-bold ${cat === 'all' ? 'glass text-white' : 'glass opacity-50'}`}>Tous</button>
          <button onClick={() => setCat('conv')} className={`px-4 py-2 uppercase rounded-lg font-bold ${cat === 'conv' ? 'bg-muted text-white' : 'glass opacity-50'}`}>Classiques</button>
          <button onClick={() => setCat('meta')} className={`px-4 py-2 uppercase rounded-lg font-bold ${cat === 'meta' ? 'bg-green-500 text-white' : 'glass opacity-50'}`}>Heuristiques</button>
          <button onClick={() => setCat('deep')} className={`px-4 py-2 uppercase rounded-lg font-bold ${cat === 'deep' ? 'bg-purple-500 text-white' : 'glass opacity-50'}`}>Deep Learning</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-6 rounded-3xl h-[250px]">
              <Bar data={barData} options={{...chartOptions, plugins:{legend:{display:false}}, scales:{ y:{min:90, max:100.5, title:{display:true, text:'η (%)', color:C.muted}, grid:chartOptions.scales.y.grid, ticks:chartOptions.scales.y.ticks}, x:{grid:{display:false}, ticks:{color:C.muted}} }}} />
            </div>
            <div className="glass p-6 rounded-3xl h-[250px]">
              <Bubble data={bubbleData} options={{...chartOptions, plugins:{legend:{display:false}, tooltip:{callbacks:{label:(c:any)=>`${filteredMethods[c.dataIndex].name}: η=${filteredMethods[c.dataIndex].eta}%, ripple=${filteredMethods[c.dataIndex].ripple}%`}}}, scales:{ y:{min:90, max:100.5, title:{display:true, text:'η (%)', color:C.muted}, grid:chartOptions.scales.y.grid, ticks:chartOptions.scales.y.ticks}, x:{title:{display:true,text:'Ondulation ripple (%)', color:C.muted}, grid:chartOptions.scales.x.grid, ticks:chartOptions.scales.x.ticks} }}} />
            </div>
          </div>

          <div className="glass p-6 rounded-3xl flex flex-col items-center justify-center space-y-8">
            <h3 className="text-lg font-bold text-center text-primary-cyan mb-4">Profil Radical: <span className="text-white">{radarMethod.name}</span></h3>
            <div className="w-full h-[300px]">
               <Radar data={radarData} options={{ responsive:true, maintainAspectRatio:false, scales: { r: { min:0, max:100, grid: { color: 'rgba(255,255,255,0.05)' }, pointLabels: { color:'#9b99b6' }, ticks: { display:false } } } }} />
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {filteredMethods.map(m => (
                <button key={m.name} onClick={() => setRadarMethod(m)} className={`px-3 py-1 text-xs rounded-full ${radarMethod.name === m.name ? 'bg-primary-cyan text-white' : 'bg-white/10 text-gray-400 hover:text-white transition-colors'}`}>{m.name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
