import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface SessionValue {
  user: string | null;
  setUser: (user: string | null) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
