import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../shared/components/AppCard';
import { mobileColors } from '../../../shared/theme/colors';
import { Order } from '../types';
import { formatCents, formatOrderId, formatSlotWindow } from '../utils/order-formatters';
import { OrderStatusBadge } from './OrderStatusBadge';

type OrderConfirmationCardProps = {
  order: Order;
};

export function OrderConfirmationCard({ order }: OrderConfirmationCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Commande #{formatOrderId(order.id)}
        </Text>
        <OrderStatusBadge status={order.status} />
      </View>
      <Text style={styles.text}>Snack : {order.snack.name}</Text>
      <Text style={styles.text}>
        Créneau : {formatSlotWindow(order.slot.startAt, order.slot.endAt)}
      </Text>
      <Text style={styles.text}>Sous-total produits : {formatCents(order.productsTotalCents)}</Text>
      <Text style={styles.text}>Frais de service : {formatCents(order.serviceFeeCents)}</Text>
      <Text style={styles.total}>Total : {formatCents(order.totalCents)}</Text>
      {order.withdrawalCode?.code ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Code de retrait</Text>
          <Text
            accessibilityLabel={`Code de retrait ${order.withdrawalCode.code}`}
            style={styles.code}
          >
            {order.withdrawalCode.code}
          </Text>
          <Text style={styles.text}>
            Présentez ce code au snack si le scan QR n'est pas disponible.
          </Text>
        </View>
      ) : null}
      {order.withdrawalCode?.qrToken ? (
        <Text style={styles.text}>QR token généré pour le retrait.</Text>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  code: {
    color: mobileColors.dark,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2
  },
  codeBox: {
    backgroundColor: mobileColors.light,
    borderColor: mobileColors.accent,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  codeLabel: {
    color: mobileColors.dark,
    fontWeight: '800'
  },
  header: {
    gap: 8
  },
  text: {
    color: mobileColors.dark
  },
  title: {
    color: mobileColors.dark,
    fontSize: 20,
    fontWeight: '900'
  },
  total: {
    color: mobileColors.dark,
    fontSize: 18,
    fontWeight: '900'
  }
});
