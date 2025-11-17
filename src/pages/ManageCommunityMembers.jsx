import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserX, Shield, Crown, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

export default function ManageCommunityMembers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get("communityId");
  const [currentUser, setCurrentUser] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        navigate(createPageUrl("Communities"));
      }
    };
    getUser();
  }, [navigate]);

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      return await base44.entities.Community.filter({ id: communityId });
    },
    enabled: !!communityId,
    select: (data) => data[0]
  });

  const { data: members = [] } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: async () => {
      return await base44.entities.CommunityMember.filter({ 
        community_id: communityId,
        status: 'approved'
      });
    },
    enabled: !!communityId,
    initialData: []
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId) => {
      await base44.entities.CommunityMember.delete(memberId);
      
      // Update member count
      if (community) {
        await base44.entities.Community.update(communityId, {
          members_count: Math.max((community.members_count || 1) - 1, 0)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityMembers']);
      queryClient.invalidateQueries(['community']);
      setMemberToRemove(null);
    }
  });

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  // Check if current user is owner
  const isOwner = community.owner_email === currentUser?.email;

  if (!isOwner) {
    navigate(createPageUrl("Communities"));
    return null;
  }

  const membersWithUserInfo = members.map(member => {
    const userInfo = allUsers.find(u => u.email === member.user_email);
    return { ...member, userInfo };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(createPageUrl("Communities"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Gerenciar Membros</h1>
            <p className="text-sm text-gray-500">{community.name}</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Gerenciamento de Membros</h3>
          </div>
          <p className="text-sm text-blue-800">
            Como dono, você pode remover membros da comunidade. Use esta função com responsabilidade.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Membros ({members.length})
          </h2>

          {members.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum membro ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {membersWithUserInfo.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {member.userInfo?.profile_photo ? (
                          <img 
                            src={member.userInfo.profile_photo} 
                            alt={member.userInfo.full_name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          member.userInfo?.full_name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {member.userInfo?.full_name || 'Usuário'}
                          </h3>
                          {member.role === 'owner' && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              Dono
                            </Badge>
                          )}
                          {member.role === 'moderator' && (
                            <Badge className="bg-blue-500 text-white">
                              <Shield className="w-3 h-3 mr-1" />
                              Moderador
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          @{member.user_email?.split('@')[0]}
                        </p>
                      </div>

                      {member.role !== 'owner' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMemberToRemove(member)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{memberToRemove?.userInfo?.full_name}" da comunidade?
              Esta pessoa poderá entrar novamente se a comunidade for pública.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMemberMutation.mutate(memberToRemove.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMemberMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}