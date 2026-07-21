import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../../../shared/components/AppCard';
import { Slot } from '../types';
import { formatSlotAvailability, formatSlotWindow } from '../utils/catalog-formatters';

type SlotCardProps = {
  slot: Slot;
};

export function SlotCard({ slot }: SlotCardProps) {
  return (
    <AppCard>
      <Text accessibilityRole="header" style={styles.title}>
        {formatSlotWindow(slot.startAt, slot.endAt)}
      </Text>
      <Text style={styles.text}>{formatSlotAvailability(slot.capacity, slot.reservedCount)}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#33443c'
  },
  title: {
    color: '#17201b',
    fontSize: 18,
    fontWeight: '800'
  }
});
