import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { Screen } from '../../../shared/components/Screen';
import { mobileColors } from '../../../shared/theme/colors';
import { getOrderDetail } from '../api/orders.api';
import { OrderConfirmationCard } from '../components/OrderConfirmationCard';
import { formatCents } from '../utils/order-formatters';

type OrderDetailScreenProps = {
  orderId: string;
  onBack: () => void;
};

export function OrderDetailScreen({ onBack, orderId }: OrderDetailScreenProps) {
  const orderQuery = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => getOrderDetail(orderId)
  });

  return (
    <Screen>
      <View style={styles.heading}>
        <AppButton label="Retour" onPress={onBack} variant="ghost" />
        <Text accessibilityRole="header" style={styles.title}>
          Détail commande
        </Text>
      </View>

      {orderQuery.isLoading ? <LoadingState message="Chargement de la commande..." /> : null}
      {orderQuery.isError ? (
        <ErrorState
          title="Commande indisponible"
          message="Impossible de charger le détail de cette commande."
          actionLabel="Réessayer"
          onAction={() => {
            void orderQuery.refetch();
          }}
        />
      ) : null}
      {orderQuery.data ? (
        <>
          <OrderConfirmationCard order={orderQuery.data} />
          <AppCard>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Produits
            </Text>
            {orderQuery.data.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} x {formatCents(item.unitPriceCents)}
                </Text>
                <Text style={styles.itemTotal}>{formatCents(item.totalPriceCents)}</Text>
              </View>
            ))}
          </AppCard>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 6
  },
  item: {
    borderBottomColor: mobileColors.accent,
    borderBottomWidth: 1,
    gap: 4,
    paddingBottom: 10
  },
  itemMeta: {
    color: mobileColors.dark
  },
  itemName: {
    color: mobileColors.dark,
    fontWeight: '800'
  },
  itemTotal: {
    color: mobileColors.dark,
    fontWeight: '800'
  },
  sectionTitle: {
    color: mobileColors.dark,
    fontSize: 18,
    fontWeight: '900'
  },
  title: {
    color: mobileColors.light,
    fontSize: 28,
    fontWeight: '900'
  }
});
