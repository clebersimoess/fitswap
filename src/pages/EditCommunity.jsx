import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, X, Lock, Unlock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  "Fitness Geral",
  "Corrida",
  "Musculação",
  "Yoga",
  "CrossFit",
  "Funcional",
  "Emagrecimento",
  "Outro"
];

export default function EditCommunity() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get("communityId");
  const [currentUser, setCurrentUser] = useState(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fitness Geral");
  const [isPublic, setIsPublic] = useState(true);
  const [rules, setRules] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        navigate(createPageUrl("Communities"));
      }
    };
    getUser();
  }, [navigate]);

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const result = await base44.entities.Community.filter({ id: communityId });
      return result[0];
    },
    enabled: !!communityId
  });

  // Populate form when community loads
  useEffect(() => {
    if (community) {
      setName(community.name || "");
      setDescription(community.description || "");
      setCategory(community.category || "Fitness Geral");
      setIsPublic(community.is_public ?? true);
      setRules(community.rules || "");
      setCoverPhoto(community.cover_photo || "");
    }
  }, [community]);

  const updateCommunityMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Community.update(communityId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communities']);
      queryClient.invalidateQueries(['community']);
      navigate(createPageUrl("Communities"));
    }
  });

  const handleImageUpload = async (file) => {
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCoverPhoto(file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao fazer upload da imagem");
    }
    setIsUploading(false);
  };

  const handleSave = () => {
    if (!name.trim() || !description.trim()) {
      alert("Preencha nome e descrição!");
      return;
    }

    updateCommunityMutation.mutate({
      name,
      description,
      category,
      is_public: isPublic,
      rules,
      cover_photo: coverPhoto
    });
  };

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  // Check if current user is owner
  const isOwner = community.owner_email === currentUser?.email;

  if (!isOwner) {
    navigate(createPageUrl("Communities"));
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl("Communities"))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Editar Comunidade</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateCommunityMutation.isPending || isUploading}
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
          >
            {updateCommunityMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-6">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Foto de Capa
          </label>
          <div className="relative">
            {coverPhoto ? (
              <div className="relative h-48 rounded-xl overflow-hidden">
                <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCoverPhoto("")}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B35] transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Adicionar foto de capa</span>
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
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Nome</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Corredores de SP"
            maxLength={50}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Descrição</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o propósito da comunidade..."
            className="min-h-[120px]"
            maxLength={500}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Categoria</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Privacidade</label>
          <Select value={isPublic ? "public" : "private"} onValueChange={(v) => setIsPublic(v === "public")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  <span>Pública - Qualquer um pode entrar</span>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Privada - Requer aprovação</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Regras (opcional)</label>
          <Textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Defina as regras da comunidade..."
            className="min-h-[100px]"
            maxLength={1000}
          />
        </div>
      </div>
    </div>
  );
}