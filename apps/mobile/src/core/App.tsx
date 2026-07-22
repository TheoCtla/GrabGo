import { StatusBar } from 'expo-status-bar';
import { AppProviders } from './providers';
import { AppNavigation } from './navigation';

export function App() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <AppNavigation />
    </AppProviders>
  );
}
