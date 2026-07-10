import React from 'react';
import { getUnreadCount } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';

// Shared unread-notifications count so the navbar badge and the Notifications screen stay in sync
// (marking all as read clears the badge instantly, instead of waiting for the 30s poll).
function readUnread(data: any) {
  if (!data) return 0;
  if (typeof data.unread === 'number') return data.unread;
  if (typeof data.count === 'number') return data.count;
  const first = Object.values(data)[0];
  return typeof first === 'number' ? first : 0;
}

interface UnreadCtx { unread: number; refresh: () => void; setZero: () => void; }
const Ctx = React.createContext<UnreadCtx>({ unread: 0, refresh: () => {}, setZero: () => {} });

export const useUnread = () => React.useContext(Ctx);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unread, setUnread] = React.useState(0);

  const refresh = React.useCallback(() => {
    if (!user) { setUnread(0); return; }
    getUnreadCount().then((d: any) => setUnread(readUnread(d))).catch(() => {});
  }, [user]);

  const setZero = React.useCallback(() => setUnread(0), []);

  React.useEffect(() => {
    refresh();
    if (!user) return undefined;
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh, user]);

  return <Ctx.Provider value={{ unread, refresh, setZero }}>{children}</Ctx.Provider>;
}
