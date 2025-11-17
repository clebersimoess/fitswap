import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";

const CHALLENGE_TYPES = ["Dias Consecutivos", "Meta de Treinos", "Objetivo de Peso", "Competição"];

export default function CreateChallenge() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [type, setType] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [virtualPrize, setVirtualPrize] = useState("");
  const [prizeIcon, setPrizeIcon] = useState("🏆");
  const [prizeRarity, setPrizeRarity] = useState("Ouro");
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef(null);

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
  }, []);

  const handleImageUpload = async (file) => {
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao fazer upload da imagem");
    }
    setIsUploading(false);
  };

  const createChallengeMutation = useMutation({
    mutationFn: async (challengeData) => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(durationDays));

      await base44.entities.Challenge.create({
        ...challengeData,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        participants_count: 0
      });
    },
    onSuccess: () => {
      navigate(createPageUrl("Challenges"));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title || !description || !type || !targetValue || !durationDays) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    createChallengeMutation.mutate({
      creator_email: currentUser.email,
      title,
      description,
      image_url: imageUrl,
      type,
      target_value: parseInt(targetValue),
      duration_days: parseInt(durationDays),
      virtual_prize: virtualPrize,
      prize_icon: prizeIcon,
      prize_rarity: prizeRarity,
      is_public: isPublic
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
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(createPageUrl("Challenges"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Criar Desafio</h1>
        </div>
      </header>

      <div className="p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Privacy Selection - FIRST STEP */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Visibilidade do Desafio *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-4 border-2 rounded-xl transition-all ${
                  isPublic
                    ? 'border-[#FF6B35] bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Unlock className={`w-8 h-8 mx-auto mb-2 ${isPublic ? 'text-[#FF6B35]' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${isPublic ? 'text-[#FF6B35]' : 'text-gray-700'}`}>
                  Público
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Qualquer um pode participar
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-4 border-2 rounded-xl transition-all ${
                  !isPublic
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Lock className={`w-8 h-8 mx-auto mb-2 ${!isPublic ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${!isPublic ? 'text-blue-600' : 'text-gray-700'}`}>
                  Privado
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Apenas convidados
                </p>
              </button>
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Foto do Desafio *
            </label>
            <div className="relative h-48 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300">
              {imageUrl ? (
                <img src={imageUrl} alt="Desafio" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Adicione uma foto ao desafio</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                ) : (
                  <p className="text-white font-medium">
                    {imageUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                  </p>
                )}
              </button>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Título *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desafio 30 Dias de Treino"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Descrição *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o desafio, regras e objetivos..."
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Tipo de Desafio *
            </label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {CHALLENGE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Meta *
              </label>
              <Input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="30"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {type === "Dias Consecutivos" && "Dias a completar"}
                {type === "Meta de Treinos" && "Número de treinos"}
                {type === "Objetivo de Peso" && "Peso alvo (kg)"}
                {type === "Competição" && "Pontos necessários"}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Duração (dias) *
              </label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="30"
                required
              />
            </div>
          </div>

          {/* Virtual Prize */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Prêmio Virtual (opcional)
            </label>
            <Input
              value={virtualPrize}
              onChange={(e) => setVirtualPrize(e.target.value)}
              placeholder="Ex: Medalha de Ouro Especial"
            />
          </div>

          {/* Prize Icon & Rarity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Ícone do Prêmio
              </label>
              <Select value={prizeIcon} onValueChange={setPrizeIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="🏆">🏆 Troféu</SelectItem>
                  <SelectItem value="🥇">🥇 Medalha Ouro</SelectItem>
                  <SelectItem value="🥈">🥈 Medalha Prata</SelectItem>
                  <SelectItem value="🥉">🥉 Medalha Bronze</SelectItem>
                  <SelectItem value="👑">👑 Coroa</SelectItem>
                  <SelectItem value="⭐">⭐ Estrela</SelectItem>
                  <SelectItem value="🔥">🔥 Fogo</SelectItem>
                  <SelectItem value="💪">💪 Força</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Raridade
              </label>
              <Select value={prizeRarity} onValueChange={setPrizeRarity}>
                <SelectTrigger>
                  <SelectValue placeholder="Raridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Prata">Prata</SelectItem>
                  <SelectItem value="Ouro">Ouro</SelectItem>
                  <SelectItem value="Platina">Platina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Prêmios Virtuais:</strong> Apenas medalhas, troféus e badges virtuais são permitidos. 
              Nada de prêmios reais, dinheiro ou brindes físicos.
            </p>
          </div>

          <Button
            type="submit"
            disabled={createChallengeMutation.isPending}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E] hover:shadow-lg"
          >
            {createChallengeMutation.isPending ? "Criando..." : "Criar Desafio"}
          </Button>
        </form>
      </div>
    </div>
  );
}