import { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorCode,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '../../../api/httpClient';
import { colors, radii } from '../../../theme';
import type { MonthlyCloseResponse, WorkDayResponse } from '../../../types/api';
import { loadStoredMessages, saveStoredMessages } from '../messageStorage';
import type { Message } from '../messages';

const germanMonthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'] as const;
const minimumComposerInputHeight = 48;
const maximumComposerInputHeight = 144;
const responseWordDelayMilliseconds = 55;
const monthlyCloseSuccessDelayMilliseconds = 800;

type TransientChatMessage = {
  id: string;
  message: string;
  monthKey: string;
  status: 'pending' | 'revealing' | 'error';
  visibleResponse: string;
  error?: string;
};

function localMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function recentMonthKeys(numberOfMonths = 6) {
  const currentDate = new Date();
  return Array.from({ length: numberOfMonths }, (_, index) => localMonthKey(new Date(currentDate.getFullYear(), currentDate.getMonth() - index, 1)));
}

function labelForMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return `${germanMonthNames[month - 1] ?? monthKey} ${year}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function appendSpeechText(existingText: string, transcript: string) {
  const trimmedTranscript = transcript.trim();
  if (!trimmedTranscript) return existingText;
  return existingText ? `${existingText.trimEnd()} ${trimmedTranscript}` : trimmedTranscript;
}

function speechErrorMessage(error: ExpoSpeechRecognitionErrorCode) {
  switch (error) {
    case 'not-allowed':
      return 'Mikrofonzugriff wurde nicht erlaubt. Bitte aktiviere ihn in den App-Einstellungen.';
    case 'no-speech':
    case 'speech-timeout':
      return 'Es wurde keine Sprache erkannt. Bitte versuche es erneut.';
    case 'network':
      return 'Die Spracherkennung konnte keine Verbindung herstellen.';
    case 'language-not-supported':
      return 'Die deutsche Spracherkennung ist auf diesem Gerät nicht verfügbar.';
    case 'service-not-allowed':
      return 'Auf diesem Gerät ist kein Dienst für Spracherkennung aktiviert.';
    default:
      return 'Die Spracheingabe konnte nicht gestartet werden. Bitte versuche es erneut.';
  }
}

function workDateFromResponse(response: string, fallbackMonth: string) {
  return response.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ?? `${fallbackMonth}-01`;
}

function TypingIndicator({ reduceMotion }: { reduceMotion: boolean }) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (reduceMotion) return;

    const interval = setInterval(() => setDotCount((currentCount) => (currentCount % 3) + 1), 320);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  return (
    <View accessibilityLabel="Timehelper antwortet …" accessibilityLiveRegion="polite" style={styles.typingIndicator}>
      <Text style={styles.typingIndicatorText}>Timehelper antwortet</Text>
      <Text style={styles.typingDots}>{'.'.repeat(reduceMotion ? 3 : dotCount)}</Text>
    </View>
  );
}

type CommandScreenProps = {
  onOpenSettings?: () => void;
};

export function CommandScreen({ onOpenSettings }: CommandScreenProps) {
  const chatScrollRef = useRef<ScrollView>(null);
  const messagesRef = useRef<Message[]>([]);
  const activeSubmissionIdRef = useRef<string | null>(null);
  const responseWordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monthlyCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = useRef(false);
  const recognitionStartedRef = useRef(false);
  const speechFinalTranscriptRef = useRef('');
  const speechInputPrefixRef = useRef('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [transientMessage, setTransientMessage] = useState<TransientChatMessage | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState(localMonthKey);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [closeMonthVisible, setCloseMonthVisible] = useState(false);
  const [monthlyCloseYear, setMonthlyCloseYear] = useState(() => String(new Date().getFullYear()));
  const [monthlyCloseMonth, setMonthlyCloseMonth] = useState(() => new Date().getMonth() + 1);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [monthlyCloseSubmitting, setMonthlyCloseSubmitting] = useState(false);
  const [monthlyCloseResult, setMonthlyCloseResult] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [composerInputHeight, setComposerInputHeight] = useState(minimumComposerInputHeight);
  const [sending, setSending] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const monthOptions = Array.from(new Set([...recentMonthKeys(), ...messages.map((storedMessage) => storedMessage.work_date.slice(0, 7)), selectedMonthKey]))
    .sort((first, second) => second.localeCompare(first))
    .map((key) => ({ key, label: labelForMonthKey(key) }));
  const selectedMonth = monthOptions.find((month) => month.key === selectedMonthKey) ?? monthOptions[0];
  const selectedMessages = messages
    .filter((storedMessage) => storedMessage.work_date.startsWith(selectedMonth.key))
    .sort((first, second) => first.created_at.localeCompare(second.created_at));
  const selectedTransientMessage = transientMessage?.monthKey === selectedMonth.key ? transientMessage : null;
  const monthlyCloseCompleted = monthlyCloseResult?.kind === 'success';
  const monthlyCloseLocked = monthlyCloseSubmitting || monthlyCloseCompleted;

  useEffect(() => {
    apiFetch<{ status: string }>('/health').catch(() => undefined);

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reduceMotionRef.current = enabled;
        setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const reduceMotionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      reduceMotionRef.current = enabled;
      setReduceMotion(enabled);
    });

    return () => {
      if (recognitionStartedRef.current) ExpoSpeechRecognitionModule.abort();
      if (responseWordTimerRef.current) clearTimeout(responseWordTimerRef.current);
      if (monthlyCloseTimerRef.current) clearTimeout(monthlyCloseTimerRef.current);
      reduceMotionSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;

    loadStoredMessages()
      .then((storedMessages) => {
        if (active) {
          messagesRef.current = storedMessages;
          setMessages(storedMessages);
        }
      })
      .catch(() => {
        if (active) setChatError('Die lokale Chat-Historie konnte nicht geladen werden.');
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useSpeechRecognitionEvent('start', () => {
    recognitionStartedRef.current = true;
    setVoiceActive(true);
    setVoiceError(null);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (!transcript) return;

    const textBeforeCurrentSegment = appendSpeechText(speechInputPrefixRef.current, speechFinalTranscriptRef.current);
    setMessage(appendSpeechText(textBeforeCurrentSegment, transcript));

    if (event.isFinal) {
      speechFinalTranscriptRef.current = appendSpeechText(speechFinalTranscriptRef.current, transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    recognitionStartedRef.current = false;
    setVoiceActive(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    recognitionStartedRef.current = false;
    setVoiceActive(false);
    if (event.error !== 'aborted') setVoiceError(speechErrorMessage(event.error));
  });

  const scrollChatToEnd = () => {
    requestAnimationFrame(() => chatScrollRef.current?.scrollToEnd({ animated: true }));
  };

  const toggleVoiceInput = async () => {
    if (voiceActive) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    setVoiceError(null);

    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setVoiceError('Auf diesem Gerät ist kein Dienst für Spracherkennung aktiviert.');
        return;
      }

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setVoiceError('Mikrofonzugriff wurde nicht erlaubt. Bitte aktiviere ihn in den App-Einstellungen.');
        return;
      }

      const existingMessage = message.trimEnd();
      speechInputPrefixRef.current = existingMessage;
      speechFinalTranscriptRef.current = '';
      recognitionStartedRef.current = true;
      setVoiceActive(true);
      ExpoSpeechRecognitionModule.start({
        lang: 'de-DE',
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
        iosTaskHint: 'dictation',
      });
    } catch {
      recognitionStartedRef.current = false;
      setVoiceActive(false);
      setVoiceError('Die Spracheingabe konnte nicht gestartet werden. Bitte versuche es erneut.');
    }
  };

  const cancelVoiceInput = () => {
    ExpoSpeechRecognitionModule.abort();
    recognitionStartedRef.current = false;
    setVoiceActive(false);
  };

  const revealResponse = async (submissionId: string, response: string) => {
    if (reduceMotionRef.current) {
      setTransientMessage((currentMessage) =>
        currentMessage?.id === submissionId ? { ...currentMessage, status: 'revealing', visibleResponse: response } : currentMessage,
      );
      return;
    }

    const words = response.match(/\S+\s*/g) ?? [response];
    setTransientMessage((currentMessage) =>
      currentMessage?.id === submissionId ? { ...currentMessage, status: 'revealing', visibleResponse: '' } : currentMessage,
    );

    for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
      await new Promise<void>((resolve) => {
        responseWordTimerRef.current = setTimeout(resolve, responseWordDelayMilliseconds);
      });
      if (activeSubmissionIdRef.current !== submissionId) return;

      const visibleResponse = words.slice(0, wordIndex + 1).join('').trimEnd();
      setTransientMessage((currentMessage) => (currentMessage?.id === submissionId ? { ...currentMessage, visibleResponse } : currentMessage));
    }
  };

  const submitMessage = async (messageToRetry?: string) => {
    const trimmedMessage = (messageToRetry ?? message).trim();
    if (!trimmedMessage || sending || historyLoading) return;

    const submissionId = Crypto.randomUUID();
    const submissionMonthKey = selectedMonth.key;
    activeSubmissionIdRef.current = submissionId;
    if (responseWordTimerRef.current) clearTimeout(responseWordTimerRef.current);
    setTransientMessage({
      id: submissionId,
      message: trimmedMessage,
      monthKey: submissionMonthKey,
      status: 'pending',
      visibleResponse: '',
    });
    setSending(true);
    setChatError(null);
    setMessage('');
    setComposerInputHeight(minimumComposerInputHeight);

    try {
      const payload = await apiFetch<WorkDayResponse>('/v1/workday/', {
        method: 'POST',
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const response = payload.response_massage;
      const workDate = workDateFromResponse(response, submissionMonthKey);
      const storedMessage: Message = {
        id: submissionId,
        message: trimmedMessage,
        response,
        work_date: workDate,
        created_at: new Date().toISOString(),
      };
      const responseMonthKey = workDate.slice(0, 7);
      setSelectedMonthKey(responseMonthKey);
      setTransientMessage((currentMessage) => (currentMessage?.id === submissionId ? { ...currentMessage, monthKey: responseMonthKey } : currentMessage));

      const updatedMessages = [...messagesRef.current, storedMessage];
      messagesRef.current = updatedMessages;
      const persistencePromise = saveStoredMessages(updatedMessages).catch(() => {
        setChatError('Der Arbeitstag wurde gespeichert, aber die lokale Chat-Historie konnte nicht aktualisiert werden.');
      });

      await revealResponse(submissionId, response);
      if (activeSubmissionIdRef.current !== submissionId) return;

      setMessages(updatedMessages);
      setTransientMessage(null);
      activeSubmissionIdRef.current = null;
      await persistencePromise;
    } catch (error) {
      const failureMessage = errorMessage(error, 'Der Arbeitstag konnte nicht gespeichert werden.');
      setTransientMessage((currentMessage) =>
        currentMessage?.id === submissionId ? { ...currentMessage, status: 'error', visibleResponse: '', error: failureMessage } : currentMessage,
      );
    } finally {
      setSending(false);
    }
  };

  const selectMonth = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    setMonthMenuVisible(false);
    setDrawerVisible(false);
  };

  const openDrawer = () => {
    setMonthMenuVisible(false);
    setDrawerVisible(true);
  };

  const openMonthClose = () => {
    const [year, month] = selectedMonth.key.split('-').map(Number);
    setDrawerVisible(false);
    setMonthlyCloseYear(String(year));
    setMonthlyCloseMonth(month);
    setMonthPickerVisible(false);
    setMonthlyCloseResult(null);
    if (monthlyCloseTimerRef.current) clearTimeout(monthlyCloseTimerRef.current);
    setCloseMonthVisible(true);
  };

  const dismissMonthlyClose = () => {
    if (monthlyCloseSubmitting) return;
    if (monthlyCloseTimerRef.current) clearTimeout(monthlyCloseTimerRef.current);
    setMonthPickerVisible(false);
    setCloseMonthVisible(false);
  };

  const submitMonthlyClose = async () => {
    const year = Number(monthlyCloseYear);
    if (!/^\d{4}$/.test(monthlyCloseYear) || year < 2000 || year > 2100) {
      setMonthlyCloseResult({ kind: 'error', message: 'Bitte gib ein gültiges vierstelliges Jahr an.' });
      return;
    }

    setMonthlyCloseSubmitting(true);
    setMonthlyCloseResult(null);

    try {
      const payload = await apiFetch<MonthlyCloseResponse>('/v1/monthly_close/', {
        method: 'POST',
        body: JSON.stringify({ year, month: monthlyCloseMonth }),
      });
      setMonthlyCloseResult({ kind: 'success', message: payload.response_message });
      monthlyCloseTimerRef.current = setTimeout(() => {
        setMonthPickerVisible(false);
        setCloseMonthVisible(false);
      }, monthlyCloseSuccessDelayMilliseconds);
    } catch (error) {
      setMonthlyCloseResult({ kind: 'error', message: errorMessage(error, 'Der Monatsabschluss konnte nicht erstellt werden.') });
    } finally {
      setMonthlyCloseSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root} testID="chat-keyboard-view">
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Navigation öffnen" hitSlop={12} onPress={openDrawer} style={styles.headerIcon}>
            <Feather color={colors.text} name="menu" size={21} />
          </Pressable>
          <Pressable
            accessibilityLabel="Monat auswählen"
            onPress={() => {
              setDrawerVisible(false);
              setMonthMenuVisible((visible) => !visible);
            }}
            style={styles.monthButton}
          >
            <Text style={styles.monthButtonText}>{selectedMonth.label}</Text>
            <Feather color={colors.textMuted} name="chevron-down" size={15} />
          </Pressable>
          <View style={styles.headerIcon} />
        </View>

        <View style={styles.chatContent}>
          <ScrollView
            contentContainerStyle={styles.chatScrollContent}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollChatToEnd}
            onLayout={scrollChatToEnd}
            ref={chatScrollRef}
            showsVerticalScrollIndicator={false}
            style={styles.chatScroll}
          >
            {selectedMessages.length > 0 || selectedTransientMessage ? (
              <>
                {selectedMessages.map((storedMessage) => (
                  <View key={storedMessage.id} style={styles.messagePair} testID="chat-message">
                    <View style={styles.userBubble}>
                      <Text style={styles.userBubbleText}>{storedMessage.message}</Text>
                    </View>

                    <View style={styles.assistantRow}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>T</Text>
                      </View>
                      <View style={styles.assistantContent}>
                        <Text style={styles.assistantText}>{storedMessage.response}</Text>
                        <View style={styles.successBadge}>
                          <Feather color={colors.successText} name="check" size={11} />
                          <Text style={styles.successText}>Erfasst</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                {selectedTransientMessage ? (
                  <View key={selectedTransientMessage.id} style={styles.messagePair} testID="transient-chat-message">
                    <View style={styles.userBubble}>
                      <Text style={styles.userBubbleText}>{selectedTransientMessage.message}</Text>
                    </View>

                    <View style={styles.assistantRow}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>T</Text>
                      </View>
                      <View style={styles.assistantContent}>
                        {selectedTransientMessage.status === 'pending' ? <TypingIndicator reduceMotion={reduceMotion} /> : null}
                        {selectedTransientMessage.status === 'revealing' ? (
                          <Text accessibilityLiveRegion="polite" style={styles.assistantText}>
                            {selectedTransientMessage.visibleResponse}
                          </Text>
                        ) : null}
                        {selectedTransientMessage.status === 'error' ? (
                          <View accessibilityLiveRegion="polite" style={styles.failedMessage}>
                            <Text style={styles.failedMessageText}>{selectedTransientMessage.error}</Text>
                            <Pressable
                              accessibilityLabel="Nachricht erneut senden"
                              disabled={sending}
                              onPress={() => void submitMessage(selectedTransientMessage.message)}
                              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
                            >
                              <Feather color="#C8C1EC" name="rotate-ccw" size={13} />
                              <Text style={styles.retryButtonText}>Erneut versuchen</Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ) : null}
              </>
            ) : historyLoading ? (
              <View style={styles.emptyChat}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.emptyChatText}>Chat-Historie wird geladen …</Text>
              </View>
            ) : (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatTitle}>Noch keine Einträge</Text>
                <Text style={styles.emptyChatText}>Für {selectedMonth.label} wurden keine Nachrichten gefunden.</Text>
              </View>
            )}
          </ScrollView>

          {!voiceActive ? <Text style={styles.closeHint}>Einträge vor dem Monatsabschluss prüfen.</Text> : null}

          {voiceActive ? (
            <View style={styles.voiceCard}>
              <View style={styles.voiceTitleRow}>
                <View style={styles.recordingDot} />
                <View style={styles.voiceCopy}>
                  <Text style={styles.voiceTitle}>Spracheingabe aktiv</Text>
                  <Text style={styles.voiceSubtitle}>Sprich jetzt — ich höre zu, bis du stoppst.</Text>
                </View>
              </View>
              <View style={styles.voiceBottomRow}>
                <View style={styles.waveform}>
                  {[8, 15, 24, 13, 21, 10].map((height, index) => (
                    <View key={`${height}-${index}`} style={[styles.waveBar, { height }]} />
                  ))}
                </View>
                <Pressable accessibilityRole="button" onPress={cancelVoiceInput}>
                  <Text style={styles.cancelVoice}>Abbrechen</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {voiceError ? (
            <Text accessibilityLiveRegion="polite" style={styles.voiceError}>
              {voiceError}
            </Text>
          ) : null}

          {chatError ? (
            <Text accessibilityLiveRegion="polite" style={styles.chatError}>
              {chatError}
            </Text>
          ) : null}

          <View style={[styles.composer, voiceActive && styles.composerActive]}>
            <TextInput
              accessibilityLabel="Arbeitszeit hinzufügen"
              multiline
              onChangeText={setMessage}
              onContentSizeChange={({ nativeEvent }) => {
                setComposerInputHeight(Math.min(maximumComposerInputHeight, Math.max(minimumComposerInputHeight, nativeEvent.contentSize.height)));
              }}
              onFocus={scrollChatToEnd}
              placeholder={voiceActive ? 'Sprache wird transkribiert …' : 'Arbeitszeit hinzufügen …'}
              placeholderTextColor={voiceActive ? '#BEB5EA' : colors.textFaint}
              scrollEnabled={composerInputHeight >= maximumComposerInputHeight}
              style={[styles.composerInput, { height: composerInputHeight }]}
              submitBehavior="newline"
              value={message}
            />
            <Pressable
              accessibilityLabel={voiceActive ? 'Spracheingabe beenden' : 'Spracheingabe starten'}
              hitSlop={8}
              onPress={() => void toggleVoiceInput()}
              style={voiceActive ? styles.voiceMicButton : styles.plainIconButton}
            >
              <Feather color={voiceActive ? colors.text : colors.textMuted} name="mic" size={voiceActive ? 19 : 18} />
            </Pressable>
            {!voiceActive ? (
              <Pressable
                accessibilityLabel="Eintrag senden"
                disabled={sending || historyLoading}
                onPress={() => void submitMessage()}
                style={({ pressed }) => [styles.sendButton, (sending || historyLoading) && styles.buttonDisabled, pressed && styles.sendButtonPressed]}
              >
                {sending ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Feather color={colors.text} name="arrow-up" size={19} />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      {monthMenuVisible ? (
        <View style={styles.monthMenu} testID="month-menu">
          <Text style={styles.eyebrow}>MONAT AUSWÄHLEN</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.monthOptionsScroll}>
            {monthOptions.map((month) => {
              const selected = selectedMonth.key === month.key;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={month.key}
                  onPress={() => selectMonth(month.key)}
                  style={[styles.monthOption, selected && styles.monthOptionSelected]}
                >
                  <Text style={[styles.monthOptionText, selected && styles.monthOptionTextSelected]}>{month.label}</Text>
                  {selected ? <Feather color="#AFA0FF" name="check" size={18} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.allMonths}>Letzte Monate und lokale Chats</Text>
        </View>
      ) : null}

      {drawerVisible ? (
        <View style={styles.overlay} testID="navigation-drawer">
          <Pressable accessibilityLabel="Navigation schließen" onPress={() => setDrawerVisible(false)} style={styles.drawerScrim} />
          <View style={styles.drawer}>
            <SafeAreaView style={styles.drawerSafeArea} edges={['top', 'bottom']}>
              <View style={styles.drawerHeader}>
                <View style={styles.brandRow}>
                  <View style={styles.brandAvatar}>
                    <Text style={styles.brandAvatarText}>T</Text>
                  </View>
                  <Text style={styles.brandName}>Timehelper</Text>
                </View>
                <Pressable accessibilityLabel="Navigation schließen" hitSlop={12} onPress={() => setDrawerVisible(false)}>
                  <Feather color={colors.textMuted} name="x" size={24} />
                </Pressable>
              </View>

              <Text style={styles.drawerSectionLabel}>MONATSABSCHLUSS</Text>
              <Pressable onPress={openMonthClose} style={styles.closeMonthCard}>
                <View style={styles.closeMonthCopy}>
                  <Text style={styles.closeMonthTitle}>{selectedMonth.label} abschließen</Text>
                  <Text style={styles.closeMonthSubtitle}>Excel-Datei im Backend erstellen</Text>
                </View>
                <View style={styles.editButton}>
                  <Feather color="#A99BFF" name="edit-3" size={17} />
                </View>
              </Pressable>

              <Text style={[styles.drawerSectionLabel, styles.historyLabel]}>VERLAUF</Text>
              <View style={styles.historyList}>
                {monthOptions.map((month, index) => {
                  const selected = selectedMonth.key === month.key;
                  return (
                    <Pressable
                      accessibilityLabel={`Chat für ${month.label} öffnen`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={month.key}
                      onPress={() => selectMonth(month.key)}
                      style={[styles.historyRow, selected && styles.historyRowActive]}
                    >
                      <Text style={styles.historyText}>{month.label}</Text>
                      {index === 0 ? <Text style={styles.currentLabel}>Aktuell</Text> : null}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => {
                  setDrawerVisible(false);
                  onOpenSettings?.();
                }}
                style={styles.settingsRow}
              >
                <Text style={styles.settingsText}>Einstellungen</Text>
                <View style={styles.settingsDot} />
              </Pressable>
            </SafeAreaView>
          </View>
        </View>
      ) : null}

      {closeMonthVisible ? (
        <View style={[styles.overlay, styles.modalOverlay]} testID="month-close-modal">
          <Pressable accessible={false} onPress={dismissMonthlyClose} style={StyleSheet.absoluteFill} />
          <View style={styles.closeModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Monatsabschluss</Text>
              <Pressable
                accessibilityLabel="Monatsabschluss schließen"
                accessibilityRole="button"
                accessibilityState={{ disabled: monthlyCloseSubmitting }}
                disabled={monthlyCloseSubmitting}
                hitSlop={10}
                onPress={dismissMonthlyClose}
                style={[styles.modalCloseButton, monthlyCloseSubmitting && styles.buttonDisabled]}
              >
                <Feather color={colors.textMuted} name="x" size={22} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>Zeitraum prüfen und Vorgang starten.</Text>

            <Text style={styles.modalLabel}>JAHR</Text>
            <View style={styles.modalField}>
              <TextInput
                accessibilityLabel="Jahr für Monatsabschluss"
                editable={!monthlyCloseLocked}
                keyboardType="number-pad"
                maxLength={4}
                onChangeText={(value) => setMonthlyCloseYear(value.replace(/\D/g, ''))}
                placeholder="2026"
                placeholderTextColor={colors.textFaint}
                style={styles.modalFieldInput}
                value={monthlyCloseYear}
              />
            </View>

            <Text style={[styles.modalLabel, styles.monthFieldLabel]}>MONAT</Text>
            <Pressable
              accessibilityLabel="Monat für Monatsabschluss auswählen"
              disabled={monthlyCloseLocked}
              onPress={() => setMonthPickerVisible((visible) => !visible)}
              style={styles.modalField}
            >
              <Text style={styles.modalFieldText}>{germanMonthNames[monthlyCloseMonth - 1]}</Text>
              <Feather color={colors.textMuted} name="chevron-down" size={16} />
            </Pressable>

            {monthPickerVisible ? (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.monthPicker} testID="monthly-close-month-picker">
                {germanMonthNames.map((monthName, index) => {
                  const monthNumber = index + 1;
                  const selected = monthlyCloseMonth === monthNumber;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={monthName}
                      onPress={() => {
                        setMonthlyCloseMonth(monthNumber);
                        setMonthPickerVisible(false);
                      }}
                      style={[styles.monthPickerOption, selected && styles.monthOptionSelected]}
                    >
                      <Text style={[styles.monthOptionText, selected && styles.monthOptionTextSelected]}>{monthName}</Text>
                      {selected ? <Feather color="#AFA0FF" name="check" size={17} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {monthlyCloseResult ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.monthlyCloseResult, monthlyCloseResult.kind === 'success' ? styles.monthlyCloseSuccess : styles.monthlyCloseError]}
              >
                {monthlyCloseResult.message}
              </Text>
            ) : null}

            <Pressable
              accessibilityLabel="Monatsabschluss erstellen"
              disabled={monthlyCloseLocked}
              onPress={() => void submitMonthlyClose()}
              style={({ pressed }) => [styles.closeButton, monthlyCloseLocked && styles.buttonDisabled, pressed && styles.signInButtonPressed]}
            >
              {monthlyCloseSubmitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.closeButtonText}>Abschließen</Text>}
            </Pressable>
            <Text style={styles.modalFootnote}>Die Excel-Datei wird vom lokalen Backend erstellt.</Text>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthButton: {
    minWidth: 124,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 15,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  monthButtonText: { color: colors.text, fontSize: 12 },
  chatContent: { flex: 1, paddingHorizontal: 20, paddingBottom: 4 },
  chatScroll: { flex: 1 },
  chatScrollContent: { flexGrow: 1, paddingTop: 5, paddingBottom: 24 },
  messagePair: { marginBottom: 28 },
  userBubble: {
    alignSelf: 'flex-end',
    width: 220,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopLeftRadius: radii.medium,
    borderBottomLeftRadius: radii.medium,
    backgroundColor: colors.surfacePurple,
  },
  userBubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginTop: 18, marginLeft: 22 },
  avatarSmall: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  avatarSmallText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  assistantContent: { flex: 1, paddingRight: 24 },
  assistantText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  typingIndicator: { minHeight: 19, flexDirection: 'row', alignItems: 'baseline' },
  typingIndicatorText: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  typingDots: { width: 18, color: '#A99BFF', fontSize: 13, lineHeight: 19 },
  failedMessage: { gap: 10 },
  failedMessageText: { color: '#FFAAA6', fontSize: 11, lineHeight: 16 },
  retryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#4A416D',
    backgroundColor: colors.primarySoft,
  },
  retryButtonPressed: { backgroundColor: colors.surfacePurple },
  retryButtonText: { color: '#C8C1EC', fontSize: 10, fontWeight: '600' },
  successBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
  },
  successText: { color: colors.successText, fontSize: 10 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyChatTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  emptyChatText: { marginTop: 7, color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  closeHint: { marginBottom: 14, textAlign: 'center', color: '#373D48', fontSize: 9 },
  composer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 15,
    paddingRight: 6,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerActive: { borderColor: colors.primary, backgroundColor: '#18152A' },
  composerInput: {
    flex: 1,
    minHeight: minimumComposerInputHeight,
    maxHeight: maximumComposerInputHeight,
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 15,
    paddingBottom: 15,
    textAlignVertical: 'top',
  },
  plainIconButton: {
    width: 36,
    height: 42,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.primary,
    marginBottom: 6,
  },
  sendButtonPressed: { backgroundColor: colors.primaryPressed },
  buttonDisabled: { opacity: 0.55 },
  voiceMicButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9C8CFF',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
    marginBottom: 6,
  },
  voiceCard: {
    marginHorizontal: 10,
    marginBottom: 18,
    padding: 15,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: '#3B335C',
    backgroundColor: '#121725',
  },
  voiceTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  recordingDot: { width: 11, height: 11, marginTop: 3, borderRadius: 6, backgroundColor: colors.danger },
  voiceCopy: { gap: 4 },
  voiceTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  voiceSubtitle: { color: colors.textMuted, fontSize: 10 },
  voiceBottomRow: { marginTop: 7, marginLeft: 22, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  waveform: { height: 25, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  waveBar: { width: 2, borderRadius: 1, backgroundColor: '#9381FF' },
  cancelVoice: { color: '#C8C1EC', fontSize: 10 },
  voiceError: {
    marginHorizontal: 12,
    marginBottom: 8,
    color: '#FFAAA6',
    fontSize: 10,
    lineHeight: 14,
  },
  chatError: { marginHorizontal: 12, marginBottom: 8, color: '#FFAAA6', fontSize: 10, lineHeight: 14 },
  monthMenu: {
    position: 'absolute',
    top: 82,
    left: '50%',
    zIndex: 20,
    width: 220,
    marginLeft: -110,
    padding: 10,
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
  eyebrow: { marginHorizontal: 4, marginBottom: 7, color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  monthOptionsScroll: { maxHeight: 270 },
  monthOption: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: radii.small,
  },
  monthOptionSelected: { backgroundColor: colors.surfacePurple },
  monthOptionText: { color: '#D4D6DC', fontSize: 12 },
  monthOptionTextSelected: { color: colors.text },
  allMonths: { marginHorizontal: 12, marginTop: 7, marginBottom: 3, color: colors.textFaint, fontSize: 9 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, flexDirection: 'row' },
  drawerScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim },
  drawer: { width: '82%', maxWidth: 340, backgroundColor: colors.surface },
  drawerSafeArea: { flex: 1, paddingHorizontal: 20 },
  drawerHeader: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandAvatar: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.primary,
  },
  brandAvatarText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  brandName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  drawerSectionLabel: { marginTop: 17, marginBottom: 10, color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  closeMonthCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: '#302A49',
    backgroundColor: '#191928',
  },
  closeMonthCopy: { flex: 1, gap: 7 },
  closeMonthTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  closeMonthSubtitle: { color: colors.textMuted, fontSize: 9 },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  historyLabel: { marginTop: 36 },
  historyList: { overflow: 'hidden', borderRadius: radii.medium },
  historyRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  historyRowActive: { height: 55, borderBottomWidth: 0, borderRadius: radii.medium, backgroundColor: '#30274F' },
  historyText: { color: '#DEE0E5', fontSize: 13 },
  currentLabel: { color: '#A99BFF', fontSize: 9 },
  settingsRow: {
    height: 58,
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingsText: { color: colors.text, fontSize: 12 },
  settingsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  modalOverlay: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, backgroundColor: colors.scrim },
  closeModal: {
    zIndex: 1,
    width: '100%',
    maxWidth: 330,
    transform: [{ translateY: -30 }],
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 22,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalCloseButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  modalSubtitle: { marginTop: 7, marginBottom: 28, color: colors.textMuted, fontSize: 11 },
  modalLabel: { marginBottom: 9, color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  monthFieldLabel: { marginTop: 24 },
  modalField: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#0E121A',
  },
  modalFieldText: { color: colors.text, fontSize: 13 },
  modalFieldInput: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: 0 },
  monthPicker: {
    maxHeight: 174,
    marginTop: 8,
    padding: 6,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#0E121A',
  },
  monthPickerOption: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderRadius: radii.small,
  },
  monthlyCloseResult: { marginTop: 14, fontSize: 11, lineHeight: 16 },
  monthlyCloseSuccess: { color: colors.successText },
  monthlyCloseError: { color: '#FFAAA6' },
  closeButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: radii.medium,
    backgroundColor: colors.primary,
  },
  closeButtonText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  modalFootnote: { alignSelf: 'center', marginTop: 10, color: colors.textFaint, fontSize: 8 },
  signInButtonPressed: { backgroundColor: colors.primaryPressed },
});
