import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { Screen } from '../../../shared/components/Screen';
import { getProducts, getSnackDetail } from '../api/catalog.api';
import { ProductCard } from '../components/ProductCard';
import { Snack } from '../types';

type SnackDetailScreenProps = {
  snack: Snack;
  onBack: () => void;
  onViewSlots: (snack: Snack) => void;
};

export function SnackDetailScreen({ onBack, onViewSlots, snack }: SnackDetailScreenProps) {
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

  return (
    <Screen>
      <View style={styles.heading}>
        <AppButton label="Retour" onPress={onBack} variant="ghost" />
        <Text accessibilityRole="header" style={styles.title}>
          {displayedSnack.name}
        </Text>
        {displayedSnack.description ? (
          <Text style={styles.subtitle}>{displayedSnack.description}</Text>
        ) : null}
        <AppButton label="Voir les créneaux" onPress={() => onViewSlots(displayedSnack)} />
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
        <ProductCard key={product.id} product={product} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 10
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
