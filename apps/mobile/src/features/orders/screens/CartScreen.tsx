import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Screen } from '../../../shared/components/Screen';
import { mobileColors } from '../../../shared/theme/colors';
import { CartItemRow } from '../components/CartItemRow';
import { CartSummary } from '../components/CartSummary';
import { useCart } from '../state/cart-context';

type CartScreenProps = {
  onBack: () => void;
  onBrowseCampuses: () => void;
  onChooseSlot: () => void;
};

export function CartScreen({ onBack, onBrowseCampuses, onChooseSlot }: CartScreenProps) {
  const { addProduct, decreaseQuantity, itemCount, productsTotalCents, removeProduct, state } =
    useCart();

  return (
    <Screen>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Panier
        </Text>
        <Text style={styles.subtitle}>
          Vérifiez vos produits avant de choisir le créneau de retrait.
        </Text>
      </View>

      {state.items.length === 0 ? (
        <EmptyState
          title="Panier vide"
          message="Ajoutez des produits depuis le détail d'un snack."
        />
      ) : (
        <AppCard>
          {state.items.map((item) => (
            <CartItemRow
              key={item.productId}
              item={item}
              onDecrease={() => decreaseQuantity(item.productId)}
              onIncrease={() => {
                if (!state.snack) {
                  return;
                }

                addProduct(
                  {
                    id: item.productId,
                    name: item.name,
                    priceCents: item.priceCents
                  },
                  state.snack
                );
              }}
              onRemove={() => removeProduct(item.productId)}
            />
          ))}
        </AppCard>
      )}

      <CartSummary
        items={state.items}
        productsTotalCents={productsTotalCents}
        snack={state.snack}
      />
      <AppButton disabled={itemCount === 0} label="Choisir un créneau" onPress={onChooseSlot} />
      <AppButton label="Retour" onPress={onBack} variant="ghost" />
      <AppButton label="Continuer mes achats" onPress={onBrowseCampuses} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 6
  },
  subtitle: {
    color: mobileColors.light
  },
  title: {
    color: mobileColors.light,
    fontSize: 28,
    fontWeight: '900'
  }
});
