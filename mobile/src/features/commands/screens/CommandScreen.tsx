import { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import {
  ActivityIndicator,
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
import type { WorkDayResponse } from '../../../types/api';
import { dummyMessagesResponse, type Message } from '../messages';

const monthOptions = [
  { key: '2026-07', label: 'Juli 2026' },
  { key: '2026-06', label: 'Juni 2026' },
  { key: '2026-05', label: 'Mai 2026' },
  { key: '2026-04', label: 'April 2026' },
] as const;

const fallbackAssistantResponse = 'Alles klar — ich habe deinen Arbeitstag gespeichert.';
const offlineAssistantResponse = 'Dein Eintrag ist vorgemerkt und wird synchronisiert, sobald die Verbindung wieder da ist.';

function workDateFromResponse(response: string, fallbackMonth: string) {
  return response.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ?? `${fallbackMonth}-01`;
}

type CommandScreenProps = {
  onOpenSettings?: () => void;
};

export function CommandScreen({ onOpenSettings }: CommandScreenProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(dummyMessagesResponse.data);
  const [selectedMonthKey, setSelectedMonthKey] = useState<(typeof monthOptions)[number]['key']>(monthOptions[0].key);
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [closeMonthVisible, setCloseMonthVisible] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedMonth = monthOptions.find((month) => month.key === selectedMonthKey) ?? monthOptions[0];
  const selectedMessages = messages
    .filter((storedMessage) => storedMessage.work_date.startsWith(selectedMonth.key))
    .sort((first, second) => first.created_at.localeCompare(second.created_at));

  useEffect(() => {
    apiFetch<{ status: string }>('/health').catch(() => undefined);
  }, []);

  const submitMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending) return;

    setSending(true);
    setMessage('');

    try {
      const payload = await apiFetch<WorkDayResponse>('/v1/workday/', {
        method: 'POST',
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const response = payload.response_massage || fallbackAssistantResponse;
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Crypto.randomUUID(),
          message: trimmedMessage,
          response,
          work_date: workDateFromResponse(response, selectedMonth.key),
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Crypto.randomUUID(),
          message: trimmedMessage,
          response: offlineAssistantResponse,
          work_date: `${selectedMonth.key}-01`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const selectMonth = (monthKey: (typeof monthOptions)[number]['key']) => {
    setSelectedMonthKey(monthKey);
    setMonthMenuVisible(false);
    setDrawerVisible(false);
  };

  const openDrawer = () => {
    setMonthMenuVisible(false);
    setDrawerVisible(true);
  };

  const openMonthClose = () => {
    setDrawerVisible(false);
    setCloseMonthVisible(true);
  };

  return (
    <View style={styles.root}>
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.chatScroll}
          >
            {selectedMessages.length > 0 ? (
              selectedMessages.map((storedMessage) => (
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
                      <View style={styles.summary}>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Arbeitszeit</Text>
                          <Text style={styles.summaryValue}>8 Std. 15 Min.</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Pause</Text>
                          <Text style={styles.summaryValue}>30 Min.</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Ort</Text>
                          <Text style={styles.summaryValue}>Büro</Text>
                        </View>
                      </View>
                      <View style={styles.successBadge}>
                        <Feather color={colors.successText} name="check" size={11} />
                        <Text style={styles.successText}>Erfasst</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
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
                  <Text style={styles.voiceSubtitle}>Sprich jetzt — ich höre zu.</Text>
                </View>
              </View>
              <View style={styles.voiceBottomRow}>
                <View style={styles.waveform}>
                  {[8, 15, 24, 13, 21, 10].map((height, index) => (
                    <View key={`${height}-${index}`} style={[styles.waveBar, { height }]} />
                  ))}
                </View>
                <Pressable accessibilityRole="button" onPress={() => setVoiceActive(false)}>
                  <Text style={styles.cancelVoice}>Abbrechen</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={[styles.composer, voiceActive && styles.composerActive]}>
            <TextInput
              accessibilityLabel="Arbeitszeit hinzufügen"
              onChangeText={setMessage}
              onSubmitEditing={() => void submitMessage()}
              placeholder={voiceActive ? 'Sprache wird transkribiert …' : 'Arbeitszeit hinzufügen …'}
              placeholderTextColor={voiceActive ? '#BEB5EA' : colors.textFaint}
              returnKeyType="send"
              style={styles.composerInput}
              value={message}
            />
            <Pressable
              accessibilityLabel={voiceActive ? 'Spracheingabe beenden' : 'Spracheingabe starten'}
              hitSlop={8}
              onPress={() => setVoiceActive((active) => !active)}
              style={voiceActive ? styles.voiceMicButton : styles.plainIconButton}
            >
              <Feather color={voiceActive ? colors.text : colors.textMuted} name="mic" size={voiceActive ? 19 : 18} />
            </Pressable>
            {!voiceActive ? (
              <Pressable
                accessibilityLabel="Eintrag senden"
                disabled={sending}
                onPress={() => void submitMessage()}
                style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}
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
          <Text style={styles.allMonths}>Alle vorhandenen Monate</Text>
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
                  <Text style={styles.closeMonthTitle}>Juli 2026 abschließen</Text>
                  <Text style={styles.closeMonthSubtitle}>Excel erstellen und per E-Mail senden</Text>
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
          <Pressable accessibilityLabel="Monatsabschluss schließen" onPress={() => setCloseMonthVisible(false)} style={StyleSheet.absoluteFill} />
          <View style={styles.closeModal}>
            <Text style={styles.modalTitle}>Monatsabschluss</Text>
            <Text style={styles.modalSubtitle}>Zeitraum prüfen und Vorgang starten.</Text>

            <Text style={styles.modalLabel}>JAHR</Text>
            <View style={styles.modalField}>
              <Text style={styles.modalFieldText}>2026</Text>
            </View>

            <Text style={[styles.modalLabel, styles.monthFieldLabel]}>MONAT</Text>
            <View style={styles.modalField}>
              <Text style={styles.modalFieldText}>Juli</Text>
              <Feather color={colors.textMuted} name="chevron-down" size={16} />
            </View>

            <Pressable
              onPress={() => setCloseMonthVisible(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.signInButtonPressed]}
            >
              <Text style={styles.closeButtonText}>Abschließen</Text>
            </Pressable>
            <Text style={styles.modalFootnote}>Der Abschluss kann einen Moment dauern.</Text>
          </View>
        </View>
      ) : null}
    </View>
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
  summary: { marginTop: 20, gap: 7 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryLabel: { width: 85, color: colors.text, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 13 },
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
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 6,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerActive: { borderColor: colors.primary, backgroundColor: '#18152A' },
  composerInput: { flex: 1, minHeight: 48, color: colors.text, fontSize: 12, paddingVertical: 0 },
  plainIconButton: { width: 36, height: 42, alignItems: 'center', justifyContent: 'center' },
  sendButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.primary,
  },
  sendButtonPressed: { backgroundColor: colors.primaryPressed },
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
  closeButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: radii.medium,
    backgroundColor: colors.primary,
  },
  closeButtonText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  modalFootnote: { position: 'absolute', bottom: -24, alignSelf: 'center', color: colors.textFaint, fontSize: 8 },
  signInButtonPressed: { backgroundColor: colors.primaryPressed },
});
