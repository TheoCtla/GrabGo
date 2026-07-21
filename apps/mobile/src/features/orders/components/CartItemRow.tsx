import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { CartItem } from '../state/cart-context';
import { formatCents } from '../utils/order-formatters';

type CartItemRowProps = {
  item: CartItem;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
};

export function CartItemRow({ item, onDecrease, onIncrease, onRemove }: CartItemRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.quantity} x {formatCents(item.priceCents)}
        </Text>
        <Text style={styles.total}>{formatCents(item.priceCents * item.quantity)}</Text>
      </View>
      <View style={styles.actions}>
        <AppButton
          accessibilityLabel={`Retirer un ${item.name}`}
          label="-"
          onPress={onDecrease}
          variant="secondary"
        />
        <AppButton
          accessibilityLabel={`Ajouter un ${item.name}`}
          label="+"
          onPress={onIncrease}
          variant="secondary"
        />
        <AppButton label="Supprimer" onPress={onRemove} variant="ghost" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8
  },
  info: {
    flex: 1,
    gap: 4
  },
  meta: {
    color: '#5f6c65'
  },
  name: {
    color: '#17201b',
    fontSize: 17,
    fontWeight: '800'
  },
  row: {
    borderBottomColor: '#e4e0d8',
    borderBottomWidth: 1,
    gap: 12,
    paddingBottom: 14
  },
  total: {
    color: '#1f7a5c',
    fontWeight: '800'
  }
});
