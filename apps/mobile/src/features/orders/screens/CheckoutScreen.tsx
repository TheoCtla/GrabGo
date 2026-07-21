import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../../shared/api/api-error';
import { AppButton } from '../../../shared/components/AppButton';
import { AppTextInput } from '../../../shared/components/AppTextInput';
import { Screen } from '../../../shared/components/Screen';
import { Slot } from '../../catalog/types';
import { createOrder, paySimulatedOrder } from '../api/orders.api';
import { CartSummary } from '../components/CartSummary';
import { CheckoutButton } from '../components/CheckoutButton';
import { useCart } from '../state/cart-context';
import { Order } from '../types';
import { formatSlotWindow, validateCheckout } from '../utils/order-formatters';

type CheckoutScreenProps = {
  selectedSlot: Slot | null;
  onBack: () => void;
  onChooseSlot: () => void;
  onOrderPaid: (order: Order) => void;
};

export function CheckoutScreen({
  onBack,
  onChooseSlot,
  onOrderPaid,
  selectedSlot
}: CheckoutScreenProps) {
  const { clearCart, itemCount, productsTotalCents, state } = useCart();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [specialNote, setSpecialNote] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (pendingOrderId) {
        return paySimulatedOrder(pendingOrderId);
      }

      const error = validateCheckout(itemCount, selectedSlot?.id);

      if (error) {
        throw new ApiError(error, 400);
      }

      if (!state.snack || !selectedSlot) {
        throw new ApiError('Le snack ou le créneau est manquant.', 400);
      }

      const createdOrder = await createOrder({
        snackId: state.snack.id,
        slotId: selectedSlot.id,
        items: state.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        specialNote: specialNote.trim() || undefined
      });

      setPendingOrderId(createdOrder.id);
      return paySimulatedOrder(createdOrder.id);
    },
    onError: (error) => {
      setValidationError(
        error instanceof ApiError
          ? error.message
          : 'Impossible de finaliser la commande pour le moment.'
      );
    },
    onSuccess: (order) => {
      setPendingOrderId(null);
      clearCart();
      onOrderPaid(order);
    }
  });

  return (
    <Screen>
      <View style={styles.heading}>
        <AppButton label="Retour" onPress={onBack} variant="ghost" />
        <Text accessibilityRole="header" style={styles.title}>
          Validation
        </Text>
        <Text style={styles.subtitle}>Confirmez votre commande et lancez le paiement simulé.</Text>
      </View>

      <CartSummary
        items={state.items}
        productsTotalCents={productsTotalCents}
        snack={state.snack}
      />

      <View style={styles.slotBox}>
        <Text style={styles.slotTitle}>Créneau de retrait</Text>
        <Text style={styles.slotText}>
          {selectedSlot
            ? formatSlotWindow(selectedSlot.startAt, selectedSlot.endAt)
            : 'Aucun créneau sélectionné'}
        </Text>
        <AppButton label="Choisir un autre créneau" onPress={onChooseSlot} variant="secondary" />
      </View>

      <AppTextInput
        label="Note pour le snack"
        multiline
        numberOfLines={3}
        onChangeText={setSpecialNote}
        placeholder="Exemple : sans couverts"
        value={specialNote}
      />

      {validationError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {validationError}
        </Text>
      ) : null}

      <CheckoutButton
        disabled={checkoutMutation.isPending}
        isLoading={checkoutMutation.isPending}
        onPress={() => {
          setValidationError(undefined);
          checkoutMutation.mutate();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#b42318',
    fontWeight: '800'
  },
  heading: {
    gap: 6
  },
  slotBox: {
    backgroundColor: '#ffffff',
    borderColor: '#d7d8d1',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  slotText: {
    color: '#33443c'
  },
  slotTitle: {
    color: '#17201b',
    fontSize: 18,
    fontWeight: '800'
  },
  subtitle: {
    color: '#5f6c65'
  },
  title: {
    color: '#17201b',
    fontSize: 28,
    fontWeight: '900'
  }
});
