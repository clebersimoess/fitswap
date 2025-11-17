
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Heart, ChevronDown } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdStoryView from "../components/AdStoryView";
import { Link } from "react-router-dom";

const STORY_DURATION = 5000; // 5 segundos

export default function ViewStories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const storyId = searchParams.get('storyId');
  const adId = searchParams.get('adId');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserStories, setCurrentUserStories] = useState([]);
  const [allGroupedStories, setAllGroupedStories] = useState([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const timerRef = useRef(null);
  const lastTapRef = useRef(0);

  const minSwipeDistance = 50;

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

  const { data: ad } = useQuery({
    queryKey: ['advertisement', adId],
    queryFn: async () => {
      if (!adId) return null;
      const ads = await base44.entities.Advertisement.list();
      return ads.find(a => a.id === adId);
    },
    enabled: !!adId
  });

  const { data: allStories = [] } = useQuery({
    queryKey: ['allStories'],
    queryFn: async () => {
      const stories = await base44.entities.Story.list('-created_date');
      const now = new Date();
      return stories.filter(story => {
        const expiresAt = new Date(story.expires_at);
        return expiresAt > now;
      });
    },
    enabled: !!storyId
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    staleTime: 5 * 60 * 1000,
    initialData: []
  });

  // Mark story as viewed
  const markViewedMutation = useMutation({
    mutationFn: async (storyId) => {
      if (!currentUser?.email) return;
      
      // Check if already viewed
      const existingViews = await base44.entities.StoryView.filter({
        story_id: storyId,
        viewer_email: currentUser.email
      });
      
      if (existingViews.length === 0) {
        await base44.entities.StoryView.create({
          story_id: storyId,
          viewer_email: currentUser.email,
          viewed_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['storyViews']);
    }
  });

  useEffect(() => {
    if (allStories.length > 0 && storyId) {
      const grouped = {};
      allStories.forEach(story => {
        if (!grouped[story.created_by]) {
          grouped[story.created_by] = [];
        }
        grouped[story.created_by].push(story);
      });

      const groupedArray = Object.entries(grouped).map(([creator, stories]) => ({
        creator,
        stories: stories.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      }));

      setAllGroupedStories(groupedArray);

      const currentStory = allStories.find(s => s.id === storyId);
      if (currentStory) {
        const groupIndex = groupedArray.findIndex(g => g.creator === currentStory.created_by);
        const storyIndex = groupedArray[groupIndex]?.stories.findIndex(s => s.id === storyId);
        
        setCurrentGroupIndex(groupIndex);
        setCurrentStoryIndex(storyIndex || 0);
        setCurrentUserStories(groupedArray[groupIndex]?.stories || []);
      }
    }
  }, [allStories, storyId]);

  const currentStory = currentUserStories[currentStoryIndex];
  const currentCreatorUser = allUsers.find(u => u.email === currentStory?.created_by);

  // Mark current story as viewed
  useEffect(() => {
    if (currentStory?.id && currentUser?.email) {
      markViewedMutation.mutate(currentStory.id);
    }
  }, [currentStory?.id, currentUser?.email]);

  const { data: likes = [] } = useQuery({
    queryKey: ['storyLikes', currentStory?.id],
    queryFn: async () => {
      if (!currentStory?.id) return [];
      return await base44.entities.StoryLike.filter({ story_id: currentStory.id });
    },
    enabled: !!currentStory?.id
  });

  const isLiked = likes.some(like => like.user_email === currentUser?.email);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        const userLike = likes.find(like => like.user_email === currentUser.email);
        if (userLike) {
          await base44.entities.StoryLike.delete(userLike.id);
        }
      } else {
        await base44.entities.StoryLike.create({
          story_id: currentStory.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name
        });

        if (currentStory.created_by !== currentUser.email) {
          await base44.entities.Notification.create({
            user_email: currentStory.created_by,
            type: "like",
            from_user_name: currentUser.full_name,
            from_user_email: currentUser.email,
            text: "curtiu seu status"
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['storyLikes', currentStory?.id]);
    }
  });

  const goToNextStory = () => {
    if (currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      goToNextGroup();
    }
  };

  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      goToPreviousGroup();
    }
  };

  const goToNextGroup = () => {
    if (currentGroupIndex < allGroupedStories.length - 1) {
      const nextGroup = allGroupedStories[currentGroupIndex + 1];
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentUserStories(nextGroup.stories);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      navigate(createPageUrl("Home"));
    }
  };

  const goToPreviousGroup = () => {
    if (currentGroupIndex > 0) {
      const prevGroup = allGroupedStories[currentGroupIndex - 1];
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentUserStories(prevGroup.stories);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (isPaused || !currentStory) return;

    const startTime = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;
      
      if (newProgress >= 100) {
        goToNextStory();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, currentStory, currentStoryIndex, currentGroupIndex]);

  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex, currentGroupIndex]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !touchStartY || !touchEndY) return;
    
    const distanceX = touchStart - touchEnd;
    const distanceY = touchStartY - touchEndY;
    
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;
    
    // Swipe down to close
    if (isDownSwipe && Math.abs(distanceY) > Math.abs(distanceX)) {
      navigate(createPageUrl("Home"));
      return;
    }
    
    // Swipe left/right to change users
    if (isLeftSwipe) {
      goToNextGroup();
    }
    if (isRightSwipe) {
      goToPreviousGroup();
    }
  };

  const handleScreenClick = (e, side) => {
    e.stopPropagation();
    
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;

    if (timeDiff < 300 && timeDiff > 0) {
      if (side === 'center' && !isLiked && currentUser) {
        likeMutation.mutate();
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.cssText = `
          position: absolute;
          left: ${e.clientX - 25}px;
          top: ${e.clientY - 25}px;
          font-size: 50px;
          animation: likeAnimation 0.8s ease-out;
          pointer-events: none;
          z-index: 100;
        `;
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
      }
      lastTapRef.current = 0;
    } else {
      if (side === 'left') {
        goToPreviousStory();
      } else {
        goToNextStory();
      }
      lastTapRef.current = now;
    }
  };

  if (adId && ad) {
    return (
      <AdStoryView 
        ad={ad} 
        onClose={() => navigate(createPageUrl("Home"))}
        onNext={() => navigate(createPageUrl("Home"))}
      />
    );
  }

  if (adId && !ad) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  if (!currentStory) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes likeAnimation {
          0% { transform: scale(0) rotate(-30deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
          100% { transform: scale(0.8) translateY(-50px) rotate(30deg); opacity: 0; }
        }
      `}</style>

      <div 
        className="fixed inset-0 bg-black z-50" 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => setIsPaused(true)}
        onMouseUp={(e) => setIsPaused(false)}
        onMouseLeave={(e) => setIsPaused(false)}
      >
        {/* Progress Bars - One for each story of current user */}
        <div className="absolute top-0 left-0 right-0 z-10 px-2 pt-2 flex gap-1">
          {currentUserStories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: idx < currentStoryIndex ? '100%' : 
                         idx === currentStoryIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-6 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <Link 
              to={`${createPageUrl('UserProfile')}?id=${currentCreatorUser?.id || currentStory.created_by}`}
              className="flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                {currentCreatorUser?.profile_photo ? (
                  <img
                    src={currentCreatorUser.profile_photo}
                    alt={currentCreatorUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold text-sm">
                    {currentStory.created_by?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm hover:underline">
                  {currentCreatorUser?.full_name?.split(' ')[0] || currentStory.created_by?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-white/80 text-xs">
                  {currentStory.created_date && formatDistanceToNow(new Date(currentStory.created_date), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(createPageUrl("Home"));
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Navigation Areas */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={(e) => handleScreenClick(e, 'left')} />
          <div className="w-1/3 h-full cursor-pointer" onClick={(e) => handleScreenClick(e, 'center')} />
          <div className="w-1/3 h-full cursor-pointer" onClick={(e) => handleScreenClick(e, 'right')} />
        </div>

        {/* Story Content */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {currentStory.media_type === 'video' || currentStory.video_url ? (
            <div className="w-full h-full">
              <video
                src={currentStory.video_url || currentStory.photo_url}
                className="w-full h-full object-contain"
                style={{ filter: currentStory.filter !== 'none' ? currentStory.filter : undefined }}
                autoPlay
                loop
                muted
                playsInline
              />
              {currentStory.text && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-3xl font-bold text-center px-4 max-w-lg text-shadow-lg">
                  {currentStory.text}
                </div>
              )}
              {currentStory.sticker && (
                <div className="absolute bottom-20 right-8 text-6xl">
                  {currentStory.sticker}
                </div>
              )}
            </div>
          ) : (
            <>
              <img
                src={currentStory.photo_url}
                alt="Story"
                className="max-w-full max-h-full object-contain"
                style={{ filter: currentStory.filter !== 'none' ? currentStory.filter : undefined }}
              />
              {currentStory.text && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-3xl font-bold text-center px-4 max-w-lg text-shadow-lg">
                  {currentStory.text}
                </div>
              )}
              {currentStory.sticker && (
                <div className="absolute bottom-20 right-8 text-6xl">
                  {currentStory.sticker}
                </div>
              )}
            </>
          )}
        </div>

        {/* Like Button */}
        {currentStory.created_by !== currentUser?.email && currentUser && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              likeMutation.mutate();
            }}
            className="absolute top-20 right-4 z-10 p-3 bg-black/40 rounded-full hover:bg-black/60 transition-all pointer-events-auto backdrop-blur-sm"
          >
            <Heart
              className={`w-6 h-6 transition-all ${
                isLiked ? 'text-red-500 fill-red-500' : 'text-white'
              }`}
            />
          </button>
        )}

        {/* Bottom Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          {/* Swipe down indicator */}
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <ChevronDown className="w-4 h-4 animate-bounce" />
            <span>Deslize para baixo para sair</span>
          </div>
          
          {/* Navigation indicators */}
          <div className="flex items-center gap-3 text-white/60 text-xs">
            {currentGroupIndex > 0 && <span>← Anterior</span>}
            <span className="text-white/80">
              {currentStoryIndex + 1} de {currentUserStories.length}
            </span>
            {currentGroupIndex < allGroupedStories.length - 1 && <span>Próximo →</span>}
          </div>
        </div>

        {/* Pause Indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white text-6xl opacity-50">⏸</div>
          </div>
        )}
      </div>
    </>
  );
}
