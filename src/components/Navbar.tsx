import React, { useEffect, useState, useRef } from 'react';
import { Search, Bell, User, LogOut, ShieldCheck, Menu, Play, X as CloseIcon } from 'lucide-react';
import { auth, signOut } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { Link, useLocation } from 'react-router-dom';
import { Movie } from '../types';
import { useNotification } from '../context/NotificationContext';
import LoginModal from './LoginModal';

interface NavbarProps {
  user: FirebaseUser | null;
  isAdmin: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onPlay: (movie: Movie) => void;
  movies: Movie[];
}

export default function Navbar({ user, isAdmin, searchQuery, setSearchQuery, onPlay, movies }: NavbarProps) {
  const { showNotification, history, clearHistory } = useNotification();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and notifications on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('Signed out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Failed to sign out', 'error');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'TV Shows', path: '/tv-shows' },
    { name: 'Movies', path: '/movies' },
    { name: 'New & Popular', path: '/new-popular' },
    { name: 'My List', path: '/my-list' },
  ];

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 px-4 md:px-12 py-4 flex items-center justify-between ${isScrolled || isMobileMenuOpen ? 'bg-black/60 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent'}`}>
        <div className="flex items-center gap-4 md:gap-12">
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link to="/" className="text-white text-2xl md:text-3xl font-serif font-black tracking-tighter italic">
            CINEMA<span className="text-amber-500">.</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest font-medium text-gray-400">
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`hover:text-white transition-all duration-300 relative group ${location.pathname === link.path ? 'text-white' : ''}`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full ${location.pathname === link.path ? 'w-full' : ''}`} />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 text-white">
          <div className={`flex items-center transition-all duration-500 ${isSearchOpen ? 'w-48 md:w-64 glass px-3 py-1.5 rounded-full' : 'w-5'}`}>
            <Search 
              className="w-5 h-5 cursor-pointer hover:text-amber-500 transition-colors shrink-0" 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            />
            {isSearchOpen && (
              <div className="flex items-center w-full">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Titles, people, genres..."
                  className="bg-transparent border-none outline-none text-xs ml-3 w-full placeholder:text-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <CloseIcon 
                    className="w-3.5 h-3.5 cursor-pointer text-gray-500 hover:text-white ml-2" 
                    onClick={() => setSearchQuery('')}
                  />
                )}
              </div>
            )}
          </div>
          <div className="relative" ref={notificationRef}>
            <Bell 
              className={`w-5 h-5 cursor-pointer hover:text-amber-500 transition-colors hidden sm:block ${history.length > 0 ? 'text-amber-500' : ''}`} 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse pointer-events-none" />
            )}
            
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 glass rounded-2xl shadow-2xl py-4 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="px-6 pb-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Notifications</span>
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="sm:hidden text-gray-500 hover:text-white"
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </div>
                  {history.length > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                      className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto scrollbar-hide">
                  {history.length > 0 ? (
                    history.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 group/notif ${notif.movieId ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (notif.movieId) {
                            const movie = movies.find(m => m.id === notif.movieId);
                            if (movie) {
                              onPlay(movie);
                              setIsNotificationsOpen(false);
                            } else {
                              console.warn('Movie not found for notification:', notif.movieId);
                            }
                          }
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <p className={`text-xs font-medium transition-colors ${notif.movieId ? 'group-hover/notif:text-amber-500' : 'text-white'}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {notif.movieId && (
                              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-amber-500 group-hover/notif:scale-105 transition-all">
                                <Play className="w-2 h-2 fill-current" />
                                <span>Watch Now →</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <p className="text-xs text-gray-500 font-medium italic">No new notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/admin" className="p-1.5 hover:bg-white/10 rounded-full transition-colors" title="Admin Panel">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                </Link>
              )}
              <div className="group relative">
                <div className="w-9 h-9 rounded-full border border-white/20 p-0.5 cursor-pointer overflow-hidden transition-transform duration-300 hover:scale-110">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 w-full h-full flex items-center justify-center text-xs font-bold rounded-full">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute right-0 top-full mt-3 w-56 glass rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 text-xs font-bold uppercase tracking-widest text-gray-400">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-amber-500" /> 
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-amber-500 text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/20"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#141414] border-t border-white/10 md:hidden py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-lg transition-colors ${location.pathname === link.path ? 'text-[#E50914] font-bold' : 'text-gray-200'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
}
