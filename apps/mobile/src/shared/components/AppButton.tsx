import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { mobileColors } from '../theme/colors';

type AppButtonProps = {
  label: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'ghost';
  onPress: () => void;
};

export function AppButton({
  accessibilityLabel,
  disabled = false,
  isLoading = false,
  label,
  onPress,
  style,
  variant = 'primary'
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;
  const labelStyle =
    variant === 'primary'
      ? styles.primaryLabel
      : variant === 'secondary'
        ? styles.secondaryLabel
        : styles.ghostLabel;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        isDisabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
        style
      ]}
    >
      <Text style={[styles.label, labelStyle]}>{isLoading ? 'Chargement...' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  disabled: {
    opacity: 0.6
  },
  ghost: {
    backgroundColor: mobileColors.dark,
    borderColor: mobileColors.accent
  },
  ghostLabel: {
    color: mobileColors.light
  },
  label: {
    fontSize: 16,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.82
  },
  primary: {
    backgroundColor: mobileColors.accent,
    borderColor: mobileColors.accent
  },
  primaryLabel: {
    color: mobileColors.dark
  },
  secondary: {
    backgroundColor: mobileColors.light,
    borderColor: mobileColors.accent
  },
  secondaryLabel: {
    color: mobileColors.dark
  }
});
