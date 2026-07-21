import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { Product } from '../types';
import { formatCents } from '../utils/catalog-formatters';

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
};

export function ProductCard({ onAddToCart, product }: ProductCardProps) {
  const allergenNames = product.allergens.map((allergen) => allergen.name).join(', ');

  return (
    <AppCard>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatCents(product.priceCents)}</Text>
      </View>
      {product.description ? <Text style={styles.text}>{product.description}</Text> : null}
      <Text style={styles.muted}>Stock : {product.stock}</Text>
      <Text style={styles.muted}>Allergènes : {allergenNames || 'aucun allergène renseigné'}</Text>
      {!product.allergensVerifiedAt ? (
        <Text style={styles.warning}>Informations allergènes à confirmer auprès du snack.</Text>
      ) : null}
      {onAddToCart ? (
        <AppButton
          disabled={!product.isAvailable || product.stock <= 0}
          label={product.isAvailable && product.stock > 0 ? 'Ajouter au panier' : 'Indisponible'}
          onPress={() => onAddToCart(product)}
        />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  muted: {
    color: '#5f6c65'
  },
  price: {
    color: '#1f7a5c',
    fontWeight: '800'
  },
  text: {
    color: '#33443c'
  },
  title: {
    color: '#17201b',
    flex: 1,
    fontSize: 18,
    fontWeight: '800'
  },
  warning: {
    color: '#8a2417',
    fontWeight: '700'
  }
});
