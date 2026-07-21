import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthSession, readAuthSession, writeAuthSession } from './auth-storage';
import { AuthSession } from './auth-types';

type AuthContextValue = {
  session: AuthSession | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void readAuthSession().then((storedSession) => {
      if (isMounted) {
        setSession(storedSession);
        setIsBootstrapping(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isBootstrapping,
      isAuthenticated: Boolean(session?.accessToken),
      signIn: async (nextSession) => {
        await writeAuthSession(nextSession);
        setSession(nextSession);
      },
      signOut: async () => {
        await clearAuthSession();
        setSession(null);
      }
    }),
    [isBootstrapping, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
