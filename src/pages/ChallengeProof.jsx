import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Image as ImageIcon, Video, Check } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export default function ChallengeProof() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challengeId');
  const participantId = searchParams.get('participantId');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("photo");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(true);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);

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

  const { data: challenge } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: async () => {
      const challenges = await base44.entities.Challenge.list();
      return challenges.find(c => c.id === challengeId);
    },
    enabled: !!challengeId
  });

  const submitProofMutation = useMutation({
    mutationFn: async (proofData) => {
      return await base44.entities.ChallengeProofSubmission.create(proofData);
    },
    onSuccess: async () => {
      // Update participant progress
      const participant = await base44.entities.ChallengeParticipant.list();
      const current = participant.find(p => p.id === participantId);
      
      if (current) {
        await base44.entities.ChallengeParticipant.update(current.id, {
          current_progress: (current.current_progress || 0) + 1
        });
      }
      
      queryClient.invalidateQueries(['challengeParticipation']);
      queryClient.invalidateQueries(['challengeProofs']);
      navigate(createPageUrl("Challenges"));
    }
  });

  const handleFileUpload = async (files, type) => {
    if (type === 'video' && files[0].size > MAX_VIDEO_SIZE) {
      alert(`Vídeo muito grande! Máximo 50MB. Tamanho: ${(files[0].size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: files[0] });
      setMediaUrl(file_url);
      setMediaType(type);
      setShowMediaOptions(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erro ao fazer upload. Tente novamente.");
    }
    setIsUploading(false);
  };

  const handleSubmit = () => {
    if (!mediaUrl) {
      alert("Adicione uma foto ou vídeo de comprovação!");
      return;
    }

    submitProofMutation.mutate({
      challenge_id: challengeId,
      participant_id: participantId,
      user_email: currentUser.email,
      photo_url: mediaUrl,
      notes: notes,
      progress_increment: 1
    });
  };

  if (!currentUser || !challenge) {
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
          <button
            onClick={() => navigate(createPageUrl("Challenges"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Comprovar Desafio</h1>
          <button
            onClick={handleSubmit}
            disabled={!mediaUrl || submitProofMutation.isPending}
            className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {submitProofMutation.isPending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-6">
        {/* Challenge Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-1">{challenge.title}</h2>
          <p className="text-sm text-gray-600">{challenge.description}</p>
        </div>

        {/* Media Upload */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            Foto ou Vídeo de Comprovação
          </label>

          {isUploading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF6B35] border-t-transparent mx-auto mb-2"></div>
              <span className="text-sm font-medium text-gray-700">Fazendo upload...</span>
            </div>
          )}

          {mediaUrl && !isUploading && (
            <div className="mb-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
                {mediaType === 'video' ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={mediaUrl} alt="Comprovante" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => {
                    setMediaUrl("");
                    setShowMediaOptions(true);
                  }}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Trocar
                </button>
              </div>
            </div>
          )}

          {showMediaOptions && !isUploading && (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all"
              >
                <Camera className="w-8 h-8 text-[#FF6B35] mb-2" />
                <span className="text-xs text-gray-700 font-medium">Tirar Foto</span>
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all"
              >
                <ImageIcon className="w-8 h-8 text-[#FF6B35] mb-2" />
                <span className="text-xs text-gray-700 font-medium">Galeria</span>
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all"
              >
                <Video className="w-8 h-8 text-[#FF6B35] mb-2" />
                <span className="text-xs text-gray-700 font-medium">Vídeo</span>
                <span className="text-[10px] text-gray-500 mt-1">Máx 50MB</span>
              </button>
            </div>
          )}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files, 'photo');
              }
              e.target.value = '';
            }}
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files, 'photo');
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
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files, 'video');
              }
              e.target.value = '';
            }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            Observações (opcional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Como foi o treino? Como está se sentindo?"
            className="min-h-[100px]"
          />
        </div>

        {/* Success Message */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Continue assim!</h3>
              <p className="text-sm text-green-700">
                Cada comprovação conta para seu progresso no desafio. 
                Continue compartilhando sua jornada!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}