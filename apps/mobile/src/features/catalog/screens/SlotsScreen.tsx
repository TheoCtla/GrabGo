import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { Screen } from '../../../shared/components/Screen';
import { getAvailableSlots } from '../api/catalog.api';
import { SlotCard } from '../components/SlotCard';
import { Snack } from '../types';

type SlotsScreenProps = {
  snack: Snack;
  onBack: () => void;
};

export function SlotsScreen({ onBack, snack }: SlotsScreenProps) {
  const slotsQuery = useQuery({
    queryKey: ['slots', snack.id],
    queryFn: () => getAvailableSlots(snack.id)
  });

  return (
    <Screen>
      <View style={styles.heading}>
        <AppButton label="Retour" onPress={onBack} variant="ghost" />
        <Text accessibilityRole="header" style={styles.title}>
          Créneaux disponibles
        </Text>
        <Text style={styles.subtitle}>{snack.name}</Text>
      </View>

      {slotsQuery.isLoading ? <LoadingState message="Chargement des créneaux..." /> : null}
      {slotsQuery.isError ? (
        <ErrorState
          title="Créneaux indisponibles"
          message="Impossible de charger les créneaux de retrait."
          actionLabel="Réessayer"
          onAction={() => {
            void slotsQuery.refetch();
          }}
        />
      ) : null}
      {slotsQuery.data?.length === 0 ? (
        <EmptyState
          title="Aucun créneau disponible"
          message="Le snack n'a pas de créneau ouvert pour le moment."
        />
      ) : null}
      {slotsQuery.data?.map((slot) => (
        <SlotCard key={slot.id} slot={slot} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 6
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
