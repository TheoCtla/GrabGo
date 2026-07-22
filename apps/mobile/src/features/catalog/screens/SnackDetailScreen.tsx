import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { Screen } from '../../../shared/components/Screen';
import { mobileColors } from '../../../shared/theme/colors';
import { getProducts, getSnackDetail } from '../api/catalog.api';
import { ProductCard } from '../components/ProductCard';
import { Product, Snack } from '../types';
import { useCart } from '../../orders/state/cart-context';

type SnackDetailScreenProps = {
  snack: Snack;
  onBack: () => void;
  onViewCart: () => void;
};

export function SnackDetailScreen({ onBack, onViewCart, snack }: SnackDetailScreenProps) {
  const { addProduct, itemCount, state: cartState } = useCart();
  const snackQuery = useQuery({
    queryKey: ['snack-detail', snack.id],
    queryFn: () => getSnackDetail(snack.id),
    initialData: snack
  });
  const productsQuery = useQuery({
    queryKey: ['products', snack.id],
    queryFn: () => getProducts(snack.id)
  });
  const displayedSnack = snackQuery.data ?? snack;

  const handleAddToCart = (product: Product) => {
    const cartSnack = { id: displayedSnack.id, name: displayedSnack.name };

    if (cartState.snack && cartState.snack.id !== displayedSnack.id) {
      Alert.alert(
        'Changer de snack ?',
        'Votre panier contient déjà des produits d’un autre snack. Voulez-vous le remplacer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Remplacer',
            onPress: () => addProduct(product, cartSnack, 'replace')
          }
        ]
      );
      return;
    }

    addProduct(product, cartSnack);
  };

  return (
    <Screen stickyHeaderIndices={[0]}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {displayedSnack.name}
        </Text>
        {displayedSnack.description ? (
          <Text style={styles.subtitle}>{displayedSnack.description}</Text>
        ) : null}
        <View style={styles.actions}>
          <AppButton label={`Panier (${itemCount})`} onPress={onViewCart} variant="secondary" />
          <AppButton label="Retour" onPress={onBack} variant="ghost" />
        </View>
      </View>

      {productsQuery.isLoading ? <LoadingState message="Chargement des produits..." /> : null}
      {productsQuery.isError ? (
        <ErrorState
          title="Produits indisponibles"
          message="Impossible de charger les produits du snack."
          actionLabel="Réessayer"
          onAction={() => {
            void productsQuery.refetch();
          }}
        />
      ) : null}
      {productsQuery.data?.length === 0 ? (
        <EmptyState
          title="Aucun produit"
          message="Ce snack n'a pas encore de produit disponible."
        />
      ) : null}
      {productsQuery.data?.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
    marginTop: 12
  },
  heading: {
    gap: 10,
    paddingBottom: 12,
    backgroundColor: mobileColors.dark
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
