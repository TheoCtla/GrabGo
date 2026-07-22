import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { mobileColors } from '../theme/colors';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  stickyHeaderIndices?: number[];
};

export function Screen({ children, scroll = true, stickyHeaderIndices }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={stickyHeaderIndices}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mobileColors.dark
  },
  content: {
    backgroundColor: mobileColors.dark,
    gap: 16,
    padding: 20
  }
});
