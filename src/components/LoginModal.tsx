import React, { useState } from 'react';
import { X, Mail, Lock, User, Chrome, AlertCircle, ExternalLink } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase';
import { useNotification } from '../context/NotificationContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { showNotification } = useNotification();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error('Google Login Error:', err);
      setDebugInfo(err);
      if (err.code === 'auth/popup-blocked') {
        setError('The login popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // No error message needed if user closed the popup
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google login is not enabled in the Firebase console. Please contact the administrator.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`This domain is not authorized for Firebase Auth. Please add the following domains to your Firebase Console: ${window.location.hostname}`);
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. This is often caused by browser extensions (like ad-blockers) or the app being inside an iframe. Please try opening the app in a new tab.');
      } else {
        setError(`Login failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setDebugInfo(err);
      if (err.code === 'auth/operation-not-allowed') {
        const projectId = "ai-studio-applet-webapp-439d7";
        setError(`Email/Password login is not enabled in the Firebase console. Please enable it here: https://console.firebase.google.com/project/${projectId}/authentication/providers`);
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(isSignUp
          ? 'This email cannot be used for sign up. It may already be registered or the credentials are invalid.'
          : 'Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(`Authentication failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] w-full max-w-md rounded-lg border border-white/10 shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-white mb-8">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="bg-[#e87c03] text-white p-4 rounded text-sm mb-6 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold mb-1">Error</p>
                  <p>{error}</p>
                </div>
              </div>

              {error.includes('auth/operation-not-allowed') && (
                <button
                  onClick={() => window.open(`https://console.firebase.google.com/project/ai-studio-applet-webapp-439d7/authentication/providers`, '_blank')}
                  className="w-full bg-white text-[#e87c03] py-2 rounded font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Enable Email Auth in Console
                </button>
              )}

              <div className="text-[11px] bg-black/20 p-2 rounded">
                <p className="font-bold mb-1 uppercase opacity-70">Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-1 opacity-90 mb-2">
                  <li>Ensure Google & Email Auth are enabled in Firebase Console.</li>
                  <li>Check if popups are blocked in your browser.</li>
                  <li><strong>Strongly Recommended:</strong> Open the app in a new tab.</li>
                </ul>
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-1.5 rounded flex items-center justify-center gap-2 transition-colors border border-white/10"
                >
                  <ExternalLink className="w-3 h-3" /> Open in New Tab
                </button>
              </div>

              <button
                onClick={() => {
                  const info = debugInfo ? `Code: ${debugInfo.code}\nMessage: ${debugInfo.message}` : "No detailed info available.";
                  showNotification(`Debug Info: ${info}`, 'info');
                  console.log("Full Login Error Object:", debugInfo);
                }}
                className="text-[10px] uppercase font-bold text-white/60 hover:text-white underline self-end"
              >
                View Debug Info
              </button>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full bg-[#333] text-white pl-10 pr-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-[#E50914]"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full bg-[#333] text-white pl-10 pr-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-[#E50914]"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full bg-[#333] text-white pl-10 pr-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-[#E50914]"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {isSignUp && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  className="w-full bg-[#333] text-white pl-10 pr-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-[#E50914]"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E50914] text-white py-3 rounded font-bold hover:bg-[#C11119] transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#141414] text-gray-400">OR</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleGoogleLogin()}
              disabled={loading}
              className="w-full bg-white text-black py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" /> Continue with Google
            </button>
          </div>

          <div className="mt-8 text-gray-400 text-sm">
            {isSignUp ? (
              <p>Already have an account? <button onClick={() => { setIsSignUp(false); setError(''); }} className="text-white hover:underline">Sign in now.</button></p>
            ) : (
              <p>New to Netflix? <button onClick={() => { setIsSignUp(true); setError(''); }} className="text-white hover:underline">Sign up now.</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
