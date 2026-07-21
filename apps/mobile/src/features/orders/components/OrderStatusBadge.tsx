import { StyleSheet, Text, View } from 'react-native';
import { OrderStatus } from '../types';
import { getOrderStatusLabel } from '../utils/order-status';

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <View accessibilityLabel={`Statut : ${getOrderStatusLabel(status)}`} style={styles.badge}>
      <Text style={styles.text}>{getOrderStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f3ee',
    borderColor: '#9bc4b4',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  text: {
    color: '#1f4d3f',
    fontWeight: '800'
  }
});
