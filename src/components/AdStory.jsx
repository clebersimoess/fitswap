import React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdStory({ ad }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px]">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-yellow-400 p-[2px]">
          <div className="w-full h-full rounded-full bg-white p-[2px]">
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full px-1 py-0.5">
          <span className="text-[8px] font-bold text-gray-900">AD</span>
        </div>
      </div>
      <span className="text-xs text-gray-600 font-medium truncate w-16 text-center">
        Patrocinado
      </span>
    </div>
  );
}