import { StyleSheet, Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.state}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    color: '#5f6c65'
  },
  state: {
    gap: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderColor: '#d7d8d1',
    borderRadius: 8,
    borderWidth: 1
  },
  title: {
    color: '#17201b',
    fontSize: 18,
    fontWeight: '800'
  }
});
