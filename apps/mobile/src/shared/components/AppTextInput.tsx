import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { mobileColors } from '../theme/colors';

type AppTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppTextInput({ error, label, style, ...props }: AppTextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={mobileColors.light}
        {...props}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    color: mobileColors.light,
    fontWeight: '700'
  },
  field: {
    gap: 6
  },
  input: {
    backgroundColor: mobileColors.dark,
    borderColor: mobileColors.light,
    borderRadius: 8,
    borderWidth: 1,
    color: mobileColors.light,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  inputError: {
    borderColor: mobileColors.accent
  },
  label: {
    color: mobileColors.light,
    fontWeight: '700'
  }
});
