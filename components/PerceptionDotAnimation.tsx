import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';

export function PerceptionDotAnimation() {
  const position = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(position, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(position, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ]).start(() => animate());
    };
    animate();
  }, []);

  // Track is 200px wide, dots are 14px
  // Close: 8px from edges → selfX=8, otherX=200-8-14=178
  // Far: 40px from edges → selfX=40, otherX=200-40-14=146
  const TRACK_WIDTH = 200;
  const DOT_SIZE = 14;
  const CLOSE_OFFSET = 8;
  const FAR_OFFSET = 40;

  const selfTranslateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [CLOSE_OFFSET, FAR_OFFSET],
  });

  const otherTranslateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [TRACK_WIDTH - CLOSE_OFFSET - DOT_SIZE, TRACK_WIDTH - FAR_OFFSET - DOT_SIZE],
  });

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.youLabel}>YOU</Text>
        <Text style={styles.themLabel}>THEM</Text>
      </View>
      <View style={[styles.track, { width: TRACK_WIDTH }]}>
        {/* Gradient connector */}
        <View style={styles.connectorContainer}>
          <View style={styles.connectorLine} />
        </View>

        {/* YOU dot */}
        <Animated.View
          style={[
            styles.dot,
            styles.selfDot,
            { transform: [{ translateX: selfTranslateX }] },
          ]}
        />

        {/* THEM dot */}
        <Animated.View
          style={[
            styles.dot,
            styles.otherDot,
            { transform: [{ translateX: otherTranslateX }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 28,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 10,
  },
  youLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: COLORS.self,
    letterSpacing: 1,
  },
  themLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: COLORS.others,
    letterSpacing: 1,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.surface2,
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  connectorContainer: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: 2.5,
    height: 3,
    opacity: 0.55,
  },
  connectorLine: {
    flex: 1,
    backgroundColor: COLORS.self,
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    top: -3,
    borderWidth: 3,
    borderColor: COLORS.bg,
  },
  selfDot: {
    backgroundColor: COLORS.self,
  },
  otherDot: {
    backgroundColor: COLORS.others,
  },
});
