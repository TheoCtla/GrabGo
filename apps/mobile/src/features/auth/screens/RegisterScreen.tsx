import { useMutation } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { AppButton } from '../../../shared/components/AppButton';
import { Screen } from '../../../shared/components/Screen';
import { mobileColors } from '../../../shared/theme/colors';
import { registerStudent } from '../api/auth.api';
import { RegisterForm } from '../components/RegisterForm';
import { RegisterPayload } from '../types';

type RegisterScreenProps = {
  onShowLogin: () => void;
};

export function RegisterScreen({ onShowLogin }: RegisterScreenProps) {
  const { signIn } = useAuth();
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerStudent(payload),
    onSuccess: (session) => {
      void signIn(session);
    }
  });

  const errorMessage =
    registerMutation.error instanceof ApiError
      ? registerMutation.error.message
      : registerMutation.error
        ? 'Inscription impossible pour le moment.'
        : undefined;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GrabGo étudiant</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Créer un compte
        </Text>
        <Text style={styles.subtitle}>Inscrivez-vous pour commander votre repas campus.</Text>
      </View>
      <View style={styles.formBlock}>
        <RegisterForm
          error={errorMessage}
          isSubmitting={registerMutation.isPending}
          onSubmit={(payload) => registerMutation.mutate(payload)}
        />
        <View style={styles.switchBlock}>
          <Text style={styles.switchText}>Vous avez déjà un compte ?</Text>
          <AppButton label="Se connecter" onPress={onShowLogin} variant="secondary" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: mobileColors.accent,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  header: {
    gap: 6
  },
  formBlock: {
    gap: 16
  },
  subtitle: {
    color: mobileColors.light,
    fontSize: 16
  },
  switchBlock: {
    gap: 8,
    marginTop: 8
  },
  switchText: {
    color: mobileColors.light,
    textAlign: 'center'
  },
  title: {
    color: mobileColors.light,
    fontSize: 30,
    fontWeight: '900'
  }
});
