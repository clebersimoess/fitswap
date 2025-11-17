import React from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StoryCircle({ story, userInfo, isOwn = false, hasUnviewed = false, storyCount = 0, currentUser }) {
  if (isOwn) {
    return (
      <Link to={createPageUrl("CreateStory")} className="flex flex-col items-center gap-1.5 min-w-[70px]">
        <div className="relative">
          {/* Outer gradient ring */}
          <div className="w-[66px] h-[66px] rounded-full bg-gradient-to-tr from-[#FF6B35] via-[#FF006E] to-[#8B5CF6] p-[2px]">
            {/* White ring */}
            <div className="w-full h-full rounded-full bg-white p-[3px]">
              {/* Profile photo or gradient */}
              {currentUser?.profile_photo ? (
                <img
                  src={currentUser.profile_photo}
                  alt="Você"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>
              )}
            </div>
          </div>
          {/* Plus icon badge */}
          <div className="absolute bottom-0 right-0 w-[20px] h-[20px] bg-[#0095F6] rounded-full flex items-center justify-center border-[3px] border-white">
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        </div>
        <span className="text-[11px] text-gray-900 font-normal truncate w-[70px] text-center">
          Seu status
        </span>
      </Link>
    );
  }

  const username = userInfo?.full_name?.split(' ')[0] || story.created_by?.split('@')[0] || 'Usuário';

  return (
    <Link 
      to={`${createPageUrl("ViewStories")}?storyId=${story.id}`}
      className="flex flex-col items-center gap-1.5 min-w-[70px]"
    >
      <div className="relative">
        {/* Outer ring - gradient for unviewed, gray for viewed */}
        <div className={`w-[66px] h-[66px] rounded-full p-[2px] ${
          hasUnviewed 
            ? 'bg-gradient-to-tr from-[#FF6B35] via-[#FF006E] to-[#8B5CF6]' 
            : 'bg-gray-300'
        }`}>
          {/* White ring separator */}
          <div className="w-full h-full rounded-full bg-white p-[3px]">
            {/* User profile photo */}
            {userInfo?.profile_photo ? (
              <img
                src={userInfo.profile_photo}
                alt={username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF006E] flex items-center justify-center text-white font-bold text-lg">
                {username[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>
        
        {/* Story count indicator (only if more than 1) */}
        {storyCount > 1 && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
            <span className="text-[9px] font-bold text-gray-700">{storyCount}</span>
          </div>
        )}
      </div>
      <span className="text-[11px] text-gray-900 font-normal truncate w-[70px] text-center">
        {username}
      </span>
    </Link>
  );
}