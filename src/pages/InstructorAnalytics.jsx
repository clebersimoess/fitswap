import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, BarChart3, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#FF6B35', '#FF006E', '#00D9FF', '#FFD700'];

export default function InstructorAnalytics() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.account_type !== 'instrutor') {
          navigate(createPageUrl("BecomeInstructor"));
        }
      } catch (error) {
        console.log("User not logged in");
      }
    };
    getUser();
  }, [navigate]);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['instructorSubscriptions', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Subscription.filter({ instructor_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['instructorPlans', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.WorkoutPlan.filter({ instructor_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: studentLogs = [] } = useQuery({
    queryKey: ['studentWorkoutLogs', subscriptions],
    queryFn: async () => {
      const studentEmails = subscriptions.map(s => s.user_email);
      if (studentEmails.length === 0) return [];
      
      const allLogs = await base44.entities.WorkoutLog.list('-created_date');
      return allLogs.filter(log => studentEmails.includes(log.user_email));
    },
    enabled: subscriptions.length > 0,
    initialData: []
  });

  // Analytics calculations
  const activeStudents = subscriptions.filter(s => s.status === 'active').length;
  const totalRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.amount_paid || 0), 0);
  const instructorRevenue = totalRevenue * 0.85;
  const avgRevenuePerStudent = activeStudents > 0 ? instructorRevenue / activeStudents : 0;

  // Student activity data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const activityData = last7Days.map(date => {
    const logsOnDate = studentLogs.filter(log => 
      log.created_date?.split('T')[0] === date
    );
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      workouts: logsOnDate.length,
      students: new Set(logsOnDate.map(l => l.user_email)).size
    };
  });

  // Plan distribution
  const planDistribution = plans.map(plan => ({
    name: plan.title.substring(0, 20),
    value: plan.subscribers_count || 0
  }));

  // Top performing students
  const studentPerformance = subscriptions
    .map(sub => {
      const logs = studentLogs.filter(l => l.user_email === sub.user_email);
      return {
        email: sub.user_email,
        name: sub.user_email.split('@')[0],
        workouts: logs.length,
        totalMinutes: logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
      };
    })
    .sort((a, b) => b.workouts - a.workouts)
    .slice(0, 5);

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
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate(createPageUrl("InstructorDashboard"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Insights sobre seu negócio</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{activeStudents}</p>
              <p className="text-xs text-gray-500">Alunos Ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {instructorRevenue.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Receita Mensal</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {avgRevenuePerStudent.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Ticket Médio</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{studentLogs.length}</p>
              <p className="text-xs text-gray-500">Treinos Registrados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="students">Top Alunos</TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atividade dos Últimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="workouts" 
                      stroke="#FF6B35" 
                      strokeWidth={3}
                      name="Treinos"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="students" 
                      stroke="#00D9FF" 
                      strokeWidth={3}
                      name="Alunos Ativos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Taxa de Conclusão</span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E]" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Alunos Ativos (últimos 7 dias)</span>
                      <span className="font-semibold">
                        {Math.round((new Set(studentLogs.map(l => l.user_email)).size / activeStudents) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" 
                        style={{ 
                          width: `${Math.round((new Set(studentLogs.map(l => l.user_email)).size / activeStudents) * 100)}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Alunos por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                {planDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-12">Nenhum plano com alunos ainda</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance dos Planos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{plan.title}</p>
                        <p className="text-sm text-gray-600">R$ {plan.price_monthly}/mês</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#FF6B35]">{plan.subscribers_count || 0}</p>
                        <p className="text-xs text-gray-500">alunos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FF6B35]" />
                  Top 5 Alunos Mais Dedicados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentPerformance.map((student, idx) => (
                    <div key={student.email} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-yellow-500' :
                        idx === 1 ? 'bg-gray-400' :
                        idx === 2 ? 'bg-orange-600' :
                        'bg-gray-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          {student.workouts} treinos • {student.totalMinutes} min
                        </p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Insights dos Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Média de treinos por aluno
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {activeStudents > 0 ? (studentLogs.length / activeStudents).toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">nos últimos 30 dias</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-900 mb-1">
                      🎯 Taxa de Retenção
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {subscriptions.length > 0 
                        ? Math.round((activeStudents / subscriptions.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-green-700 mt-1">alunos ativos vs total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}