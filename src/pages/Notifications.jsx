import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, UserPlus, Bell, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Notifications() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);

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

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Notification.filter(
        { user_email: currentUser.email }, 
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
    staleTime: 30 * 1000
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    staleTime: 5 * 60 * 1000
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['myFollows', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Follow.filter({ follower_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: []
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifs.map(n => 
        base44.entities.Notification.update(n.id, { read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.delete(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const followBackMutation = useMutation({
    mutationFn: async (notification) => {
      await base44.entities.Follow.create({
        follower_email: currentUser.email,
        following_email: notification.from_user_email
      });

      await base44.entities.Notification.create({
        user_email: notification.from_user_email,
        type: "follow",
        from_user_name: currentUser.full_name,
        from_user_email: currentUser.email,
        text: "começou a te seguir"
      });

      // Mark notification as read
      await base44.entities.Notification.update(notification.id, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myFollows']);
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="#ef4444" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const isFollowing = (email) => {
    return follows.some(f => f.following_email === email);
  };

  const getUserFromNotification = (notification) => {
    return users.find(u => u.email === notification.from_user_email);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
              {unreadCount > 0 && (
                <div className="px-3 py-1 bg-red-500 rounded-full">
                  <span className="text-white text-sm font-semibold">{unreadCount}</span>
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-sm text-[#FF6B35] font-semibold hover:text-[#FF006E] transition-colors"
              >
                {markAllAsReadMutation.isPending ? 'Marcando...' : 'Marcar todas como lidas'}
              </button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">
              Você tem {unreadCount} {unreadCount === 1 ? 'notificação nova' : 'notificações novas'}
            </p>
          )}
        </div>
      </header>

      <div className="px-4 py-2 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando notificações...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-gray-500">
              Quando alguém interagir com você, aparecerá aqui
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const notifUser = getUserFromNotification(notification);
              const isFollowNotif = notification.type === 'follow';
              const alreadyFollowing = isFollowing(notification.from_user_email);

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-xl transition-all relative group ${
                    notification.read ? 'bg-white' : 'bg-blue-50 border-l-4 border-[#FF6B35]'
                  }`}
                >
                  {/* Delete button */}
                  <button
                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>

                  <Link
                    to={`${createPageUrl('UserProfile')}?id=${notifUser?.id}`}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex-shrink-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold relative">
                      {notifUser?.profile_photo ? (
                        <img 
                          src={notifUser.profile_photo} 
                          alt={notifUser.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        notification.from_user_name?.[0]?.toUpperCase() || 'U'
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-gray-900">
                      <Link
                        to={`${createPageUrl('UserProfile')}?id=${notifUser?.id}`}
                        onClick={() => handleNotificationClick(notification)}
                        className="font-semibold hover:underline"
                      >
                        {notification.from_user_name}
                      </Link>
                      {' '}
                      <span className="text-gray-600">{notification.text}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      {notification.created_date && formatDistanceToNow(new Date(notification.created_date), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                      {!notification.read && (
                        <>
                          <span>•</span>
                          <span className="text-[#FF6B35] font-medium">Nova</span>
                        </>
                      )}
                    </p>
                  </div>

                  {isFollowNotif && !alreadyFollowing && (
                    <Button
                      size="sm"
                      onClick={() => followBackMutation.mutate(notification)}
                      disabled={followBackMutation.isPending}
                      className="bg-gradient-to-r from-[#FF6B35] to-[#FF006E] text-white hover:shadow-lg flex-shrink-0"
                    >
                      {followBackMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Seguir
                        </>
                      )}
                    </Button>
                  )}

                  {isFollowNotif && alreadyFollowing && (
                    <div className="flex items-center gap-1 text-sm text-green-600 font-medium flex-shrink-0">
                      <Check className="w-4 h-4" />
                      Seguindo
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}