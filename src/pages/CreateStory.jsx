
import React, { useState, useRef, useEffect } from "react";
import { X, Check, Camera, Image as ImageIcon, Type, Smile, AlertCircle, Video, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FILTERS = ["Normal", "Sépia", "Preto e Branco", "Vintage", "Brilho"];

export default function CreateStory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("photo");
  const [text, setText] = useState("");
  const [sticker, setSticker] = useState("");
  const [filter, setFilter] = useState("Normal");
  const [visibility, setVisibility] = useState("Todos");
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRecordRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const createStoryMutation = useMutation({
    mutationFn: async (storyData) => {
      return await base44.entities.Story.create(storyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      navigate(createPageUrl("Home"));
    }
  });

  const handleFileUpload = async (files, type = 'photo') => {
    if (!files || files.length === 0) return;

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

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRecordRef.current) {
        videoRecordRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Upload recorded video
        setIsUploading(true);
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          setMediaUrl(file_url);
          setMediaType('video');
          setShowMediaOptions(false);
          setIsRecording(false);
        } catch (error) {
          console.error("Error uploading video:", error);
          alert("Erro ao fazer upload do vídeo.");
        }
        setIsUploading(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowMediaOptions(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handlePublish = () => {
    if (!mediaUrl) {
      alert("Adicione uma foto ou vídeo!");
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    createStoryMutation.mutate({
      photo_url: mediaUrl,
      video_url: mediaType === 'video' ? mediaUrl : null,
      media_type: mediaType,
      text,
      sticker,
      filter: mediaType === 'photo' ? filter : null,
      visibility,
      expires_at: expiresAt.toISOString()
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
          <h1 className="text-lg font-semibold text-gray-900">Novo Status</h1>
          <button
            onClick={handlePublish}
            disabled={!mediaUrl || createStoryMutation.isPending}
            className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {createStoryMutation.isPending ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-6">
        {isRecording && (
          <div className="space-y-4">
            <video
              ref={videoRecordRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[9/16] bg-black rounded-xl"
            />
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="font-semibold">Gravando...</span>
              </div>
              <Button
                onClick={stopVideoRecording}
                className="bg-red-600 hover:bg-red-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Parar Gravação
              </Button>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Fazendo upload...</p>
          </div>
        )}

        {mediaUrl && !isUploading && (
          <div className="space-y-4">
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black">
              {mediaType === 'video' ? (
                <video src={mediaUrl} className="w-full h-full object-cover" controls />
              ) : (
                <img 
                  src={mediaUrl} 
                  alt="Story" 
                  className="w-full h-full object-cover"
                  style={{
                    filter: 
                      filter === "Sépia" ? "sepia(100%)" :
                      filter === "Preto e Branco" ? "grayscale(100%)" :
                      filter === "Vintage" ? "sepia(50%) contrast(110%)" :
                      filter === "Brilho" ? "brightness(120%)" :
                      "none"
                  }}
                />
              )}
              
              {text && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white text-2xl font-bold text-center px-4 drop-shadow-lg">
                    {text}
                  </p>
                </div>
              )}
              
              {sticker && (
                <div className="absolute top-4 right-4 text-4xl drop-shadow-lg">
                  {sticker}
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                setMediaUrl("");
                setText("");
                setSticker("");
                setFilter("Normal");
                setMediaType("photo");
                setShowMediaOptions(true);
              }}
              variant="outline"
              className="w-full"
            >
              Trocar Mídia
            </Button>
          </div>
        )}

        {showMediaOptions && !isUploading && !isRecording && (
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Escolha uma opção
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all"
              >
                <Camera className="w-10 h-10 text-[#FF6B35] mb-2" />
                <span className="text-sm text-gray-700 font-medium">Tirar Foto</span>
              </button>
              
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all"
              >
                <ImageIcon className="w-10 h-10 text-[#FF6B35] mb-2" />
                <span className="text-sm text-gray-700 font-medium">Galeria</span>
              </button>
              
              <button
                onClick={() => videoInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-gray-300 flex flex-col items-center justify-center hover:border-[#FF6B35] hover:bg-orange-50 transition-all"
              >
                <Video className="w-10 h-10 text-[#FF6B35] mb-2" />
                <span className="text-sm text-gray-700 font-medium">Upload Vídeo</span>
              </button>
              
              <button
                onClick={startVideoRecording}
                className="aspect-square rounded-xl border-2 border-red-300 bg-red-50 flex flex-col items-center justify-center hover:border-red-500 hover:bg-red-100 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center mb-2">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-red-700 font-medium">Gravar Vídeo</span>
              </button>
            </div>
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFileUpload(e.target.files, 'photo');
            e.target.value = '';
          }}
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFileUpload(e.target.files, 'photo');
            e.target.value = '';
          }}
        />

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            handleFileUpload(e.target.files, 'video');
            e.target.value = '';
          }}
        />

        {mediaUrl && mediaType === 'photo' && (
          <>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Adicionar Texto
              </label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite algo..."
                className="min-h-[80px]"
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Adicionar Sticker
              </label>
              <div className="flex gap-2 flex-wrap">
                {["💪", "🔥", "⚡", "✨", "🏆", "💯", "👍", "❤️"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSticker(sticker === emoji ? "" : emoji)}
                    className={`text-3xl p-3 rounded-xl border-2 transition-all ${
                      sticker === emoji
                        ? "border-[#FF6B35] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Filtro
              </label>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full border-2 whitespace-nowrap transition-all ${
                      filter === f
                        ? "border-[#FF6B35] bg-orange-50 text-[#FF6B35] font-semibold"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            Quem pode ver
          </label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Seguidores">Apenas Seguidores</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
