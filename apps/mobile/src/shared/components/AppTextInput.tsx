import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

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
        placeholderTextColor="#6b756e"
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
    color: '#b42318',
    fontWeight: '700'
  },
  field: {
    gap: 6
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#17201b',
    backgroundColor: '#ffffff',
    borderColor: '#aeb7b0',
    borderRadius: 8,
    borderWidth: 1
  },
  inputError: {
    borderColor: '#b42318'
  },
  label: {
    color: '#17201b',
    fontWeight: '700'
  }
});
