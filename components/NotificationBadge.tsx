import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.ts'; 
import { useAuth } from '../hooks/useAuth.tsx';
import { useToast } from '../hooks/useToast.tsx';

export default function NotificationBadge() {
  const [unread, setUnread] = useState < number > (0);
  const { user } = useAuth();
  const userId = user?.id;
  const prevCountRef = useRef<number>(0);
  const { showToast } = useToast();

  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }

    const unsubscribe = api.subscribeToNotifications(userId, (notifs) => {
      const unreadNotifs = (notifs || []).filter((n: any) => !n.read);
      const count = unreadNotifs.length;
      setUnread(count);
      
      // If the unread count goes up, show a toast or a visual indicator
      if (count > prevCountRef.current) {
         // Sort to get newest first
         const newest = [...unreadNotifs].sort((a, b) => b.createdAt - a.createdAt)[0];
         if (newest && newest.title) {
            showToast(`${newest.title}: ${newest.message || ''}`, 'info');
         } else {
            showToast('Tienes nuevas notificaciones', 'info');
         }
      }
      prevCountRef.current = count;
    });

    return () => {
      unsubscribe();
    };
  }, [userId, showToast]);

  if (unread <= 0) return null;

  return (
    React.createElement("span", { className: "notification-badge", style: {
      position: 'absolute',
      top: 0,
      right: 0,
      transform: 'translate(50%, -50%)',
      background: 'linear-gradient(90deg,#ff4d4f,#ffb3a7)',
      color: 'white',
      minWidth: 18,
      height: 18,
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 999,
      fontSize: 12,
      padding: '0 5px',
      border: '2px solid white',
    }},
      unread > 99 ? '99+' : unread
    )
  );
}