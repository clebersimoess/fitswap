import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, Grid, Users as UsersIcon, Trophy, X, Clock, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SEARCH_HISTORY_KEY = 'fitswap_search_history';
const MAX_HISTORY_ITEMS = 10;

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error("Error loading search history:", e);
      }
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      
      // Save to history if search term is not empty and has results
      if (searchTerm.trim() && searchTerm.length >= 2) {
        saveToHistory(searchTerm.trim());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const saveToHistory = (term) => {
    setSearchHistory(prev => {
      // Remove duplicates and add to beginning
      const newHistory = [term, ...prev.filter(item => item !== term)].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const removeHistoryItem = (term) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== term);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date'),
    initialData: [],
    staleTime: 2 * 60 * 1000
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
    staleTime: 5 * 60 * 1000
  });

  const { data: communities = [], isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.list('-created_date'),
    initialData: [],
    staleTime: 5 * 60 * 1000
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      return await base44.entities.Challenge.filter({ is_public: true }, '-created_date');
    },
    initialData: [],
    staleTime: 5 * 60 * 1000
  });

  // Filter results based on search
  const filteredPosts = posts.filter(post => 
    !debouncedSearch || 
    post.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    post.created_by?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    post.category?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    !debouncedSearch ||
    user.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    user.bio?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    user.specialties?.some(s => s.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  const filteredCommunities = communities.filter(community =>
    !debouncedSearch ||
    community.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    community.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    community.category?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const filteredChallenges = challenges.filter(challenge =>
    !debouncedSearch ||
    challenge.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    challenge.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    challenge.type?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const isLoading = postsLoading || usersLoading || communitiesLoading || challengesLoading;

  const totalResults = filteredPosts.length + filteredUsers.length + filteredCommunities.length + filteredChallenges.length;

  // Get counts per category for tab badges
  const categoryCounts = {
    users: filteredUsers.length,
    posts: filteredPosts.length,
    communities: filteredCommunities.length,
    challenges: filteredChallenges.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40 shadow-sm">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              placeholder="Buscar usuários, posts, comunidades, desafios..."
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearch("");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}

            {/* Search History Dropdown */}
            {showHistory && !searchTerm && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Buscas Recentes</span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-[#FF6B35] hover:text-[#FF006E] font-semibold"
                  >
                    Limpar
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchHistory.map((term, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer group"
                      onClick={() => setSearchTerm(term)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{term}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistoryItem(term);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {debouncedSearch && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
                    Buscando...
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-[#FF6B35]">{totalResults}</span> 
                    {' '}resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                    {debouncedSearch && (
                      <span className="text-gray-400"> para "{debouncedSearch}"</span>
                    )}
                  </>
                )}
              </p>
              {!isLoading && totalResults > 0 && (
                <div className="flex gap-2 text-xs">
                  {categoryCounts.users > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <UsersIcon className="w-3 h-3 mr-1" />
                      {categoryCounts.users}
                    </Badge>
                  )}
                  {categoryCounts.posts > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {categoryCounts.posts}
                    </Badge>
                  )}
                  {categoryCounts.communities > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <UsersIcon className="w-3 h-3 mr-1" />
                      {categoryCounts.communities}
                    </Badge>
                  )}
                  {categoryCounts.challenges > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Trophy className="w-3 h-3 mr-1" />
                      {categoryCounts.challenges}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[73px] bg-white border-b border-gray-200 z-30">
            <TabsList className="w-full grid grid-cols-5 rounded-none h-12 bg-transparent">
              <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B35] rounded-none relative">
                Tudo
                {debouncedSearch && totalResults > 0 && (
                  <Badge className="ml-1 bg-[#FF6B35] text-white text-[10px] h-4 px-1">
                    {totalResults}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B35] rounded-none">
                <UsersIcon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Pessoas</span>
                {debouncedSearch && categoryCounts.users > 0 && (
                  <Badge className="ml-1 bg-blue-500 text-white text-[10px] h-4 px-1">
                    {categoryCounts.users}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="posts" className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B35] rounded-none">
                <Grid className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Posts</span>
                {debouncedSearch && categoryCounts.posts > 0 && (
                  <Badge className="ml-1 bg-purple-500 text-white text-[10px] h-4 px-1">
                    {categoryCounts.posts}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="communities" className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B35] rounded-none">
                <UsersIcon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Grupos</span>
                {debouncedSearch && categoryCounts.communities > 0 && (
                  <Badge className="ml-1 bg-green-500 text-white text-[10px] h-4 px-1">
                    {categoryCounts.communities}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="challenges" className="data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B35] rounded-none">
                <Trophy className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Desafios</span>
                {debouncedSearch && categoryCounts.challenges > 0 && (
                  <Badge className="ml-1 bg-yellow-500 text-white text-[10px] h-4 px-1">
                    {categoryCounts.challenges}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* All Tab */}
          <TabsContent value="all" className="p-4 space-y-6 mt-0">
            {!debouncedSearch && !isLoading && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Busque por pessoas, posts, comunidades e desafios
                </h3>
                <p className="text-gray-500 mb-4">
                  Digite algo na barra de pesquisa acima
                </p>
                {searchHistory.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-600 mb-3">Buscas recentes:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {searchHistory.slice(0, 5).map((term, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchTerm(term)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent mb-4"></div>
                <p className="text-gray-500">Buscando resultados...</p>
              </div>
            )}

            {debouncedSearch && !isLoading && totalResults === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-500">
                  Tente buscar com outras palavras-chave
                </p>
              </div>
            )}

            {/* Users Section */}
            {filteredUsers.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-blue-500" />
                  Pessoas 
                  <Badge className="bg-blue-100 text-blue-800">
                    {filteredUsers.length}
                  </Badge>
                </h2>
                <div className="space-y-2">
                  {filteredUsers.slice(0, 5).map((user) => (
                    <Link key={user.email} to={`${createPageUrl("UserProfile")}?email=${user.email}`}>
                      <div className="bg-white rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                            {user.profile_photo ? (
                              <img src={user.profile_photo} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              user.full_name?.[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                              {user.account_type === 'instructor' && user.is_verified && (
                                <Badge className="bg-blue-500 text-white text-xs">
                                  Instrutor
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">@{user.email?.split('@')[0]}</p>
                            {user.bio && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {filteredUsers.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab("users")}
                    >
                      Ver todos ({filteredUsers.length})
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Posts Section */}
            {filteredPosts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Grid className="w-5 h-5 text-purple-500" />
                  Posts
                  <Badge className="bg-purple-100 text-purple-800">
                    {filteredPosts.length}
                  </Badge>
                </h2>
                <div className="grid grid-cols-3 gap-1">
                  {filteredPosts.slice(0, 9).map((post) => (
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
                {filteredPosts.length > 9 && (
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => setActiveTab("posts")}
                  >
                    Ver todos ({filteredPosts.length})
                  </Button>
                )}
              </div>
            )}

            {/* Communities Section */}
            {filteredCommunities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-green-500" />
                  Comunidades
                  <Badge className="bg-green-100 text-green-800">
                    {filteredCommunities.length}
                  </Badge>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {filteredCommunities.slice(0, 4).map((community) => (
                    <Link key={community.id} to={`${createPageUrl("CommunityView")}?communityId=${community.id}`}>
                      <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-all">
                        <div className="h-24 bg-gradient-to-br from-[#FF6B35] to-[#FF006E]">
                          {community.cover_photo && (
                            <img src={community.cover_photo} alt={community.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{community.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {community.members_count || 0} membros
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {filteredCommunities.length > 4 && (
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => setActiveTab("communities")}
                  >
                    Ver todas ({filteredCommunities.length})
                  </Button>
                )}
              </div>
            )}

            {/* Challenges Section */}
            {filteredChallenges.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Desafios
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {filteredChallenges.length}
                  </Badge>
                </h2>
                <div className="space-y-2">
                  {filteredChallenges.slice(0, 3).map((challenge) => (
                    <Link key={challenge.id} to={createPageUrl("Challenges")}>
                      <div className="bg-white rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex gap-3">
                          {challenge.image_url ? (
                            <img src={challenge.image_url} alt={challenge.title} className="w-16 h-16 rounded-lg object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center">
                              <Trophy className="w-8 h-8 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{challenge.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>👥 {challenge.participants_count || 0}</span>
                              <span>•</span>
                              <span>📅 {challenge.duration_days} dias</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {filteredChallenges.length > 3 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab("challenges")}
                    >
                      Ver todos ({filteredChallenges.length})
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="p-4 mt-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma pessoa encontrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Link key={user.email} to={`${createPageUrl("UserProfile")}?email=${user.email}`}>
                    <div className="bg-white rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                          {user.profile_photo ? (
                            <img src={user.profile_photo} alt={user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            user.full_name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                            {user.account_type === 'instructor' && user.is_verified && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                Instrutor
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">@{user.email?.split('@')[0]}</p>
                          {user.bio && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="p-4 mt-0">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum post encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {filteredPosts.map((post) => (
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
          </TabsContent>

          {/* Communities Tab */}
          <TabsContent value="communities" className="p-4 mt-0">
            {filteredCommunities.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma comunidade encontrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredCommunities.map((community) => (
                  <Link key={community.id} to={`${createPageUrl("CommunityView")}?communityId=${community.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-all">
                      <div className="h-24 bg-gradient-to-br from-[#FF6B35] to-[#FF006E]">
                        {community.cover_photo && (
                          <img src={community.cover_photo} alt={community.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{community.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {community.members_count || 0} membros
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {community.category}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="p-4 mt-0">
            {filteredChallenges.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum desafio encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChallenges.map((challenge) => (
                  <Link key={challenge.id} to={createPageUrl("Challenges")}>
                    <div className="bg-white rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex gap-3">
                        {challenge.image_url ? (
                          <img src={challenge.image_url} alt={challenge.title} className="w-20 h-20 rounded-lg object-cover" />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center">
                            <Trophy className="w-10 h-10 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{challenge.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>👥 {challenge.participants_count || 0} participantes</span>
                            <span>📅 {challenge.duration_days} dias</span>
                            <span>🎯 Meta: {challenge.target_value}</span>
                          </div>
                          {challenge.virtual_prize && (
                            <Badge className="mt-2 bg-yellow-100 text-yellow-900">
                              {challenge.prize_icon} {challenge.virtual_prize}
                            </Badge>
                          )}
                        </div>
                      </div>
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