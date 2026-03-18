import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';
import MovieCard from './MovieCard';

interface MovieRowProps {
  key?: React.Key;
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleWatchlist: (movieId: string) => void;
  onToggleLike: (movieId: string) => void;
  watchlist: string[];
  likedMovies: string[];
}

export default function MovieRow({ title, movies, onPlay, onToggleWatchlist, onToggleLike, watchlist, likedMovies }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-12 group relative mb-8">
      <h2 
        onClick={() => window.location.href = title === 'TV Shows' ? '/tv-shows' : '/movies'}
        className="text-white text-lg md:text-2xl font-serif italic font-black hover:text-amber-500 cursor-pointer transition-all duration-300 inline-flex items-center gap-3"
      >
        {title} 
        <div className="w-12 h-px bg-amber-500/30 group-hover:w-24 transition-all duration-500" />
      </h2>
      
      <div className="relative group/row">
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-4 md:-left-8 top-0 bottom-0 z-40 w-12 md:w-16 glass opacity-0 group-hover/row:opacity-100 transition-all duration-500 flex items-center justify-center hover:bg-amber-500 hover:text-black text-white rounded-r-2xl"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        
        <div 
          ref={rowRef}
          className="flex items-center gap-4 md:gap-6 overflow-x-scroll scrollbar-hide py-4 md:py-6"
        >
          {movies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onPlay={onPlay} 
              onToggleWatchlist={onToggleWatchlist}
              onToggleLike={onToggleLike}
              isInWatchlist={watchlist.includes(movie.id)}
              isLiked={likedMovies.includes(movie.id)}
            />
          ))}
        </div>
        
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-4 md:-right-8 top-0 bottom-0 z-40 w-12 md:w-16 glass opacity-0 group-hover/row:opacity-100 transition-all duration-500 flex items-center justify-center hover:bg-amber-500 hover:text-black text-white rounded-l-2xl"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
