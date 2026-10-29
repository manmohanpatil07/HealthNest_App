import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants';
import { AppInput, AppButton, ErrorMessage } from '../../components';
import { providerService } from '../../services/providerService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProviderLoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProviderSignIn = async () => {
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your registered mobile number or email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const response = await providerService.login({
        identifier: identifier.trim(),
        password,
      });

      if (response && response.success && response.token) {
        // Save provider session into AuthContext (role = 'healthcare_provider')
        await login(response.provider, response.token, response.role || 'healthcare_provider');
      } else {
        setError(response?.message || 'Invalid provider credentials.');
      }
    } catch (err) {
      console.warn('[ProviderLoginScreen] Error:', err);
      const apiMessage = err.response?.data?.message;
      setError(apiMessage || 'Unable to sign in. Please verify your credentials or server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Hero with Deep Teal / Emerald Gradient theme */}
        <View style={styles.heroSection}>
          <View style={styles.topBar}>
            <View style={styles.badgeRow}>
              <View style={styles.doctorBadge}>
                <Text style={styles.doctorBadgeIcon}>👨‍⚕️</Text>
              </View>
              <Text style={styles.portalTag}>{t('provider.portalTitle')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => setLanguage(language === 'en' ? 'mr' : 'en')}
            >
              <Text style={styles.backBtnText}>🌐 {language === 'en' ? 'English' : 'मराठी'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeTitle}>{t('provider.roleHeader')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('auth.providerLoginSubtitle')}</Text>
        </View>

        {/* Rounded Top-Sheet Form Container */}
        <View style={styles.sheetContainer}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>🔒</Text>
            <Text style={styles.infoBannerText}>
              {t('provider.secureSessionSub')}
            </Text>
          </View>

          {error ? <ErrorMessage message={error} /> : null}

          <AppInput
            label={t('auth.mobileNumber')}
            placeholder="e.g. 9876543210 or doctor@clinic.com"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (error) setError('');
            }}
            autoCapitalize="none"
            required
          />

          <AppInput
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            secureTextEntry
            required
          />

          <View style={styles.spacer} />

          <AppButton
            title={t('auth.providerLoginBtn')}
            variant="secondary"
            onPress={handleProviderSignIn}
            loading={loading}
          />

          <View style={styles.providerRegisterRow}>
            <Text style={styles.userPromptText}>{t('auth.noAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderRegister')}>
              <Text style={styles.providerRegisterLink}>{t('auth.registerAsProvider')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.userLoginRow}>
            <Text style={styles.userPromptText}>{t('auth.userPortalLink')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.userLoginLink}>{t('auth.loginBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    backgroundColor: '#0D9488',
    paddingTop: 54,
    paddingBottom: 36,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  doctorBadgeIcon: {
    fontSize: 18,
  },
  portalTag: {
    color: '#CCFBF1',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#CCFBF1',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    alignItems: 'center',
  },
  infoBannerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
    fontWeight: '500',
  },
  spacer: {
    height: 8,
  },
  providerRegisterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  providerRegisterLink: {
    color: '#0D9488',
    fontWeight: '700',
    fontSize: 14,
  },
  userLoginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  userPromptText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  userLoginLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
