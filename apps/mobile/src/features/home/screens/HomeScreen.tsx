import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../shared/auth/auth-context';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { Screen } from '../../../shared/components/Screen';

type HomeScreenProps = {
  onBrowseCampuses: () => void;
  onViewCart: () => void;
};

export function HomeScreen({ onBrowseCampuses, onViewCart }: HomeScreenProps) {
  const { session, signOut } = useAuth();
  const firstName = session?.user.firstName ?? 'étudiant';

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GrabGo</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Bonjour {firstName}
        </Text>
        <Text style={styles.subtitle}>Trouvez un snack campus et choisissez votre créneau.</Text>
      </View>
      <AppCard>
        <Text style={styles.cardTitle}>Parcours étudiant</Text>
        <Text style={styles.text}>
          Consultez les campus, choisissez vos produits, puis validez un créneau de retrait.
        </Text>
        <AppButton label="Choisir un campus" onPress={onBrowseCampuses} />
        <AppButton label="Voir mon panier" onPress={onViewCart} variant="secondary" />
        <AppButton
          label="Se déconnecter"
          onPress={() => {
            void signOut();
          }}
          variant="ghost"
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: '#17201b',
    fontSize: 18,
    fontWeight: '800'
  },
  eyebrow: {
    color: '#40685a',
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  header: {
    gap: 6
  },
  subtitle: {
    color: '#5f6c65',
    fontSize: 16
  },
  text: {
    color: '#33443c'
  },
  title: {
    color: '#17201b',
    fontSize: 30,
    fontWeight: '900'
  }
});
