
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  X,
  User,
  Lock,
  Bell,
  LogOut,
  Trash2,
  ChevronRight,
  Shield,
  Moon,
  FileText,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Initialize queryClient
  const [currentUser, setCurrentUser] = useState(null);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log("User not logged in");
        // Optionally navigate to login or show an error
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear all local data first
      queryClient.clear();
      
      // Logout and redirect to login
      await base44.auth.logout(window.location.origin);
    } catch (error) {
      console.error("Logout error:", error);
      
      // Force complete reload to clear all state and redirect to login
      window.location.href = window.location.origin;
    }
  };

  const handleDeleteAccount = async () => {
    alert("Funcionalidade em desenvolvimento");
    setShowDeleteDialog(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  const settingsSections = [
    {
      title: "Conta",
      items: [
        {
          icon: User,
          label: "Editar Perfil",
          onClick: () => navigate(createPageUrl("EditProfile")),
          showArrow: true
        },
        {
          icon: Shield,
          label: "Privacidade",
          description: "Perfil privado",
          toggle: true,
          value: privateProfile,
          onChange: setPrivateProfile
        }
      ]
    },
    {
      title: "Notificações",
      items: [
        {
          icon: Bell,
          label: "Notificações Push",
          description: "Receber notificações no celular",
          toggle: true,
          value: pushNotifications,
          onChange: setPushNotifications
        },
        {
          icon: Bell,
          label: "Notificações por Email",
          description: "Receber emails de atividades",
          toggle: true,
          value: emailNotifications,
          onChange: setEmailNotifications
        }
      ]
    },
    {
      title: "Aparência",
      items: [
        {
          icon: Moon,
          label: "Modo Escuro",
          description: "Em breve",
          toggle: true,
          value: false,
          onChange: () => {},
          disabled: true
        }
      ]
    },
    {
      title: "Legal e Ajuda",
      items: [
        {
          icon: FileText,
          label: "Termos de Uso",
          onClick: () => navigate(createPageUrl("TermsOfService")),
          showArrow: true
        },
        {
          icon: FileText,
          label: "Política de Privacidade",
          onClick: () => navigate(createPageUrl("PrivacyPolicy")),
          showArrow: true
        },
        {
          icon: HelpCircle,
          label: "Ajuda com Permissões",
          description: "Câmera e galeria",
          onClick: () => navigate(createPageUrl("PermissionsHelp")),
          showArrow: true
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(createPageUrl("Profile"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Configurações</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {currentUser.profile_photo ? (
              <img src={currentUser.profile_photo} alt={currentUser.full_name || 'User'} className="w-full h-full object-cover" />
            ) : (
              currentUser.full_name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{currentUser.full_name}</p>
            <p className="text-sm text-gray-500">{currentUser.email}</p>
          </div>
        </div>

        {settingsSections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 px-2">
              {section.title}
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden">
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    itemIdx !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                  </div>
                  {item.toggle ? (
                    <Switch
                      checked={item.value}
                      onCheckedChange={item.onChange}
                      disabled={item.disabled}
                    />
                  ) : item.showArrow ? (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 px-2">
            Zona de Perigo
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-orange-600">Sair da Conta</p>
              </div>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-red-600">Deletar Conta</p>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 pt-4">
          FitSwap v1.0.0
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e não pode ser desfeita. Todos os seus treinos,
              stories e dados serão perdidos para sempre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, deletar minha conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
