import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { PromptInputBox } from './ui/ai-prompt-box';
import { Bot, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KNOWLEDGE = {
  author: {
    name: "Mohamed Ayoub Essalami, MSc",
    role: "Étudiant chercheur en Génie Énergétique et Environnement",
    education: "Master en Matériaux Innovants et Management de l'Énergie, ENIGA (École Nationale d'Ingénieurs de Gafsa)",
    skills: ["Python", "JavaScript", "MATLAB", "Data Science", "Modélisation PV", "Perovskites"],
    interests: "Passionné par l'innovation dans les énergies renouvelables et le couplage de l'IA avec la physique des systèmes solaires.",
    experience: "Stagiaire à la STEG (Laboratoire de recherche Photovoltaïque) et au CPG.",
    linkedin: "linkedin.com/in/mohamed-ayoub-essalami"
  },
  module: {
    name: "BP 485J",
    power: "85W",
    cells: 36,
    vmp: "17.8V",
    imp: "4.8A",
    voc: "22.2V",
    isc: "5.1A",
    efficiency: "13.1%",
    coeffs: { isc: "0.065%/K", voc: "-0.36%/K", pmax: "-0.5%/K" }
  },
  algorithms: [
    "P&O (Perturb & Observe)", "INC (Incrémentation de la Conductance)",
    "PSO (Particle Swarm Optimization)", "GWO (Grey Wolf Optimizer)", "GA (Genetic Algorithm)",
    "FLC (Fuzzy Logic Control)", "ANN (Artificial Neural Networks)", "RNN (LSTM/GRU)",
    "Hybrides (CNN-LSTM, Transformer)"
  ],
  app_sections: [
    "Contexte Marché", "Modélisation Physique", "Configuration Réseau & Ombrage",
    "Convertisseur Boost", "Optimisation Métaheuristique", "Logique Floue",
    "Deep Learning", "Séquences Temporelles", "Modèles Hybrides", "Comparaison Globale"
  ]
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'bot' | 'user', text: string}[]>([
    { role: 'bot', text: "Bonjour ! Je suis l'assistant IA de PV-MPPT-IA. Comment puis-je vous aider avec vos recherches sur l'énergie solaire aujourd'hui ?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', text: "Erreur: Clé API Groq manquante dans le fichier .env." }]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const systemPrompt = `Tu es l'assistant expert du site PV-MPPT-IA. 
Voici tes connaissances de base:
- AUTEUR: ${KNOWLEDGE.author.name}, ${KNOWLEDGE.author.role} à l'ENIGA. Spécialiste en ${KNOWLEDGE.author.skills.join(', ')}.
- MODULE PV: ${KNOWLEDGE.module.name} (${KNOWLEDGE.module.power}, ${KNOWLEDGE.module.cells} cellules). Vmpp=${KNOWLEDGE.module.vmp}, Impp=${KNOWLEDGE.module.imp}.
- APP: Ce site simule des algos MPPT (P&O, PSO, GWO, ANN, LSTM, Transformers) et utilise une API météo en direct (Open-Meteo) pour Tunis.
Réponds de manière scientifique, élégante et concise en français. Si on te pose des questions sur l'auteur ou le panneau BP-485J, utilise les infos ci-dessus.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
            { role: "user", content: text }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const botText = data.choices?.[0]?.message?.content || "Désolé, j'ai rencontré une erreur lors de la génération de la réponse.";
      
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      console.error("Groq API Error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: "Une erreur réseau est survenue. Veuillez vérifier votre connexion ou votre clé API." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-primary-cyan text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-110 transition-transform active:scale-95"
      >
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 z-[70] w-[400px] max-w-[90vw] glass h-[600px] rounded-3xl flex flex-col border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-cyan/20 rounded-xl flex items-center justify-center text-primary-cyan">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Assistant MPPT</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">IA Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary-cyan text-black font-medium' 
                      : 'bg-white/5 border border-white/10 text-gray-200'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-1">
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-100" />
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <PromptInputBox 
                isLoading={loading}
                onSend={handleSend}
                placeholder="Posez votre question scientifique..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
