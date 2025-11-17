import React, { useState } from "react";
import { X, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CommentModal({ post, currentUser, onClose }) {
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post.id }, '-created_date'),
    initialData: []
  });

  const createCommentMutation = useMutation({
    mutationFn: async (text) => {
      await base44.entities.Comment.create({
        post_id: post.id,
        text: text,
        user_name: currentUser.full_name
      });

      // Create notification for post owner
      if (post.created_by !== currentUser.email) {
        await base44.entities.Notification.create({
          user_email: post.created_by,
          type: "comment",
          from_user_name: currentUser.full_name,
          from_user_email: currentUser.email,
          post_id: post.id,
          text: `comentou no seu treino: "${text.slice(0, 30)}..."`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', post.id]);
      queryClient.invalidateQueries(['posts']);
      setCommentText("");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      createCommentMutation.mutate(commentText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div 
        className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Comentários ({comments.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 p-4">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum comentário ainda</p>
              <p className="text-sm text-gray-400 mt-2">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {comment.user_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2">
                      <p className="font-semibold text-sm text-gray-900">
                        {comment.user_name}
                      </p>
                      <p className="text-gray-800">{comment.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-4">
                      {comment.created_date && formatDistanceToNow(new Date(comment.created_date), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {currentUser?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!commentText.trim() || createCommentMutation.isPending}
              size="icon"
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] hover:shadow-lg"
            >
              {createCommentMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}