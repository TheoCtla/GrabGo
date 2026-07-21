import { FormEvent, useId, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { TextInput } from '../../../shared/components/TextInput';
import { ValidateWithdrawalPayload } from '../types';

type WithdrawalValidationFormProps = {
  apiError?: string;
  isSubmitting: boolean;
  snackId: string;
  onValidate: (payload: ValidateWithdrawalPayload) => void;
};

export function WithdrawalValidationForm({
  apiError,
  isSubmitting,
  snackId,
  onValidate
}: WithdrawalValidationFormProps) {
  const codeId = useId();
  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{4}$/.test(code)) {
      setValidationError('Le code de retrait doit contenir exactement 4 chiffres.');
      return;
    }

    setValidationError(undefined);
    onValidate({
      code,
      snackId
    });
  }

  return (
    <form className="withdrawal-form" onSubmit={handleSubmit} noValidate>
      <TextInput
        id={codeId}
        label="Code de retrait"
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        value={code}
        onChange={(event) => {
          setCode(event.target.value.replace(/\D/g, '').slice(0, 4));
          setValidationError(undefined);
        }}
        error={validationError}
        required
      />
      {apiError ? (
        <p className="form-error" role="alert">
          {apiError}
        </p>
      ) : null}
      <Button type="submit" isLoading={isSubmitting}>
        Valider le retrait
      </Button>
    </form>
  );
}
