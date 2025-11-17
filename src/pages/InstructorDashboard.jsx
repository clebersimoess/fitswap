
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DollarSign, Users, TrendingUp, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.account_type !== 'instructor') { // Corrected typo: 'instrutor' -> 'instructor'
          navigate(createPageUrl("BecomeInstructor"));
        }
      } catch (error) {
        console.log("User not logged in");
      }
    };
    getUser();
  }, [navigate]);

  const { data: plans = [] } = useQuery({
    queryKey: ['instructorPlans', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.WorkoutPlan.filter({ instructor_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['instructorSubscriptions', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Subscription.filter({ 
        instructor_email: currentUser.email,
        status: 'active'
      });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount_paid || 0), 0);
  const instructorRevenue = totalRevenue * 0.85; // 85% para o instrutor

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
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Painel do Instrutor</h1>
          <p className="text-sm text-gray-500">Gerencie seus planos e alunos</p>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl("CreatePlan")}>
            <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
              <Plus className="w-4 h-4 mr-2" />
              Criar Plano
            </Button>
          </Link>
          <Link to={createPageUrl("InstructorAnalytics")}>
            <Button variant="outline" className="w-full">
              📊 Analytics
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <p className="text-xs text-gray-500">Receita</p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                R$ {instructorRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-500">Alunos</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{subscriptions.length}</p>
              <p className="text-xs text-gray-500">ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <p className="text-xs text-gray-500">Planos</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{plans.length}</p>
              <p className="text-xs text-gray-500">criados</p>
            </CardContent>
          </Card>
        </div>

        {/* Plans List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus Planos</h2>
          {plans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">Você ainda não criou nenhum plano</p>
                <Link to={createPageUrl("CreatePlan")}>
                  <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                    Criar Primeiro Plano
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{plan.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                      </div>
                      {plan.cover_image && (
                        <img 
                          src={plan.cover_image} 
                          alt={plan.title}
                          className="w-16 h-16 rounded-lg object-cover ml-4"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>R$ {plan.price_monthly}/mês</span>
                        <span>•</span>
                        <span>{plan.subscribers_count} alunos</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Editar
                        </Button>
                        <Button size="sm" className="bg-[#FF6B35]">
                          Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Active Students */}
        {subscriptions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alunos Ativos</h2>
            <div className="space-y-3">
              {subscriptions.slice(0, 5).map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold">
                          {sub.user_email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {sub.user_email?.split('@')[0]}
                          </p>
                          <p className="text-sm text-gray-500">
                            R$ {sub.amount_paid}/mês
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
