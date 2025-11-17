
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Search, PlusCircle, Users, User, Trophy } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: createPageUrl("Home"), icon: Home, label: "Feed" },
    { name: "Explore", path: createPageUrl("Explore"), icon: Search, label: "Buscar" },
    { name: "Challenges", path: createPageUrl("Challenges"), icon: Trophy, label: "Desafios" },
    { name: "CreatePost", path: createPageUrl("CreatePost"), icon: PlusCircle, label: "Criar", isCenter: true },
    { name: "Communities", path: createPageUrl("Communities"), icon: Users, label: "Comunidades" },
    { name: "Profile", path: createPageUrl("Profile"), icon: User, label: "Perfil" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #FF6B35 0%, #FF006E 100%);
          --primary-color: #FF6B35;
          --secondary-color: #FF006E;
        }
        
        body {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .bottom-nav-fixed {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 9999 !important;
        }
      `}</style>
      
      <main className="max-w-2xl mx-auto pb-24">
        {children}
      </main>

      <nav className="bottom-nav-fixed bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl">
        <div 
          className="max-w-2xl mx-auto flex justify-around items-center h-16 px-0.5"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            if (item.isCenter) {
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex flex-col items-center justify-center flex-1 transition-all min-w-0"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E] flex items-center justify-center shadow-xl -mt-6 border-4 border-white hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all min-w-0 py-2"
              >
                <div className={`transition-all ${active ? 'scale-110' : 'scale-100'}`}>
                  <Icon 
                    className={`w-5 h-5 transition-colors ${
                      active ? 'text-[#FF6B35]' : 'text-gray-400'
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </div>
                <span className={`text-[9px] font-medium transition-colors truncate max-w-full px-0.5 ${
                  active ? 'text-[#FF6B35]' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
