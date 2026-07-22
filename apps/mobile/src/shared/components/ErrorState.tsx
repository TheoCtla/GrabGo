import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { mobileColors } from '../theme/colors';

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
    color: mobileColors.dark
  },
  state: {
    gap: 10,
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
