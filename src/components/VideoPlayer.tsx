import React, { useMemo } from 'react';
import { X, Maximize, Volume2, Play, SkipBack, SkipForward } from 'lucide-react';
import { Movie } from '../types';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

export default function VideoPlayer({ movie, onClose }: VideoPlayerProps) {
  const videoSource = useMemo(() => {
    const url = movie.videoUrl;
    
    // Handle YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
      }
      return { type: 'iframe', url: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0` };
    }
    
    // Handle Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return { type: 'iframe', url: `https://player.vimeo.com/video/${videoId}?autoplay=1` };
    }

    // Handle XNXX
    if (url.includes('xnxx.com')) {
      const match = url.match(/video-([a-z0-9]+)/);
      if (match) {
        return { type: 'iframe', url: `https://www.xnxx.com/embedframe/${match[1]}` };
      }
    }

    // Handle XVideos
    if (url.includes('xvideos.com')) {
      const match = url.match(/video([0-9]+)/);
      if (match) {
        return { type: 'iframe', url: `https://www.xvideos.com/embedframe/${match[1]}` };
      }
    }

    // Default to direct video tag for mp4, webm, etc.
    return { type: 'video', url };
  }, [movie.videoUrl]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-8 h-8 text-white" />
          </button>
          <h2 className="text-white text-2xl font-bold">{movie.title}</h2>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {videoSource.type === 'iframe' ? (
          <iframe 
            src={videoSource.url} 
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={movie.title}
          />
        ) : (
          <video 
            src={videoSource.url} 
            className="w-full h-full"
            controls
            autoPlay
            playsInline
          />
        )}
      </div>
    </div>
  );
}
