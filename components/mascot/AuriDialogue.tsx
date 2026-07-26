import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AuriCard } from '@/components/mascot/AuriCard';
import { brand } from '@/constants/brand';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useMascot } from '@/contexts/MascotContext';
import { useTheme } from '@/contexts/ThemeContext';

const GAP = 14;

/** Floating speech bubble next to Auri — passport card + tips + free-text ask. */
export function AuriDialogue() {
  const { colors, themeId } = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const {
    dialogue,
    position,
    mascotSize,
    mood,
    isTutorial,
    closeDialogue,
    nextTutorialStep,
    skipTutorial,
    askQuick,
    startTutorial,
  } = useMascot();

  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  const [boxH, setBoxH] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [draft, setDraft] = useState('');

  const body = dialogue?.body ?? '';

  useEffect(() => {
    if (!dialogue) return;
    opacity.setValue(0);
    slide.setValue(10);
    setDraft('');
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(slide, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [dialogue, opacity, slide]);

  useEffect(() => {
    if (!body) return;
    setRevealed(0);
    const id = setInterval(() => {
      setRevealed((n) => {
        if (n >= body.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 16);
    return () => clearInterval(id);
  }, [body]);

  if (!dialogue) return null;

  const boxW = Math.min(340, W - 24);
  const left = Math.min(
    Math.max(12, position.x + mascotSize / 2 - boxW / 2),
    Math.max(12, W - boxW - 12),
  );

  const placeAbove = position.y > H * 0.42;
  const measured = boxH || 220;
  const top = placeAbove
    ? Math.max(44, position.y - measured - GAP)
    : Math.min(H - measured - 24, position.y + mascotSize + GAP);

  const isDone = revealed >= body.length;

  async function onPrimary() {
    if (!isDone) {
      setRevealed(body.length);
      return;
    }
    if (isTutorial) {
      await nextTutorialStep();
      return;
    }
    if (dialogue?.onPrimary) {
      dialogue.onPrimary();
      return;
    }
    closeDialogue();
  }

  function onChoice(id: string) {
    if (id === 'tour') {
      startTutorial();
      return;
    }
    askQuick(id);
  }

  function onSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    askQuick(text);
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { left, top, width: boxW, opacity, transform: [{ translateY: slide }] },
      ]}
      onLayout={(e) => setBoxH(e.nativeEvent.layout.height)}
    >
      <View
        style={[
          styles.box,
          { backgroundColor: colors.surface, borderColor: colors.primary },
        ]}
      >
        <View style={styles.header}>
          <AuriCard mood={mood} size={54} />
          <View style={styles.headerText}>
            <Text style={[styles.name, { color: colors.text, fontFamily: fonts.displayBold }]}>
              {dialogue.title || brand.mascot.name}
            </Text>
            <Text style={[styles.role, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>
              {brand.mascot.title}
            </Text>
          </View>
          <Pressable
            onPress={isTutorial ? skipTutorial : closeDialogue}
            hitSlop={10}
            style={styles.close}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={[styles.body, { color: colors.text, fontFamily: fonts.body }]}>
          {body.slice(0, revealed)}
          {isDone ? '' : '▌'}
        </Text>

        {dialogue.choices && !isTutorial && isDone ? (
          <View style={styles.choices}>
            {dialogue.choices.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => onChoice(c.id)}
                style={[
                  styles.choice,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    { color: colors.text, fontFamily: fonts.bodyMedium },
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!isTutorial && isDone ? (
          <View
            style={[
              styles.askRow,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Ask Auri… "${themeId === 'dusk' ? 'light' : 'dark'} theme"`}
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={onSend}
              returnKeyType="send"
              style={[styles.askInput, { color: colors.text, fontFamily: fonts.body }]}
            />
            <Pressable
              onPress={onSend}
              disabled={!draft.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: draft.trim() ? colors.primary : colors.border,
                },
              ]}
              accessibilityLabel="Send message to Auri"
            >
              <Ionicons name="send" size={16} color={colors.textOnPrimary} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.actions}>
          {isTutorial ? (
            <Pressable onPress={skipTutorial} style={styles.skipBtn}>
              <Text
                style={[styles.skipText, { color: colors.textSecondary, fontFamily: fonts.body }]}
              >
                Skip tour
              </Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <Pressable
            onPress={onPrimary}
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.nextText, { color: colors.textOnPrimary, fontFamily: fonts.bodyBold }]}
            >
              {(isDone ? dialogue.primaryLabel || 'Got it' : 'Skip').toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            placeAbove ? styles.tailDown : styles.tailUp,
            {
              borderTopColor: placeAbove ? colors.primary : 'transparent',
              borderBottomColor: placeAbove ? 'transparent' : colors.primary,
              left: Math.min(boxW - 40, Math.max(22, position.x + mascotSize / 2 - left - 11)),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 70,
    elevation: 70,
  },
  box: {
    borderWidth: 3,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: { flex: 1 },
  name: { fontSize: fontSize.md },
  role: { fontSize: fontSize.xs, marginTop: 1 },
  close: { padding: 2 },
  body: {
    fontSize: fontSize.md,
    lineHeight: 22,
    minHeight: 44,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  choice: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  choiceText: { fontSize: fontSize.xs },
  askRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
  },
  askInput: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  skipBtn: { flex: 1, paddingVertical: 6 },
  skipText: { fontSize: fontSize.sm },
  nextBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  nextText: { fontSize: fontSize.sm, letterSpacing: 0.6 },
  tailDown: {
    position: 'absolute',
    bottom: -13,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailUp: {
    position: 'absolute',
    top: -13,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
