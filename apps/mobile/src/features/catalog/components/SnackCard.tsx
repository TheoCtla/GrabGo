import { StyleSheet, Text } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { Snack } from '../types';

type SnackCardProps = {
  snack: Snack;
  onSelect: (snack: Snack) => void;
};

export function SnackCard({ onSelect, snack }: SnackCardProps) {
  return (
    <AppCard>
      <Text accessibilityRole="header" style={styles.title}>
        {snack.name}
      </Text>
      {snack.description ? <Text style={styles.text}>{snack.description}</Text> : null}
      <Text style={styles.muted}>{snack.products.length} produit(s) disponible(s)</Text>
      <AppButton label="Voir le menu" onPress={() => onSelect(snack)} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  muted: {
    color: '#5f6c65'
  },
  text: {
    color: '#33443c'
  },
  title: {
    color: '#17201b',
    fontSize: 18,
    fontWeight: '800'
  }
});
