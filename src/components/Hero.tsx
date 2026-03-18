import React, { useState, useEffect } from 'react';
import { Play, Info, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

export default function Hero({ movies, onPlay }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (movies.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 10000); // Auto-slide every 10 seconds

    return () => clearInterval(interval);
  }, [movies.length, currentIndex]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
      setIsAnimating(false);
    }, 600);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
      setIsAnimating(false);
    }, 600);
  };

  if (!movies.length) return <div className="h-[70vh] md:h-[90vh] bg-[#050505] animate-pulse" />;

  const movie = movies[currentIndex];

  return (
    <div className="relative h-[75vh] md:h-[95vh] w-full bg-[#050505] overflow-hidden">
      {/* Background Layer with Parallax-like effect */}
      <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isAnimating ? 'opacity-0 scale-110 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
        <img 
          src={movie.thumbnailUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover brightness-[0.4] transition-transform duration-[20s] ease-linear scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
      
      {/* Sophisticated Layered Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(245,158,11,0.05),transparent_50%)] z-[1]" />
      
      {/* Main Content Area - Left Aligned Editorial Style */}
      <div className="relative h-full w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center z-10">
        <div className={`max-w-3xl transition-all duration-1000 ease-out ${isAnimating ? 'opacity-0 -translate-x-12' : 'opacity-100 translate-x-0'}`}>
          {/* Micro-labels */}
          <div className="flex items-center gap-4 mb-4 md:mb-6">
            <div className="h-px w-8 bg-amber-500" />
            <span className="text-amber-500 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em]">
              Now Premiering
            </span>
            <span className="px-2.5 py-0.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white/60 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
              {movie.type === 'tv-show' ? 'Series' : 'Feature Film'}
            </span>
          </div>
          
          {/* Massive Display Title */}
          <div className="relative mb-4 md:mb-6">
            <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-serif font-black leading-tight tracking-tighter italic uppercase drop-shadow-2xl">
              {movie.title}
            </h1>
            <div className="absolute -top-3 -left-3 text-amber-500/5 text-5xl md:text-6xl font-serif italic font-black select-none pointer-events-none">
              {currentIndex + 1}
            </div>
          </div>

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-black text-sm md:text-base italic font-serif">
                {movie.category}
              </span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-3 text-white/70 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em]">
              <span>{movie.duration}</span>
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              <span>{movie.language}</span>
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              <span>{movie.releaseDate?.split('-')[0]}</span>
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              <div className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-amber-500" />
                <span>{movie.views || 0} Views</span>
              </div>
            </div>
          </div>

          {/* Description - Editorial weight */}
          <p className="text-gray-400 text-[10px] md:text-sm font-medium leading-relaxed max-w-lg mb-8 md:mb-10 line-clamp-2 md:line-clamp-3 border-l-2 border-amber-500/20 pl-4 italic">
            "{movie.description}"
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <button 
              onClick={() => onPlay(movie)}
              className="group relative flex items-center gap-4 bg-amber-500 text-black px-8 md:px-10 py-3.5 md:py-4 rounded-full overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl shadow-amber-500/20"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-current group-hover:rotate-12 transition-transform" /> 
              <span className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">Watch Feature</span>
            </button>
            
            <button 
              onClick={() => onPlay(movie)}
              className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full hover:bg-white/10 transition-all duration-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] group"
            >
              <Info className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform text-amber-500" /> 
              <span>View Details</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modern Navigation Controls */}
      <div className="absolute bottom-12 left-6 md:left-12 right-6 md:right-12 z-20 flex flex-col md:flex-row items-end md:items-center justify-between gap-8">
        {/* Progress Indicators */}
        <div className="flex items-center gap-3">
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="group relative h-12 w-1 flex items-center justify-center transition-all duration-500"
            >
              <div className={`w-0.5 transition-all duration-500 rounded-full ${currentIndex === idx ? 'h-full bg-amber-500' : 'h-4 bg-white/20 group-hover:bg-white/40'}`} />
              {currentIndex === idx && (
                <div className="absolute -top-6 text-[10px] font-black text-amber-500 font-serif italic">
                  0{idx + 1}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Arrow Controls with Glass Effect */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrev}
            className="p-3 md:p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-amber-500 hover:text-black transition-all duration-500 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={handleNext}
            className="p-3 md:p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-amber-500 hover:text-black transition-all duration-500 group"
          >
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Vertical Rail Text */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 md:right-12 z-10 hidden lg:block">
        <div className="flex flex-col items-center gap-12">
          <div className="h-32 w-px bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
          <span className="writing-vertical-rl rotate-180 text-[10px] font-black uppercase tracking-[0.5em] text-white/20 select-none">
            Cinema Experience • Premium Selection • 2024
          </span>
          <div className="h-32 w-px bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
