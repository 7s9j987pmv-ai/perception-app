import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PerceptionResults, TraitResult } from '@/types/perception';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RESULTS_CACHE_KEY = 'perception_results_cache';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BlindSpotGuessScreen() {
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<PerceptionResults | null>(null);
  const [options, setOptions] = useState<TraitResult[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState('');
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      console.log('[blind-spot-guess] loading results from cache');
      const cached = await AsyncStorage.getItem(RESULTS_CACHE_KEY);
      if (!cached) {
        console.warn('[blind-spot-guess] no cached results, redirecting to results-intro');
        router.replace('/results-intro');
        return;
      }
      const r: PerceptionResults = JSON.parse(cached);
      setResults(r);

      // Build 4 options: blind spot + 3 random others
      const others = r.traitResults
        .filter(t => t.trait.key !== r.blindSpot.trait.key)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      setOptions(shuffle([r.blindSpot, ...others]));
    };
    load();
  }, []);

  const handleSelect = (traitKey: string) => {
    if (revealed) return;
    console.log('[blind-spot-guess] option selected', traitKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(traitKey);
    setRevealed(true);
    const isCorrect = traitKey === results?.blindSpot.trait.key;
    setMessage(isCorrect ? 'You called it. 🎯' : 'It was actually…');
    Animated.timing(ctaOpacity, { toValue: 1, duration: 400, delay: 600, useNativeDriver: true }).start();
  };

  const handleSeeBlindSpot = () => {
    console.log('[blind-spot-guess] see blind spot pressed');
    router.push('/blind-spot-reveal');
  };

  if (!results) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Calculating…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Text style={styles.question}>
        What trait do you think people saw most differently?
      </Text>

      <View style={styles.optionsContainer}>
        {options.map(option => {
          const isSelected = selected === option.trait.key;
          const isBlindSpot = option.trait.key === results.blindSpot.trait.key;
          let bgColor = COLORS.surface;
          let borderColor = COLORS.border;
          let textColor = COLORS.text;

          if (revealed) {
            if (isBlindSpot) {
              bgColor = 'rgba(255,107,92,0.15)';
              borderColor = COLORS.self;
            } else if (isSelected && !isBlindSpot) {
              bgColor = 'rgba(239,68,68,0.15)';
              borderColor = '#EF4444';
            }
          }

          return (
            <AnimatedPressable
              key={option.trait.key}
              onPress={() => handleSelect(option.trait.key)}
              disabled={revealed}
              style={[styles.option, { backgroundColor: bgColor, borderColor }]}
            >
              <Text style={styles.optionEmoji}>{option.trait.emoji}</Text>
              <Text style={[styles.optionLabel, { color: textColor }]}>{option.trait.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {revealed && (
        <Text style={styles.message}>{message}</Text>
      )}

      <Animated.View style={{ opacity: ctaOpacity }}>
        <GradientButton label="See My Blind Spot →" onPress={handleSeeBlindSpot} />
      </Animated.View>
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
    gap: 16,
  },
  question: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: COLORS.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: COLORS.text,
  },
  message: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginVertical: 8,
  },
});
