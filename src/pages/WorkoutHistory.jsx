import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, TrendingUp, Calendar, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WorkoutHistory() {
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

  const { data: workouts = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.WorkoutLog.filter({ user_email: currentUser.email }, '-created_date');
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Achievement.filter({ user_email: currentUser.email }, '-unlocked_at');
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
  const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);

  // Chart data - last 7 workouts
  const chartData = workouts.slice(0, 7).reverse().map((workout, idx) => ({
    name: `T${idx + 1}`,
    duration: workout.duration_minutes
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Progresso</h1>
            <p className="text-sm text-gray-500">Histórico e conquistas</p>
          </div>
          <Link to={createPageUrl("LogWorkout")}>
            <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
              <Plus className="w-4 h-4 mr-2" />
              Registrar
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-[#FF6B35] mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{workouts.length}</p>
              <p className="text-xs text-gray-500">Treinos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-[#FF6B35] mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{totalDuration}</p>
              <p className="text-xs text-gray-500">Minutos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 text-[#FF6B35] mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              <p className="text-xs text-gray-500">Pontos</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Duração dos Treinos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="#FF6B35" 
                    strokeWidth={3}
                    dot={{ fill: '#FF6B35', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conquistas Desbloqueadas</h2>
          {achievements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Nenhuma conquista ainda</p>
                <Link to={createPageUrl("LogWorkout")}>
                  <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                    Registrar Primeiro Treino
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={`border-2 ${
                  achievement.rarity === 'Platina' ? 'border-purple-300 bg-purple-50' :
                  achievement.rarity === 'Ouro' ? 'border-yellow-300 bg-yellow-50' :
                  achievement.rarity === 'Prata' ? 'border-gray-300 bg-gray-50' :
                  'border-orange-300 bg-orange-50'
                }`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <p className="font-bold text-gray-900 text-sm">{achievement.title}</p>
                    <Badge variant="outline" className="mt-2">{achievement.rarity}</Badge>
                    <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                    <p className="text-xs text-[#FF6B35] font-bold mt-1">+{achievement.points} pts</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Workout History */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Treinos</h2>
          {workouts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum treino registrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <Card key={workout.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {workout.proof_photo && (
                        <img 
                          src={workout.proof_photo} 
                          alt="Comprovante"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{workout.title}</h3>
                            <p className="text-sm text-gray-600">{workout.category}</p>
                          </div>
                          <Badge variant="outline">{workout.feeling}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{workout.duration_minutes} min</span>
                          {workout.exercises && workout.exercises.length > 0 && (
                            <span>• {workout.exercises.length} exercícios</span>
                          )}
                        </div>
                        {workout.created_date && (
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(workout.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
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