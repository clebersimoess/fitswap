import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const LEVELS = ["Iniciante", "Intermediário", "Avançado"];
const CATEGORIES = ["Musculação", "Emagrecimento", "Hipertrofia", "Funcional", "Cardio", "Yoga"];

export default function CreateWorkoutPlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [priceMonthly, setPriceMonthly] = useState(0);
  const [level, setLevel] = useState("Iniciante");
  const [category, setCategory] = useState("Musculação");
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [includesNutrition, setIncludesNutrition] = useState(false);
  const [includesChat, setIncludesChat] = useState(true);
  const [active, setActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.account_type !== 'instructor') {
          navigate(createPageUrl("Home"));
        }
      } catch (error) {
        navigate(createPageUrl("Home"));
      }
    };
    getUser();
  }, [navigate]);

  const createPlanMutation = useMutation({
    mutationFn: async (planData) => {
      return await base44.entities.WorkoutPlan.create(planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorPlans']);
      navigate(createPageUrl("InstructorPanel"));
    }
  });

  const handleImageUpload = async (file) => {
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCoverImage(file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao fazer upload da imagem");
    }
    setIsUploading(false);
  };

  const handleCreate = () => {
    if (!title.trim() || !description.trim()) {
      alert("Preencha título e descrição!");
      return;
    }

    if (priceMonthly < 0) {
      alert("Preço não pode ser negativo!");
      return;
    }

    createPlanMutation.mutate({
      instructor_email: currentUser.email,
      title,
      description,
      cover_image: coverImage,
      price_monthly: priceMonthly,
      level,
      category,
      duration_weeks: durationWeeks,
      workouts_per_week: workoutsPerWeek,
      includes_nutrition: includesNutrition,
      includes_chat: includesChat,
      active,
      subscribers_count: 0
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl("InstructorPanel"))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Criar Plano de Treino</h1>
          </div>
          <Button
            onClick={handleCreate}
            disabled={createPlanMutation.isPending || isUploading}
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
          >
            {createPlanMutation.isPending ? "Criando..." : "Criar Plano"}
          </Button>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-6 max-w-2xl mx-auto">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Imagem de Capa
          </label>
          <div className="relative">
            {coverImage ? (
              <div className="relative h-48 rounded-xl overflow-hidden">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCoverImage("")}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B35] transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Adicionar imagem de capa</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Título do Plano</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Hipertrofia em 12 Semanas"
            maxLength={100}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Descrição</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o plano de treino..."
            className="min-h-[120px]"
            maxLength={1000}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Nível</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Categoria</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Preço Mensal (R$)
          </label>
          <Input
            type="number"
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Duração (semanas)
            </label>
            <Input
              type="number"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Treinos por semana
            </label>
            <Input
              type="number"
              value={workoutsPerWeek}
              onChange={(e) => setWorkoutsPerWeek(parseInt(e.target.value) || 0)}
              min="1"
              max="7"
            />
          </div>
        </div>

        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <Label htmlFor="nutrition" className="text-sm font-semibold text-gray-700">
              Inclui Nutrição
            </Label>
            <Switch
              id="nutrition"
              checked={includesNutrition}
              onCheckedChange={setIncludesNutrition}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="chat" className="text-sm font-semibold text-gray-700">
              Inclui Chat Direto
            </Label>
            <Switch
              id="chat"
              checked={includesChat}
              onCheckedChange={setIncludesChat}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active" className="text-sm font-semibold text-gray-700">
              Plano Ativo
            </Label>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📋 Resumo do Plano</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>• Nível: {level}</p>
            <p>• Categoria: {category}</p>
            <p>• Duração: {durationWeeks} semanas</p>
            <p>• Treinos: {workoutsPerWeek}x por semana</p>
            <p>• Preço: R$ {priceMonthly.toFixed(2)}/mês</p>
            <p>• Nutrição: {includesNutrition ? 'Sim' : 'Não'}</p>
            <p>• Chat: {includesChat ? 'Sim' : 'Não'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}