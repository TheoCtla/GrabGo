import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { mobileColors } from '../../../shared/theme/colors';
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
          accessibilityLabel={`Retirer 1 ${item.name}`}
          label="-1"
          onPress={onDecrease}
          style={styles.quantityButton}
          variant="secondary"
        />
        <AppButton
          accessibilityLabel={`Ajouter 1 ${item.name}`}
          label="+1"
          onPress={onIncrease}
          style={styles.quantityButton}
          variant="secondary"
        />
        <AppButton
          accessibilityLabel={`Supprimer l'article ${item.name}`}
          label="Supprimer"
          onPress={onRemove}
          style={styles.removeButton}
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  info: {
    flex: 1,
    gap: 4
  },
  meta: {
    color: mobileColors.dark
  },
  name: {
    color: mobileColors.dark,
    fontSize: 17,
    fontWeight: '800'
  },
  row: {
    borderBottomColor: mobileColors.accent,
    borderBottomWidth: 1,
    gap: 12,
    paddingBottom: 14
  },
  total: {
    color: mobileColors.dark,
    fontWeight: '800'
  },
  removeButton: {
    flex: 1
  },
  quantityButton: {
    width: 64
  }
});
