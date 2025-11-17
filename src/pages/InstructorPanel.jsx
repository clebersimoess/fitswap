import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  TrendingUp, 
  MessageCircle, 
  Plus, 
  Award,
  Calendar,
  Target,
  Activity,
  CheckCircle,
  Clock,
  Dumbbell,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CreatePrivateChallengeModal from "../components/CreatePrivateChallengeModal";

export default function InstructorPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.account_type !== 'instructor') {
          navigate(createPageUrl("Home"));
        }
      } catch (error) {
        navigate(createPageUrl("Home"));
      }
    };
    getUser();
  }, [navigate]);

  // Fetch instructor's followers (potential students)
  const { data: followers = [] } = useQuery({
    queryKey: ['instructorFollowers', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Follow.filter({ 
        following_email: currentUser.email 
      });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  // Fetch all users to get student info
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  // Fetch instructor-student relationships
  const { data: studentRelationships = [] } = useQuery({
    queryKey: ['instructorStudents', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.InstructorStudent.filter({ 
        instructor_email: currentUser.email 
      });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  // Fetch private challenges
  const { data: privateChallenges = [] } = useQuery({
    queryKey: ['privateChallenges', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.PrivateChallenge.filter({ 
        instructor_email: currentUser.email 
      }, '-created_date');
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  // Fetch workout plans
  const { data: workoutPlans = [] } = useQuery({
    queryKey: ['instructorPlans', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.WorkoutPlan.filter({ 
        instructor_email: currentUser.email 
      }, '-created_date');
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  // Fetch instructor's posts for engagement metrics
  const { data: instructorPosts = [] } = useQuery({
    queryKey: ['instructorPosts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Post.filter({ 
        created_by: currentUser.email 
      }, '-created_date');
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  // Accept student mutation
  const acceptStudentMutation = useMutation({
    mutationFn: async (relationshipId) => {
      await base44.entities.InstructorStudent.update(relationshipId, {
        status: 'active',
        started_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorStudents']);
    }
  });

  // Reject student mutation
  const rejectStudentMutation = useMutation({
    mutationFn: async (relationshipId) => {
      await base44.entities.InstructorStudent.delete(relationshipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorStudents']);
    }
  });

  // Invite student mutation
  const inviteStudentMutation = useMutation({
    mutationFn: async (studentEmail) => {
      await base44.entities.InstructorStudent.create({
        instructor_email: currentUser.email,
        student_email: studentEmail,
        status: 'pending',
        plan_type: 'free_trial'
      });

      // Create notification
      await base44.entities.Notification.create({
        user_email: studentEmail,
        type: 'follow',
        from_user_name: currentUser.full_name,
        from_user_email: currentUser.email,
        text: `${currentUser.full_name} convidou você para ser seu aluno!`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorStudents']);
    }
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  const activeStudents = studentRelationships.filter(r => r.status === 'active');
  const pendingStudents = studentRelationships.filter(r => r.status === 'pending');

  // Calculate engagement metrics
  const totalLikes = instructorPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
  const totalComments = instructorPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
  const engagementRate = instructorPosts.length > 0 
    ? ((totalLikes + totalComments) / instructorPosts.length).toFixed(1)
    : 0;

  // Get students with user info and engagement data
  const studentsWithInfo = activeStudents.map(rel => {
    const userInfo = allUsers.find(u => u.email === rel.student_email);
    const studentPosts = instructorPosts.filter(p => 
      p.created_by === rel.student_email
    );
    
    return {
      ...rel,
      userInfo,
      postsCount: studentPosts.length,
      engagement: studentPosts.reduce((sum, p) => 
        sum + (p.likes_count || 0) + (p.comments_count || 0), 0
      )
    };
  });

  // Potential students to invite (followers not yet students)
  const studentEmails = studentRelationships.map(r => r.student_email);
  const potentialStudents = followers
    .filter(f => !studentEmails.includes(f.follower_email))
    .map(f => ({
      email: f.follower_email,
      userInfo: allUsers.find(u => u.email === f.follower_email)
    }))
    .filter(s => s.userInfo);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Painel do Instrutor</h1>
              <p className="text-white/80">Gerencie seus alunos e conteúdo</p>
            </div>
            <Link to={createPageUrl("Profile")}>
              <Button variant="secondary">
                Voltar ao Perfil
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{activeStudents.length}</p>
                    <p className="text-xs text-white/80">Alunos Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Dumbbell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{workoutPlans.length}</p>
                    <p className="text-xs text-white/80">Planos de Treino</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{privateChallenges.length}</p>
                    <p className="text-xs text-white/80">Desafios Criados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{engagementRate}</p>
                    <p className="text-xs text-white/80">Engajamento Médio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <div className="p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="plans">
              <Dumbbell className="w-4 h-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Award className="w-4 h-4 mr-2" />
              Desafios
            </TabsTrigger>
            <TabsTrigger value="invite">
              <Plus className="w-4 h-4 mr-2" />
              Convidar
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            {/* Pending Students */}
            {pendingStudents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Solicitações Pendentes ({pendingStudents.length})
                </h3>
                <div className="space-y-2">
                  {pendingStudents.map((rel) => {
                    const userInfo = allUsers.find(u => u.email === rel.student_email);
                    
                    return (
                      <Card key={rel.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden">
                              {userInfo?.profile_photo ? (
                                <img src={userInfo.profile_photo} alt={userInfo.full_name} className="w-full h-full object-cover" />
                              ) : (
                                userInfo?.full_name?.[0]?.toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{userInfo?.full_name || 'Usuário'}</h4>
                              <p className="text-sm text-gray-500">@{rel.student_email?.split('@')[0]}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => acceptStudentMutation.mutate(rel.id)}
                                disabled={acceptStudentMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectStudentMutation.mutate(rel.id)}
                                disabled={rejectStudentMutation.isPending}
                              >
                                Recusar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Students */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Alunos Ativos ({activeStudents.length})
              </h3>
              
              {activeStudents.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum aluno ativo ainda</p>
                    <p className="text-sm text-gray-400 mt-2">Convide seguidores para serem seus alunos</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {studentsWithInfo.map((student) => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Link to={`${createPageUrl("UserProfile")}?email=${student.student_email}`}>
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden">
                              {student.userInfo?.profile_photo ? (
                                <img src={student.userInfo.profile_photo} alt={student.userInfo.full_name} className="w-full h-full object-cover" />
                              ) : (
                                student.userInfo?.full_name?.[0]?.toUpperCase() || 'U'
                              )}
                            </div>
                          </Link>
                          
                          <div className="flex-1">
                            <Link to={`${createPageUrl("UserProfile")}?email=${student.student_email}`}>
                              <h4 className="font-semibold text-gray-900">{student.userInfo?.full_name || 'Usuário'}</h4>
                              <p className="text-sm text-gray-500 mb-2">@{student.student_email?.split('@')[0]}</p>
                            </Link>
                            
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <Activity className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Posts</p>
                                <p className="text-sm font-semibold">{student.postsCount}</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <BarChart3 className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Engajamento</p>
                                <p className="text-sm font-semibold">{student.engagement}</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Plano</p>
                                <p className="text-sm font-semibold">{student.plan_type || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Link to={`${createPageUrl("InstructorChat")}?studentEmail=${student.student_email}`} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full">
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Mensagem
                                </Button>
                              </Link>
                              <Button size="sm" variant="outline">
                                Ver Progresso
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Workout Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Meus Planos de Treino</h3>
              <Link to={createPageUrl("CreateWorkoutPlan")}>
                <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Plano
                </Button>
              </Link>
            </div>

            {workoutPlans.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum plano de treino criado</p>
                  <Link to={createPageUrl("CreateWorkoutPlan")}>
                    <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                      Criar Primeiro Plano
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {workoutPlans.map((plan) => (
                  <Card key={plan.id}>
                    <CardContent className="p-4">
                      {plan.cover_image && (
                        <img src={plan.cover_image} alt={plan.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                      )}
                      <h4 className="font-semibold text-gray-900 mb-1">{plan.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>{plan.level}</Badge>
                        <Badge variant="outline">{plan.category}</Badge>
                        <Badge className="bg-green-100 text-green-800">
                          R$ {plan.price_monthly}/mês
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{plan.subscribers_count || 0} assinantes</span>
                        <Badge variant={plan.active ? "default" : "secondary"}>
                          {plan.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Desafios Privados</h3>
              <Button 
                onClick={() => setShowCreateChallengeModal(true)}
                className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Desafio
              </Button>
            </div>

            {privateChallenges.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum desafio privado criado</p>
                  <Button 
                    onClick={() => setShowCreateChallengeModal(true)}
                    className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
                  >
                    Criar Primeiro Desafio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {privateChallenges.map((challenge) => (
                  <Card key={challenge.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {challenge.image_url && (
                          <img src={challenge.image_url} alt={challenge.title} className="w-20 h-20 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{challenge.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>👥 {challenge.participants_count || 0} participantes</span>
                            <span>📅 {challenge.duration_days} dias</span>
                            <span>🎯 Meta: {challenge.target_value}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invite Tab */}
          <TabsContent value="invite" className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Convidar Seguidores</h3>
            
            {potentialStudents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum seguidor disponível para convidar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {potentialStudents.map((student) => (
                  <Card key={student.email}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden">
                          {student.userInfo?.profile_photo ? (
                            <img src={student.userInfo.profile_photo} alt={student.userInfo.full_name} className="w-full h-full object-cover" />
                          ) : (
                            student.userInfo?.full_name?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{student.userInfo?.full_name || 'Usuário'}</h4>
                          <p className="text-sm text-gray-500">@{student.email?.split('@')[0]}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => inviteStudentMutation.mutate(student.email)}
                          disabled={inviteStudentMutation.isPending}
                          className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
                        >
                          Convidar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Private Challenge Modal */}
      {showCreateChallengeModal && (
        <CreatePrivateChallengeModal
          isOpen={showCreateChallengeModal}
          onClose={() => setShowCreateChallengeModal(false)}
          activeStudents={activeStudents.map(s => ({
            ...s,
            userInfo: allUsers.find(u => u.email === s.student_email)
          }))}
        />
      )}
    </div>
  );
}