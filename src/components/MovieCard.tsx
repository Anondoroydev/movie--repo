import React from 'react';
import { Play, Plus, Check, ChevronDown, ThumbsUp, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Movie } from '../types';

interface MovieCardProps {
  key?: React.Key;
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onToggleWatchlist: (movieId: string) => void;
  onToggleLike: (movieId: string) => void;
  isInWatchlist: boolean;
  isLiked: boolean;
}

export default function MovieCard({ movie, onPlay, onToggleWatchlist, onToggleLike, isInWatchlist, isLiked }: MovieCardProps) {
  return (
    <motion.div 
      className="relative group min-w-[220px] md:min-w-[320px] h-[140px] md:h-[180px] cursor-pointer"
      whileHover={{ scale: 1.05, zIndex: 50 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <img 
        src={movie.thumbnailUrl} 
        alt={movie.title} 
        className="w-full h-full object-cover rounded-xl shadow-2xl transition-all duration-500 group-hover:brightness-50"
        referrerPolicy="no-referrer"
      />
      
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
        <div className="glass rounded-2xl p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onPlay(movie); }}
              className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/30"
            >
              <Play className="w-5 h-5 text-black fill-black" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleWatchlist(movie.id); }}
              className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all duration-300"
            >
              {isInWatchlist ? <Check className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleLike(movie.id); }}
              className={`w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all duration-300 ml-auto ${isLiked ? 'bg-amber-500/20 border-amber-500/50' : ''}`}
            >
              <ThumbsUp className={`w-5 h-5 ${isLiked ? 'text-amber-500 fill-amber-500' : 'text-white'}`} />
            </button>
          </div>
          
          <h3 className="text-white font-serif italic text-base md:text-lg truncate mb-1">{movie.title}</h3>
          
          <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-bold text-amber-500/80">
            <span>{movie.category}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-gray-400">{movie.duration}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-1 text-white/60">
              <Eye className="w-3 h-3 text-amber-500" />
              <span>{movie.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
