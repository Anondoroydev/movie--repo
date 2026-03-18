import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { NotificationType } from '../context/NotificationContext';

interface ToastProps {
  message: string;
  type: NotificationType;
  movieId?: string;
  onAction?: (movieId: string) => void;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <XCircle className="w-5 h-5 text-rose-500" />,
  info: <Info className="w-5 h-5 text-amber-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
};

const colors = {
  success: 'border-emerald-500/20 bg-emerald-500/5',
  error: 'border-rose-500/20 bg-rose-500/5',
  info: 'border-amber-500/20 bg-amber-500/5',
  warning: 'border-orange-500/20 bg-orange-500/5',
};

const Toast: React.FC<ToastProps> = ({ message, type, movieId, onAction, onClose }) => {
  const handleClick = () => {
    if (movieId && onAction) {
      onAction(movieId);
      onClose();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-2xl shadow-2xl min-w-[300px] max-w-md transition-all duration-300 ${colors[type]} ${movieId ? 'cursor-pointer hover:scale-[1.02] hover:border-amber-500/40' : ''}`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <div className="flex-1 flex flex-col gap-1">
        <p className="text-sm font-medium text-white/90 leading-tight">
          {message}
        </p>
        {movieId && (
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 animate-pulse">
            Watch Now →
          </span>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-white/40" />
      </button>
    </motion.div>
  );
};

export default Toast;
