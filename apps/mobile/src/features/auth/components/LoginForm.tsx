import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { LoginPayload } from '../types';
import { validateLoginFields } from '../utils/auth-role';

type LoginFormProps = {
  error?: string;
  isSubmitting: boolean;
  onSubmit: (payload: LoginPayload) => void;
};

export function LoginForm({ error, isSubmitting, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();

  function handleSubmit() {
    const nextValidationError = validateLoginFields(email, password);

    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    setValidationError(undefined);
    onSubmit({
      email: email.trim(),
      password
    });
  }

  return (
    <>
      <AppTextInput
        label="Adresse email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setValidationError(undefined);
        }}
      />
      <AppTextInput
        label="Mot de passe"
        autoComplete="password"
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setValidationError(undefined);
        }}
      />
      {validationError || error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {validationError ?? error}
        </Text>
      ) : null}
      <AppButton label="Se connecter" isLoading={isSubmitting} onPress={handleSubmit} />
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#b42318',
    fontWeight: '700'
  }
});
