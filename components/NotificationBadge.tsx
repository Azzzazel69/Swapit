import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts'; 
import { useAuth } from '../hooks/useAuth.tsx';

export default function NotificationBadge() {
  const [unread, setUnread] = useState < number > (0);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    let mounted = true;
    let timer: any;

    async function fetchNotifs() {
      if (!userId) {
        setUnread(0);
        return;
      }
      try {
        // DEV-ONLY: replace with real backend
        const fn = (api as any).getNotificationsForUserDev || (api as any).getNotificationsForUser;
        if (!fn) return;
        const notifs = await fn(userId);
        if (!mounted) return;
        const count = (notifs || []).filter((n: any) => !n.read).length;
        setUnread(count);
      } catch (e) {
        console.error('Error cargando notificaciones (NotificationBadge)', e);
      } finally {
        if(mounted) {
            timer = setTimeout(fetchNotifs, 3000);
        }
      }
    }

    fetchNotifs();
    return () => { mounted = false; if (timer) clearTimeout(timer); };
  }, [userId]);

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