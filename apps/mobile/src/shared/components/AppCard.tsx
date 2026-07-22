import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { mobileColors } from '../theme/colors';

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
    backgroundColor: mobileColors.light,
    borderColor: mobileColors.accent,
    borderRadius: 8,
    borderWidth: 1
  }
});
