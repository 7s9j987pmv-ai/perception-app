import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';

interface PerceptionBarProps {
  selfScore: number;
  otherScore: number;
  label: string;
  showDelta?: boolean;
}

export function PerceptionBar({ selfScore, otherScore, label, showDelta = true }: PerceptionBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const selfAnim = useRef(new Animated.Value(0)).current;
  const otherAnim = useRef(new Animated.Value(0)).current;

  const selfPct = (selfScore - 1) / 9;
  const otherPct = (otherScore - 1) / 9;
  const diff = otherScore - selfScore;
  const absDiff = Math.abs(diff);

  useEffect(() => {
    if (trackWidth === 0) return;
    Animated.parallel([
      Animated.timing(selfAnim, {
        toValue: selfPct * trackWidth,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(otherAnim, {
        toValue: otherPct * trackWidth,
        duration: 700,
        delay: 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [selfPct, otherPct, trackWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setTrackWidth(w);
  };

  const minPos = Math.min(selfPct, otherPct) * trackWidth;
  const maxPos = Math.max(selfPct, otherPct) * trackWidth;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showDelta && absDiff >= 1.5 && (
          <Text style={styles.delta}>Δ {absDiff.toFixed(1)}</Text>
        )}
      </View>
      <View style={styles.track} onLayout={handleLayout}>
        {trackWidth > 0 && (
          <>
            {/* Gradient connector */}
            <View
              style={[
                styles.connector,
                {
                  left: minPos,
                  width: Math.max(0, maxPos - minPos),
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
            </View>

            {/* YOU dot */}
            <Animated.View
              style={[
                styles.dot,
                styles.selfDot,
                { left: Animated.subtract(selfAnim, 7) },
              ]}
            />

            {/* THEM dot */}
            <Animated.View
              style={[
                styles.dot,
                styles.otherDot,
                { left: Animated.subtract(otherAnim, 7) },
              ]}
            />
          </>
        )}
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
