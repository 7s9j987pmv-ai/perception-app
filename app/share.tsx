import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { loadProfile } from '@/utils/storage';
import { getBlindSpotInsight } from '@/utils/insights';
import { PerceptionResults, Profile } from '@/types/perception';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RESULTS_KEY = 'perception_results_cache';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 260;
const CARD_HEIGHT = Math.round(CARD_WIDTH * (16 / 9));

interface MiniBarProps {
  selfScore: number;
  otherScore: number;
  label: string;
}

function MiniBar({ selfScore, otherScore, label }: MiniBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const selfPx = trackWidth > 0 ? ((selfScore - 1) / 9) * trackWidth : 0;
  const otherPx = trackWidth > 0 ? ((otherScore - 1) / 9) * trackWidth : 0;
  return (
    <View style={miniStyles.container}>
      <Text style={miniStyles.label}>{label}</Text>
      <View style={miniStyles.track} onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}>
        {trackWidth > 0 && (
          <>
            <View style={[miniStyles.selfDot, { left: selfPx - 4 }]} />
            <View style={[miniStyles.otherDot, { left: otherPx - 4 }]} />
          </>
        )}
      </View>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  container: { marginBottom: 8 },
  label: { fontFamily: 'Inter_400Regular', fontSize: 10, color: COLORS.muted, marginBottom: 4 },
  track: { height: 4, backgroundColor: COLORS.surface2, borderRadius: 2, position: 'relative' },
  selfDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.self, top: -2, marginLeft: -4 },
  otherDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.others, top: -2, marginLeft: -4 },
});

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<PerceptionResults | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      console.log('[share] loading data');
      const p = await loadProfile();
      if (p) setProfile(p);
      const cached = await AsyncStorage.getItem(RESULTS_KEY);
      if (cached) setResults(JSON.parse(cached));
    };
    load();
  }, []);

  const handleShare = async () => {
    if (!profile || !results) return;
    const url = `perception://rate/${profile.code}`;
    const avgGapDisplay = results.avgGap.toFixed(1);
    console.log('[share] share to story pressed', url);
    try {
      await Share.share({
        message: `My Perception Gap is ${avgGapDisplay} — do people see you the way you see yourself? Find out: ${url}`,
        url,
      });
    } catch (e) {
      console.warn('[share] share error', e);
    }
  };

  if (!results || !profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const blindSpotInsight = getBlindSpotInsight(results.blindSpot.trait.key, results.blindSpot.diff);
  const top4 = [...results.traitResults].sort((a, b) => b.absDiff - a.absDiff).slice(0, 4);
  const avgGapPct = Math.round(results.avgGap * 10);
  const avgGapDisplay = String(avgGapPct) + '%';
  const selfScoreDisplay = String(results.blindSpot.selfScore);
  const otherScoreDisplay = results.blindSpot.avgOtherScore.toFixed(1);
  const selfPct = Math.round(((results.blindSpot.selfScore - 1) / 9) * 100);
  const otherPct = Math.round(((results.blindSpot.avgOtherScore - 1) / 9) * 100);
  const selfPctDisplay = String(selfPct) + '%';
  const otherPctDisplay = String(otherPct) + '%';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>Pick your card</Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.cardsContainer}
        onScroll={e => {
          const x = e.nativeEvent.contentOffset.x;
          const idx = Math.round(x / (CARD_WIDTH + 16));
          setActiveCard(idx);
        }}
        scrollEventThrottle={16}
      >
        {/* Card 1 — Blind Spot */}
        <LinearGradient
          colors={['#241f42', COLORS.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.cardLogo}>PERCEPTION</Text>
          <Text style={styles.cardChip}>BLIND SPOT</Text>
          <Text style={styles.cardSubtitle}>{profile.name}'s biggest blind spot</Text>
          <Text style={styles.cardTraitBig}>
            {results.blindSpot.trait.emoji}
            {' '}
            {results.blindSpot.trait.label.toUpperCase()}
          </Text>
          <View style={styles.cardMiniRow}>
            <View style={styles.cardMiniStat}>
              <Text style={styles.cardMiniLabel}>Me</Text>
              <Text style={[styles.cardMiniValue, { color: COLORS.self }]}>{selfScoreDisplay}/10</Text>
            </View>
            <View style={styles.cardMiniStat}>
              <Text style={styles.cardMiniLabel}>Them</Text>
              <Text style={[styles.cardMiniValue, { color: COLORS.others }]}>{otherScoreDisplay}/10</Text>
            </View>
          </View>
          {blindSpotInsight ? (
            <Text style={styles.cardInsight}>Apparently {blindSpotInsight}. {results.blindSpot.trait.emoji}</Text>
          ) : null}
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterQ}>Do people see YOU the way you think?</Text>
            <Text style={styles.cardFooterBrand}>PERCEPTION</Text>
          </View>
        </LinearGradient>

        {/* Card 2 — Full Gap */}
        <LinearGradient
          colors={['#241f42', COLORS.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.cardLogo}>PERCEPTION</Text>
          <Text style={styles.cardChip}>FULL GAP</Text>
          <Text style={styles.cardSubtitle}>{profile.name}'s perception gap</Text>
          <Text style={styles.cardSectionTitle}>Where they were most surprised</Text>
          {top4.map(tr => (
            <MiniBar
              key={tr.trait.key}
              label={tr.trait.label}
              selfScore={tr.selfScore}
              otherScore={tr.avgOtherScore}
            />
          ))}
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterQ}>Do people see YOU the way you think?</Text>
            <Text style={styles.cardFooterBrand}>PERCEPTION</Text>
          </View>
        </LinearGradient>

        {/* Card 3 — Challenge */}
        <LinearGradient
          colors={['#241f42', COLORS.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.cardLogo}>PERCEPTION</Text>
          <Text style={styles.cardChip}>CHALLENGE</Text>
          <Text style={styles.cardSubtitle}>Do you actually know how people see you?</Text>
          <Text style={styles.cardChallengeSubtitle}>{profile.name}'s perception gap</Text>
          <Text style={styles.cardBigNumber}>{avgGapDisplay}</Text>
          <Text style={styles.cardBeatMine}>Beat mine 👀</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterQ}>Find your own Perception Gap</Text>
            <Text style={styles.cardFooterBrand}>PERCEPTION</Text>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Dot pagination */}
      <View style={styles.pagination}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.pageDot,
              { backgroundColor: i === activeCard ? COLORS.text : COLORS.faint },
            ]}
          />
        ))}
      </View>

      <GradientButton label="Share to Story" onPress={handleShare} style={styles.shareBtn} />
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
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 20,
  },
  cardsContainer: {
    paddingRight: 24,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'flex-start',
  },
  cardLogo: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: COLORS.faint,
    letterSpacing: 2,
    marginBottom: 16,
  },
  cardChip: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  cardTraitBig: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 16,
  },
  cardMiniRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  cardMiniStat: {
    gap: 2,
  },
  cardMiniLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLORS.muted,
  },
  cardMiniValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
  },
  cardInsight: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
    flex: 1,
  },
  cardSectionTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 12,
  },
  cardChallengeSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 16,
  },
  cardBigNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 72,
    color: COLORS.self,
    lineHeight: 76,
    marginBottom: 8,
  },
  cardBeatMine: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: COLORS.text,
    flex: 1,
  },
  cardFooter: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 2,
  },
  cardFooterQ: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: COLORS.muted,
  },
  cardFooterBrand: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: COLORS.faint,
    letterSpacing: 1.5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 20,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shareBtn: {},
});
