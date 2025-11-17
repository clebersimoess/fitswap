
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";

const SEGMENTS = [
  "Academia",
  "Loja de Suplementos",
  "Roupas Esportivas",
  "Personal Trainer",
  "Nutricionista",
  "Outro"
];

export default function BusinessSetup() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [segment, setSegment] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [website, setWebsite] = useState("");

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

  const createBusinessMutation = useMutation({
    mutationFn: async (data) => {
      // Calculate free period end date (3 months from now)
      const freePeriodEnds = new Date();
      freePeriodEnds.setMonth(freePeriodEnds.getMonth() + 3);

      await base44.entities.BusinessProfile.create({
        ...data,
        free_period_ends: freePeriodEnds.toISOString().split('T')[0],
        submitted_at: new Date().toISOString(),
        verification_status: 'pending',
        verified: false
      });

      // Update user account type
      await base44.auth.updateMe({
        account_type: 'comercial'
      });
    },
    onSuccess: () => {
      alert("Cadastro enviado! Nossa equipe irá verificar suas informações em até 48 horas. Você receberá um email com o resultado.");
      navigate(createPageUrl("Profile"));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!businessName || !cnpj || !segment || !phone || !address || !city) {
      alert("Preencha os campos obrigatórios!");
      return;
    }

    createBusinessMutation.mutate({
      user_email: currentUser.email,
      business_name: businessName,
      cnpj,
      segment,
      phone,
      address,
      city,
      state,
      website
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
            <h1 className="text-lg font-semibold text-gray-900">Configurar Perfil Comercial</h1>
            <p className="text-sm text-gray-500">Anuncie após verificação</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-24">
        {/* Benefits */}
        <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF006E] rounded-2xl p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-3">Benefícios do Perfil Comercial</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Anúncios verificados nos stories dos usuários</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Badge de verificação comercial após aprovação</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Estatísticas de visualizações e cliques</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>3 meses grátis após verificação</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Verificação manual pela nossa equipe (até 48h)</span>
            </li>
          </ul>
        </div>

        {/* Warning */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Importante:</strong> Todos os perfis comerciais passam por verificação manual. 
            Certifique-se de fornecer informações verdadeiras e atualizadas. Anúncios só poderão 
            ser criados após a aprovação.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Nome da Empresa *
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Academia FitZone"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              CNPJ *
            </label>
            <Input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Será verificado pela nossa equipe
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Segmento *
            </label>
            <Select value={segment} onValueChange={setSegment} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento" />
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
              Telefone *
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Estado (UF)
              </label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Endereço Completo *
            </label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, CEP..."
              className="min-h-[80px]"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Website/Instagram
            </label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Button
            type="submit"
            disabled={createBusinessMutation.isPending}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E] hover:shadow-lg"
          >
            {createBusinessMutation.isPending ? "Enviando..." : "Enviar para Verificação"}
          </Button>
        </form>
      </div>
    </div>
  );
}
