import React from "react";
import { X } from "lucide-react";

export default function ImageFullscreen({ imageUrl, onClose }) {
  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <img
        src={imageUrl}
        alt="Fullscreen"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}