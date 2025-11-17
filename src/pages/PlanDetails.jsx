
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Check, Calendar, Users, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PlanDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const [currentUser, setCurrentUser] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showPixInstructions, setShowPixInstructions] = useState(false); // New state for PIX instructions

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

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      const plans = await base44.entities.WorkoutPlan.list();
      return plans.find(p => p.id === planId);
    },
    enabled: !!planId
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', plan?.instructor_email],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.email === plan.instructor_email);
    },
    enabled: !!plan?.instructor_email
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data) => {
      const subscription = await base44.entities.Subscription.create({
        user_email: currentUser.email,
        plan_id: planId,
        instructor_email: plan.instructor_email,
        status: data.paymentMethod === 'pix' ? 'pending' : 'active', // Set status to 'pending' for PIX
        payment_method: data.paymentMethod,
        amount_paid: plan.price_monthly,
        started_at: new Date().toISOString()
      });

      // Only update subscribers count if not PIX (PIX approval is manual)
      if (data.paymentMethod !== 'pix') {
        await base44.entities.WorkoutPlan.update(planId, {
          subscribers_count: (plan.subscribers_count || 0) + 1
        });
      }

      return subscription;
    },
    onSuccess: (subscription) => {
      queryClient.invalidateQueries(['plan', planId]);
      setShowCheckout(false);
      
      if (subscription.status === 'pending') {
        setShowPixInstructions(true); // Show PIX instructions if pending
      } else {
        alert("Assinatura realizada com sucesso! Bem-vindo ao plano!");
        navigate(createPageUrl("MySubscriptions")); // Navigate to MySubscriptions
      }
    }
  });

  const handleSubscribe = () => {
    if (!currentUser) {
      alert("Faça login para assinar este plano");
      return;
    }
    setShowCheckout(true);
  };

  const handlePayment = () => {
    if (!paymentMethod) {
      alert("Selecione um método de pagamento");
      return;
    }

    subscribeMutation.mutate({ paymentMethod });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Plano não encontrado</p>
          <Button onClick={() => navigate(createPageUrl("MarketplacePlans"))}>
            Ver Outros Planos
          </Button>
        </div>
      </div>
    );
  }

  const formatPriceForPix = (price) => {
    if (typeof price === 'number') {
      return price.toFixed(2).replace('.', ''); // Example: 120.00 -> 12000
    }
    return '';
  };

  const generatePixCode = () => {
    if (!currentUser || !plan) return 'N/A';
    
    const amount = plan.price_monthly ? plan.price_monthly.toFixed(2).replace('.', '') : '000'; // Ensure two decimal places, no decimal point
    const userIdentifier = currentUser.id || '00000000-0000-0000-0000-000000000000'; // Default UUID if not available
    const userIdentifierLength = userIdentifier.length.toString().padStart(2, '0');

    // This is a placeholder PIX code structure. A real implementation would involve a backend service
    // to generate a secure and valid PIX QR code/Copia e Cola string.
    // The fixed values (e.g., merchant name, city) would typically come from configuration.
    // The amount and user ID are inserted for demonstration.
    return `00020126${userIdentifierLength}0014BR.GOV.BCB.PIX01${userIdentifierLength}${userIdentifier}520400005303986540${amount}5802BR6009SAO PAULO62070503***6304ABCD`;
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
          <h1 className="text-lg font-semibold text-gray-900">Detalhes do Plano</h1>
        </div>
      </header>

      <div className="pb-24">
        {/* Cover Image */}
        {plan.cover_image && (
          <img 
            src={plan.cover_image} 
            alt={plan.title}
            className="w-full h-64 object-cover"
          />
        )}

        <div className="p-4 space-y-6">
          {/* Title & Price */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h1>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-[#FF6B35]">
                R$ {plan.price_monthly}
              </span>
              <span className="text-gray-500">/mês</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{plan.level}</Badge>
              <Badge variant="outline">{plan.category}</Badge>
              {plan.includes_nutrition && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  + Nutrição
                </Badge>
              )}
              {plan.includes_chat && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  + Chat
                </Badge>
              )}
            </div>
          </div>

          {/* Instructor */}
          {instructor && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold">
                    {instructor.full_name?.[0]?.toUpperCase() || 'I'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{instructor.full_name}</p>
                      {instructor.is_verified && (
                        <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Instrutor Verificado</p>
                    {instructor.specialties && instructor.specialties.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {instructor.specialties.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-[#FF6B35] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{plan.subscribers_count}</p>
                <p className="text-xs text-gray-500">Alunos</p>
              </CardContent>
            </Card>
            {plan.duration_weeks > 0 && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 text-[#FF6B35] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{plan.duration_weeks}</p>
                  <p className="text-xs text-gray-500">Semanas</p>
                </CardContent>
              </Card>
            )}
            {plan.workouts_per_week > 0 && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Check className="w-6 h-6 text-[#FF6B35] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{plan.workouts_per_week}x</p>
                  <p className="text-xs text-gray-500">Por semana</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre o Plano</h2>
            <p className="text-gray-700 whitespace-pre-line">{plan.description}</p>
          </div>

          {/* What's Included */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">O que está incluído?</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Treinos Personalizados</p>
                  <p className="text-sm text-gray-600">Plano adaptado aos seus objetivos</p>
                </div>
              </div>
              {plan.includes_chat && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Chat Exclusivo</p>
                    <p className="text-sm text-gray-600">Tire dúvidas direto com o instrutor</p>
                  </div>
                </div>
              )}
              {plan.includes_nutrition && (
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Plano Nutricional</p>
                    <p className="text-sm text-gray-600">Dieta personalizada inclusa</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Subscribe Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E] hover:shadow-lg"
              size="lg"
            >
              Assinar por R$ {plan.price_monthly}/mês
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Você pode cancelar a qualquer momento
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Assinatura</DialogTitle>
            <DialogDescription>
              Escolha o método de pagamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`w-full p-4 border-2 rounded-xl transition-all ${
                  paymentMethod === 'pix' 
                    ? 'border-[#FF6B35] bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'pix' ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'pix' && (
                      <Check className="w-full h-full text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">PIX</p>
                    <p className="text-sm text-gray-500">Aprovação manual após confirmação</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('pagseguro')}
                className={`w-full p-4 border-2 rounded-xl transition-all ${
                  paymentMethod === 'pagseguro' 
                    ? 'border-[#FF6B35] bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'pagseguro' ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'pagseguro' && (
                      <Check className="w-full h-full text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">PagSeguro</p>
                    <p className="text-sm text-gray-500">Cartão de crédito</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('picpay')}
                className={`w-full p-4 border-2 rounded-xl transition-all ${
                  paymentMethod === 'picpay' 
                    ? 'border-[#FF6B35] bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'picpay' ? 'border-[#FF6B35] bg-[#FF6B35]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'picpay' && (
                      <Check className="w-full h-full text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">PicPay</p>
                    <p className="text-sm text-gray-500">Carteira digital</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                <strong>Nota:</strong> O instrutor recebe 85% do valor. FitSwap retém 15% de comissão.
              </p>
            </div>

            <Button
              onClick={handlePayment}
              disabled={!paymentMethod || subscribeMutation.isPending}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
            >
              {subscribeMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX Instructions Dialog */}
      <Dialog open={showPixInstructions} onOpenChange={setShowPixInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento PIX</DialogTitle>
            <DialogDescription>
              Siga as instruções abaixo para completar o pagamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">PIX Copia e Cola</p>
              <p className="font-mono text-xs break-all bg-white p-3 rounded border">
                {generatePixCode()}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <p className="text-sm text-gray-700">Copie o código PIX acima</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <p className="text-sm text-gray-700">Abra o app do seu banco</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <p className="text-sm text-gray-700">Cole o código e confirme o pagamento</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-900">
                <strong>Atenção:</strong> Após o pagamento, aguarde até 24h para aprovação manual. 
                Você receberá uma notificação quando for aprovado.
              </p>
            </div>

            <Button
              onClick={() => {
                setShowPixInstructions(false);
                navigate(createPageUrl("MySubscriptions"));
              }}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
            >
              Entendi, voltar para Assinaturas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
