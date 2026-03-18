import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, auth, sendPasswordResetEmail, setDoc } from '../firebase';
import { Movie, OperationType, UserProfile, PreauthorizedAdmin } from '../types';
import { handleFirestoreError } from '../utils';
import { useNotification } from '../context/NotificationContext';
import { 
  Plus, Trash2, Edit2, X, Save, Film, Users, Shield, Ban, CheckCircle, Mail, UserPlus, Search,
  BarChart3, PieChart as PieChartIcon, TrendingUp, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

interface AdminPanelProps {
  onSeedData?: () => void;
}

export default function AdminPanel({ onSeedData }: AdminPanelProps) {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'movies' | 'users' | 'dashboard'>('dashboard');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [preAuthAdmins, setPreAuthAdmins] = useState<PreauthorizedAdmin[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteUserConfirmId, setDeleteUserConfirmId] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<{ [key: string]: string }>({});
  const [userSearch, setUserSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState<Partial<Movie>>({
    title: '',
    description: '',
    thumbnailUrl: '',
    videoUrl: '',
    type: 'movie',
    category: 'Trending',
    language: 'English',
    duration: '',
    releaseDate: '',
    isFeatured: false
  });

  const [userFormData, setUserFormData] = useState<Partial<UserProfile>>({
    email: '',
    displayName: '',
    role: 'user',
    isBlocked: false
  });

  useEffect(() => {
    fetchMovies();
    fetchUsers();
    fetchPreAuthAdmins();
  }, []);

  const fetchMovies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'movies'));
      const moviesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      setMovies(moviesList);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'movies');
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersList);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  };

  const fetchPreAuthAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'preauthorized_admins'));
      const preAuthList = querySnapshot.docs.map(doc => ({ email: doc.id, ...doc.data() } as PreauthorizedAdmin));
      setPreAuthAdmins(preAuthList);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'preauthorized_admins');
    }
  };

  const handlePasswordReset = async (email: string, uid: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setResetStatus(prev => ({ ...prev, [uid]: 'Sent!' }));
      showNotification(`Password reset email sent to ${email}`, 'success');
      setTimeout(() => setResetStatus(prev => ({ ...prev, [uid]: '' })), 3000);
    } catch (error) {
      console.error('Reset error:', error);
      setResetStatus(prev => ({ ...prev, [uid]: 'Error' }));
      showNotification('Failed to send password reset email', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { id, ...updateData } = formData as Movie;
        await updateDoc(doc(db, 'movies', editingId), updateData);
        showNotification('Movie updated successfully!', 'success');
      } else {
        await addDoc(collection(db, 'movies'), formData);
        showNotification('Movie added successfully!', 'success');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        thumbnailUrl: '',
        videoUrl: '',
        type: 'movie',
        category: 'Trending',
        language: 'English',
        duration: '',
        releaseDate: '',
        isFeatured: false
      });
      fetchMovies();
    } catch (error: any) {
      console.error('Submit error:', error);
      showNotification(`Error saving movie: ${error.message || 'Unknown error'}`, 'error');
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, editingId ? `movies/${editingId}` : 'movies');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await updateDoc(doc(db, 'users', editingUserId), userFormData);
        showNotification('User profile updated!', 'success');
      } else {
        // If creating a new admin by email, we also add to preauthorized_admins
        if (userFormData.role === 'admin' && userFormData.email) {
          await setDoc(doc(db, 'preauthorized_admins', userFormData.email), { authorizedAt: new Date().toISOString() });
          showNotification('Admin pre-authorized successfully!', 'success');
        } else {
          showNotification('To add a new user, they must sign up. You can only pre-authorize administrators.', 'warning');
          return;
        }
      }
      setIsAddingUser(false);
      setEditingUserId(null);
      setUserFormData({ email: '', displayName: '', role: 'user', isBlocked: false });
      fetchUsers();
      fetchPreAuthAdmins();
    } catch (error) {
      handleFirestoreError(error, editingUserId ? OperationType.UPDATE : OperationType.CREATE, editingUserId ? `users/${editingUserId}` : 'users');
      showNotification('Failed to update user', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'movies', id));
      setDeleteConfirmId(null);
      showNotification('Movie deleted successfully', 'info');
      fetchMovies();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `movies/${id}`);
      showNotification('Failed to delete movie', 'error');
    }
  };

  const handleDeleteUser = async (uid: string, isPreAuth: boolean = false) => {
    try {
      if (isPreAuth) {
        await deleteDoc(doc(db, 'preauthorized_admins', uid)); // uid is email here
        fetchPreAuthAdmins();
      } else {
        await deleteDoc(doc(db, 'users', uid));
        fetchUsers();
      }
      setDeleteUserConfirmId(null);
      showNotification('User removed successfully', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, isPreAuth ? `preauthorized_admins/${uid}` : `users/${uid}`);
      showNotification('Failed to remove user', 'error');
    }
  };

  const toggleUserBlock = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isBlocked: !user.isBlocked
      });
      showNotification(user.isBlocked ? 'User unblocked' : 'User blocked', 'warning');
      fetchUsers();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showNotification('Failed to update user status', 'error');
    }
  };

  const toggleUserRole = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: user.role === 'admin' ? 'user' : 'admin'
      });
      showNotification(`User role updated to ${user.role === 'admin' ? 'user' : 'admin'}`, 'info');
      fetchUsers();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showNotification('Failed to update user role', 'error');
    }
  };

  const handleEdit = (movie: Movie) => {
    setFormData(movie);
    setEditingId(movie.id);
    setIsAdding(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setUserFormData(user);
    setEditingUserId(user.uid);
    setIsAddingUser(true);
  };

  const filteredUsers = [
    ...users.map(u => ({ ...u, isPreAuth: false })),
    ...preAuthAdmins
      .filter(pa => !users.some(u => u.email === pa.email))
      .map(pa => ({ 
        uid: pa.email, 
        email: pa.email, 
        displayName: 'Pre-authorized Admin', 
        role: 'admin' as const, 
        isBlocked: false,
        isPreAuth: true 
      }))
  ].filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Dashboard Data
  const categoryData = movies.reduce((acc: any[], movie) => {
    const existing = acc.find(d => d.name === movie.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: movie.category, value: 1 });
    }
    return acc;
  }, []);

  const typeData = [
    { name: 'Movies', value: movies.filter(m => m.type === 'movie' || !m.type).length },
    { name: 'TV Shows', value: movies.filter(m => m.type === 'tv-show').length }
  ];

  const roleData = [
    { name: 'Users', value: users.filter(u => u.role === 'user').length },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length }
  ];

  const COLORS = ['#E50914', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="md:w-64 flex-shrink-0">
          <div className="glass rounded-2xl p-4 sticky top-24">
            <h2 className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-4">Management</h2>
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Activity className="w-5 h-5" /> <span className="text-xs uppercase tracking-widest">Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveTab('movies')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'movies' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Film className="w-5 h-5" /> <span className="text-xs uppercase tracking-widest">Library</span>
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'users' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Users className="w-5 h-5" /> <span className="text-xs uppercase tracking-widest">Audience</span>
              </button>
            </nav>

            <div className="mt-8 pt-8 border-t border-white/5 px-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure Access</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="glass p-6 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all duration-500 group">
              <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest">Total Audience</p>
                <p className="text-white text-2xl font-serif italic font-black">{users.length}</p>
              </div>
            </div>
            <div className="glass p-6 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all duration-500 group">
              <div className="p-4 bg-amber-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                <Film className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest">Library Titles</p>
                <p className="text-white text-2xl font-serif italic font-black">{movies.length}</p>
              </div>
            </div>
            <div className="glass p-6 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all duration-500 group">
              <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest">Administrators</p>
                <p className="text-white text-2xl font-serif italic font-black">{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
            <h1 className="text-4xl font-serif italic font-black text-white capitalize tracking-tighter">{activeTab}</h1>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {statusMsg && (
                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse ${statusMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}>
                  {statusMsg.text}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/60" />
                  <input 
                    type="text"
                    placeholder="Search audience..."
                    className="bg-white/5 border border-white/10 text-white pl-12 pr-6 py-3 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-64 transition-all"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>
              )}
              
              {activeTab !== 'dashboard' && (
                <div className="flex items-center gap-3">
                  {activeTab === 'movies' && movies.length === 0 && onSeedData && (
                    <button 
                      onClick={onSeedData}
                      className="glass text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" /> Seed Library
                    </button>
                  )}
                  <button 
                    onClick={() => { 
                      if (activeTab === 'movies') {
                        setIsAdding(true); setEditingId(null); setFormData({ title: '', description: '', thumbnailUrl: '', videoUrl: '', type: 'movie', category: 'Trending', language: 'English', duration: '', releaseDate: '', isFeatured: false }); 
                      } else {
                        setIsAddingUser(true); setEditingUserId(null); setUserFormData({ email: '', displayName: '', role: 'admin', isBlocked: false });
                      }
                    }}
                    className="bg-amber-500 text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 shadow-xl shadow-amber-500/20 whitespace-nowrap"
                  >
                    {activeTab === 'movies' ? <><Plus className="w-4 h-4" /> Add Title</> : <><UserPlus className="w-4 h-4" /> Add Admin</>}
                  </button>
                </div>
              )}
            </div>
          </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Content Distribution */}
              <div className="glass p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <h3 className="text-white text-sm font-black uppercase tracking-[0.2em]">Content Mix</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="glass p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <h3 className="text-white text-sm font-black uppercase tracking-[0.2em]">Genre Insights</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      />
                      <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User Roles */}
              <div className="glass p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h3 className="text-white text-sm font-black uppercase tracking-[0.2em]">Audience Roles</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {roleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Growth Trend */}
              <div className="glass p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <h3 className="text-white text-sm font-black uppercase tracking-[0.2em]">Platform Growth</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: 'Jan', users: 10, movies: 5 },
                      { name: 'Feb', users: 25, movies: 12 },
                      { name: 'Mar', users: users.length, movies: movies.length },
                    ]}>
                      <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      <Line type="monotone" dataKey="users" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#050505' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="movies" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#050505' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movies' ? (
          <>
            {isAdding && (
              <div className="glass p-8 rounded-3xl mb-10 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-white text-2xl font-serif italic font-black">{editingId ? 'Edit Title' : 'Add New Title'}</h2>
                  <button onClick={() => setIsAdding(false)} className="text-amber-500/60 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Title</label>
                      <input 
                        type="text" required
                        className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Description</label>
                      <textarea 
                        required rows={4}
                        className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Type</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                          value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}
                        >
                          <option value="movie">Movie</option>
                          <option value="tv-show">TV Show</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Category</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                          value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}
                        >
                          {["Trending", "Action", "Comedy", "Horror", "Romance", "Documentaries"].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Thumbnail URL</label>
                      <input 
                        type="url" required
                        className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Video URL</label>
                      <input 
                        type="url" required
                        className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Language</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                          value={formData.language} onChange={e => setFormData({...formData, language: e.target.value as any})}
                        >
                          {["Hindi", "Bangla", "Telugu", "English", "Other"].map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Duration</label>
                        <input 
                          type="text" placeholder="2h 15m"
                          className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                          value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Release Date</label>
                      <input 
                        type="date"
                        className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={formData.releaseDate} onChange={e => setFormData({...formData, releaseDate: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-4">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" id="isFeatured"
                          className="w-5 h-5 accent-amber-500 rounded border-white/10 bg-white/5"
                          checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
                        />
                      </div>
                      <label htmlFor="isFeatured" className="text-white text-xs font-bold cursor-pointer">Feature in Hero Section</label>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-8">
                    <button 
                      type="button" onClick={() => setIsAdding(false)}
                      className="px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-amber-500/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-amber-500 text-black px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 shadow-xl shadow-amber-500/20"
                    >
                      <Save className="w-4 h-4" /> {editingId ? 'Update Title' : 'Save Title'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {movies.map(movie => (
                <div key={movie.id} className="glass rounded-3xl overflow-hidden group hover:bg-white/5 transition-all duration-500">
                  <div className="relative aspect-video">
                    <img src={movie.thumbnailUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4">
                      <button onClick={() => handleEdit(movie)} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-amber-500 hover:text-black transition-all transform translate-y-4 group-hover:translate-y-0 duration-500"><Edit2 className="w-5 h-5" /></button>
                      <button onClick={() => setDeleteConfirmId(movie.id)} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 delay-75"><Trash2 className="w-5 h-5" /></button>
                    </div>
                    {deleteConfirmId === movie.id && (
                      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                        <p className="text-white font-serif italic text-lg mb-6">Remove this title from library?</p>
                        <div className="flex gap-4">
                          <button onClick={() => handleDelete(movie.id)} className="bg-red-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">Delete</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="glass text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                        </div>
                      </div>
                    )}
                    {movie.isFeatured && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">{movie.category}</span>
                      <div className="flex gap-2">
                        <span className="text-amber-500/60 text-[10px] font-bold uppercase tracking-tighter">{movie.language}</span>
                        <span className="text-amber-500/60 text-[10px] font-bold uppercase tracking-tighter">{movie.duration}</span>
                      </div>
                    </div>
                    <h3 className="text-white font-serif italic font-black text-xl mb-3 truncate">{movie.title}</h3>
                    <p className="text-amber-500/60 text-xs line-clamp-2 leading-relaxed">{movie.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {isAddingUser && (
              <div className="glass p-8 rounded-3xl mb-10 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-white text-2xl font-serif italic font-black">{editingUserId ? 'Edit Profile' : 'Pre-authorize Admin'}</h2>
                  <button onClick={() => setIsAddingUser(false)} className="text-amber-500/60 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Email Address</label>
                      <input 
                        type="email" required
                        disabled={!!editingUserId}
                        className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50"
                        value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                      />
                      {!editingUserId && <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-3 px-1">Authorized email for administrative access.</p>}
                    </div>
                    <div>
                      <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Display Name</label>
                      <input 
                        type="text"
                        className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={userFormData.displayName} onChange={e => setUserFormData({...userFormData, displayName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-amber-500/60 text-[10px] font-black uppercase tracking-widest mb-2">Access Level</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none"
                        value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as any})}
                      >
                        <option value="user">Audience</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" id="isBlocked"
                          className="w-5 h-5 accent-red-500 rounded border-white/10 bg-white/5"
                          checked={userFormData.isBlocked} onChange={e => setUserFormData({...userFormData, isBlocked: e.target.checked})}
                        />
                      </div>
                      <label htmlFor="isBlocked" className="text-white text-xs font-bold cursor-pointer">Restrict Account Access</label>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-8">
                    <button 
                      type="button" onClick={() => setIsAddingUser(false)}
                      className="px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-amber-500/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-amber-500 text-black px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 shadow-xl shadow-amber-500/20"
                    >
                      <Save className="w-4 h-4" /> {editingUserId ? 'Update Profile' : 'Authorize Access'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="glass rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-8 py-6 text-amber-500/60 text-[10px] font-black uppercase tracking-widest">Audience Member</th>
                      <th className="px-8 py-6 text-amber-500/60 text-[10px] font-black uppercase tracking-widest">Access Level</th>
                      <th className="px-8 py-6 text-amber-500/60 text-[10px] font-black uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-amber-500/60 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(user => (
                      <tr key={user.uid} className="hover:bg-white/5 transition-all duration-300 group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black text-lg shadow-lg">
                              {user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-bold text-sm tracking-tight">{user.displayName || 'No Name'}</div>
                              <div className="text-amber-500/60 text-xs font-medium">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          {user.isPreAuth ? (
                            <span className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          ) : user.isBlocked ? (
                            <span className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Restricted
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            {!user.isPreAuth && (
                              <>
                                <button 
                                  onClick={() => handlePasswordReset(user.email, user.uid)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${resetStatus[user.uid] === 'Sent!' ? 'bg-emerald-500 text-black' : resetStatus[user.uid] === 'Error' ? 'bg-red-500 text-white' : 'glass text-white hover:bg-white/10'}`}
                                  title="Send Password Reset"
                                >
                                  <Mail className="w-3.5 h-3.5" /> {resetStatus[user.uid] || 'Reset'}
                                </button>
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className="p-3 glass rounded-full text-gray-400 hover:text-amber-500 transition-all"
                                  title="Edit Profile"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => toggleUserBlock(user)}
                                  className={`p-3 glass rounded-full transition-all ${user.isBlocked ? 'text-emerald-500' : 'text-red-500'}`}
                                  title={user.isBlocked ? 'Unblock' : 'Restrict'}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => setDeleteUserConfirmId(user.uid)}
                              className="p-3 glass rounded-full text-red-500 hover:bg-red-500/10 transition-all"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {deleteUserConfirmId === user.uid && (
                              <div className="absolute right-0 top-full mt-4 z-20 glass p-6 rounded-2xl shadow-2xl w-56 text-center border border-white/10">
                                <p className="text-white font-serif italic text-sm mb-6">{user.isPreAuth ? 'Remove authorization?' : 'Delete member profile?'}</p>
                                <div className="flex gap-3 justify-center">
                                  <button onClick={() => handleDeleteUser(user.uid, user.isPreAuth)} className="bg-red-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">Delete</button>
                                  <button onClick={() => setDeleteUserConfirmId(null)} className="glass text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        </main>
      </div>
    </div>
  );
}
