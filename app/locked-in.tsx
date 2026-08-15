import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';

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

function usePopIn(delay: number) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 15, bounciness: 10, delay }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return { opacity, transform: [{ scale }] };
}

export default function LockedInScreen() {
  const insets = useSafeAreaInsets();
  const emojiAnim = usePopIn(0);
  const titleAnim = useFadeUp(150);
  const sub1Anim = useFadeUp(500);
  const sub2Anim = useFadeUp(900);
  const ctaAnim = useFadeUp(1300);

  const handleContinue = () => {
    console.log('[locked-in] Continue pressed');
    router.push('/profile-create');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.emoji, emojiAnim]}>🔒</Animated.Text>

        <Animated.Text style={[styles.title, titleAnim]}>
          Your self-perception is locked in.
        </Animated.Text>

        <Animated.Text style={[styles.sub, sub1Anim]}>
          Now comes the interesting part.
        </Animated.Text>

        <Animated.Text style={[styles.sub, sub2Anim]}>
          Let's see if they agree. 👀
        </Animated.Text>
      </View>

      <Animated.View style={[styles.ctaContainer, ctaAnim]}>
        <GradientButton label="Continue →" onPress={handleContinue} />
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
    alignItems: 'center',
    gap: 20,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 26,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
  ctaContainer: {
    paddingBottom: 8,
  },
});
