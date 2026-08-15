import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { loadProfile, loadResponses } from '@/utils/storage';

function useFadeUp(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

export default function ResultsIntroScreen() {
  const insets = useSafeAreaInsets();
  const [responseCount, setResponseCount] = useState(0);

  const line1Anim = useFadeUp(0);
  const line2Anim = useFadeUp(1300);
  const line3Anim = useFadeUp(2500);
  const ctaAnim = useFadeUp(3600);

  useEffect(() => {
    const load = async () => {
      console.log('[results-intro] loading data');
      const profile = await loadProfile();
      if (!profile) {
        router.replace('/');
        return;
      }
      const responses = await loadResponses(profile.code);
      if (responses.length < 3) {
        console.warn('[results-intro] not enough responses, redirecting');
        router.replace('/invite');
        return;
      }
      setResponseCount(responses.length);
    };
    load();
  }, []);

  const handleReveal = () => {
    console.log('[results-intro] reveal pressed');
    router.push('/blind-spot-guess');
  };

  const countText = String(responseCount);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.line1, line1Anim]}>
          {countText}
          {' people answered.'}
        </Animated.Text>

        <Animated.Text style={[styles.line2, line2Anim]}>
          You were right about some things.
        </Animated.Text>

        <Animated.Text style={[styles.line3, line3Anim]}>
          Others… not so much.
        </Animated.Text>
      </View>

      <Animated.View style={ctaAnim}>
        <GradientButton label="Reveal My Perception →" onPress={handleReveal} />
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
    gap: 24,
  },
  line1: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    color: COLORS.text,
    textAlign: 'center',
  },
  line2: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    color: COLORS.muted,
    textAlign: 'center',
  },
  line3: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    color: COLORS.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
