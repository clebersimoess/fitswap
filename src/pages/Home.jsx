
import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell, Dumbbell, RefreshCw, TrendingUp, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StoryCircle from "../components/StoryCircle";
import AdStory from "../components/AdStory";
import PostCard from "../components/PostCard";

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user && !user.onboarding_completed) {
          navigate(createPageUrl("AccountTypeSelector"));
          return;
        }
      } catch (error) {
        console.log("User not logged in", error);
      }
    };
    getUser();
  }, [navigate]);

  // Fetch users that current user is following
  const { data: following = [] } = useQuery({
    queryKey: ['myFollowing', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Follow.filter({ follower_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: stories = [], refetch: refetchStories, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories', currentUser?.email, following],
    queryFn: async () => {
      const allStories = await base44.entities.Story.list('-created_date');
      const now = new Date();
      
      // Filter out expired stories
      const validStories = allStories.filter(story => {
        if (!story.expires_at) return false;
        const expiresAt = new Date(story.expires_at);
        return expiresAt > now;
      });

      // If no user logged in, return empty
      if (!currentUser?.email) return [];

      // Get list of emails user is following
      const followingEmails = following.map(f => f.following_email);
      
      // Filter stories based on visibility
      return validStories.filter(story => {
        // Always show own stories
        if (story.created_by === currentUser.email) return true;
        
        // Stories with "Todos" visibility - show to everyone
        if (story.visibility === 'Todos') return true;
        
        // Stories with "Seguidores" visibility - show only to followers
        if (story.visibility === 'Seguidores') {
          // Show if current user follows the story creator
          if (followingEmails.includes(story.created_by)) {
            return true;
          }
        }
        
        return false;
      });
    },
    enabled: !!currentUser?.email,
    initialData: [],
    staleTime: 2 * 60 * 1000
  });

  const { data: storyViews = [] } = useQuery({
    queryKey: ['storyViews', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.StoryView.filter({ viewer_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    staleTime: 5 * 60 * 1000,
    initialData: []
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['activeAds'],
    queryFn: async () => {
      return await base44.entities.Advertisement.filter({ 
        active: true,
        verified: true,
        approval_status: 'approved'
      });
    },
    initialData: [],
    staleTime: 5 * 60 * 1000
  });

  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date'),
    initialData: [],
    staleTime: 1 * 60 * 1000
  });

  const groupedStories = useMemo(() => {
    const grouped = {};
    
    stories.forEach(story => {
      if (!grouped[story.created_by]) {
        grouped[story.created_by] = {
          creator: story.created_by,
          stories: [],
          hasUnviewed: false
        };
      }
      grouped[story.created_by].stories.push(story);
    });

    Object.keys(grouped).forEach(creator => {
      const userStories = grouped[creator].stories;
      const hasAnyUnviewed = userStories.some(story => 
        !storyViews.some(view => view.story_id === story.id)
      );
      grouped[creator].hasUnviewed = hasAnyUnviewed;
    });

    const result = Object.values(grouped).map(group => {
      const userInfo = allUsers.find(u => u.email === group.creator);
      return {
        ...group,
        userInfo
      };
    });

    return result.sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      const aNewest = new Date(a.stories[0].created_date);
      const bNewest = new Date(b.stories[0].created_date);
      return bNewest - aNewest;
    });
  }, [stories, storyViews, allUsers]);

  const storiesWithAds = useMemo(() => {
    const result = [];
    let adIndex = 0;
    
    groupedStories.forEach((group, index) => {
      result.push({ type: 'storyGroup', data: group });
      
      if ((index + 1) % 6 === 0 && adIndex < ads.length) {
        result.push({ type: 'ad', data: ads[adIndex] });
        adIndex++;
      }
    });
    
    return result;
  }, [groupedStories, ads]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStories(), refetchPosts()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF006E] bg-clip-text text-transparent">
              FitSwap
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("Explore")}>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="w-6 h-6 text-gray-700" />
              </button>
            </Link>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link to={createPageUrl("Notifications")}>
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-6 h-6 text-gray-700" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stories */}
      <div className="bg-white border-b border-gray-200 py-4 mb-2">
        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
          <StoryCircle isOwn currentUser={currentUser} />
          
          {storiesLoading ? (
            <div className="flex items-center justify-center w-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF6B35] border-t-transparent"></div>
            </div>
          ) : stories.length === 0 && !storiesLoading ? (
            <div className="flex items-center px-4">
              <p className="text-sm text-gray-500">
                Nenhum story disponível no momento
              </p>
            </div>
          ) : (
            storiesWithAds.map((item, idx) => {
              if (item.type === 'ad') {
                return (
                  <Link key={`ad-${idx}`} to={`${createPageUrl("ViewStories")}?adId=${item.data.id}`}>
                    <AdStory ad={item.data} />
                  </Link>
                );
              }
              
              const group = item.data;
              const firstStory = group.stories[0];
              
              return (
                <StoryCircle 
                  key={`group-${group.creator}`}
                  story={firstStory}
                  userInfo={group.userInfo}
                  hasUnviewed={group.hasUnviewed}
                  storyCount={group.stories.length}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 py-2 pb-24">
        {postsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando feed...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Seja o primeiro!
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              A comunidade FitSwap está crescendo. Seja o primeiro a compartilhar seu treino 
              e inspire outros a começarem sua jornada fitness!
            </p>
            <div className="space-y-3 max-w-xs mx-auto">
              <Link to={createPageUrl("CreatePost")}>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white rounded-full font-semibold hover:shadow-lg transition-all">
                  📸 Publicar Meu Treino
                </button>
              </Link>
              <Link to={createPageUrl("Communities")}>
                <button className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all">
                  👥 Encontrar Pessoas
                </button>
              </Link>
              <Link to={createPageUrl("Challenges")}>
                <button className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all">
                  🏆 Ver Desafios
                </button>
              </Link>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-200 max-w-md mx-auto">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">💡 Dicas para começar:</h4>
              <div className="grid gap-3 text-left">
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-700">
                    <strong>1. Registre seus treinos</strong> - Tire fotos durante o exercício
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>2. Siga instrutores</strong> - Encontre profissionais verificados
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-700">
                    <strong>3. Participe de desafios</strong> - Ganhe conquistas e medalhas
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={currentUser} />
            ))}
            
            {posts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">🎉 Você viu tudo!</p>
                <Link to={createPageUrl("CreatePost")}>
                  <button className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white rounded-full font-semibold hover:shadow-lg transition-all">
                    Compartilhar Meu Treino
                  </button>
                </Link>
              </div>
            )}
          </>
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
