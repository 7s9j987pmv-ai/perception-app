import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { loadProfileByCode, saveResponse } from '@/utils/storage';
import { TRAITS } from '@/constants/traits';
import { PublicProfile } from '@/utils/api';

type RateStep = 'intro' | 'rating';

export default function RateScreen() {
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [step, setStep] = useState<RateStep>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    TRAITS.forEach(t => { init[t.key] = 5; });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const emojiScale = useRef(new Animated.Value(0.85)).current;
  const emojiOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!code) return;
    console.log('[rate] loading profile for code', code);
    setLoadingProfile(true);
    loadProfileByCode(code).then(p => {
      if (!p) {
        console.warn('[rate] profile not found for code', code);
        setNotFound(true);
      } else {
        console.log('[rate] profile loaded', p.name);
        setProfile(p);
      }
      setLoadingProfile(false);
    });
  }, [code]);

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
    if (step === 'rating') animateIn();
  }, [currentIndex, step]);

  const handleStartRating = () => {
    console.log('[rate] start rating pressed for', profile?.name);
    setStep('rating');
    animateIn();
  };

  const handleSliderChange = (value: number) => {
    const rounded = Math.round(value);
    const trait = TRAITS[currentIndex];
    if (rounded !== scores[trait.key]) {
      console.log('[rate] slider change', trait.key, rounded);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScores(prev => ({ ...prev, [trait.key]: rounded }));
    }
  };

  const handleNext = async () => {
    const trait = TRAITS[currentIndex];
    console.log('[rate] next pressed', currentIndex, trait.key, scores[trait.key]);
    if (currentIndex < TRAITS.length - 1) {
      Animated.parallel([
        Animated.timing(emojiOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex(i => i + 1);
      });
    } else {
      // Submit
      console.log('[rate] submitting scores to Supabase', code, scores);
      setSubmitting(true);
      try {
        const result = await saveResponse(code!, scores);
        if (result.error) {
          // 429 / already submitted — show friendly message and still navigate
          const isAlreadyRated =
            result.error.toLowerCase().includes('already') ||
            result.error.toLowerCase().includes('429') ||
            result.error.toLowerCase().includes('duplicate');
          if (isAlreadyRated) {
            console.log('[rate] already rated, navigating to rate-complete');
            setAlreadyRated(true);
          } else {
            console.error('[rate] submit error', result.error);
          }
        } else {
          console.log('[rate] response submitted, count', result.responseCount);
        }
        router.replace('/rate-complete');
      } catch (e) {
        console.error('[rate] submit exception', e);
        router.replace('/rate-complete');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loadingProfile) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.loadingEmoji}>👀</Text>
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.notFoundEmoji}>🔍</Text>
        <Text style={styles.notFoundTitle}>Link not found or expired</Text>
        <Text style={styles.notFoundSub}>Double-check the link and try again.</Text>
        <GradientButton label="Find Out →" onPress={() => router.replace('/')} style={styles.notFoundBtn} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (step === 'intro') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={[
          styles.introContent,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <Text style={styles.introAvatar}>{profile.avatar}</Text>
        <Text style={styles.introHeader}>{profile.name}'s profile</Text>
        <Text style={styles.introEyeball}>👀 {profile.name} wants your honest opinion.</Text>
        <Text style={styles.introQuestion}>How do you see them?</Text>
        <Text style={styles.introPrivacy}>
          🔒 {profile.name} won't see your individual answers. Takes about 30 seconds.
        </Text>
        <GradientButton label={`Rate ${profile.name} →`} onPress={handleStartRating} />
      </ScrollView>
    );
  }

  const trait = TRAITS[currentIndex];
  const question = trait.question.replace('{name}', profile.name);
  const currentScore = scores[trait.key];
  const isLast = currentIndex === TRAITS.length - 1;
  const buttonLabel = isLast ? 'Submit →' : 'Next →';
  const scoreDisplay = String(currentScore);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {TRAITS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              { backgroundColor: i <= currentIndex ? COLORS.others : COLORS.surface2 },
            ]}
          />
        ))}
      </View>

      <View style={styles.counterRow}>
        <Text style={styles.counterText}>{currentIndex + 1} of 10</Text>
        <Text style={styles.ratingFor}>Rating {profile.name}</Text>
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
        <Text style={styles.question}>{question}</Text>
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
          minimumTrackTintColor={COLORS.others}
          maximumTrackTintColor={COLORS.surface2}
          thumbTintColor={COLORS.others}
        />
        <View style={styles.anchors}>
          <Text style={styles.anchorText}>{trait.lo}</Text>
          <Text style={styles.anchorText}>{trait.hi}</Text>
        </View>
      </Animated.View>

      <View style={styles.ctaContainer}>
        <GradientButton label={buttonLabel} onPress={handleNext} loading={submitting} />
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.muted,
  },
  notFoundEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  notFoundTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  notFoundSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
  },
  notFoundBtn: {
    width: 200,
  },
  introContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  introAvatar: {
    fontSize: 64,
    marginBottom: 12,
  },
  introHeader: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 20,
  },
  introEyeball: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 8,
  },
  introQuestion: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  introPrivacy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
    lineHeight: 20,
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
  ratingFor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.others,
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
    color: COLORS.others,
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
