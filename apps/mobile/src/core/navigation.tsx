import { useState } from 'react';
import { useAuth } from '../shared/auth/auth-context';
import { LoadingState } from '../shared/components/LoadingState';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { CampusesScreen } from '../features/catalog/screens/CampusesScreen';
import { SnacksScreen } from '../features/catalog/screens/SnacksScreen';
import { SnackDetailScreen } from '../features/catalog/screens/SnackDetailScreen';
import { SlotsScreen } from '../features/catalog/screens/SlotsScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { Campus, Snack } from '../features/catalog/types';

type MobileRoute = 'home' | 'campuses' | 'snacks' | 'snack-detail' | 'slots';

export function AppNavigation() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [route, setRoute] = useState<MobileRoute>('home');
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);

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
        onViewSlots={(snack) => {
          setSelectedSnack(snack);
          setRoute('slots');
        }}
      />
    );
  }

  if (route === 'slots' && selectedSnack) {
    return <SlotsScreen snack={selectedSnack} onBack={() => setRoute('snack-detail')} />;
  }

  return (
    <HomeScreen
      onBrowseCampuses={() => {
        setRoute('campuses');
      }}
    />
  );
}
