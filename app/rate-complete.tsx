import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';

function useFadeUp(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

export default function RateCompleteScreen() {
  const insets = useSafeAreaInsets();
  const line1Anim = useFadeUp(0);
  const line2Anim = useFadeUp(500);
  const line3Anim = useFadeUp(1000);
  const ctaAnim = useFadeUp(1600);

  const handleFindOut = () => {
    console.log('[rate-complete] Find Out pressed');
    router.replace('/');
  };

  const handleNotNow = () => {
    console.log('[rate-complete] Not right now pressed');
    router.replace('/');
  };

  const youText = 'YOU';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.line1, line1Anim]}>
          Your answers are in. 👀
        </Animated.Text>

        <Animated.Text style={[styles.line2, line2Anim]}>
          Now we're curious…
        </Animated.Text>

        <Animated.Text style={[styles.line3, line3Anim]}>
          {'Do people see '}
          <Text style={styles.youHighlight}>{youText}</Text>
          {' the way you see yourself?'}
        </Animated.Text>
      </View>

      <Animated.View style={[styles.ctaSection, ctaAnim]}>
        <GradientButton label="Find Out →" onPress={handleFindOut} />
        <AnimatedPressable onPress={handleNotNow} style={styles.notNowBtn}>
          <Text style={styles.notNowText}>Not right now</Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  line1: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
  },
  line2: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
  line3: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  youHighlight: {
    color: COLORS.self,
  },
  ctaSection: {
    gap: 12,
  },
  notNowBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  notNowText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.faint,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});
