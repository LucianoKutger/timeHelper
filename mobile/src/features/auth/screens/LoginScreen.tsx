import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
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

import { supabase } from '../../../lib/supabase';
import { colors, radii } from '../../../theme';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signIn = async () => {
    if (!email.trim() || !password) return;

    setLoading(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) setErrorMessage('Anmeldung fehlgeschlagen. Bitte prüfe deine Zugangsdaten.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={12}
        style={styles.keyboardView}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <View style={styles.logoHalo}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>T</Text>
              </View>
            </View>
            <Text style={styles.title}>Willkommen zurück</Text>
            <Text style={styles.subtitle}>Melde dich bei deinem Timehelper an.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-MAIL-ADRESSE</Text>
              <View style={styles.inputShell}>
                <Feather color={colors.textMuted} name="mail" size={20} />
                <TextInput
                  accessibilityLabel="E-Mail-Adresse"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="name@beispiel.de"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORT</Text>
              <View style={styles.inputShell}>
                <Feather color={colors.textMuted} name="lock" size={20} />
                <TextInput
                  accessibilityLabel="Passwort"
                  autoComplete="password"
                  onChangeText={setPassword}
                  onSubmitEditing={() => void signIn()}
                  placeholder="••••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!passwordVisible}
                  style={styles.input}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={passwordVisible ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                  hitSlop={10}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                >
                  <Feather color={colors.textMuted} name={passwordVisible ? 'eye-off' : 'eye'} size={20} />
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" hitSlop={8}>
                <Text style={styles.forgotPassword}>Passwort vergessen?</Text>
              </Pressable>
            </View>

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={loading || !email.trim() || !password}
              onPress={() => void signIn()}
              style={({ pressed }) => [styles.signInButton, pressed && styles.signInButtonPressed]}
            >
              {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.signInText}>Anmelden</Text>}
            </Pressable>
          </View>

          <View style={styles.securityNote}>
            <View style={styles.divider} />
            <View style={styles.securityRow}>
              <Feather color={colors.textFaint} name="lock" size={14} />
              <Text style={styles.securityText}>Deine Daten werden sicher übertragen.</Text>
            </View>
          </View>

          <Text style={styles.tagline}>Arbeitszeiten einfach. Sicher. Persönlich.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 62,
    paddingBottom: 18,
  },
  intro: { alignItems: 'center' },
  logoHalo: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  logo: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: colors.primary,
  },
  logoText: { color: colors.text, fontSize: 26, fontWeight: '600' },
  title: { marginTop: 20, color: colors.text, fontSize: 25, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { marginTop: 7, color: colors.textMuted, fontSize: 13 },
  form: { marginTop: 38, gap: 22 },
  fieldGroup: { gap: 9 },
  label: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  inputShell: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  forgotPassword: { alignSelf: 'flex-end', color: '#A99BFF', fontSize: 11, marginTop: 1 },
  error: { color: colors.danger, fontSize: 12, marginTop: -8 },
  signInButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1,
    borderRadius: radii.medium,
    backgroundColor: colors.primary,
  },
  signInButtonPressed: { backgroundColor: colors.primaryPressed },
  signInText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  securityNote: { marginHorizontal: 24, marginTop: 48, alignItems: 'center', gap: 14 },
  divider: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  securityText: { color: colors.textFaint, fontSize: 10 },
  tagline: { marginTop: 'auto', paddingTop: 80, textAlign: 'center', color: '#454B57', fontSize: 10 },
});
