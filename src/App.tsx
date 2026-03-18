import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, auth, db, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, onSnapshot, signOut, writeBatch, increment } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { Movie, UserProfile, OperationType } from './types';
import { handleFirestoreError } from './utils';
import { Film, Eye } from 'lucide-react';

import { NotificationProvider, useNotification } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import AdminPanel from './components/AdminPanel';
import VideoPlayer from './components/VideoPlayer';

export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

function AppContent() {
  const { showNotification, setActionHandler } = useNotification();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePlay = useCallback(async (movie: Movie) => {
    setPlayingMovie(movie);
    
    // Increment views in Firestore
    try {
      await updateDoc(doc(db, 'movies', movie.id), {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }, [showNotification]);

  useEffect(() => {
    setActionHandler((movieId: string) => {
      const movie = movies.find(m => m.id === movieId);
      if (movie) {
        handlePlay(movie);
      }
    });
  }, [handlePlay, setActionHandler, movies]);

  const seedSampleData = async () => {
    if (userProfile?.role !== 'admin') return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const sampleMovies: Omit<Movie, 'id'>[] = [
        {
          title: "The Midnight Forest",
          description: "A deep dive into the mysteries of the ancient Amazon, where legends come to life and danger lurks in every shadow.",
          thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
          videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          type: "movie",
          category: "Action",
          language: "English",
          duration: "2h 15m",
          releaseDate: "2024-03-10",
          isFeatured: true
        },
        {
          title: "Urban Legends",
          description: "Follow a group of teenagers as they uncover the dark secrets behind their town's most famous ghost stories.",
          thumbnailUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1920&q=80",
          videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          type: "tv-show",
          category: "Horror",
          language: "English",
          duration: "45m",
          releaseDate: "2023-11-15"
        },
        {
          title: "Love in Kolkata",
          description: "A heartwarming story of two strangers who find love in the bustling streets of Kolkata during the Durga Puja festival.",
          thumbnailUrl: "https://images.unsplash.com/photo-1517089534706-3d5efebb2492?auto=format&fit=crop&w=1920&q=80",
          videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          type: "movie",
          category: "Romance",
          language: "Bangla",
          duration: "2h 30m",
          releaseDate: "2024-01-20"
        },
        {
          title: "The Last Stand",
          description: "In a post-apocalyptic world, one man must protect his family from a ruthless warlord.",
          thumbnailUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80",
          videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          type: "movie",
          category: "Action",
          language: "Hindi",
          duration: "1h 55m",
          releaseDate: "2023-09-05"
        },
        {
          title: "Tech Revolution",
          description: "A documentary exploring how artificial intelligence is changing the world as we know it.",
          thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1920&q=80",
          videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          type: "movie",
          category: "Documentaries",
          language: "English",
          duration: "1h 20m",
          releaseDate: "2024-02-12"
        },
        {
          title: "Comedy Central Live",
          description: "The biggest names in comedy come together for a night of non-stop laughter and entertainment.",
          thumbnailUrl: "https://images.unsplash.com/photo-1527224857813-f37d654de801?auto=format&fit=crop&w=1920&q=80",
          videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
          type: "tv-show",
          category: "Comedy",
          language: "Hindi",
          duration: "50m",
          releaseDate: "2023-12-25"
        }
      ];

      sampleMovies.forEach(m => {
        const newDoc = doc(collection(db, 'movies'));
        batch.set(newDoc, m);
      });

      await batch.commit();
      showNotification("Sample data seeded successfully!", "success");
    } catch (error) {
      console.error("Seeding error:", error);
      showNotification("Failed to seed data. Check console for details.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? `User: ${firebaseUser.email}` : "No user");
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          // Fetch or create user profile
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = { uid: firebaseUser.uid, ...userDoc.data() } as UserProfile;
            if (profile.isBlocked) {
              await signOut(auth);
              showNotification('Your account has been blocked by an administrator.', 'error');
              setUserProfile(null);
              setUser(null);
            } else {
              setUserProfile(profile);
            }
          } else {
            // Check if email is pre-authorized as admin
            const adminEmails = ['ajoysarkar9098@gmail.com', 'ajoysarker553@gmail.com', 'anondo554@gmail.com'];
            let initialRole: 'user' | 'admin' = adminEmails.includes(firebaseUser.email || '') ? 'admin' : 'user';
            
            try {
              const preAuthDoc = await getDoc(doc(db, 'preauthorized_admins', firebaseUser.email || ''));
              if (preAuthDoc.exists()) {
                initialRole = 'admin';
              }
            } catch (e) {
              console.warn('Pre-auth check failed:', e);
            }

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: initialRole,
              watchlist: []
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile(newProfile);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        if (firebaseUser) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } finally {
        setLoading(false);
      }
    });

    const unsubscribeMovies = onSnapshot(collection(db, 'movies'), (snapshot) => {
      const moviesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      
      // Detect new movie additions (skip initial load)
      if (!loading) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newMovie = { id: change.doc.id, ...change.doc.data() } as Movie;
            showNotification(`New ${newMovie.type === 'tv-show' ? 'Series' : 'Movie'} added: ${newMovie.title}`, 'success', newMovie.id);
          }
        });
      }
      
      setMovies(moviesList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'movies');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMovies();
    };
  }, []);

  const toggleWatchlist = async (movieId: string) => {
    if (!user) {
      showNotification('Please sign in to add movies to your list.', 'info');
      return;
    }
    const isInWatchlist = userProfile?.watchlist?.includes(movieId);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        watchlist: isInWatchlist ? arrayRemove(movieId) : arrayUnion(movieId)
      });
      setUserProfile(prev => prev ? ({
        ...prev,
        watchlist: isInWatchlist 
          ? prev.watchlist?.filter(id => id !== movieId) 
          : [...(prev.watchlist || []), movieId]
      }) : null);
      showNotification(isInWatchlist ? 'Removed from your list' : 'Added to your list', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showNotification('Failed to update your list', 'error');
    }
  };

  const toggleLike = async (movieId: string) => {
    if (!user) {
      showNotification('Please sign in to like movies.', 'info');
      return;
    }
    const isInLikes = userProfile?.likedMovies?.includes(movieId);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        likedMovies: isInLikes ? arrayRemove(movieId) : arrayUnion(movieId)
      });
      setUserProfile(prev => prev ? ({
        ...prev,
        likedMovies: isInLikes 
          ? prev.likedMovies?.filter(id => id !== movieId) 
          : [...(prev.likedMovies || []), movieId]
      }) : null);
      showNotification(isInLikes ? 'Removed from your likes' : 'Added to your likes', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showNotification('Failed to update your likes', 'error');
    }
  };

  const featuredMovies = movies.filter(m => m.isFeatured);
  const displayFeatured = featuredMovies.length > 0 ? featuredMovies : movies.slice(0, 6);
  const categories = ["Trending", "Action", "Comedy", "Horror", "Romance", "Documentaries"];
  const languages = ["Hindi", "Bangla", "Telugu"];

  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#141414] font-sans text-white selection:bg-[#E50914] selection:text-white">
        <Navbar 
          user={user} 
          isAdmin={userProfile?.role === 'admin'} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onPlay={handlePlay}
          movies={movies}
        />
        
        <Routes>
          <Route path="/" element={
            <main className="pb-20">
              {!searchQuery && <Hero movies={displayFeatured} onPlay={handlePlay} />}
              <div className={`relative ${searchQuery ? 'pt-24' : 'mt-8 md:mt-12'} space-y-8 md:space-y-16`}>
                {searchQuery && (
                  <div className="px-4 md:px-12">
                    <h2 className="text-2xl font-serif italic font-black mb-8">Search Results for "{searchQuery}"</h2>
                    {filteredMovies.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {filteredMovies.map(movie => (
                          <div key={movie.id} className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group glass" onClick={() => handlePlay(movie)}>
                            <img src={movie.thumbnailUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                              <span className="text-white font-serif italic font-black text-sm mb-1">{movie.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">{movie.category}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <div className="flex items-center gap-1 text-white/60 text-[10px]">
                                  <Eye className="w-3 h-3 text-amber-500" />
                                  <span>{movie.views || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 font-medium">No titles found matching your search.</p>
                    )}
                  </div>
                )}

                {!searchQuery && (
                  <>
                    {(() => {
                      const displayedIds = new Set<string>();
                      
                      // Only exclude Hero movies from rows if we have plenty of content
                      if (movies.length > 10) {
                        displayFeatured.forEach(m => displayedIds.add(m.id));
                      }

                      if (movies.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                              <Film className="w-10 h-10 text-amber-500" />
                            </div>
                            <h2 className="text-3xl font-serif italic font-black mb-4">Your Library is Empty</h2>
                            <p className="text-gray-400 max-w-md mb-8">
                              Start building your cinematic collection by adding titles in the Admin Panel or use our sample data to get started.
                            </p>
                            {userProfile?.role === 'admin' && (
                              <button 
                                onClick={seedSampleData}
                                className="bg-amber-500 text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20"
                              >
                                Seed Sample Library
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <>
                          {categories.map(category => {
                            const catMovies = movies.filter(m => m.category === category && !displayedIds.has(m.id));
                            catMovies.forEach(m => displayedIds.add(m.id));
                            return (
                              <MovieRow 
                                key={category}
                                title={category}
                                movies={catMovies}
                                onPlay={handlePlay}
                                onToggleWatchlist={toggleWatchlist}
                                onToggleLike={toggleLike}
                                watchlist={userProfile?.watchlist || []}
                                likedMovies={userProfile?.likedMovies || []}
                              />
                            );
                          })}

                          {languages.map(lang => {
                            const langMovies = movies.filter(m => m.language === lang && !displayedIds.has(m.id));
                            langMovies.forEach(m => displayedIds.add(m.id));
                            return (
                              <MovieRow 
                                key={lang}
                                title={`${lang} Content`}
                                movies={langMovies}
                                onPlay={handlePlay}
                                onToggleWatchlist={toggleWatchlist}
                                onToggleLike={toggleLike}
                                watchlist={userProfile?.watchlist || []}
                                likedMovies={userProfile?.likedMovies || []}
                              />
                            );
                          })}

                          {(() => {
                            const remainingMovies = movies.filter(m => !displayedIds.has(m.id));
                            if (remainingMovies.length === 0) return null;
                            return (
                              <MovieRow 
                                title="Discover More"
                                movies={remainingMovies}
                                onPlay={handlePlay}
                                onToggleWatchlist={toggleWatchlist}
                                onToggleLike={toggleLike}
                                watchlist={userProfile?.watchlist || []}
                                likedMovies={userProfile?.likedMovies || []}
                              />
                            );
                          })()}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </main>
          } />

          <Route path="/tv-shows" element={
            <div className="pt-24 px-4 md:px-12">
              <h1 className="text-3xl font-bold mb-8">TV Shows</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movies.filter(m => m.type === 'tv-show').map(movie => (
                  <div key={movie.id} className="relative aspect-video rounded-md overflow-hidden cursor-pointer group" onClick={() => handlePlay(movie)}>
                    <img src={movie.thumbnailUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-white font-bold text-sm mb-1">{movie.title}</span>
                      <div className="flex items-center gap-1.5 text-white/80 text-[10px]">
                        <Eye className="w-3 h-3 text-amber-500" />
                        <span>{movie.views || 0} Views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="/movies" element={
            <div className="pt-24 px-4 md:px-12">
              <h1 className="text-3xl font-bold mb-8">Movies</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movies.filter(m => m.type === 'movie' || !m.type).map(movie => (
                  <div key={movie.id} className="relative aspect-video rounded-md overflow-hidden cursor-pointer group" onClick={() => handlePlay(movie)}>
                    <img src={movie.thumbnailUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-white font-bold text-sm mb-1">{movie.title}</span>
                      <div className="flex items-center gap-1.5 text-white/80 text-[10px]">
                        <Eye className="w-3 h-3 text-amber-500" />
                        <span>{movie.views || 0} Views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {movies.filter(m => m.type === 'movie' || !m.type).length === 0 && (
                <p className="text-gray-400">No Movies available yet.</p>
              )}
            </div>
          } />

          <Route path="/new-popular" element={
            <div className="pt-24 px-4 md:px-12">
              <h1 className="text-3xl font-bold mb-8">New & Popular</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movies
                  .filter(m => m.category === 'Trending' || m.isFeatured)
                  .sort((a, b) => {
                    const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
                    const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
                    return dateB - dateA;
                  })
                  .map(movie => (
                  <div key={movie.id} className="relative aspect-video rounded-md overflow-hidden cursor-pointer group" onClick={() => handlePlay(movie)}>
                    <img src={movie.thumbnailUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{movie.title}</span>
                    </div>
                  </div>
                ))}
              </div>
              {movies.filter(m => m.category === 'Trending' || m.isFeatured).length === 0 && (
                <p className="text-gray-400 mt-4">No trending or featured content available yet.</p>
              )}
            </div>
          } />

          <Route path="/my-list" element={
            <div className="pt-24 px-4 md:px-12">
              <h1 className="text-3xl font-bold mb-8">My List</h1>
              {userProfile?.watchlist && userProfile.watchlist.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {movies.filter(m => userProfile.watchlist?.includes(m.id)).map(movie => (
                    <div key={movie.id} className="relative aspect-video rounded-md overflow-hidden cursor-pointer group" onClick={() => handlePlay(movie)}>
                      <img src={movie.thumbnailUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{movie.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">You haven't added any movies to your list yet.</p>
              )}
            </div>
          } />
          
          <Route path="/admin" element={
            userProfile?.role === 'admin' ? <AdminPanel onSeedData={seedSampleData} /> : <Navigate to="/" />
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {playingMovie && (
          <VideoPlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />
        )}
      </div>
    </Router>
  );
}
