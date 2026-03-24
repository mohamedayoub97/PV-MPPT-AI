import * as React from 'react';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="p-3 rounded-full glass hover:scale-110 active:scale-95 transition-all z-50 fixed bottom-8 left-8 shadow-lg shadow-black/20 border border-white/20"
      title="Basculer Mode Sombre/Clair"
    >
      {isDark ? <Sun className="text-white w-6 h-6" /> : <Moon className="text-black w-6 h-6" />}
    </button>
  );
}
