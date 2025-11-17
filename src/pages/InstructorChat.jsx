import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Smile } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function InstructorChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const studentEmail = searchParams.get("studentEmail");
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.account_type !== 'instructor') {
          navigate(createPageUrl("InstructorPanel"));
        }
      } catch (error) {
        navigate(createPageUrl("InstructorPanel"));
      }
    };
    getUser();
  }, [navigate]);

  // Fetch student info
  const { data: student } = useQuery({
    queryKey: ['student', studentEmail],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.email === studentEmail);
    },
    enabled: !!studentEmail
  });

  // Find or create subscription/relationship
  const { data: relationship } = useQuery({
    queryKey: ['instructorStudentRelation', currentUser?.email, studentEmail],
    queryFn: async () => {
      if (!currentUser?.email || !studentEmail) return null;
      const relations = await base44.entities.InstructorStudent.filter({
        instructor_email: currentUser.email,
        student_email: studentEmail
      });
      return relations[0];
    },
    enabled: !!currentUser?.email && !!studentEmail
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', relationship?.id],
    queryFn: async () => {
      if (!relationship?.id) return [];
      return await base44.entities.ChatMessage.filter({
        subscription_id: relationship.id
      }, 'created_date');
    },
    enabled: !!relationship?.id,
    initialData: [],
    refetchInterval: 3000 // Poll every 3 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!relationship?.id) throw new Error("No relationship found");
      
      await base44.entities.ChatMessage.create({
        subscription_id: relationship.id,
        sender_email: currentUser.email,
        message: messageText,
        type: 'text'
      });

      // Create notification for student
      await base44.entities.Notification.create({
        user_email: studentEmail,
        type: 'comment',
        from_user_name: currentUser.full_name,
        from_user_email: currentUser.email,
        text: `${currentUser.full_name} enviou uma mensagem`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages']);
      setMessage("");
    }
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  if (!currentUser || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(createPageUrl("InstructorPanel"))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden">
              {student.profile_photo ? (
                <img src={student.profile_photo} alt={student.full_name} className="w-full h-full object-cover" />
              ) : (
                student.full_name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{student.full_name}</h1>
              <p className="text-xs text-gray-500">@{student.email?.split('@')[0]}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {!relationship && (
          <Card className="p-6 text-center">
            <p className="text-gray-500">
              Esta conversa ainda não foi iniciada. Envie a primeira mensagem!
            </p>
          </Card>
        )}

        {messages.length === 0 && relationship && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center">
              <Send className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-500">Nenhuma mensagem ainda</p>
            <p className="text-sm text-gray-400 mt-2">Comece a conversa com seu aluno!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isInstructor = msg.sender_email === currentUser.email;
          
          return (
            <div
              key={msg.id}
              className={`flex ${isInstructor ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isInstructor
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm break-words">{msg.message}</p>
                <p className={`text-xs mt-1 ${isInstructor ? 'text-white/70' : 'text-gray-400'}`}>
                  {new Date(msg.created_date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          
          <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
            <Smile className="w-5 h-5 text-gray-500" />
          </Button>
          
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}