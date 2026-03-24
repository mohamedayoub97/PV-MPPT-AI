import * as React from 'react';
import { BookOpen } from 'lucide-react';

export default function RefsSection() {
  return (
    <section id="refs" className="py-24 px-8 lg:px-24">
      <div className="max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-block text-xl font-mono text-primary-cyan/50 tracking-widest mb-2">10</div>
        <h2 className="text-4xl font-bold font-outfit">Références & <span className="text-purple-400 glow-text">Bibliographie</span></h2>
        
        <div className="glass p-12 max-w-2xl mx-auto inline-flex flex-col items-center gap-6 rounded-3xl text-gray-400 hover:border-purple-400/50 transition-colors">
          <BookOpen size={48} className="text-accent-purple" />
          <p className="text-xl">38 Articles Scientifiques Analysés</p>
          <div className="w-full h-px bg-white/10 my-2"></div>
          <p className="font-mono text-sm">IEEE Transactions on Power Electronics (2018-2024)<br/>Solar Energy (Elsevier)<br/>MDPI Energies<br/>Nature Scientific Reports</p>
        </div>
      </div>
    </section>
  );
}
