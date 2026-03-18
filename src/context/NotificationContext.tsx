import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  movieId?: string;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, movieId?: string) => void;
  history: Notification[];
  clearHistory: () => void;
  onAction?: (movieId: string) => void;
  setActionHandler: (handler: (movieId: string) => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [onAction, setOnAction] = useState<(movieId: string) => void>();

  const setActionHandler = useCallback((handler: (movieId: string) => void) => {
    setOnAction(() => handler);
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = 'info', movieId?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { id, message, type, timestamp: new Date(), movieId };
    
    setNotifications((prev) => [...prev, newNotification]);
    setHistory((prev) => [newNotification, ...prev].slice(0, 10)); // Keep last 10

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000); // Increased duration for clickable notifications
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, history, clearHistory, onAction, setActionHandler }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <Toast
              key={notification.id}
              message={notification.message}
              type={notification.type}
              movieId={notification.movieId}
              onAction={onAction}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
