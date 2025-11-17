import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

export default function Followers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const userEmail = searchParams.get('email');
  const defaultTab = searchParams.get('tab') || 'followers';
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

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    staleTime: 5 * 60 * 1000
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const follows = await base44.entities.Follow.filter({ following_email: userEmail });
      
      return follows.map(follow => {
        const user = allUsers.find(u => u.email === follow.follower_email);
        return {
          ...follow,
          user: user
        };
      });
    },
    enabled: !!userEmail && allUsers.length > 0,
    initialData: []
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const follows = await base44.entities.Follow.filter({ follower_email: userEmail });
      
      return follows.map(follow => {
        const user = allUsers.find(u => u.email === follow.following_email);
        return {
          ...follow,
          user: user
        };
      });
    },
    enabled: !!userEmail && allUsers.length > 0,
    initialData: []
  });

  const { data: myFollows = [] } = useQuery({
    queryKey: ['myFollows', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Follow.filter({ follower_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const followMutation = useMutation({
    mutationFn: async (userToFollow) => {
      await base44.entities.Follow.create({
        follower_email: currentUser.email,
        following_email: userToFollow.email
      });

      await base44.entities.Notification.create({
        user_email: userToFollow.email,
        type: "follow",
        from_user_name: currentUser.full_name,
        from_user_email: currentUser.email,
        text: "começou a te seguir"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myFollows']);
    }
  });

  const isFollowingUser = (userEmail) => {
    return myFollows.some(f => f.following_email === userEmail);
  };

  const isOwnProfile = currentUser?.email === userEmail;

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
            <h1 className="text-lg font-semibold text-gray-900">
              {isOwnProfile ? 'Meus Seguidores' : 'Seguidores'}
            </h1>
            <p className="text-sm text-gray-500">
              @{userEmail?.split('@')[0]}
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-24">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="followers">
              Seguidores ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Seguindo ({following.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers">
            {followers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {isOwnProfile ? 'Você ainda não tem seguidores' : 'Nenhum seguidor ainda'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {followers.map((follow) => (
                  <div
                    key={follow.id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl"
                  >
                    <Link
                      to={`${createPageUrl('UserProfile')}?id=${follow.user?.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {follow.user?.profile_photo ? (
                          <img 
                            src={follow.user.profile_photo} 
                            alt={follow.user.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          follow.user?.full_name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {follow.user?.full_name || 'Usuário'}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{follow.follower_email?.split('@')[0]}
                        </p>
                      </div>
                    </Link>
                    {currentUser && follow.follower_email !== currentUser?.email && !isFollowingUser(follow.follower_email) && (
                      <Button
                        size="sm"
                        onClick={() => followMutation.mutate(follow.user)}
                        disabled={followMutation.isPending}
                        className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Seguir
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following">
            {following.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {isOwnProfile ? 'Você ainda não segue ninguém' : 'Não segue ninguém ainda'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {following.map((follow) => (
                  <Link
                    key={follow.id}
                    to={`${createPageUrl('UserProfile')}?id=${follow.user?.id}`}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {follow.user?.profile_photo ? (
                        <img 
                          src={follow.user.profile_photo} 
                          alt={follow.user.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        follow.user?.full_name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {follow.user?.full_name || 'Usuário'}
                      </p>
                      <p className="text-sm text-gray-500">
                        @{follow.following_email?.split('@')[0]}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}