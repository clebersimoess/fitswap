import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, MessageCircle, Send } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";

export default function DirectMessages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);

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

  // Get chat partner from URL if exists
  useEffect(() => {
    const userEmail = searchParams.get('user');
    if (userEmail) {
      setSelectedChat(userEmail);
    }
  }, [searchParams]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    staleTime: 5 * 60 * 1000,
    initialData: []
  });

  const { data: following = [] } = useQuery({
    queryKey: ['myFollowing', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Follow.filter({ follower_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['myFollowers', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Follow.filter({ following_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  // Get users I can message (following + followers)
  const connectionsEmails = [
    ...following.map(f => f.following_email),
    ...followers.map(f => f.follower_email)
  ];
  
  const uniqueConnections = [...new Set(connectionsEmails)].filter(email => email !== currentUser?.email);

  const connections = uniqueConnections
    .map(email => allUsers.find(u => u.email === email))
    .filter(u => u && u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  if (selectedChat) {
    const chatUser = allUsers.find(u => u.email === selectedChat);
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Chat Header */}
        <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSelectedChat(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            {chatUser && (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden">
                  {chatUser.profile_photo ? (
                    <img src={chatUser.profile_photo} alt={chatUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    chatUser.full_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">{chatUser.full_name}</h2>
                  <p className="text-xs text-gray-500">@{chatUser.email?.split('@')[0]}</p>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Em Breve: Chat Direto
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Funcionalidade de mensagens diretas será lançada em breve. 
              Por enquanto, você pode se conectar através de comentários nos posts!
            </p>
          </div>
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Digite uma mensagem..." 
              disabled
              className="flex-1"
            />
            <button
              disabled
              className="p-3 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(createPageUrl("Profile"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Mensagens</h1>
        </div>
      </header>

      {/* Search */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conexões..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Connections List */}
      <div className="p-4 pb-24">
        {connections.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Nenhum resultado' : 'Nenhuma conexão ainda'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Tente buscar por outro nome'
                : 'Comece seguindo pessoas para poder enviar mensagens!'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate(createPageUrl("Explore"))}
                className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Encontrar Pessoas
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {connections.map((user) => (
              <button
                key={user.email}
                onClick={() => setSelectedChat(user.email)}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                  {user.profile_photo ? (
                    <img src={user.profile_photo} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                  <p className="text-sm text-gray-500">@{user.email?.split('@')[0]}</p>
                </div>
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}