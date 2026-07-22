import { StyleSheet, Text, View } from 'react-native';
import { mobileColors } from '../theme/colors';

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
    color: mobileColors.dark
  },
  state: {
    gap: 8,
    padding: 16,
    backgroundColor: mobileColors.light,
    borderColor: mobileColors.accent,
    borderRadius: 8,
    borderWidth: 1
  },
  title: {
    color: mobileColors.dark,
    fontSize: 18,
    fontWeight: '800'
  }
});
