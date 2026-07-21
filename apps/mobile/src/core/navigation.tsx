import { useState } from 'react';
import { useAuth } from '../shared/auth/auth-context';
import { LoadingState } from '../shared/components/LoadingState';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { CampusesScreen } from '../features/catalog/screens/CampusesScreen';
import { SnacksScreen } from '../features/catalog/screens/SnacksScreen';
import { SnackDetailScreen } from '../features/catalog/screens/SnackDetailScreen';
import { SlotsScreen } from '../features/catalog/screens/SlotsScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { Campus, Slot, Snack } from '../features/catalog/types';
import { CartScreen } from '../features/orders/screens/CartScreen';
import { CheckoutScreen } from '../features/orders/screens/CheckoutScreen';
import { OrderConfirmationScreen } from '../features/orders/screens/OrderConfirmationScreen';
import { OrderDetailScreen } from '../features/orders/screens/OrderDetailScreen';
import { useCart } from '../features/orders/state/cart-context';
import { Order } from '../features/orders/types';

type MobileRoute =
  | 'home'
  | 'campuses'
  | 'snacks'
  | 'snack-detail'
  | 'cart'
  | 'slots'
  | 'checkout'
  | 'confirmation'
  | 'order-detail';

export function AppNavigation() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { state: cartState } = useCart();
  const [route, setRoute] = useState<MobileRoute>('home');
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  if (isBootstrapping) {
    return <LoadingState message="Ouverture de GrabGo..." />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (route === 'campuses') {
    return (
      <CampusesScreen
        onBack={() => setRoute('home')}
        onSelectCampus={(campus) => {
          setSelectedCampus(campus);
          setSelectedSnack(null);
          setSelectedSlot(null);
          setRoute('snacks');
        }}
      />
    );
  }

  if (route === 'snacks') {
    return (
      <SnacksScreen
        campus={selectedCampus}
        onBack={() => setRoute('campuses')}
        onSelectSnack={(snack) => {
          setSelectedSnack(snack);
          setSelectedSlot(null);
          setRoute('snack-detail');
        }}
      />
    );
  }

  if (route === 'snack-detail' && selectedSnack) {
    return (
      <SnackDetailScreen
        snack={selectedSnack}
        onBack={() => setRoute('snacks')}
        onViewCart={() => setRoute('cart')}
        onViewSlots={(snack) => {
          setSelectedSnack(snack);
          setSelectedSlot(null);
          setRoute('slots');
        }}
      />
    );
  }

  if (route === 'cart') {
    return (
      <CartScreen
        onBack={() => setRoute(selectedSnack ? 'snack-detail' : 'home')}
        onBrowseCampuses={() => setRoute('campuses')}
        onChooseSlot={() => {
          setRoute('slots');
        }}
      />
    );
  }

  if (route === 'slots') {
    const slotSnack = selectedSnack ?? cartState.snack;

    if (!slotSnack) {
      return (
        <CartScreen
          onBack={() => setRoute('home')}
          onBrowseCampuses={() => setRoute('campuses')}
          onChooseSlot={() => setRoute('slots')}
        />
      );
    }

    return (
      <SlotsScreen
        snack={slotSnack}
        onBack={() => setRoute(cartState.items.length > 0 ? 'cart' : 'snack-detail')}
        onSelectSlot={(slot) => {
          setSelectedSlot(slot);
          setRoute('checkout');
        }}
      />
    );
  }

  if (route === 'checkout') {
    return (
      <CheckoutScreen
        selectedSlot={selectedSlot}
        onBack={() => setRoute('cart')}
        onChooseSlot={() => setRoute('slots')}
        onOrderPaid={(order) => {
          setConfirmedOrder(order);
          setDetailOrderId(order.id);
          setSelectedSlot(null);
          setRoute('confirmation');
        }}
      />
    );
  }

  if (route === 'confirmation' && confirmedOrder) {
    return (
      <OrderConfirmationScreen
        order={confirmedOrder}
        onGoHome={() => setRoute('home')}
        onViewDetail={(orderId) => {
          setDetailOrderId(orderId);
          setRoute('order-detail');
        }}
      />
    );
  }

  if (route === 'order-detail' && detailOrderId) {
    return (
      <OrderDetailScreen
        orderId={detailOrderId}
        onBack={() => setRoute(confirmedOrder ? 'confirmation' : 'home')}
      />
    );
  }

  return (
    <HomeScreen
      onBrowseCampuses={() => {
        setRoute('campuses');
      }}
      onViewCart={() => setRoute('cart')}
    />
  );
}
