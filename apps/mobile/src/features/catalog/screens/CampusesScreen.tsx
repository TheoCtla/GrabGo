import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { Screen } from '../../../shared/components/Screen';
import { mobileColors } from '../../../shared/theme/colors';
import { getCampuses } from '../api/catalog.api';
import { CampusCard } from '../components/CampusCard';
import { Campus } from '../types';

type CampusesScreenProps = {
  onBack: () => void;
  onSelectCampus: (campus: Campus) => void;
};

export function CampusesScreen({ onBack, onSelectCampus }: CampusesScreenProps) {
  const campusesQuery = useQuery({
    queryKey: ['campuses'],
    queryFn: getCampuses
  });

  return (
    <Screen>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Campus
        </Text>
      </View>

      {campusesQuery.isLoading ? <LoadingState message="Chargement des campus..." /> : null}
      {campusesQuery.isError ? (
        <ErrorState
          title="Campus indisponibles"
          message="Impossible de charger les campus."
          actionLabel="Réessayer"
          onAction={() => {
            void campusesQuery.refetch();
          }}
        />
      ) : null}
      {campusesQuery.data?.length === 0 ? (
        <EmptyState title="Aucun campus" message="Aucun campus n'est disponible pour le moment." />
      ) : null}
      {campusesQuery.data?.map((campus) => (
        <CampusCard key={campus.id} campus={campus} onSelect={onSelectCampus} />
      ))}
      <AppButton label="Retour" onPress={onBack} variant="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 12
  },
  title: {
    color: mobileColors.light,
    fontSize: 28,
    fontWeight: '900'
  }
});
