import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/Colors';
import { GradientButton } from '@/components/GradientButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { saveProfile } from '@/utils/storage';
import { generateCode } from '@/utils/code';
import { Profile } from '@/types/perception';

const AVATARS = ['😎', '🦄', '🌸', '🔥', '🌟', '🦋', '🎭', '👻'];
const AGE_RANGES = ['13-17', '18-24', '25-34', '35+'];
const GENDERS = ['Woman', 'Man', 'Nonbinary', 'Prefer not to say'];
const SELF_SCORES_KEY = 'perception_self_scores_temp';

export default function ProfileCreateScreen() {
  const insets = useSafeAreaInsets();
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarScales = useRef(AVATARS.map(() => new Animated.Value(1))).current;

  const handleAvatarSelect = (avatar: string, index: number) => {
    console.log('[profile-create] avatar selected', avatar);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAvatar(avatar);
    Animated.spring(avatarScales[index], {
      toValue: 1.05,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start(() => {
      Animated.spring(avatarScales[index], {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }).start();
    });
  };

  const handleCreateLink = async () => {
    if (!name.trim()) return;
    console.log('[profile-create] create link pressed', name, selectedAvatar, ageRange, gender);
    setLoading(true);
    setError(null);
    try {
      const selfScoresJson = await AsyncStorage.getItem(SELF_SCORES_KEY);
      const selfScores = selfScoresJson ? JSON.parse(selfScoresJson) : {};
      const code = generateCode(name.trim());
      const profile: Profile = {
        code,
        name: name.trim(),
        avatar: selectedAvatar,
        ageRange,
        gender,
        selfScores,
        createdAt: new Date().toISOString(),
      };
      console.log('[profile-create] saving profile', code);
      // saveProfile saves locally AND syncs to Supabase
      await saveProfile(profile);
      console.log('[profile-create] profile saved, navigating to invite', code);
      router.push('/invite');
    } catch (e: any) {
      console.error('[profile-create] error', e);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canCreate = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Almost there.</Text>
        <Text style={styles.subtext}>Just enough so your results feel like yours.</Text>

        {/* Avatar picker */}
        <Text style={styles.sectionLabel}>Pick your avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((avatar, index) => {
            const isSelected = avatar === selectedAvatar;
            return (
              <AnimatedPressable
                key={avatar}
                onPress={() => handleAvatarSelect(avatar, index)}
                style={styles.avatarWrapper}
              >
                <Animated.View style={{ transform: [{ scale: avatarScales[index] }] }}>
                  {isSelected ? (
                    <LinearGradient
                      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarContainer}
                    >
                      <Text style={styles.avatarEmoji}>{avatar}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.avatarContainer, styles.avatarUnselected]}>
                      <Text style={styles.avatarEmoji}>{avatar}</Text>
                    </View>
                  )}
                </Animated.View>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Name input */}
        <Text style={styles.sectionLabel}>First name</Text>
        <TextInput
          style={[styles.input, focused && styles.inputFocused]}
          value={name}
          onChangeText={setName}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Georgia"
          placeholderTextColor={COLORS.faint}
          autoCapitalize="words"
          returnKeyType="done"
        />

        {/* Age range */}
        <Text style={styles.sectionLabel}>Age range</Text>
        <View style={styles.pillRow}>
          {AGE_RANGES.map(age => {
            const isSelected = age === ageRange;
            return (
              <AnimatedPressable
                key={age}
                onPress={() => {
                  console.log('[profile-create] age range selected', age);
                  setAgeRange(age);
                }}
                style={[styles.pill, isSelected && styles.pillSelected]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{age}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Gender */}
        <Text style={styles.sectionLabel}>Gender <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.pillRow}>
          {GENDERS.map(g => {
            const isSelected = g === gender;
            return (
              <AnimatedPressable
                key={g}
                onPress={() => {
                  console.log('[profile-create] gender selected', g);
                  setGender(g);
                }}
                style={[styles.pill, isSelected && styles.pillSelected]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{g}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Error message */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <GradientButton
            label="Create My Link →"
            onPress={handleCreateLink}
            disabled={!canCreate}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 26,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.muted,
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 10,
    marginTop: 4,
  },
  optional: {
    color: COLORS.faint,
    fontFamily: 'Inter_400Regular',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  avatarWrapper: {
    width: '22%',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnselected: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24,
  },
  inputFocused: {
    borderColor: COLORS.others,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pillSelected: {
    backgroundColor: COLORS.others,
    borderColor: COLORS.others,
  },
  pillText: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 14,
    color: COLORS.muted,
  },
  pillTextSelected: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: COLORS.bg,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.self,
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaContainer: {
    marginTop: 8,
  },
});
