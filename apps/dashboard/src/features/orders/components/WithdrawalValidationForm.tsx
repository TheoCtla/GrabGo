import { ChangeEvent, FormEvent } from 'react';
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
  const codeId = 'withdrawal-code';
  const errorId = 'withdrawal-code-error';

  function hideValidationError() {
    const errorElement = document.getElementById(errorId);

    if (errorElement) {
      errorElement.hidden = true;
    }
  }

  function showValidationError() {
    const errorElement = document.getElementById(errorId);

    if (errorElement) {
      errorElement.hidden = false;
    }
  }

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
    hideValidationError();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const codeInput = event.currentTarget.elements.namedItem(codeId);

    if (!(codeInput instanceof HTMLInputElement)) {
      return;
    }

    const code = codeInput.value;

    if (!/^\d{4}$/.test(code)) {
      showValidationError();
      return;
    }

    hideValidationError();
    onValidate({
      code,
      snackId
    });
  }

  return (
    <form className="withdrawal-form" onSubmit={handleSubmit} noValidate>
      <TextInput
        id={codeId}
        className="withdrawal-code-field"
        label="Code de retrait"
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        onChange={handleCodeChange}
        required
      />
      <p id={errorId} className="form-error" role="alert" hidden>
        Le code de retrait doit contenir exactement 4 chiffres.
      </p>
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
