import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { Screen } from '../../../shared/components/Screen';
import { getSnacks } from '../api/catalog.api';
import { SnackCard } from '../components/SnackCard';
import { Campus, Snack } from '../types';

type SnacksScreenProps = {
  campus: Campus | null;
  onBack: () => void;
  onSelectSnack: (snack: Snack) => void;
};

export function SnacksScreen({ campus, onBack, onSelectSnack }: SnacksScreenProps) {
  const snacksQuery = useQuery({
    queryKey: ['snacks', campus?.id],
    queryFn: () => getSnacks(campus?.id)
  });

  return (
    <Screen>
      <View style={styles.heading}>
        <AppButton label="Retour" onPress={onBack} variant="ghost" />
        <Text accessibilityRole="header" style={styles.title}>
          Snacks
        </Text>
        <Text style={styles.subtitle}>{campus ? campus.name : 'Tous les campus'}</Text>
      </View>

      {snacksQuery.isLoading ? <LoadingState message="Chargement des snacks..." /> : null}
      {snacksQuery.isError ? (
        <ErrorState
          title="Snacks indisponibles"
          message="Impossible de charger les snacks."
          actionLabel="Réessayer"
          onAction={() => {
            void snacksQuery.refetch();
          }}
        />
      ) : null}
      {snacksQuery.data?.length === 0 ? (
        <EmptyState
          title="Aucun snack disponible"
          message="Aucun snack en ligne n'est disponible sur ce campus."
        />
      ) : null}
      {snacksQuery.data?.map((snack) => (
        <SnackCard key={snack.id} snack={snack} onSelect={onSelectSnack} />
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
