import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';

type ErrorStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({ actionLabel, message, onAction, title }: ErrorStateProps) {
  return (
    <View accessibilityRole="alert" style={styles.state}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    color: '#5f6c65'
  },
  state: {
    gap: 10,
    padding: 16,
    backgroundColor: '#fff7f5',
    borderColor: '#f0b5aa',
    borderRadius: 8,
    borderWidth: 1
  },
  title: {
    color: '#8a2417',
    fontSize: 18,
    fontWeight: '800'
  }
});
