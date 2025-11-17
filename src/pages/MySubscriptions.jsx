import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MySubscriptions() {
  const [currentUser, setCurrentUser] = useState(null);

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

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['mySubscriptions', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Subscription.filter({ user_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      return await base44.entities.WorkoutPlan.list();
    },
    initialData: []
  });

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Minhas Assinaturas</h1>
          <p className="text-sm text-gray-500">Gerencie seus planos ativos</p>
        </div>
      </header>

      <div className="p-4 space-y-4 pb-24">
        {activeSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Você não tem assinaturas ativas</p>
              <Link to={createPageUrl("MarketplacePlans")}>
                <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                  Explorar Planos
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          activeSubscriptions.map((sub) => {
            const plan = plans.find(p => p.id === sub.plan_id);
            if (!plan) return null;

            return (
              <Card key={sub.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4 mb-4">
                    {plan.cover_image && (
                      <img 
                        src={plan.cover_image} 
                        alt={plan.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{plan.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Ativo
                        </Badge>
                        <span className="text-xs text-gray-500">
                          R$ {sub.amount_paid}/mês
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Iniciou em {sub.started_at && format(new Date(sub.started_at), "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    {sub.next_billing_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          Próxima cobrança: {format(new Date(sub.next_billing_date), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Link to={`${createPageUrl("StudentChat")}?subscriptionId=${sub.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat com Instrutor
                      </Button>
                    </Link>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}