import { StyleSheet, Text } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { Campus } from '../types';

type CampusCardProps = {
  campus: Campus;
  onSelect: (campus: Campus) => void;
};

export function CampusCard({ campus, onSelect }: CampusCardProps) {
  return (
    <AppCard>
      <Text accessibilityRole="header" style={styles.title}>
        {campus.name}
      </Text>
      <Text style={styles.text}>{campus.city}</Text>
      {campus.address ? <Text style={styles.muted}>{campus.address}</Text> : null}
      <AppButton label="Voir les snacks" onPress={() => onSelect(campus)} />
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
