import { FormEvent, useId, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { TextInput } from '../../../shared/components/TextInput';
import { LoginPayload } from '../types';

type LoginFormProps = {
  error?: string;
  isSubmitting: boolean;
  onSubmit: (payload: LoginPayload) => void;
};

export function LoginForm({ error, isSubmitting, onSubmit }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      email,
      password
    });
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <TextInput
        id={emailId}
        label="Adresse email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <TextInput
        id={passwordId}
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" isLoading={isSubmitting}>
        Se connecter
      </Button>
    </form>
  );
}
