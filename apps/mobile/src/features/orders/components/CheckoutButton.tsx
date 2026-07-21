import { AppButton } from '../../../shared/components/AppButton';

type CheckoutButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export function CheckoutButton({ disabled, isLoading, onPress }: CheckoutButtonProps) {
  return (
    <AppButton
      disabled={disabled}
      isLoading={isLoading}
      label="Confirmer et payer"
      onPress={onPress}
    />
  );
}
