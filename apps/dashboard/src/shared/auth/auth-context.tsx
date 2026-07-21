import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearAuthSession, readAuthSession, writeAuthSession } from './auth-storage';
import { AuthSession } from './auth-types';

type AuthContextValue = {
  session: AuthSession | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      signIn: (nextSession) => {
        writeAuthSession(nextSession);
        setSession(nextSession);
      },
      signOut: () => {
        clearAuthSession();
        setSession(null);
      }
    }),
    [session]
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

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, session, signOut } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (session?.user.role !== 'MERCHANT') {
    return <NonMerchantRedirect onReject={signOut} />;
  }

  return children;
}

type NonMerchantRedirectProps = {
  onReject: () => void;
};

function NonMerchantRedirect({ onReject }: NonMerchantRedirectProps) {
  useEffect(() => {
    onReject();
  }, [onReject]);

  return (
    <Navigate
      to="/login"
      replace
      state={{
        authError: 'Ce dashboard est réservé aux commerçants.'
      }}
    />
  );
}
