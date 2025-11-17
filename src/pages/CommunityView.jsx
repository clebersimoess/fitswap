import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Users, Settings, Lock, Globe, UserPlus, Shield, Ban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "../components/PostCard";

export default function CommunityView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get('id');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");

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

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const communities = await base44.entities.Community.list();
      return communities.find(c => c.id === communityId);
    },
    enabled: !!communityId
  });

  const { data: membership } = useQuery({
    queryKey: ['communityMembership', communityId, currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email || !communityId) return null;
      const memberships = await base44.entities.CommunityMember.filter({
        community_id: communityId,
        user_email: currentUser.email
      });
      return memberships[0] || null;
    },
    enabled: !!currentUser?.email && !!communityId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: async () => {
      if (!communityId) return [];
      return await base44.entities.CommunityMember.filter({
        community_id: communityId,
        status: "approved"
      });
    },
    enabled: !!communityId,
    initialData: []
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['communityPosts', communityId],
    queryFn: async () => {
      if (!communityId) return [];
      return await base44.entities.CommunityPost.filter(
        { community_id: communityId },
        '-created_date'
      );
    },
    enabled: !!communityId,
    initialData: []
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!membership) return;
      await base44.entities.CommunityMember.delete(membership.id);
      if (community) {
        await base44.entities.Community.update(community.id, {
          members_count: Math.max(0, (community.members_count || 0) - 1)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityMembership']);
      queryClient.invalidateQueries(['community']);
      navigate(createPageUrl("Communities"));
    }
  });

  if (isLoading || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  const isOwner = membership?.role === "owner";
  const isModerator = membership?.role === "moderator" || isOwner;
  const isMember = membership?.status === "approved";
  const isPending = membership?.status === "pending";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(createPageUrl("Communities"))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">{community.name}</h1>
          {isModerator && (
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>
      </header>

      {/* Cover & Info */}
      <div className="relative h-48 bg-gradient-to-br from-[#FF6B35] to-[#FF006E]">
        {community.cover_photo && (
          <img src={community.cover_photo} alt={community.name} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Community Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{community.name}</h2>
            {community.is_public ? (
              <Globe className="w-5 h-5 text-gray-500" />
            ) : (
              <Lock className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <p className="text-gray-600 mb-3">{community.description}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline">{community.category}</Badge>
            <span className="text-sm text-gray-600">{community.members_count} membros</span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm text-gray-600">{community.posts_count} posts</span>
          </div>
        </div>

        {/* Actions */}
        {!isMember && !isPending && currentUser && (
          <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
            <UserPlus className="w-4 h-4 mr-2" />
            {community.is_public ? 'Entrar na Comunidade' : 'Solicitar Entrada'}
          </Button>
        )}

        {isPending && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            <p className="text-yellow-800 font-medium">Solicitação Pendente</p>
            <p className="text-sm text-yellow-700 mt-1">Aguardando aprovação do moderador</p>
          </div>
        )}

        {isMember && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              className="flex-1"
            >
              {leaveMutation.isPending ? 'Saindo...' : 'Sair da Comunidade'}
            </Button>
            {isModerator && (
              <Button variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            )}
          </div>
        )}

        {/* Rules */}
        {community.rules && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">📜 Regras da Comunidade</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{community.rules}</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="challenges">Desafios</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            {!isMember ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Entre na comunidade para ver os posts</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-500 mb-4">Nenhum post ainda</p>
                <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-800">{post.description}</p>
                    {post.photos && post.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {post.photos.map((photo, idx) => (
                          <img key={idx} src={photo} alt="" className="rounded-lg w-full h-32 object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold">
                    {member.user_email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.user_email?.split('@')[0]}</p>
                    {member.role !== 'member' && (
                      <Badge variant="outline" className="mt-1">
                        {member.role === 'owner' ? '👑 Dono' : '🛡️ Moderador'}
                      </Badge>
                    )}
                  </div>
                  {isModerator && member.role === 'member' && (
                    <Button size="sm" variant="ghost">
                      <Ban className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="mt-4">
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500 mb-4">Desafios exclusivos em breve</p>
              <p className="text-sm text-gray-400">
                Crie desafios privados para os membros da comunidade
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}