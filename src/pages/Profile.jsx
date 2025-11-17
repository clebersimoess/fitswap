
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Grid, Bookmark, Camera, Check, Download, Trash2, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
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


export default function Profile() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Post.filter({ created_by: currentUser.email }, '-created_date');
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: savedPosts = [] } = useQuery({
    queryKey: ['userSavedPosts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const saved = await base44.entities.SavedPost.filter({ user_email: currentUser.email });
      const postIds = saved.map(s => s.post_id);
      if (postIds.length === 0) return [];
      const posts = await base44.entities.Post.list();
      return posts.filter(p => postIds.includes(p.id));
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: userStories = [] } = useQuery({
    queryKey: ['userStories', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const allStories = await base44.entities.Story.filter({ created_by: currentUser.email }, '-created_date');
      const now = new Date();
      return allStories.filter(story => {
        const createdDate = new Date(story.created_date);
        const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
        return hoursDiff < 24;
      });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followersCount', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return 0;
      const followers = await base44.entities.Follow.filter({ following_email: currentUser.email });
      return followers.length;
    },
    enabled: !!currentUser?.email,
    initialData: 0
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return 0;
      const following = await base44.entities.Follow.filter({ follower_email: currentUser.email });
      return following.length;
    },
    enabled: !!currentUser?.email,
    initialData: 0
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['userAchievements', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Achievement.filter({ user_email: currentUser.email }, '-unlocked_at');
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      // Delete all related data first
      const postLikes = await base44.entities.Like.filter({ post_id: postId });
      const postComments = await base44.entities.Comment.filter({ post_id: postId });
      const postSaved = await base44.entities.SavedPost.filter({ post_id: postId });
      const postNotifications = await base44.entities.Notification.filter({ post_id: postId });

      // Delete all related records
      await Promise.all([
        ...postLikes.map(like => base44.entities.Like.delete(like.id)),
        ...postComments.map(comment => base44.entities.Comment.delete(comment.id)),
        ...postSaved.map(saved => base44.entities.SavedPost.delete(saved.id)),
        ...postNotifications.map(notif => base44.entities.Notification.delete(notif.id))
      ]);

      // Finally delete the post
      await base44.entities.Post.delete(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userPosts']);
      setShowDeleteDialog(false);
      setSelectedPost(null);
      setShowMenu(false);
    }
  });

  const handleLongPressStart = (e, post) => {
    e.preventDefault();
    const timer = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      setSelectedPost(post);
      setShowMenu(true);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleSaveImage = async (imageUrl) => {
    try {
      // Tentar baixar a imagem
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `fitswap-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowMenu(false);
      setSelectedPost(null);
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Não foi possível salvar a imagem");
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedPost) {
      deletePostMutation.mutate(selectedPost.id);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  const isInstructor = currentUser.account_type === 'instructor';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">
              @{currentUser.email?.split('@')[0]}
            </h1>
            {isInstructor && currentUser.is_verified && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg">
                <Award className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Instrutor Verificado</span>
              </div>
            )}
          </div>
          <Link to={createPageUrl("Settings")}>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="w-6 h-6 text-gray-700" />
            </button>
          </Link>
        </div>
      </header>

      {/* Cover Photo */}
      <div className="relative h-48 bg-gradient-to-br from-[#FF6B35] to-[#FF006E]">
        {currentUser.cover_photo && (
          <img src={currentUser.cover_photo} alt="Capa" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
            {currentUser.profile_photo ? (
              <img src={currentUser.profile_photo} alt={currentUser.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white text-4xl font-bold">
                {currentUser.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          {isInstructor && currentUser.is_verified && (
            <div className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{currentUser.full_name}</h1>
          </div>
          <p className="text-gray-500">@{currentUser.email?.split('@')[0]}</p>
          {isInstructor && (
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                💪 Instrutor de Educação Física
              </Badge>
              {currentUser.is_verified && (
                <Badge className="bg-green-500 text-white">
                  ✓ Verificado
                </Badge>
              )}
            </div>
          )}
          {currentUser.bio && (
            <p className="text-gray-700 mt-2">{currentUser.bio}</p>
          )}

          {currentUser.specialties && currentUser.specialties.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {currentUser.specialties.map((specialty, idx) => (
                <Badge key={idx} variant="outline">{specialty}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mb-4">
          <Link to={createPageUrl("EditProfile")}>
            <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E] hover:shadow-lg">
              Editar Perfil
            </Button>
          </Link>

          {isInstructor && (
            <Link to={createPageUrl("InstructorPanel")}>
              <Button variant="outline" className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold">
                🎓 Painel de Instrutor
              </Button>
            </Link>
          )}

          <Link to={createPageUrl("WorkoutHistory")}>
            <Button variant="outline" className="w-full">
              📊 Meu Progresso
            </Button>
          </Link>

          {!isInstructor && (
            <Link to={createPageUrl("MySubscriptions")}>
              <Button variant="outline" className="w-full">
                💳 Minhas Assinaturas
              </Button>
            </Link>
          )}

          <Link to={createPageUrl("DirectMessages")}>
            <Button variant="outline" className="w-full">
              💬 Mensagens
            </Button>
          </Link>
        </div>

        {/* Achievements Display */}
        {achievements.length > 0 && (
          <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Conquistas</h3>
              <Badge className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white">
                {totalPoints} pts
              </Badge>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {achievements.slice(0, 6).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${
                    achievement.rarity === 'Platina' ? 'bg-purple-100' :
                    achievement.rarity === 'Ouro' ? 'bg-yellow-100' :
                    achievement.rarity === 'Prata' ? 'bg-gray-100' :
                    'bg-orange-100'
                  }`}
                  title={achievement.title}
                >
                  {achievement.icon}
                </div>
              ))}
              {achievements.length > 6 && (
                <Link to={createPageUrl("WorkoutHistory")}>
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    +{achievements.length - 6}
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{userPosts.length}</p>
            <p className="text-sm text-gray-500">Treinos</p>
          </div>
          <Link
            to={`${createPageUrl('Followers')}?email=${currentUser.email}&tab=followers`}
            className="text-center hover:bg-gray-50 rounded-lg transition-colors"
          >
            <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
            <p className="text-sm text-gray-500">{isInstructor ? 'Alunos' : 'Seguidores'}</p>
          </Link>
          <Link
            to={`${createPageUrl('Followers')}?email=${currentUser.email}&tab=following`}
            className="text-center hover:bg-gray-50 rounded-lg transition-colors"
          >
            <p className="text-2xl font-bold text-gray-900">{followingCount}</p>
            <p className="text-sm text-gray-500">Seguindo</p>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Salvos
            </TabsTrigger>
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <Grid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum treino publicado ainda</p>
                <Link to={createPageUrl("CreatePost")}>
                  <Button className="mt-4 bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                    Publicar Primeiro Treino
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group"
                    onTouchStart={(e) => handleLongPressStart(e, post)}
                    onTouchEnd={handleLongPressEnd}
                    onMouseDown={(e) => handleLongPressStart(e, post)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                  >
                    {post.photos?.[0] ? (
                      <img
                        src={post.photos[0]}
                        alt="Post"
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity select-none"
                        draggable="false"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <Grid className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {savedPosts.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum treino salvo ainda</p>
                <p className="text-sm text-gray-400 mt-2">
                  Salve posts tocando no ícone de bookmark
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {savedPosts.map((post) => (
                  <div key={post.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    {post.photos?.[0] && (
                      <img src={post.photos[0]} alt="Post" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stories">
            {userStories.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum status ativo</p>
                <Link to={createPageUrl("CreateStory")}>
                  <Button className="mt-4 bg-gradient-to-r from-[#FF6B35] to-[#FF006E]">
                    Criar Status
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {userStories.map((story) => (
                  <div key={story.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img src={story.photo_url} alt="Story" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Long Press Menu */}
      {showMenu && selectedPost && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => {
              setShowMenu(false);
              setSelectedPost(null);
            }}
          />
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              transform: 'translate(-50%, -50%)',
              minWidth: '200px'
            }}
          >
            <button
              onClick={() => handleSaveImage(selectedPost.photos?.[0])}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <Download className="w-5 h-5 text-gray-700" />
              <span className="text-gray-900 font-medium">Salvar</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
              <span className="text-red-600 font-medium">Apagar</span>
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.
              O post será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedPost(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePostMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePostMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
