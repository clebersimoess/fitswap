import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState({ title: "", subtitle: "" });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log("User not logged in");
      }
    };
    getUser();

    // Determinar saudação baseada no horário
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({ title: "Bom dia, atleta!", subtitle: "Prepare-se para evoluir com a comunidade FitSwap." });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({ title: "Boa tarde, campeão!", subtitle: "Prepare-se para evoluir com a comunidade FitSwap." });
    } else {
      setGreeting({ title: "Boa noite, guerreiro!", subtitle: "Prepare-se para evoluir com a comunidade FitSwap." });
    }
  }, []);

  const handleContinue = () => {
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image com Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80"
          alt="Fitness Background"
          className="w-full h-full object-cover filter blur-sm"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between p-6 py-12">
        {/* Logo FitSwap */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 mt-8"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center shadow-2xl border-4 border-white/20">
            <Dumbbell className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF006E] bg-clip-text text-transparent drop-shadow-2xl">
            FitSwap
          </h1>
        </motion.div>

        {/* Saudação Central */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-md"
        >
          <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
            {greeting.title}
          </h2>
          <p className="text-xl text-white/90 font-medium drop-shadow-lg leading-relaxed">
            {greeting.subtitle}
          </p>

          {currentUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
            >
              <p className="text-white font-semibold text-lg">
                Olá, {currentUser.full_name?.split(' ')[0] || 'Atleta'}! 👋
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Botão de Continuar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-md mb-8"
        >
          <button
            onClick={handleContinue}
            className="w-full py-4 px-8 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <span>Entrar no FitSwap</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2 h-2 rounded-full bg-white/40"></div>
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white/40"></div>
          </div>
        </motion.div>
      </div>

      {/* Efeito de brilho no logo */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 0, 110, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 107, 53, 0.8), 0 0 60px rgba(255, 0, 110, 0.5);
          }
        }
        
        .shadow-3xl {
          box-shadow: 0 20px 60px -10px rgba(255, 107, 53, 0.5);
        }
      `}</style>
    </div>
  );
}