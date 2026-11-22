import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Modal, PanResponder, Platform, Pressable,
  ScrollView, StatusBar, Text, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chars, createSession, getCounts, modes, moveSession, rateSession } from './src/study';
import { createProgressStorage } from './src/progressStorage';
import styles, { colors } from './src/styles';

const progressStorage = createProgressStorage(AsyncStorage);

function Button({ children, onPress, tone = 'secondary', disabled = false, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button, styles[`${tone}Button`], style,
        disabled && styles.disabledButton, pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.buttonText, styles[`${tone}ButtonText`]]}>{children}</Text>
    </Pressable>
  );
}

function Flashcard({ kana, roman, rating, flipped, onFlip, onPrevious, onNext, narrow, fontScale }) {
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(rotation, {
      toValue: flipped ? 1 : 0, duration: 480, useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [flipped, rotation]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => (
      gesture.numberActiveTouches === 1
      && Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy)
    ),
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) >= 50 && Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
        if (gesture.dx < 0) onPrevious();
        else onNext();
      }
    },
    onPanResponderTerminationRequest: () => true,
  }), [onPrevious, onNext]);

  const status = rating === undefined ? 'Chưa đánh dấu' : rating ? 'Đã nhớ' : 'Chưa nhớ';
  return (
    <View
      {...panResponder.panHandlers}
      style={Platform.OS === 'web' ? { touchAction: 'pan-y pinch-zoom', userSelect: 'none' } : undefined}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={flipped ? `${kana}, cách đọc ${roman}. Chạm để lật thẻ.` : `${kana}, ${status}. Chạm để xem cách đọc.`}
        accessibilityState={{ expanded: flipped }}
        onPress={onFlip}
        style={[styles.card, { height: (narrow ? 240 : 335) * fontScale }]}
      >
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden={flipped}
          importantForAccessibility={flipped ? 'no-hide-descendants' : 'auto'}
          style={[styles.cardFace, {
            opacity: rotation.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] }),
            transform: [{ perspective: 1200 }, { rotateY: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
          }]}
        >
          <Text style={styles.cardCaption}>HIRAGANA · {status}</Text>
          <Text style={[styles.kana, narrow && { fontSize: 104, lineHeight: 140 }]}>{kana}</Text>
          <Text style={styles.cardCaption}>Chạm để xem · Vuốt trái: lùi · phải: tiến</Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden={!flipped}
          importantForAccessibility={flipped ? 'auto' : 'no-hide-descendants'}
          style={[styles.cardFace, styles.cardBack, {
            opacity: rotation.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] }),
            transform: [{ perspective: 1200 }, { rotateY: rotation.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) }],
          }]}
        >
          <Text style={styles.cardCaption}>ROMAJI</Text>
          <Text style={styles.backKana}>{kana}</Text>
          <Text style={styles.roman}>{roman}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function StudyApp() {
  const { width, fontScale } = useWindowDimensions();
  const narrow = width <= 480;
  const [session, setSession] = useState(null);
  const currentSession = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveVersion = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const persist = useCallback((next) => {
    const version = ++saveVersion.current;
    setSaving(true);
    progressStorage.save(next).then(() => {
      if (mounted.current && version === saveVersion.current) {
        setSaving(false);
        setSaveError(false);
      }
    }, () => {
      if (mounted.current && version === saveVersion.current) {
        setSaving(false);
        setSaveError(true);
      }
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    progressStorage.load().then((saved) => {
      if (!active) return;
      const next = saved ?? createSession();
      currentSession.current = next;
      setSession(next);
      if (!saved) persist(next);
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [loadAttempt, persist]);

  const update = useCallback((change) => {
    const previous = currentSession.current;
    if (!previous) return;
    const next = change(previous);
    if (next === previous) return;
    currentSession.current = next;
    setFlipped(false);
    setSession(next);
    persist(next);
  }, [persist]);
  const previous = useCallback(() => update((value) => moveSession(value, -1)), [update]);
  const next = useCallback(() => update((value) => moveSession(value, 1)), [update]);
  const answer = useCallback((remembered) => update((value) => rateSession(value, remembered)), [update]);
  const flip = useCallback(() => {
    const value = currentSession.current;
    if (value && value.position < value.deck.length) setFlipped((value) => !value);
  }, []);
  const restart = useCallback((mode) => {
    setModeOpen(false);
    update((value) => {
      const restarted = createSession(mode ?? value.mode, value.ratings);
      setNotice(mode === 'missed' && restarted.mode !== 'missed'
        ? 'Chưa có chữ sai để ôn. Hãy luyện một lượt trước!' : '');
      return restarted;
    });
  }, [update]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (event) => {
      if (!currentSession.current || modeOpen || event.isComposing) return;
      const target = event.target;
      if (['SELECT', 'INPUT', 'TEXTAREA'].includes(target?.tagName) || target?.isContentEditable) return;
      if (event.code === 'Space') {
        if (target?.closest?.('button, [role="button"]')) return;
        event.preventDefault();
        flip();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault(); answer(false);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault(); answer(true);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault(); next();
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [answer, flip, modeOpen, next]);

  if (!session) {
    return (
      <View style={styles.loading}>
        {loadError ? <>
          <Text accessibilityRole="alert" style={styles.errorText}>Không đọc được tiến độ đã lưu. Hãy thử lại.</Text>
          <Button style={{ flex: 0 }} onPress={() => setLoadAttempt((value) => value + 1)}>Thử lại</Button>
        </> : <>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.tip}>Đang tải tiến độ…</Text>
        </>}
      </View>
    );
  }

  const { good, bad, unmarked } = getCounts(session);
  const complete = session.position === session.deck.length;
  const kana = session.deck[session.position];
  const roman = chars.find((value) => value[0] === kana)?.[1];
  const hasMissed = Object.values(session.ratings).includes(false);
  const ordered = session.mode === 'forward' || session.mode === 'reverse';
  const modeLabel = modes.find((value) => value.value === session.mode).label;

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, narrow && { paddingTop: 16, paddingHorizontal: 14, paddingBottom: 28 }]}>
      <View style={styles.header}>
        <View style={styles.headingGroup}>
          <Text accessibilityRole="header" style={[styles.title, narrow && { fontSize: 25 }]}>🌸 Hiragana Flashcards</Text>
          <Text style={styles.subtitle}>Nhìn chữ Nhật → nhớ Romaji, không cần mở bảng chữ cái</Text>
        </View>
        <View style={styles.tag}><Text style={styles.tagText}>46 chữ cơ bản</Text></View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.modeField}>
          <Text style={styles.modeLabel}>Chế độ</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Chế độ: ${modeLabel}`} onPress={() => setModeOpen(true)} style={styles.modeButton}>
            <Text style={styles.modeButtonText}>{modeLabel} ▾</Text>
          </Pressable>
        </View>
        <Button onPress={() => restart()} style={styles.restartButton}>{ordered ? '↻ Bắt đầu lại' : '🔀 Xáo trộn lại'}</Button>
      </View>
      {notice ? <Text accessibilityRole="alert" style={styles.tip}>{notice}</Text> : null}
      {saveError ? <View style={styles.errorBanner}>
        <Text accessibilityRole="alert" style={styles.errorText}>Không lưu được tiến độ. Giữ app mở và thử lưu lại.</Text>
        <Button style={{ flex: 0, marginTop: 10 }} onPress={() => persist(currentSession.current)}>Thử lưu lại</Button>
      </View> : null}

      {complete ? <View style={styles.complete}>
        <Text accessibilityRole="header" style={styles.completeTitle}>🎉 Hoàn thành một lượt!</Text>
        <Text style={styles.result}>Trong bộ này: Đã nhớ {good}/{session.deck.length} · Cần ôn {bad} chữ · Chưa đánh dấu {unmarked} chữ. {good === session.deck.length
          ? 'Xuất sắc, bạn đã đánh dấu nhớ toàn bộ chữ trong bộ này!'
          : 'Làm lại hoặc ôn những chữ sai để luyện thêm.'}</Text>
        <View style={styles.actions}>
          <Button tone="bad" disabled={!hasMissed} onPress={() => restart('missed')}>Ôn những chữ sai</Button>
          <Button tone="primary" onPress={() => restart('all')}>🔀 Làm lại 46 chữ</Button>
        </View>
      </View> : <>
        <View style={styles.stats}>
          {[['Tiến độ', `${session.position + 1}/${session.deck.length}`], ['Đã nhớ', good], ['Chưa nhớ', bad]].map(([label, value]) => (
            <View key={label} style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>
          ))}
        </View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: session.deck.length, now: session.position }} style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${session.position / session.deck.length * 100}%` }]} />
        </View>
        <Flashcard key={`${session.mode}:${session.position}:${kana}`} kana={kana} roman={roman} rating={session.ratings[kana]} flipped={flipped} onFlip={flip} onPrevious={previous} onNext={next} narrow={narrow} fontScale={fontScale} />
        <Text style={styles.tip}>{flipped ? 'Đọc đúng ngay không cần nhẩm? Chọn “Đã nhớ”.' : 'Thử đọc thành tiếng trước khi lật thẻ.'}</Text>
        <View style={styles.actions}>
          <Button tone="bad" onPress={() => answer(false)}>✗ Chưa nhớ</Button>
          <Button tone="good" onPress={() => answer(true)}>✓ Đã nhớ</Button>
        </View>
        <View style={styles.actions}>
          <Button disabled={session.position === 0} onPress={previous}>← Từ trước</Button>
          <Button onPress={next}>Từ tiếp theo →</Button>
        </View>
        {Platform.OS === 'web' ? <Text style={styles.keyboard}>Phím tắt: Space = lật · ← = chưa nhớ · → = đã nhớ · ↓ = từ tiếp theo</Text> : null}
      </>}
      <Text accessibilityLiveRegion="polite" style={styles.saveStatus}>{saving ? 'Đang lưu tiến độ…' : saveError ? 'Tiến độ chưa được lưu.' : 'Tiến độ đã lưu trên thiết bị.'}</Text>
      <View style={styles.note}>
        <Text style={styles.noteText}><Text style={styles.noteStrong}>💡 Mẹo học: </Text>Mỗi thẻ cố gắng trả lời trong 1–2 giây. Nếu phải nhẩm theo thứ tự bảng chữ thì chọn “Chưa nhớ”. Chọn “Từ trước” hoặc “Từ tiếp theo” để di chuyển; vuốt trái để quay lại từ trước, vuốt phải để sang từ tiếp theo. Di chuyển giữa các từ không thay đổi đánh dấu. Bộ đếm tính các từ trong chế độ đang chọn, mỗi từ chỉ tính một lần. Đánh dấu, chế độ và vị trí học được lưu trên thiết bị để mở lại app vẫn tiếp tục được.</Text>
      </View>

      <Modal visible={modeOpen} transparent animationType="fade" onRequestClose={() => setModeOpen(false)}>
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={styles.modal}>
            <Text accessibilityRole="header" style={styles.modalTitle}>Chế độ</Text>
            <ScrollView>
              {modes.map((mode) => <Pressable key={mode.value} accessibilityRole="radio" accessibilityState={{ checked: mode.value === session.mode }} onPress={() => restart(mode.value)} style={[styles.modeOption, mode.value === session.mode && styles.modeOptionSelected]}>
                <Text style={styles.modeOptionText}>{mode.label}</Text>
              </Pressable>)}
            </ScrollView>
            <Button style={{ flex: 0, marginTop: 10 }} onPress={() => setModeOpen(false)}>Đóng</Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.screen}>
        <StudyApp />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
