import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../shared/components/AppCard';
import { mobileColors } from '../../../shared/theme/colors';
import { CartItem, CartSnack } from '../state/cart-context';
import { formatCents } from '../utils/order-formatters';

type CartSummaryProps = {
  items: CartItem[];
  productsTotalCents: number;
  snack: CartSnack | null;
  serviceFeeCents?: number;
};

export function CartSummary({
  items,
  productsTotalCents,
  serviceFeeCents,
  snack
}: CartSummaryProps) {
  const totalCents = productsTotalCents + (serviceFeeCents ?? 0);

  return (
    <AppCard>
      <Text accessibilityRole="header" style={styles.title}>
        Résumé
      </Text>
      <Text style={styles.text}>Snack : {snack?.name ?? 'non sélectionné'}</Text>
      <Text style={styles.text}>Produits : {items.length}</Text>
      <View style={styles.line}>
        <Text style={styles.text}>Sous-total</Text>
        <Text style={styles.amount}>{formatCents(productsTotalCents)}</Text>
      </View>
      {serviceFeeCents !== undefined ? (
        <View style={styles.line}>
          <Text style={styles.text}>Frais de service</Text>
          <Text style={styles.amount}>{formatCents(serviceFeeCents)}</Text>
        </View>
      ) : null}
      <View style={styles.line}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.total}>{formatCents(totalCents)}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: mobileColors.dark,
    fontWeight: '700'
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  text: {
    color: mobileColors.dark
  },
  title: {
    color: mobileColors.dark,
    fontSize: 18,
    fontWeight: '800'
  },
  total: {
    color: mobileColors.dark,
    fontSize: 18,
    fontWeight: '900'
  },
  totalLabel: {
    color: mobileColors.dark,
    fontWeight: '900'
  }
});
