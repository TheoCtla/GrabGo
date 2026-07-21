import { useMutation } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { AppCard } from '../../../shared/components/AppCard';
import { Screen } from '../../../shared/components/Screen';
import { loginStudent } from '../api/auth.api';
import { LoginForm } from '../components/LoginForm';
import { LoginPayload } from '../types';

export function LoginScreen() {
  const { signIn } = useAuth();
  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => loginStudent(payload),
    onSuccess: (session) => {
      void signIn(session);
    }
  });

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.error
        ? 'Connexion impossible pour le moment.'
        : undefined;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GrabGo étudiant</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Connexion
        </Text>
        <Text style={styles.subtitle}>Commandez votre repas campus avant le rush.</Text>
      </View>
      <AppCard>
        <LoginForm
          error={errorMessage}
          isSubmitting={loginMutation.isPending}
          onSubmit={(payload) => loginMutation.mutate(payload)}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: '#40685a',
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  header: {
    gap: 6
  },
  subtitle: {
    color: '#5f6c65',
    fontSize: 16
  },
  title: {
    color: '#17201b',
    fontSize: 30,
    fontWeight: '900'
  }
});
