import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PerceptionDotAnimation } from '@/components/PerceptionDotAnimation';
import { loadProfile } from '@/utils/storage';

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const [hasProfile, setHasProfile] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(12)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile().then(p => {
      if (p) setHasProfile(true);
    });

    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(heroTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(subOpacity, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleFindOut = () => {
    console.log('[index] Find Out pressed');
    router.push('/self-rating');
  };

  const handleContinue = () => {
    console.log('[index] Continue pressed');
    router.push('/invite');
  };

  const youText = 'you';
  const yourselfText = 'yourself';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          />
          <Text style={styles.logoText}>Perception</Text>
        </View>

        {/* Hero */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] },
          ]}
        >
          <Text style={styles.h1}>
            {'Do people see '}
            <Text style={styles.h1Coral}>{youText}</Text>
            {' the way '}
            <Text style={styles.h1Violet}>{yourselfText}</Text>
            {'?'}
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: subOpacity }}>
          <Text style={styles.subtext}>
            You rate yourself. Your friends rate you anonymously. We show you the gap.
          </Text>
        </Animated.View>

        {/* Animated visual */}
        <Animated.View style={{ opacity: subOpacity }}>
          <PerceptionDotAnimation />
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.ctaSection, { opacity: ctaOpacity }]}>
          <GradientButton label="Find Out 👀" onPress={handleFindOut} />

          {hasProfile && (
            <AnimatedPressable onPress={handleContinue} style={styles.continueBtn}>
              <Text style={styles.continueBtnText}>Continue →</Text>
            </AnimatedPressable>
          )}

          <Text style={styles.micro}>
            No account needed to reply. Takes about a minute.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 10,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logoText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: COLORS.text,
  },
  heroSection: {
    marginBottom: 16,
  },
  h1: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    color: COLORS.text,
    lineHeight: 35,
  },
  h1Coral: {
    color: COLORS.self,
  },
  h1Violet: {
    color: COLORS.others,
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
  },
  ctaSection: {
    gap: 12,
  },
  continueBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  continueBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: COLORS.others,
  },
  micro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.faint,
    textAlign: 'center',
    marginTop: 4,
  },
});
