import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PerceptionBar } from '@/components/PerceptionBar';
import { loadProfile } from '@/utils/storage';
import { getBlindSpotInsight } from '@/utils/insights';
import { PerceptionResults, Profile } from '@/types/perception';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RESULTS_CACHE_KEY = 'perception_results_cache';

interface InsightCardProps {
  icon: string;
  title: string;
  headerColor: string;
  bgColors: string[];
  traitEmoji: string;
  traitLabel: string;
  insight: string;
}

function InsightCard({ icon, title, headerColor, bgColors, traitEmoji, traitLabel, insight }: InsightCardProps) {
  return (
    <View style={[styles.insightCard, { backgroundColor: bgColors[0], borderColor: '#3A3654' }]}>
      <Text style={[styles.insightCardTitle, { color: headerColor }]}>{icon} {title}</Text>
      <Text style={styles.insightTraitLabel}>{traitEmoji} {traitLabel}</Text>
      <Text style={styles.insightCopy}>{insight}</Text>
    </View>
  );
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<PerceptionResults | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      console.log('[results] loading results from cache');
      const p = await loadProfile();
      if (!p) { router.replace('/'); return; }
      setProfile(p);

      const cached = await AsyncStorage.getItem(RESULTS_CACHE_KEY);
      if (cached) {
        console.log('[results] loaded results from AsyncStorage cache');
        setResults(JSON.parse(cached));
        return;
      }
      // No cache — redirect to results-intro to re-fetch
      console.warn('[results] no cached results, redirecting to results-intro');
      router.replace('/results-intro');
    };
    load();
  }, []);

  const handleShare = () => {
    console.log('[results] share pressed');
    router.push('/share');
  };

  const handleAskMore = () => {
    console.log('[results] ask more pressed');
    router.push('/invite');
  };

  if (!results || !profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading your results…</Text>
      </View>
    );
  }

  const avgGapDisplay = Number(results.avgGap).toFixed(1);
  const responseCountDisplay = String(results.responseCount);
  const blindSpotInsight = getBlindSpotInsight(results.blindSpot.trait.key, results.blindSpot.diff);
  const positiveInsight = getBlindSpotInsight(results.positiveSurprise.trait.key, results.positiveSurprise.diff);
  const calledItInsight = getBlindSpotInsight(results.youCalledIt.trait.key, results.youCalledIt.diff);
  const strongestAvg = Number(results.strongestTrait.avgOtherScore).toFixed(1);
  const strongestInsight = `People consistently rate you ${strongestAvg}/10 on this.`;
  const blindSpotSelf = String(results.blindSpot.selfScore);
  const blindSpotOther = Number(results.blindSpot.avgOtherScore).toFixed(1);
  const positiveSurpriseOther = Number(results.positiveSurprise.avgOtherScore).toFixed(1);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.header}>
        {profile.avatar} {profile.name}'s Perception Gap
      </Text>
      <Text style={styles.subheader}>
        Based on {responseCountDisplay} anonymous responses
      </Text>

      {/* 3-stat grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{responseCountDisplay}</Text>
          <Text style={styles.statLabel}>RESPONSES</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{avgGapDisplay}</Text>
          <Text style={styles.statLabel}>AVG GAP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>{results.blindSpot.trait.emoji}</Text>
          <Text style={styles.statLabel}>BLIND SPOT</Text>
        </View>
      </View>

      {/* Insight cards */}
      <InsightCard
        icon="👀"
        title="Biggest Blind Spot"
        headerColor={COLORS.self}
        bgColors={['rgba(255,107,92,0.12)', 'rgba(139,92,246,0.06)']}
        traitEmoji={results.blindSpot.trait.emoji}
        traitLabel={results.blindSpot.trait.label}
        insight={blindSpotInsight || `You rated yourself ${blindSpotSelf}/10, they said ${blindSpotOther}/10.`}
      />
      <InsightCard
        icon="✨"
        title="Biggest Positive Surprise"
        headerColor={COLORS.success}
        bgColors={['rgba(34,197,94,0.08)']}
        traitEmoji={results.positiveSurprise.trait.emoji}
        traitLabel={results.positiveSurprise.trait.label}
        insight={positiveInsight || `They rated you ${positiveSurpriseOther}/10 — higher than you expected.`}
      />
      <InsightCard
        icon="🎯"
        title="You Called It"
        headerColor={COLORS.others}
        bgColors={['rgba(139,92,246,0.08)']}
        traitEmoji={results.youCalledIt.trait.emoji}
        traitLabel={results.youCalledIt.trait.label}
        insight={calledItInsight || `Your self-rating matched what others thought almost exactly.`}
      />
      <InsightCard
        icon="🔥"
        title="Your Strongest Trait"
        headerColor="#F59E0B"
        bgColors={['rgba(245,158,11,0.08)']}
        traitEmoji={results.strongestTrait.trait.emoji}
        traitLabel={results.strongestTrait.trait.label}
        insight={strongestInsight}
      />

      {/* Full Perception Gap section */}
      <Text style={styles.sectionHeader}>FULL PERCEPTION GAP</Text>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.self }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.others }]} />
          <Text style={styles.legendText}>Them</Text>
        </View>
      </View>

      {/* All trait bars */}
      <View style={styles.barsContainer}>
        {results.traitResults.map(tr => (
          <PerceptionBar
            key={tr.trait.key}
            label={tr.trait.label}
            selfScore={tr.selfScore}
            otherScore={tr.avgOtherScore}
            showDelta
          />
        ))}
      </View>

      {/* CTAs */}
      <GradientButton label="Share My Results →" onPress={handleShare} style={styles.shareBtn} />
      <AnimatedPressable onPress={handleAskMore} style={styles.askMoreBtn}>
        <Text style={styles.askMoreText}>
          Want a clearer picture? Ask a few more people.
        </Text>
      </AnimatedPressable>
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
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 6,
  },
  subheader: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    color: COLORS.text,
  },
  statEmoji: {
    fontSize: 20,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  insightCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  insightCardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  insightTraitLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 6,
  },
  insightCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  sectionHeader: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: COLORS.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.muted,
  },
  barsContainer: {
    marginBottom: 24,
  },
  shareBtn: {
    marginBottom: 12,
  },
  askMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  askMoreText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.others,
    textAlign: 'center',
  },
});
