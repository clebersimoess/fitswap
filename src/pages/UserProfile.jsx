
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserPlus, UserCheck, MoreVertical, Check, Grid, Award } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostCard from "../components/PostCard";

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.id === userId) {
          navigate(createPageUrl("Profile"));
        }
      } catch (error) {
        console.log("User not logged in");
      }
    };
    getUser();
  }, [userId, navigate]);

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.id === userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });

  const { data: userPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['userPosts', profileUser?.email],
    queryFn: async () => {
      if (!profileUser?.email) return [];
      return await base44.entities.Post.filter({ created_by: profileUser.email }, '-created_date');
    },
    enabled: !!profileUser?.email,
    initialData: [],
    staleTime: 2 * 60 * 1000
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['follows', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Follow.filter({ follower_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: [],
    staleTime: 1 * 60 * 1000
  });

  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followersCount', profileUser?.email],
    queryFn: async () => {
      if (!profileUser?.email) return 0;
      const followers = await base44.entities.Follow.filter({ following_email: profileUser.email });
      return followers.length;
    },
    enabled: !!profileUser?.email,
    initialData: 0
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', profileUser?.email],
    queryFn: async () => {
      if (!profileUser?.email) return 0;
      const following = await base44.entities.Follow.filter({ follower_email: profileUser.email });
      return following.length;
    },
    enabled: !!profileUser?.email,
    initialData: 0
  });

  // New: Fetch user achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ['userAchievements', profileUser?.email],
    queryFn: async () => {
      if (!profileUser?.email) return [];
      return await base44.entities.Achievement.filter({ user_email: profileUser.email }, '-unlocked_at');
    },
    enabled: !!profileUser?.email,
    initialData: []
  });

  const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);

  const isFollowing = follows.some(f => f.following_email === profileUser?.email);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        const followRecord = follows.find(f => f.following_email === profileUser.email);
        if (followRecord) {
          await base44.entities.Follow.delete(followRecord.id);
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: profileUser.email
        });

        await base44.entities.Notification.create({
          user_email: profileUser.email,
          type: "follow",
          from_user_name: currentUser.full_name,
          from_user_email: currentUser.email,
          text: "começou a te seguir"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['follows']);
      queryClient.invalidateQueries(['followersCount']);
      queryClient.invalidateQueries(['user', userId]);
    }
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Perfil não encontrado</p>
          <Button onClick={() => navigate(createPageUrl("Home"))}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            @{profileUser.email?.split('@')[0]}
          </h1>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Cover Photo */}
      <div className="relative h-48 bg-gradient-to-br from-[#FF6B35] to-[#FF006E]">
        {profileUser.cover_photo && (
          <img src={profileUser.cover_photo} alt="Capa" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Rendering */}
      <div className="px-4 pb-4">
        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
            {profileUser.profile_photo ? (
              <img src={profileUser.profile_photo} alt={profileUser.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white text-4xl font-bold">
                {profileUser.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          {profileUser.account_type === 'instructor' && profileUser.is_verified && (
            <div className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{profileUser.full_name}</h1>
            {profileUser.account_type === 'instructor' && profileUser.is_verified && (
              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Award className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white">Instrutor</span>
              </div>
            )}
          </div>
          <p className="text-gray-500">@{profileUser.email?.split('@')[0]}</p>
          {profileUser.account_type === 'instructor' && (
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                💪 Instrutor de Educação Física
              </Badge>
              {profileUser.is_verified && (
                <Badge className="bg-green-500 text-white">
                  ✓ Verificado
                </Badge>
              )}
            </div>
          )}
          {profileUser.bio && (
            <p className="text-gray-700 mt-2">{profileUser.bio}</p>
          )}

          {profileUser.specialties && profileUser.specialties.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {profileUser.specialties.map((specialty, idx) => (
                <Badge key={idx} variant="outline">{specialty}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          {currentUser && profileUser.id !== currentUser.id && (
            isFollowing ? (
              <Button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                Seguindo
              </Button>
            ) : (
              <Button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
              >
                Seguir
              </Button>
            )
          )}
          {/* For now, message button is always there, consider making it conditional later */}
          <Button variant="outline" className="flex-1">
            Mensagem
          </Button>
        </div>


        {/* Achievements Display */}
        {achievements.length > 0 && (
          <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="font-semibold text-gray-900">Conquistas</h3>
              </div>
              <Badge className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white">
                {totalPoints} pts
              </Badge>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {achievements.slice(0, 6).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-2xl relative group cursor-pointer ${
                    achievement.rarity === 'Platina' ? 'bg-purple-100' :
                    achievement.rarity === 'Ouro' ? 'bg-yellow-100' :
                    achievement.rarity === 'Prata' ? 'bg-gray-100' :
                    'bg-orange-100'
                  }`}
                  title={achievement.title}
                >
                  <span className="text-3xl mb-1">{achievement.icon}</span>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      <p className="font-bold">{achievement.title}</p>
                      <p className="text-gray-300">{achievement.description}</p>
                      <p className="text-[#FF6B35] font-bold mt-1">+{achievement.points} pts</p>
                    </div>
                  </div>
                </div>
              ))}
              {achievements.length > 6 && (
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                  +{achievements.length - 6}
                </div>
              )}
            </div>
             <p className="text-xs text-gray-500 mt-2 text-center">
              {achievements.length} {achievements.length === 1 ? 'conquista desbloqueada' : 'conquistas desbloqueadas'}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{userPosts.length}</p>
            <p className="text-sm text-gray-500">Posts</p>
          </div>
          <Link
            to={`${createPageUrl('Followers')}?email=${profileUser.email}&tab=followers`}
            className="text-center hover:bg-gray-50 rounded-lg transition-colors"
          >
            <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
            <p className="text-sm text-gray-500">
              {profileUser.account_type === 'instructor' ? 'Alunos' : 'Seguidores'}
            </p>
          </Link>
          <Link
            to={`${createPageUrl('Followers')}?email=${profileUser.email}&tab=following`}
            className="text-center hover:bg-gray-50 rounded-lg transition-colors"
          >
            <p className="text-2xl font-bold text-gray-900">{followingCount}</p>
            <p className="text-sm text-gray-500">Seguindo</p>
          </Link>
        </div>

        {/* Posts Grid */}
        {userPosts.length === 0 ? (
          <div className="text-center py-12">
            <Grid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum post ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {userPosts.map((post) => (
              <div key={post.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {post.photos?.[0] ? (
                  <img src={post.photos[0]} alt="Post" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Grid className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
