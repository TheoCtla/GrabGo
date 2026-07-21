import { Pressable, StyleSheet, Text } from 'react-native';

type AppButtonProps = {
  label: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  onPress: () => void;
};

export function AppButton({
  accessibilityLabel,
  disabled = false,
  isLoading = false,
  label,
  onPress,
  variant = 'primary'
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;

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
        pressed ? styles.pressed : null
      ]}
    >
      <Text
        style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}
      >
        {isLoading ? 'Chargement...' : label}
      </Text>
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
    backgroundColor: 'transparent',
    borderColor: '#9bc4b4'
  },
  label: {
    fontSize: 16,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.82
  },
  primary: {
    backgroundColor: '#1f7a5c',
    borderColor: '#1f7a5c'
  },
  primaryLabel: {
    color: '#ffffff'
  },
  secondary: {
    backgroundColor: '#e8f3ee',
    borderColor: '#9bc4b4'
  },
  secondaryLabel: {
    color: '#1f4d3f'
  }
});
