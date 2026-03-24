import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sun, Wind, Droplets, MapPin, Thermometer } from 'lucide-react';

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather: {
      desc: string;
      icon: string;
    };
  };
}

export default function WeatherToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/weather/current');
        if (res.ok) {
          const data = await res.json();
          setWeather(data);
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && !weather) {
      fetchWeather();
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-8 left-24 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
            className="absolute bottom-16 left-0 w-64 glass p-6 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-widest text-primary-cyan">
              <MapPin className="w-3 h-3" />
              <span>Tunis, Tunisie</span>
            </div>

            {loading ? (
              <div className="py-4 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary-cyan border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-outfit opacity-50 text-white">Mise à jour...</span>
              </div>
            ) : weather ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold font-outfit text-white">
                    {Math.round(weather.current.temperature)}°
                  </div>
                  <div className="text-4xl">{weather.current.weather.icon}</div>
                </div>
                
                <div className="text-sm font-outfit text-white/80 capitalize">
                  {weather.current.weather.desc}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary-cyan" />
                    <span className="text-xs text-white/60">{weather.current.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-white/60">{Math.round(weather.current.wind_speed)} km/h</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-red-400 font-outfit py-2">
                Serveur non joignable
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-full glass transition-all hover:scale-110 active:scale-95 border border-white/20 shadow-lg ${isOpen ? 'bg-primary-cyan/20 ring-2 ring-primary-cyan/50' : ''}`}
        title="Météo Tunis"
      >
        <Cloud className={`w-6 h-6 transition-colors ${isOpen ? 'text-primary-cyan' : 'text-white dark:text-white text-black dark:text-white'}`} />
      </button>
    </div>
  );
}
