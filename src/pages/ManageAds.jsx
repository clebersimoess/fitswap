import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Eye, MousePointer, AlertCircle, CheckCircle, Clock, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SEGMENTS = ["Academia", "Suplementos", "Roupas", "Equipamentos", "Serviços", "Nutrição"];

export default function ManageAds() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [segment, setSegment] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user.account_type !== 'comercial') {
          navigate(createPageUrl("BusinessSetup"));
          return;
        }

        const profiles = await base44.entities.BusinessProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          setBusinessProfile(profiles[0]);
          setPhone(profiles[0].phone || "");
          setAddress(profiles[0].address || "");
          setCity(profiles[0].city || "");
          setState(profiles[0].state || "");
        }
      } catch (error) {
        console.log("User not logged in");
      }
    };
    getUser();
  }, [navigate]);

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['myAds', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Advertisement.filter({ business_email: currentUser.email }, '-created_date');
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const createAdMutation = useMutation({
    mutationFn: async (adData) => {
      return await base44.entities.Advertisement.create({
        ...adData,
        submitted_at: new Date().toISOString(),
        approval_status: 'pending',
        verified: false,
        active: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myAds']);
      setShowCreateForm(false);
      resetForm();
      alert("Anúncio enviado para aprovação! Nossa equipe irá revisar em até 48 horas.");
    }
  });

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setLinkUrl("");
    setSegment("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!businessProfile?.verified) {
      alert("Seu perfil comercial precisa ser verificado antes de criar anúncios!");
      return;
    }

    if (!title || !description || !imageUrl || !segment || !phone || !address || !city) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    createAdMutation.mutate({
      business_email: currentUser.email,
      business_name: businessProfile.business_name,
      title,
      description,
      image_url: imageUrl,
      link_url: linkUrl,
      segment,
      phone,
      address,
      city,
      state
    });
  };

  const getStatusBadge = (ad) => {
    if (ad.approval_status === 'approved' && ad.verified) {
      return <Badge className="bg-green-100 text-green-700">✓ Aprovado</Badge>;
    } else if (ad.approval_status === 'rejected') {
      return <Badge className="bg-red-100 text-red-700">✗ Rejeitado</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-700">⏳ Aguardando Aprovação</Badge>;
    }
  };

  if (!currentUser || !businessProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(createPageUrl("Settings"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Meus Anúncios</h1>
            {businessProfile.verified ? (
              <p className="text-sm text-green-600">✓ Perfil Verificado</p>
            ) : (
              <p className="text-sm text-yellow-600">⏳ Aguardando Verificação</p>
            )}
          </div>
          {businessProfile.verified && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Anúncio
            </Button>
          )}
        </div>
      </header>

      <div className="p-4 pb-24">
        {/* Verification Warning */}
        {!businessProfile.verified && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">
                    Verificação Pendente
                  </p>
                  <p className="text-sm text-yellow-800">
                    Seu perfil comercial está sendo analisado pela nossa equipe. 
                    Você poderá criar anúncios após a aprovação (até 48 horas).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Política de Anúncios</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Todos os anúncios são revisados manualmente</li>
              <li>✓ Apenas informações verdadeiras e verificáveis</li>
              <li>✓ Proibido conteúdo enganoso ou ofensivo</li>
              <li>✓ Tempo de aprovação: até 48 horas</li>
            </ul>
          </CardContent>
        </Card>

        {/* Create Form */}
        {showCreateForm && businessProfile.verified && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Criar Novo Anúncio</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Imagem do Anúncio *
                  </label>
                  {imageUrl ? (
                    <div className="relative">
                      <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      <Button
                        type="button"
                        onClick={() => setImageUrl("")}
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-[#FF6B35] transition-colors"
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#FF6B35] border-t-transparent"></div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Clique para fazer upload</span>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Título do Anúncio *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Academia FitZone - Matrículas Abertas!"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Descrição *
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva seu anúncio, promoções, diferenciais..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Categoria *
                  </label>
                  <Select value={segment} onValueChange={setSegment} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map((seg) => (
                        <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Link (opcional)
                  </label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://seusite.com.br"
                    type="url"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Telefone *
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Cidade *
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Endereço Completo *
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro..."
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAdMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
                  >
                    {createAdMutation.isPending ? "Enviando..." : "Enviar para Aprovação"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Ads List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seus Anúncios</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#FF6B35] border-t-transparent"></div>
            </div>
          ) : ads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Você ainda não criou nenhum anúncio</p>
                {businessProfile.verified && (
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
                  >
                    Criar Primeiro Anúncio
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <Card key={ad.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{ad.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{ad.description}</p>
                          </div>
                          {getStatusBadge(ad)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {ad.views_count || 0} visualizações
                          </div>
                          <div className="flex items-center gap-1">
                            <MousePointer className="w-4 h-4" />
                            {ad.clicks_count || 0} cliques
                          </div>
                        </div>
                        {ad.rejection_reason && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                            <strong>Motivo da rejeição:</strong> {ad.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}