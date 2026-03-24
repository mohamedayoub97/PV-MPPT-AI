import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import SolarModel3D from './SolarModel3D';
import { Zap, Sun, Award, ShieldAlert } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full flex flex-col lg:flex-row items-center justify-between px-8 lg:px-24 overflow-hidden pt-20">
      
      {/* Text Content */}
      <div className="z-10 w-full lg:w-1/2 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary-cyan/30 text-primary-cyan text-sm font-mono tracking-widest uppercase"
        >
          <span className="w-2 h-2 rounded-full bg-primary-cyan animate-pulse"></span>
          PFE Ingénieur · ENIGA 2026
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-5xl lg:text-7xl font-black leading-tight tracking-tight"
        >
          PV MPPT <br />
          <span className="gradient-text from-primary-cyan via-primary-blue to-accent-purple glow-text">
            Intelligence
          </span><br/>
          <span className="gradient-text from-accent-orange to-accent-pink glow-text">
            Artificielle
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg lg:text-xl text-gray-400 max-w-xl font-light leading-relaxed"
        >
          Optimisation ultime du rendement photovoltaïque. Étude avancée des algorithmes MPPT classiques, métaheuristiques et architecturaux Deep Learning (Transformer, CNN-LSTM) pour le module BP Solar 485J.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap gap-4 pt-4"
        >
          <div className="glass px-6 py-4 rounded-2xl flex items-center gap-4 hover:border-accent-orange/50 transition-colors">
            <div className="p-3 bg-accent-orange/20 text-accent-orange rounded-xl">
              <Sun size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase">Efficacité Max</p>
              <p className="text-2xl font-bold font-mono text-white">99.3<span className="text-accent-orange">%</span></p>
            </div>
          </div>
          
          <div className="glass px-6 py-4 rounded-2xl flex items-center gap-4 hover:border-primary-cyan/50 transition-colors">
            <div className="p-3 bg-primary-cyan/20 text-primary-cyan rounded-xl">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase">Réseau Neuronal</p>
              <p className="text-2xl font-bold font-mono text-white">Transformer</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 lg:relative lg:w-1/2 h-[60vh] lg:h-screen w-full -z-0 lg:z-10 mt-12 lg:mt-0 opacity-50 lg:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent lg:hidden z-10" />
        <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
          <SolarModel3D />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.5} 
            maxPolarAngle={Math.PI / 2 + 0.1}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>
      </div>
      
    </section>
  );
}
