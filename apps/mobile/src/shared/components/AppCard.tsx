import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type AppCardProps = {
  children: ReactNode;
};

export function AppCard({ children }: AppCardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 16,
    backgroundColor: '#ffffff',
    borderColor: '#d7d8d1',
    borderRadius: 8,
    borderWidth: 1
  }
});
