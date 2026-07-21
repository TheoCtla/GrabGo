import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { Screen } from '../../../shared/components/Screen';
import { OrderConfirmationCard } from '../components/OrderConfirmationCard';
import { Order } from '../types';

type OrderConfirmationScreenProps = {
  order: Order;
  onGoHome: () => void;
  onViewDetail: (orderId: string) => void;
};

export function OrderConfirmationScreen({
  onGoHome,
  onViewDetail,
  order
}: OrderConfirmationScreenProps) {
  return (
    <Screen>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Commande confirmée
        </Text>
        <Text style={styles.subtitle}>Votre retrait est prêt à être suivi dans GrabGo.</Text>
      </View>
      <OrderConfirmationCard order={order} />
      <AppButton label="Voir le détail" onPress={() => onViewDetail(order.id)} />
      <AppButton label="Retour à l'accueil" onPress={onGoHome} variant="secondary" />
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
