import * as React from 'react';
import Hero from './components/Hero';
import ThemeToggle from './components/ThemeToggle';
import WeatherToggle from './components/WeatherToggle';
import MarketSection from './components/MarketSection';
import ModelSection from './components/ModelSection';
import ArraySection from './components/ArraySection';
import BoostSection from './components/BoostSection';
import MPPTSection from './components/MPPTSection';
import MetaSection from './components/MetaSection';
import FuzzySection from './components/FuzzySection';
import AnnSection from './components/AnnSection';
import RnnSection from './components/RnnSection';
import HybridSection from './components/HybridSection';
import ComparisonSection from './components/ComparisonSection';
import RefsSection from './components/RefsSection';
import ChatBot from './components/ChatBot';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';

import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

function App() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen font-outfit relative overflow-hidden text-slate-900 dark:text-white transition-colors bg-white dark:bg-black">
      <ThemeToggle />
      <WeatherToggle />
      <ChatBot />
      
      {/* Navigation Layer */}
      <nav className="fixed top-0 inset-x-0 z-50 glass rounded-full max-w-6xl mx-auto mt-6 px-8 py-4 flex items-center justify-between">
        <div className="font-black text-xl tracking-widest gradient-text from-primary-cyan to-accent-purple">
          PV-MPPT-IA
        </div>
        <div className="hidden lg:flex items-center gap-4 xl:gap-6 font-mono text-xs uppercase tracking-wider">
          <a href="#contexte" className="hover:text-primary-cyan transition-colors">Contexte</a>
          <a href="#modele" className="hover:text-primary-cyan transition-colors">Modèle</a>
          <a href="#mppt" className="hover:text-primary-cyan transition-colors">MPPT Classique</a>
          <a href="#ann" className="hover:text-accent-purple transition-colors">Deep Learning</a>
          <div className="w-px h-4 bg-white/20 mx-2" />
          <div className="flex items-center gap-3">
            <span className="text-primary-cyan italic lowercase">@{user.username}</span>
            <button 
              onClick={logout}
              className="px-3 py-1 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all border border-white/5"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <Hero />

      {/* Sections Flow */}
      <MarketSection />
      
      <div className="w-full h-px bg-gradient-to-r from-transparent via-current opacity-10 to-transparent my-4" />
      <ModelSection />
      
      <div className="w-full h-px bg-gradient-to-r from-transparent via-current opacity-10 to-transparent my-4" />
      <ArraySection />
      
      <BoostSection />
      
      <MPPTSection />
      
      <MetaSection />
      
      <FuzzySection />
      
      <AnnSection />
      
      <RnnSection />
      
      <HybridSection />
      
      <ComparisonSection />
      
      <RefsSection />

      {/* Footer */}
      <footer className="py-12 text-center opacity-50 font-mono text-sm border-t border-current/10">
        <p>Mohamed Ayoub Essalami · ENIGA 2025-2026</p>
        <p className="mt-2 text-primary-cyan glow-text">Laboratoire LPV · Centre de Recherche Borj Cedria</p>
      </footer>
    </div>
  );
}

export default App;
