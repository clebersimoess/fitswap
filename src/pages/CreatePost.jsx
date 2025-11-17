import React, { useState, useRef } from "react";
import { X, Plus, Trash2, Image as ImageIcon, Camera, Video, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Musculação", "Cardio", "Yoga", "Crossfit", "Corrida", "Funcional"];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export default function CreatePost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [media, setMedia] = useState([]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [exercises, setExercises] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      return await base44.entities.Post.create(postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      navigate(createPageUrl("Home"));
    }
  });

  const handleFileUpload = async (files, type = 'photo') => {
    if (media.length + files.length > 4) {
      alert("Máximo de 4 fotos/vídeos!");
      return;
    }

    // Validar vídeos
    if (type === 'video') {
      for (let file of files) {
        if (file.size > MAX_VIDEO_SIZE) {
          alert(`Vídeo muito grande! Máximo 50MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
          return;
        }
        if (!file.type.startsWith('video/')) {
          alert("Apenas vídeos são permitidos!");
          return;
        }
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setUploadProgress(((index + 1) / files.length) * 100);
        return { url: file_url, type };
      });
      
      const urls = await Promise.all(uploadPromises);
      setMedia([...media, ...urls]);
      setShowMediaOptions(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Erro ao fazer upload. Tente novamente.");
    }
    
    setIsUploading(false);
    setUploadProgress(0);
  };

  const removeMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: 12, weight: 0 }]);
  };

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    if (!description.trim()) {
      alert("Adicione uma descrição!");
      return;
    }

    createPostMutation.mutate({
      description,
      photos: media.filter(m => m.type === 'photo').map(m => m.url),
      videos: media.filter(m => m.type === 'video').map(m => m.url),
      category,
      exercises: exercises.filter(e => e.name.trim())
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(createPageUrl("Home"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Novo Treino</h1>
          <button 
            onClick={handlePublish}
            disabled={!description.trim() || createPostMutation.isPending}
            className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {createPostMutation.isPending ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            Fotos/Vídeos do Treino (até 4)
          </label>
          
          {isUploading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#FF6B35] border-t-transparent"></div>
                <span className="text-sm font-medium text-gray-700">Fazendo upload...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            {media.map((item, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-black">
                {item.type === 'video' ? (
                  <div className="relative w-full h-full">
                    <video src={item.url} className="w-full h-full object-cover" controls />
                  </div>
                ) : (
                  <img src={item.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => removeMedia(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {item.type === 'video' && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded-md flex items-center gap-1">
                    <Video className="w-3 h-3 text-white" />
                    <span className="text-xs text-white font-medium">Vídeo</span>
                  </div>
                )}
              </div>
            ))}
            
            {media.length < 4 && !showMediaOptions && !isUploading && (
              <button
                onClick={() => setShowMediaOptions(true)}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all"
              >
                <Plus className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Adicionar</span>
              </button>
            )}

            {media.length < 4 && showMediaOptions && !isUploading && (
              <>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all bg-white"
                >
                  <Camera className="w-8 h-8 text-[#FF6B35] mb-2" />
                  <span className="text-xs text-gray-700 font-medium">Foto</span>
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all bg-white"
                >
                  <ImageIcon className="w-8 h-8 text-[#FF6B35] mb-2" />
                  <span className="text-xs text-gray-700 font-medium">Galeria</span>
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all bg-white"
                >
                  <Video className="w-8 h-8 text-[#FF6B35] mb-2" />
                  <span className="text-xs text-gray-700 font-medium">Vídeo</span>
                  <span className="text-[10px] text-gray-500 mt-1">Máx 50MB</span>
                </button>
              </>
            )}
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                handleFileUpload(files, 'photo');
              }
              e.target.value = '';
            }}
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                handleFileUpload(files, 'photo');
              }
              e.target.value = '';
            }}
          />

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                handleFileUpload(files, 'video');
              }
              e.target.value = '';
            }}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            O que treinou hoje?
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva seu treino, como se sentiu, objetivos..."
            className="min-h-[120px] resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            Categoria
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">
              Ficha Técnica (opcional)
            </label>
            <button
              onClick={addExercise}
              className="flex items-center gap-1 text-sm text-[#FF6B35] font-semibold hover:text-[#FF006E] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Exercício
            </button>
          </div>
          
          <div className="space-y-4">
            {exercises.map((exercise, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-start justify-between">
                  <Input
                    value={exercise.name}
                    onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                    placeholder="Nome do exercício"
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeExercise(idx)}
                    className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Séries</label>
                    <Input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Reps</label>
                    <Input
                      type="number"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(idx, 'reps', parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Carga (kg)</label>
                    <Input
                      type="number"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(idx, 'weight', parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}