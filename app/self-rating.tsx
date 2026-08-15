import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { SELF_TRAITS } from '@/constants/traits';
import { GradientButton } from '@/components/GradientButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELF_SCORES_KEY = 'perception_self_scores_temp';

export default function SelfRatingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    SELF_TRAITS.forEach(t => { init[t.key] = 5; });
    return init;
  });
  const [timeLeft, setTimeLeft] = useState(50);

  const emojiScale = useRef(new Animated.Value(0.85)).current;
  const emojiOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    emojiScale.setValue(0.85);
    emojiOpacity.setValue(0);
    contentOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(emojiScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
      Animated.timing(emojiOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    animateIn();
  }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const trait = SELF_TRAITS[currentIndex];
  const currentScore = scores[trait.key];

  const handleSliderChange = (value: number) => {
    const rounded = Math.round(value);
    if (rounded !== scores[trait.key]) {
      console.log('[self-rating] slider change', trait.key, rounded);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScores(prev => ({ ...prev, [trait.key]: rounded }));
    }
  };

  const handleNext = async () => {
    console.log('[self-rating] next pressed', currentIndex, trait.key, currentScore);
    if (currentIndex < SELF_TRAITS.length - 1) {
      Animated.parallel([
        Animated.timing(emojiOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex(i => i + 1);
      });
    } else {
      console.log('[self-rating] lock it in', scores);
      await AsyncStorage.setItem(SELF_SCORES_KEY, JSON.stringify(scores));
      router.push('/locked-in');
    }
  };

  const isLast = currentIndex === SELF_TRAITS.length - 1;
  const buttonLabel = isLast ? 'Lock It In →' : 'Next →';
  const remaining = Math.max(0, timeLeft);
  const scoreDisplay = String(currentScore);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {SELF_TRAITS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              { backgroundColor: i <= currentIndex ? COLORS.self : COLORS.surface2 },
            ]}
          />
        ))}
      </View>

      {/* Counter */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>{currentIndex + 1} of 10</Text>
        <Text style={styles.timerText}>~{remaining}s left</Text>
      </View>

      {/* Emoji */}
      <Animated.Text
        style={[
          styles.emoji,
          { opacity: emojiOpacity, transform: [{ scale: emojiScale }] },
        ]}
      >
        {trait.emoji}
      </Animated.Text>

      {/* Question */}
      <Animated.View style={{ opacity: contentOpacity }}>
        <Text style={styles.question}>{trait.question}</Text>
      </Animated.View>

      {/* Score display */}
      <Animated.View style={[styles.scoreContainer, { opacity: contentOpacity }]}>
        <Text style={styles.scoreText}>{scoreDisplay}</Text>
      </Animated.View>

      {/* Slider */}
      <Animated.View style={[styles.sliderContainer, { opacity: contentOpacity }]}>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={currentScore}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={COLORS.self}
          maximumTrackTintColor={COLORS.surface2}
          thumbTintColor={COLORS.self}
        />
        <View style={styles.anchors}>
          <Text style={styles.anchorText}>{trait.lo}</Text>
          <Text style={styles.anchorText}>{trait.hi}</Text>
        </View>
      </Animated.View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <GradientButton label={buttonLabel} onPress={handleNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  counterText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.muted,
  },
  timerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.muted,
  },
  emoji: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 20,
  },
  question: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 25,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 31,
    marginBottom: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 48,
    color: COLORS.self,
  },
  sliderContainer: {
    marginBottom: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  anchors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  anchorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.muted,
    maxWidth: '45%',
  },
  ctaContainer: {
    marginTop: 24,
  },
});
