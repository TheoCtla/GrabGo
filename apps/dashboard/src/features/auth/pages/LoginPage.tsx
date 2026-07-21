import { useMutation } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { Card } from '../../../shared/components/Card';
import { loginMerchant } from '../api/auth.api';
import { LoginForm } from '../components/LoginForm';
import { LoginPayload } from '../types';

type LocationState = {
  from?: {
    pathname?: string;
  };
  authError?: string;
};

export function LoginPage() {
  const { isAuthenticated, session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? '/orders';

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const authSession = await loginMerchant(payload);

      if (authSession.user.role !== 'MERCHANT') {
        throw new ApiError('Ce dashboard est réservé aux commerçants.', 403);
      }

      return authSession;
    },
    onSuccess: (session) => {
      signIn(session);
      void navigate(redirectTo, { replace: true });
    }
  });

  if (isAuthenticated && session?.user.role === 'MERCHANT') {
    return <Navigate to="/orders" replace />;
  }

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.error
        ? 'Connexion impossible pour le moment.'
        : state?.authError;

  return (
    <main className="login-page" aria-labelledby="login-title">
      <Card className="login-card">
        <p className="eyebrow">GrabGo Dashboard</p>
        <h1 id="login-title">Connexion commerçant</h1>
        <p className="muted">Accédez aux commandes de votre snack campus.</p>
        <LoginForm
          error={errorMessage}
          isSubmitting={loginMutation.isPending}
          onSubmit={(payload) => loginMutation.mutate(payload)}
        />
      </Card>
    </main>
  );
}
