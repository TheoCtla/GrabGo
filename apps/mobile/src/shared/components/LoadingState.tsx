import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Chargement en cours...' }: LoadingStateProps) {
  return (
    <View accessibilityRole="progressbar" style={styles.state}>
      <ActivityIndicator color="#1f7a5c" />
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
    color: '#33443c'
  }
});
