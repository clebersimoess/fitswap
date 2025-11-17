import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StudentChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get('subscriptionId');
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);

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

  const { data: subscription } = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.list();
      return subs.find(s => s.id === subscriptionId);
    },
    enabled: !!subscriptionId
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];
      return await base44.entities.ChatMessage.filter(
        { subscription_id: subscriptionId },
        'created_date'
      );
    },
    enabled: !!subscriptionId,
    initialData: []
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', subscription?.instructor_email],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.email === subscription.instructor_email);
    },
    enabled: !!subscription?.instructor_email
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      await base44.entities.ChatMessage.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages', subscriptionId]);
      setMessage("");
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      subscription_id: subscriptionId,
      sender_email: currentUser.email,
      message: message.trim(),
      type: 'text'
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!currentUser || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold">
              {instructor?.full_name?.[0]?.toUpperCase() || 'I'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{instructor?.full_name || 'Instrutor'}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma mensagem ainda</p>
            <p className="text-sm text-gray-400 mt-2">Inicie a conversa com seu instrutor!</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((msg) => {
              const isFromMe = msg.sender_email === currentUser.email;
              
              return (
                <div key={msg.id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isFromMe ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white' : 'bg-white border border-gray-200 text-gray-900'} rounded-2xl px-4 py-2`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isFromMe ? 'text-white/70' : 'text-gray-500'}`}>
                      {msg.created_date && formatDistanceToNow(new Date(msg.created_date), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-2xl mx-auto">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E]"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}