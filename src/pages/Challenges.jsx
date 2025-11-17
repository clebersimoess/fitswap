import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Plus, Users, Calendar, Target, Camera, Award, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Challenges() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [challengeToDelete, setChallengeToDelete] = useState(null);

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

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      return await base44.entities.Challenge.filter({ is_public: true }, '-created_date');
    },
    initialData: []
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.ChallengeParticipant.filter({
        user_email: currentUser.email
      });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: challengeAchievements = [] } = useQuery({
    queryKey: ['challengeAchievements', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const allAchievements = await base44.entities.Achievement.filter({
        user_email: currentUser.email
      }, '-unlocked_at');
      return allAchievements.filter(a => a.description?.includes('Completou:'));
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId) => {
      await base44.entities.ChallengeParticipant.create({
        challenge_id: challengeId,
        user_email: currentUser.email,
        current_progress: 0
      });

      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) {
        await base44.entities.Challenge.update(challengeId, {
          participants_count: (challenge.participants_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myParticipations']);
      queryClient.invalidateQueries(['challenges']);
    }
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (challengeId) => {
      // Delete all participants first
      const participants = await base44.entities.ChallengeParticipant.filter({ challenge_id: challengeId });
      await Promise.all(participants.map(p => base44.entities.ChallengeParticipant.delete(p.id)));
      
      // Delete all proof submissions
      const proofs = await base44.entities.ChallengeProofSubmission.filter({ challenge_id: challengeId });
      await Promise.all(proofs.map(p => base44.entities.ChallengeProofSubmission.delete(p.id)));
      
      // Finally delete the challenge
      await base44.entities.Challenge.delete(challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['challenges']);
      queryClient.invalidateQueries(['myParticipations']);
      setChallengeToDelete(null);
    }
  });

  const isParticipating = (challengeId) => {
    return myParticipations.some(p => p.challenge_id === challengeId);
  };

  const isCreator = (challenge) => {
    return challenge.creator_email === currentUser?.email;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Desafios</h1>
            <p className="text-sm text-gray-500">Participe e supere seus limites</p>
          </div>
          <Link to={createPageUrl("CreateChallenge")}>
            <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
              <Plus className="w-4 h-4 mr-2" />
              Criar
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-4 pb-24">
        {/* Challenge Achievements */}
        {challengeAchievements.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF6B35]" />
              Minhas Medalhas ({challengeAchievements.length})
            </h2>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {challengeAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 relative group cursor-pointer ${
                    achievement.rarity === 'Platina' ? 'bg-purple-100 border-2 border-purple-300' :
                    achievement.rarity === 'Ouro' ? 'bg-yellow-100 border-2 border-yellow-300' :
                    achievement.rarity === 'Prata' ? 'bg-gray-100 border-2 border-gray-300' :
                    'bg-orange-100 border-2 border-orange-300'
                  }`}
                  title={achievement.title}
                >
                  <span className="text-3xl mb-1">{achievement.icon}</span>
                  <span className="text-[8px] font-bold text-gray-600 text-center leading-tight">
                    {achievement.rarity}
                  </span>

                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                      <p className="font-bold">{achievement.title}</p>
                      <p className="text-gray-300 mt-1">{achievement.description}</p>
                      <p className="text-[#FF6B35] font-bold mt-1">+{achievement.points} pts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Active Challenges */}
        {myParticipations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Meus Desafios Ativos ({myParticipations.filter(p => !p.completed).length})
            </h2>
            <div className="space-y-3">
              {myParticipations.map((participation) => {
                const challenge = challenges.find(c => c.id === participation.challenge_id);
                if (!challenge) return null;

                const progress = (participation.current_progress / challenge.target_value) * 100;

                return (
                  <Card key={participation.id} className={participation.completed ? 'border-2 border-green-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {challenge.image_url ? (
                          <img
                            src={challenge.image_url}
                            alt={challenge.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                          <p className="text-sm text-gray-600">{challenge.type}</p>
                          {participation.completed && (
                            <div className="flex items-center gap-1 text-green-600 text-sm font-semibold mt-1">
                              <Trophy className="w-4 h-4" />
                              Completo!
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progresso</span>
                          <span className="font-semibold">
                            {participation.current_progress} / {challenge.target_value}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      {!participation.completed && (
                        <Link to={`${createPageUrl("ChallengeProof")}?challengeId=${challenge.id}&participantId=${participation.id}`}>
                          <Button variant="outline" className="w-full">
                            <Camera className="w-4 h-4 mr-2" />
                            Comprovar Progresso
                          </Button>
                        </Link>
                      )}
                      {participation.completed && challenge.virtual_prize && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                          <span className="text-2xl">{challenge.prize_icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900">
                              {challenge.virtual_prize}
                            </p>
                            <p className="text-xs text-green-700">
                              {challenge.prize_rarity} • Desbloqueado
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Challenges */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Desafios Disponíveis
          </h2>
          {challenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhum desafio disponível</p>
                <Link to={createPageUrl("CreateChallenge")}>
                  <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                    Criar Primeiro Desafio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => {
                const isActive = isParticipating(challenge.id);
                const iAmCreator = isCreator(challenge);

                return (
                  <Card key={challenge.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {challenge.image_url ? (
                          <img
                            src={challenge.image_url}
                            alt={challenge.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-12 h-12 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {challenge.title}
                            </h3>
                            {iAmCreator && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <MoreVertical className="w-5 h-5 text-gray-600" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setChallengeToDelete(challenge)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir Desafio
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {challenge.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{challenge.participants_count || 0} participantes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{challenge.duration_days} dias</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              <span>Meta: {challenge.target_value}</span>
                            </div>
                          </div>
                          {challenge.virtual_prize && (
                            <Badge className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-yellow-300 mb-2">
                              {challenge.prize_icon} {challenge.virtual_prize} ({challenge.prize_rarity})
                            </Badge>
                          )}
                          <div className="flex gap-2">
                            {isActive ? (
                              <>
                                <Badge variant="outline" className="border-green-500 text-green-700">
                                  ✓ Participando
                                </Badge>
                                <Link to={`${createPageUrl("ChallengeProof")}?challengeId=${challenge.id}&participantId=${myParticipations.find(p => p.challenge_id === challenge.id)?.id}`}>
                                  <Button size="sm" variant="outline">
                                    <Camera className="w-4 h-4 mr-2" />
                                    Comprovar
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => joinChallengeMutation.mutate(challenge.id)}
                                disabled={joinChallengeMutation.isPending}
                                className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
                              >
                                Participar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!challengeToDelete} onOpenChange={() => setChallengeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Desafio?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{challengeToDelete?.title}"? 
              Esta ação não pode ser desfeita e todos os participantes e comprovações serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChallengeMutation.mutate(challengeToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteChallengeMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}