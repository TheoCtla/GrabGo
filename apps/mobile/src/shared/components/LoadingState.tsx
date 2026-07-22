import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { mobileColors } from '../theme/colors';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Chargement en cours...' }: LoadingStateProps) {
  return (
    <View accessibilityRole="progressbar" style={styles.state}>
      <ActivityIndicator color={mobileColors.accent} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    gap: 10,
    padding: 20
  },
  text: {
    color: mobileColors.light
  }
});
