import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { getBlindSpotInsight } from '@/utils/insights';
import { PerceptionResults } from '@/types/perception';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RESULTS_CACHE_KEY = 'perception_results_cache';

function useCountUp(target: number, duration: number = 900) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();
    anim.addListener(({ value }) => {
      setDisplay(Math.round(value * 10) / 10);
    });
    return () => anim.removeAllListeners();
  }, [target]);

  return display;
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

export default function BlindSpotRevealScreen() {
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<PerceptionResults | null>(null);
  const emojiAnim = usePopIn(0);

  useEffect(() => {
    const load = async () => {
      console.log('[blind-spot-reveal] loading results from cache');
      const cached = await AsyncStorage.getItem(RESULTS_CACHE_KEY);
      if (cached) {
        setResults(JSON.parse(cached));
        return;
      }
      console.warn('[blind-spot-reveal] no cached results, redirecting to results-intro');
      router.replace('/results-intro');
    };
    load();
  }, []);

  const selfDisplay = useCountUp(results?.blindSpot.selfScore ?? 0);
  const otherDisplay = useCountUp(results?.blindSpot.avgOtherScore ?? 0);

  const handleSeeFullResults = () => {
    console.log('[blind-spot-reveal] see full results pressed');
    router.push('/results');
  };

  if (!results) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const { blindSpot } = results;
  const diff = blindSpot.diff;
  const absDiff = blindSpot.absDiff;
  const diffSign = diff >= 0 ? '+' : '-';
  const diffLabel = `${diffSign}${Number(absDiff).toFixed(1)} perception gap`;
  const insight = getBlindSpotInsight(blindSpot.trait.key, diff);
  const selfDisplayStr = String(selfDisplay);
  const otherDisplayStr = String(otherDisplay);
  const traitDisplay = `${blindSpot.trait.emoji} ${blindSpot.trait.label.toUpperCase()}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Animated.Text style={[styles.eyeEmoji, emojiAnim]}>👀</Animated.Text>

      <Text style={styles.label}>YOUR BIGGEST BLIND SPOT</Text>

      <Text style={styles.traitDisplay}>
        {traitDisplay}
      </Text>

      {/* Stat blocks */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>You thought</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValueSelf}>{selfDisplayStr}</Text>
            <Text style={styles.statUnit}>/10</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>They said</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValueOther}>{otherDisplayStr}</Text>
            <Text style={styles.statUnit}>/10</Text>
          </View>
        </View>
      </View>

      {/* Gap pill */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gapPill}
      >
        <Text style={styles.gapPillText}>{diffLabel}</Text>
      </LinearGradient>

      {/* Insight */}
      {insight ? (
        <Text style={styles.insight}>Apparently {insight}.</Text>
      ) : null}

      <GradientButton label="See My Full Perception →" onPress={handleSeeFullResults} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 20,
  },
  eyeEmoji: {
    fontSize: 48,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  traitDisplay: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 40,
    color: COLORS.text,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginVertical: 8,
  },
  statBlock: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.muted,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statValueSelf: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 48,
    color: COLORS.self,
    lineHeight: 52,
  },
  statValueOther: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 48,
    color: COLORS.others,
    lineHeight: 52,
  },
  statUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 8,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.border,
  },
  gapPill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  gapPillText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: COLORS.bg,
  },
  insight: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
});
