import React from 'react';
import { Text, ActivityIndicator, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { COLORS } from '@/constants/Colors';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({ label, onPress, disabled, loading, style }: GradientButtonProps) {
  return (
    <AnimatedPressable onPress={onPress} disabled={disabled || loading} style={style}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.bg} size="small" />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowColor: COLORS.others,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 17,
    color: COLORS.bg,
    letterSpacing: 0.2,
  },
});
