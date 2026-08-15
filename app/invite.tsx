import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Share,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { loadProfile, loadResponses } from '@/utils/storage';
import { Profile, Response } from '@/types/perception';

const DISPLAY_URL = (code: string) => `perception.app/rate/${code}`;
const SHARE_URL = (code: string) => `perception://rate/${code}`;

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [copied, setCopied] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotScales = useRef([
    new Animated.Value(0.85),
    new Animated.Value(0.85),
    new Animated.Value(0.85),
  ]).current;

  const prevResponseCount = useRef(0);

  const loadData = useCallback(async () => {
    const p = await loadProfile();
    if (!p) return;
    setProfile(p);
    const r = await loadResponses(p.code);
    setResponses(r);

    // Animate new dot fills
    if (r.length > prevResponseCount.current) {
      for (let i = prevResponseCount.current; i < Math.min(r.length, 3); i++) {
        Animated.spring(dotScales[i], {
          toValue: 1.0,
          useNativeDriver: true,
          speed: 15,
          bounciness: 8,
        }).start();
      }
      prevResponseCount.current = r.length;
    }

    // Animate progress bar
    const pct = Math.min(r.length / 3, 1);
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      console.log('[invite] polling for responses');
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCopy = async () => {
    if (!profile) return;
    const url = DISPLAY_URL(profile.code);
    console.log('[invite] copy link pressed', url);
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!profile) return;
    const url = SHARE_URL(profile.code);
    console.log('[invite] share pressed', url);
    try {
      await Share.share({
        message: `Rate me on Perception 👀 — ${url}`,
        url,
      });
    } catch (e) {
      console.warn('[invite] share error', e);
    }
  };

  const handleReveal = () => {
    console.log('[invite] reveal pressed', responses.length);
    router.push('/results-intro');
  };

  const responseCount = responses.length;

  const headlineText = responseCount === 0
    ? '3 people stand between you and your Perception Gap.'
    : responseCount === 1
    ? '1 down. 2 to go.'
    : responseCount === 2
    ? 'One more person and the truth comes out 👀'
    : "It's unlocked. 🔓";

  const subtextContent = responseCount === 0
    ? 'Still waiting… apparently your friends have jobs.'
    : responseCount === 1
    ? 'Someone already spilled. Keep going.'
    : responseCount === 2
    ? 'So close. Send it to one more.'
    : 'Your Perception Gap is ready.';

  const canReveal = responseCount >= 3;
  const displayUrl = profile ? DISPLAY_URL(profile.code) : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      {/* Response dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map(i => {
          const isFilled = i < responseCount;
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { transform: [{ scale: dotScales[i] }] },
              ]}
            >
              {isFilled ? (
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dotInner}
                />
              ) : (
                <View style={[styles.dotInner, styles.dotEmpty]} />
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Headline */}
      <Text style={styles.headline}>{headlineText}</Text>
      <Text style={styles.subtext}>{subtextContent}</Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Invite link box */}
      <View style={styles.linkBox}>
        <Text style={styles.linkText} numberOfLines={1}>{displayUrl}</Text>
        <AnimatedPressable
          onPress={handleCopy}
          style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
        >
          <Text style={styles.copyBtnText}>{copied ? 'Copied ✓' : 'Copy'}</Text>
        </AnimatedPressable>
      </View>

      {/* Share button */}
      <GradientButton label="Send My Link →" onPress={handleShare} style={styles.shareBtn} />

      {/* Reveal button */}
      <View style={styles.revealContainer}>
        <GradientButton
          label="Reveal My Perception →"
          onPress={handleReveal}
          disabled={!canReveal}
        />
        {!canReveal && (
          <Text style={styles.unlockLabel}>Unlocks at 3 responses</Text>
        )}
      </View>

      {/* Privacy note */}
      <Text style={styles.privacy}>
        Responses are anonymous. Individual answers are never shown.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
  },
  dot: {
    width: 18,
    height: 18,
  },
  dotInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dotEmpty: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  headline: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#B3AECF',
  },
  copyBtn: {
    backgroundColor: COLORS.others,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyBtnSuccess: {
    backgroundColor: COLORS.success,
  },
  copyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: COLORS.bg,
  },
  shareBtn: {
    marginBottom: 12,
  },
  revealContainer: {
    marginBottom: 16,
    gap: 8,
  },
  unlockLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.faint,
    textAlign: 'center',
  },
  privacy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.faint,
    textAlign: 'center',
    marginTop: 'auto',
  },
});
