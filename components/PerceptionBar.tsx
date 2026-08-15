import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';

interface PerceptionBarProps {
  selfScore: number;
  otherScore: number;
  label: string;
  showDelta?: boolean;
}

export function PerceptionBar({ selfScore, otherScore, label, showDelta = true }: PerceptionBarProps) {
  const selfAnim = useRef(new Animated.Value(0)).current;
  const otherAnim = useRef(new Animated.Value(0)).current;

  const selfPct = (selfScore - 1) / 9;
  const otherPct = (otherScore - 1) / 9;
  const diff = otherScore - selfScore;
  const absDiff = Math.abs(diff);
  const diffText = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(selfAnim, {
        toValue: selfPct,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(otherAnim, {
        toValue: otherPct,
        duration: 700,
        delay: 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [selfPct, otherPct]);

  const minPct = Math.min(selfPct, otherPct);
  const maxPct = Math.max(selfPct, otherPct);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showDelta && absDiff >= 1.5 && (
          <Text style={styles.delta}>Δ {absDiff.toFixed(1)}</Text>
        )}
      </View>
      <View style={styles.track}>
        {/* Gradient connector */}
        <Animated.View
          style={[
            styles.connector,
            {
              left: selfAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              right: otherAnim.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] }),
            },
          ]}
        >
          <LinearGradient
            colors={selfPct <= otherPct
              ? [COLORS.self, COLORS.others]
              : [COLORS.others, COLORS.self]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* YOU dot */}
        <Animated.View
          style={[
            styles.dot,
            styles.selfDot,
            {
              left: selfAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              marginLeft: -7,
            },
          ]}
        />

        {/* THEM dot */}
        <Animated.View
          style={[
            styles.dot,
            styles.otherDot,
            {
              left: otherAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              marginLeft: -7,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.muted,
  },
  delta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: COLORS.muted,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.surface2,
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  connector: {
    position: 'absolute',
    top: 2.5,
    height: 3,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    top: -3,
    borderWidth: 2.5,
    borderColor: COLORS.bg,
  },
  selfDot: {
    backgroundColor: COLORS.self,
  },
  otherDot: {
    backgroundColor: COLORS.others,
  },
});
