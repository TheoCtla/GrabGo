import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { mobileColors } from '../../../shared/theme/colors';
import { RegisterPayload } from '../types';
import { validateRegisterFields } from '../utils/auth-role';

type RegisterFormProps = {
  error?: string;
  isSubmitting: boolean;
  onSubmit: (payload: RegisterPayload) => void;
};

export function RegisterForm({ error, isSubmitting, onSubmit }: RegisterFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();

  function handleSubmit() {
    const nextValidationError = validateRegisterFields({
      firstName,
      lastName,
      email,
      password,
      passwordConfirmation
    });

    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    setValidationError(undefined);
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password
    });
  }

  return (
    <>
      <AppTextInput
        label="Prénom"
        autoComplete="given-name"
        textContentType="givenName"
        value={firstName}
        onChangeText={(value) => {
          setFirstName(value);
          setValidationError(undefined);
        }}
      />
      <AppTextInput
        label="Nom"
        autoComplete="family-name"
        textContentType="familyName"
        value={lastName}
        onChangeText={(value) => {
          setLastName(value);
          setValidationError(undefined);
        }}
      />
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
        autoComplete="new-password"
        secureTextEntry
        textContentType="newPassword"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setValidationError(undefined);
        }}
      />
      <AppTextInput
        label="Confirmation du mot de passe"
        autoComplete="new-password"
        secureTextEntry
        textContentType="newPassword"
        value={passwordConfirmation}
        onChangeText={(value) => {
          setPasswordConfirmation(value);
          setValidationError(undefined);
        }}
      />
      {validationError || error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {validationError ?? error}
        </Text>
      ) : null}
      <AppButton
        label="Créer mon compte étudiant"
        isLoading={isSubmitting}
        onPress={handleSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    color: mobileColors.light,
    fontWeight: '700'
  }
});
