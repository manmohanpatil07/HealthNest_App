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
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');

    if (!mobile.trim()) {
      setError('Please enter your mobile number.');
      return;
    }

    if (mobile.trim().length !== 10 || !/^[0-9]+$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login({
        mobile: mobile.trim(),
        password,
      });

      if (response && response.success && response.token) {
        await login(response.user, response.token, response.role);
        // Navigation will be handled automatically by AppNavigator auth state
      } else {
        setError(response.message || 'Invalid credentials.');
      }
    } catch (err) {
      console.warn('[LoginScreen] Error:', err);
      const apiMessage = err.response?.data?.message;
      setError(apiMessage || 'Unable to connect to server. Please check your connection.');
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
        {/* Top Hero with Blue/Teal Gradient simulation */}
        <View style={styles.heroSection}>
          <View style={styles.topBar}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>HN</Text>
            </View>
            <TouchableOpacity style={styles.langSelector}>
              <Text style={styles.langText}>🌐 English</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeTitle}>Welcome back 👋</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to your health account</Text>
        </View>

        {/* Rounded Top-Sheet Form Container */}
        <View style={styles.sheetContainer}>
          {error ? <ErrorMessage message={error} /> : null}

          <AppInput
            label="Mobile Number"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChangeText={(text) => {
              setMobile(text);
              if (error) setError('');
            }}
            keyboardType="number-pad"
            maxLength={10}
            required
          />

          <AppInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            secureTextEntry
            required
          />

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <AppButton
            title="Sign In"
            variant="primary"
            onPress={handleSignIn}
            loading={loading}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <AppButton
            title="Continue with OTP"
            variant="outline"
            onPress={() => navigation.navigate('OTPVerification')}
          />

          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.providerSection}>
            <View style={styles.thinDivider} />
            <Text style={styles.providerPrompt}>Are you a Healthcare Provider?</Text>
            <AppButton
              title="Provider Login"
              variant="secondary"
              onPress={() => navigation.navigate('ProviderLogin')}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    backgroundColor: COLORS.primaryDark,
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
  logoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  langSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langText: {
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
    color: '#E0F2FE',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 14,
  },
  noAccountText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  createAccountText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  providerSection: {
    marginTop: 10,
    paddingTop: 14,
  },
  thinDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  providerPrompt: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
});
