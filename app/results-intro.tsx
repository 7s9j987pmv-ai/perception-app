import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { loadProfile, loadAggregatedResults } from '@/utils/storage';
import { mapApiResults } from '@/utils/api';

const RESULTS_CACHE_KEY = 'perception_results_cache';

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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const line1Anim = useFadeUp(0);
  const line2Anim = useFadeUp(1300);
  const line3Anim = useFadeUp(2500);
  const ctaAnim = useFadeUp(3600);

  useEffect(() => {
    const load = async () => {
      console.log('[results-intro] loading data from Supabase');
      const profile = await loadProfile();
      if (!profile) {
        console.warn('[results-intro] no profile, redirecting to home');
        router.replace('/');
        return;
      }

      const data = await loadAggregatedResults(profile.code);
      if (!data) {
        console.warn('[results-intro] no results or insufficient responses, redirecting to invite');
        router.replace('/invite');
        return;
      }

      const { results: apiResults, profile: apiProfile } = data;

      if (!apiResults) {
        console.warn('[results-intro] empty results, redirecting to invite');
        router.replace('/invite');
        return;
      }

      console.log('[results-intro] results loaded, response count', apiResults.responseCount);
      setResponseCount(apiResults.responseCount ?? 0);

      // Map API results to local PerceptionResults type and cache
      try {
        const mapped = mapApiResults(apiResults, profile);
        await AsyncStorage.setItem(RESULTS_CACHE_KEY, JSON.stringify(mapped));
        console.log('[results-intro] results cached to AsyncStorage');
      } catch (e) {
        console.warn('[results-intro] failed to cache results', e);
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleReveal = () => {
    console.log('[results-intro] reveal pressed');
    router.push('/blind-spot-guess');
  };

  const countText = String(responseCount);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Calculating your perception…</Text>
      </View>
    );
  }

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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.muted,
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
