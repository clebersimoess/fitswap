
import React, { useState } from "react";
import { Heart, MessageCircle, Share2, MoreVertical, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommentModal from "./CommentModal";
import PostOptionsMenu from "./PostOptionsMenu";
import ImageFullscreen from "./ImageFullscreen";

export default function PostCard({ post, currentUser }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const { data: likes = [] } = useQuery({
    queryKey: ['postLikes', post.id],
    queryFn: () => base44.entities.Like.filter({ post_id: post.id }),
    initialData: [],
    staleTime: 30 * 1000
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['postComments', post.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post.id }),
    initialData: [],
    staleTime: 30 * 1000
  });

  const { data: saved = [] } = useQuery({
    queryKey: ['savedPosts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.SavedPost.filter({ user_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: [],
    staleTime: 1 * 60 * 1000
  });

  const { data: postUser } = useQuery({
    queryKey: ['postUser', post.created_by],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.email === post.created_by);
    },
    enabled: !!post.created_by,
    staleTime: 5 * 60 * 1000
  });

  const isLiked = likes.some(like => like.user_email === currentUser?.email);
  const isSaved = saved.some(s => s.post_id === post.id);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!isLiked) {
        await base44.entities.Like.create({
          post_id: post.id,
          user_email: currentUser?.email
        });

        if (post.created_by !== currentUser?.email) {
          await base44.entities.Notification.create({
            user_email: post.created_by,
            type: "like",
            from_user_name: currentUser.full_name,
            from_user_email: currentUser.email,
            post_id: post.id,
            text: "curtiu seu treino"
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['postLikes', post.id]);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isSaved) {
        await base44.entities.SavedPost.create({
          post_id: post.id,
          user_email: currentUser?.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['savedPosts', currentUser?.email]);
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      const postLikes = await base44.entities.Like.filter({ post_id: postId });
      const postComments = await base44.entities.Comment.filter({ post_id: postId });
      const postSaved = await base44.entities.SavedPost.filter({ post_id: postId });
      const postNotifications = await base44.entities.Notification.filter({ post_id: postId });

      await Promise.all([
        ...postLikes.map(like => base44.entities.Like.delete(like.id)),
        ...postComments.map(comment => base44.entities.Comment.delete(comment.id)),
        ...postSaved.map(saved => base44.entities.SavedPost.delete(saved.id)),
        ...postNotifications.map(notif => base44.entities.Notification.delete(notif.id))
      ]);

      await base44.entities.Post.delete(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['explorePosts'] });
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      alert("Erro ao excluir post. Tente novamente.");
    }
  });

  const handleShare = (platform) => {
    const text = `Confira esse treino no FitSwap: ${post.description}`;
    const url = window.location.href;
    
    switch(platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  const handleEdit = (post) => {
    alert("Edição em desenvolvimento");
  };

  const getUserProfileLink = () => {
    if (postUser?.id) {
      return `${createPageUrl('UserProfile')}?id=${postUser.id}`;
    }
    return createPageUrl('Home');
  };

  const totalMedia = (post.photos?.length || 0) + (post.videos?.length || 0);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link 
            to={getUserProfileLink()}
            className="flex items-center gap-3 flex-1"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold overflow-hidden">
              {postUser?.profile_photo ? (
                <img 
                  src={postUser.profile_photo} 
                  alt={postUser.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                post.created_by?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 hover:underline truncate">
                {postUser?.full_name || post.created_by?.split('@')[0] || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500">
                {post.created_date && formatDistanceToNow(new Date(post.created_date), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
          </Link>
          <PostOptionsMenu
            post={post}
            currentUser={currentUser}
            onEdit={handleEdit}
            onDelete={(postId) => deletePostMutation.mutate(postId)}
            onShare={handleShare}
            isDeleting={deletePostMutation.isPending}
          >
            <button className="text-gray-400 hover:text-gray-600 p-2">
              <MoreVertical className="w-5 h-5" />
            </button>
          </PostOptionsMenu>
        </div>

        {/* Photos/Videos Grid */}
        {((post.photos && post.photos.length > 0) || (post.videos && post.videos.length > 0)) && (
          <div className={`grid ${totalMedia === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}>
            {post.photos?.slice(0, 4).map((photo, idx) => (
              <img
                key={`photo-${idx}`}
                src={photo}
                alt={`Treino ${idx + 1}`}
                onClick={() => setFullscreenImage(photo)}
                className={`w-full object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                  totalMedia === 1 ? 'h-96' : 'h-48'
                }`}
              />
            ))}
            {post.videos?.map((video, idx) => (
              <video
                key={`video-${idx}`}
                src={video}
                controls
                className={`w-full object-cover ${
                  totalMedia === 1 ? 'h-96' : 'h-48'
                }`}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => likeMutation.mutate()}
                className="flex items-center gap-1 transition-all hover:scale-110"
                disabled={!currentUser}
              >
                <Heart 
                  className={`w-6 h-6 transition-all ${
                    isLiked ? 'text-red-500 fill-red-500' : 'text-gray-700'
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">{likes.length}</span>
              </button>
              <button 
                onClick={() => setShowComments(true)}
                className="flex items-center gap-1 hover:scale-110 transition-all"
              >
                <MessageCircle className="w-6 h-6 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">{comments.length}</span>
              </button>
              <button 
                onClick={() => handleShare('whatsapp')}
                className="hover:scale-110 transition-all"
              >
                <Share2 className="w-6 h-6 text-gray-700" />
              </button>
            </div>
            <button 
              onClick={() => saveMutation.mutate()}
              className="hover:scale-110 transition-all"
              disabled={!currentUser}
            >
              <Bookmark 
                className={`w-6 h-6 transition-all ${
                  isSaved ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-gray-700'
                }`}
              />
            </button>
          </div>

          {/* Category Badge */}
          {post.category && (
            <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white text-xs font-semibold mb-2">
              {post.category}
            </div>
          )}

          {/* Description */}
          <p className="text-gray-800 mb-2">
            <Link 
              to={getUserProfileLink()}
              className="font-semibold hover:underline"
            >
              {postUser?.full_name || post.created_by?.split('@')[0]}
            </Link>{' '}
            {post.description}
          </p>

          {/* View Comments */}
          {comments.length > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Ver {comments.length === 1 ? '1 comentário' : `todos os ${comments.length} comentários`}
            </button>
          )}

          {/* Exercises */}
          {post.exercises && post.exercises.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">FICHA TÉCNICA</p>
              {post.exercises.map((exercise, idx) => (
                <div key={idx} className="text-sm text-gray-600 mb-1">
                  • {exercise.name}: {exercise.sets}x{exercise.reps} - {exercise.weight}kg
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showComments && currentUser && (
        <CommentModal
          post={post}
          currentUser={currentUser}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Fullscreen Image */}
      {fullscreenImage && (
        <ImageFullscreen
          imageUrl={fullscreenImage}
          onClose={() => setFullscreenImage(null)}
        />
      )}
    </>
  );
}
