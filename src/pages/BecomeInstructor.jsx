import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Award, DollarSign, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";

const SPECIALTIES = [
  "Musculação",
  "Emagrecimento",
  "Hipertrofia",
  "Funcional",
  "Yoga",
  "Pilates",
  "Crossfit",
  "Personal Trainer"
];

export default function BecomeInstructor() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [cref, setCref] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [bio, setBio] = useState("");

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        if (user.bio) setBio(user.bio);
      } catch (error) {
        console.log("User not logged in");
      }
    };
    getUser();
  }, []);

  const becomeInstructorMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe({
        account_type: 'instrutor',
        cref: data.cref,
        specialties: data.specialties,
        bio: data.bio,
        is_verified: false // Will be reviewed by admin
      });
    },
    onSuccess: () => {
      navigate(createPageUrl("Profile"));
    }
  });

  const handleToggleSpecialty = (specialty) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!cref || selectedSpecialties.length === 0) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    becomeInstructorMutation.mutate({
      cref,
      specialties: selectedSpecialties,
      bio
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Tornar-se Instrutor</h1>
            <p className="text-sm text-gray-500">Venda treinos e ganhe dinheiro</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-24">
        {/* Benefits */}
        <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF006E] rounded-2xl p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-4">Benefícios do Instrutor</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">Monetize seu conhecimento</p>
                <p className="text-sm opacity-90">Crie planos pagos de R$ 50 a R$ 200/mês</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">Acompanhe seus alunos</p>
                <p className="text-sm opacity-90">Chat exclusivo e envio de treinos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">Selo de verificação</p>
                <p className="text-sm opacity-90">Badge azul de instrutor verificado</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">Comissão de apenas 15%</p>
                <p className="text-sm opacity-90">Você fica com 85% do valor dos planos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              CREF (Número de Registro) *
            </label>
            <Input
              value={cref}
              onChange={(e) => setCref(e.target.value)}
              placeholder="000000-G/SP"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Necessário para verificação profissional
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Especialidades * (selecione ao menos 1)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTIES.map((specialty) => (
                <div
                  key={specialty}
                  onClick={() => handleToggleSpecialty(specialty)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSpecialties.includes(specialty)
                      ? 'border-[#FF6B35] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedSpecialties.includes(specialty)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {specialty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Sobre Você
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte sobre sua experiência, formação e metodologia de treino..."
              className="min-h-[120px]"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <strong>Processo de verificação:</strong> Após enviar, nossa equipe 
              irá revisar seu cadastro em até 48 horas. Você receberá um email 
              com o resultado da análise.
            </p>
          </div>

          <Button
            type="submit"
            disabled={becomeInstructorMutation.isPending}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E] hover:shadow-lg"
          >
            {becomeInstructorMutation.isPending ? "Enviando..." : "Solicitar Verificação"}
          </Button>
        </form>
      </div>
    </div>
  );
}