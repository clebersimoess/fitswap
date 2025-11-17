import React, { useState, useRef } from "react";
import { X, Upload, Users, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const CHALLENGE_TYPES = ["Dias Consecutivos", "Meta de Treinos", "Objetivo de Peso", "Competição"];

export default function CreatePrivateChallengeModal({ currentUser, myStudents, allUsers, onClose }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [type, setType] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [virtualPrize, setVirtualPrize] = useState("");
  const [prizeIcon, setPrizeIcon] = useState("🏆");
  const [prizeRarity, setPrizeRarity] = useState("Ouro");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef(null);

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

      await base44.entities.PrivateChallenge.create({
        ...challengeData,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        participants_count: selectedStudents.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPrivateChallenges']);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title || !type || !targetValue || !durationDays) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    if (selectedStudents.length === 0) {
      alert("Selecione pelo menos um aluno!");
      return;
    }

    createChallengeMutation.mutate({
      instructor_email: currentUser.email,
      title,
      description,
      image_url: imageUrl,
      type,
      target_value: parseInt(targetValue),
      duration_days: parseInt(durationDays),
      virtual_prize: virtualPrize,
      prize_icon: prizeIcon,
      prize_rarity: prizeRarity,
      invited_students: selectedStudents
    });
  };

  const toggleStudent = (email) => {
    setSelectedStudents(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const activeStudents = myStudents.filter(s => s.status === 'active');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Criar Desafio Privado</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Imagem do Desafio
            </label>
            <div className="relative h-48 bg-gray-100 rounded-xl overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="Desafio" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-400" />
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
                    {imageUrl ? 'Alterar Imagem' : 'Adicionar Imagem'}
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

          {/* Title & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Título *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Desafio 30 Dias - Turma Avançada"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Descrição
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o desafio e as regras..."
                className="h-20"
              />
            </div>
          </div>

          {/* Type & Target & Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Tipo *
              </label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CHALLENGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Dias *
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

          {/* Prize */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Ícone
              </label>
              <Select value={prizeIcon} onValueChange={setPrizeIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="🏆">🏆 Troféu</SelectItem>
                  <SelectItem value="🥇">🥇 Ouro</SelectItem>
                  <SelectItem value="🥈">🥈 Prata</SelectItem>
                  <SelectItem value="🥉">🥉 Bronze</SelectItem>
                  <SelectItem value="👑">👑 Coroa</SelectItem>
                  <SelectItem value="⭐">⭐ Estrela</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Prêmio Virtual
              </label>
              <Input
                value={virtualPrize}
                onChange={(e) => setVirtualPrize(e.target.value)}
                placeholder="Ex: Medalha Especial do Mês"
              />
            </div>
          </div>

          {/* Select Students */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
              <Users className="w-4 h-4" />
              Selecionar Alunos * ({selectedStudents.length} selecionados)
            </label>
            {activeStudents.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                Você ainda não tem alunos ativos
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {activeStudents.map((student) => {
                  const studentUser = allUsers.find(u => u.email === student.student_email);
                  const isSelected = selectedStudents.includes(student.student_email);
                  
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.student_email)}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-orange-50 border-l-4 border-[#FF6B35]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold">
                        {studentUser?.full_name?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {studentUser?.full_name || student.student_email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {student.plan_type}
                        </p>
                      </div>
                      {isSelected && (
                        <Trophy className="w-5 h-5 text-[#FF6B35]" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createChallengeMutation.isPending || activeStudents.length === 0}
              className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
            >
              {createChallengeMutation.isPending ? 'Criando...' : 'Criar Desafio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}