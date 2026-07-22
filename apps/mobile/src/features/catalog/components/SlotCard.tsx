import { StyleSheet, Text } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { mobileColors } from '../../../shared/theme/colors';
import { Slot } from '../types';
import { formatSlotAvailability, formatSlotWindow } from '../utils/catalog-formatters';

type SlotCardProps = {
  slot: Slot;
  onSelect?: (slot: Slot) => void;
};

export function SlotCard({ onSelect, slot }: SlotCardProps) {
  return (
    <AppCard>
      <Text accessibilityRole="header" style={styles.title}>
        {formatSlotWindow(slot.startAt, slot.endAt)}
      </Text>
      <Text style={styles.text}>{formatSlotAvailability(slot.capacity, slot.reservedCount)}</Text>
      {onSelect ? (
        <AppButton label="Choisir ce créneau" onPress={() => onSelect(slot)} variant="secondary" />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  text: {
    color: mobileColors.dark
  },
  title: {
    color: mobileColors.dark,
    fontSize: 18,
    fontWeight: '800'
  }
});
