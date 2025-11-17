import React from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";

export default function AdStoryView({ ad, onClose, onNext }) {
  const incrementViewMutation = useMutation({
    mutationFn: async () => {
      if (!ad?.id) return;
      await base44.entities.Advertisement.update(ad.id, {
        views_count: (ad.views_count || 0) + 1
      });
    }
  });

  const incrementClickMutation = useMutation({
    mutationFn: async () => {
      if (!ad?.id) return;
      await base44.entities.Advertisement.update(ad.id, {
        clicks_count: (ad.clicks_count || 0) + 1
      });
    }
  });

  React.useEffect(() => {
    if (ad?.id) {
      incrementViewMutation.mutate();
    }
  }, [ad?.id]);

  const handleLearnMore = () => {
    incrementClickMutation.mutate();
    if (ad?.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  if (!ad) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B35] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 bg-yellow-400 rounded text-xs font-bold text-gray-900">
              ANÚNCIO
            </div>
            {ad.segment && (
              <p className="text-white text-sm">{ad.segment}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={ad.image_url}
          alt={ad.title || 'Anúncio'}
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute bottom-32 left-0 right-0 px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
            {ad.title}
          </h2>
          {ad.description && (
            <p className="text-white text-sm mb-4 drop-shadow-lg">
              {ad.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex gap-3">
          <Button
            onClick={onNext}
            variant="outline"
            className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            Pular
          </Button>
          {ad.link_url && (
            <Button
              onClick={handleLearnMore}
              className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF006E] hover:shadow-lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Saber Mais
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}