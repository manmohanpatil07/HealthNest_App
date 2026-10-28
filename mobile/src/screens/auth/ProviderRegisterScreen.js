import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants';
import { AppInput, AppButton, ErrorMessage } from '../../components';
import { providerService } from '../../services/providerService';

export default function ProviderRegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name or doctor name.');
      return;
    }

    if (!mobile.trim() || mobile.trim().length !== 10 || !/^[0-9]+$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        full_name: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || null,
        provider_type: 'healthcare_provider',
        clinic_name: clinicName.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        password,
      };

      const response = await providerService.register(payload);

      if (response && response.success) {
        setSuccess(true);
        Alert.alert(
          'Registration Successful',
          'Your Healthcare Provider account has been created successfully. Please sign in.',
          [
            {
              text: 'Sign In Now',
              onPress: () => navigation.navigate('ProviderLogin'),
            },
          ]
        );
      } else {
        setError(response?.message || 'Provider registration failed.');
      }
    } catch (err) {
      console.warn('[ProviderRegisterScreen] Error:', err);
      const apiMessage = err.response?.data?.message;
      setError(apiMessage || 'Unable to complete provider registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Section matching Provider Teal theme */}
        <View style={styles.heroSection}>
          <View style={styles.topBar}>
            <View style={styles.badgeRow}>
              <View style={styles.doctorBadge}>
                <Text style={styles.doctorBadgeIcon}>🩺</Text>
              </View>
              <Text style={styles.portalTag}>HEALTHCARE PROVIDER PORTAL</Text>
            </View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('ProviderLogin')}
            >
              <Text style={styles.backBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeTitle}>Create Provider Account</Text>
          <Text style={styles.welcomeSubtitle}>
            Register your clinic or practice for secure QR patient access
          </Text>
        </View>

        {/* Form Container Card */}
        <View style={styles.sheetContainer}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>🛡️</Text>
            <Text style={styles.infoBannerText}>
              Verified provider access enables HIPAA-aligned, read-only QR code patient health records scanning.
            </Text>
          </View>

          {error ? <ErrorMessage message={error} /> : null}

          {success ? (
            <View style={styles.successBanner}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>
                Account created successfully! Redirecting to login...
              </Text>
            </View>
          ) : null}

          <AppInput
            label="Full Name / Dr. Name"
            placeholder="e.g. Dr. Priya Deshmukh"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (error) setError('');
            }}
            required
          />

          <AppInput
            label="Mobile Number"
            placeholder="10-digit mobile number"
            value={mobile}
            onChangeText={(text) => {
              setMobile(text);
              if (error) setError('');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            required
          />

          <AppInput
            label="Email Address (Optional)"
            placeholder="doctor@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppInput
            label="Clinic / Hospital Name"
            placeholder="e.g. LifeCare Clinic"
            value={clinicName}
            onChangeText={(text) => {
              setClinicName(text);
              if (error) setError('');
            }}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <AppInput
                label="City"
                placeholder="e.g. Mumbai"
                value={city}
                onChangeText={(text) => {
                  setCity(text);
                  if (error) setError('');
                }}
              />
            </View>
            <View style={styles.halfCol}>
              <AppInput
                label="State"
                placeholder="e.g. Maharashtra"
                value={state}
                onChangeText={(text) => {
                  setState(text);
                  if (error) setError('');
                }}
              />
            </View>
          </View>

          <AppInput
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            secureTextEntry
            required
          />

          <AppInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError('');
            }}
            secureTextEntry
            required
          />

          <View style={styles.spacer} />

          <AppButton
            title="Register Provider Account"
            variant="secondary"
            onPress={handleRegister}
            loading={loading}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginPromptText}>Already have a provider account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderLogin')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.userLoginRow}>
            <Text style={styles.userPromptText}>Looking for patient access? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.userLoginLink}>User Sign In</Text>
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
    paddingBottom: 24,
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
    fontSize: 11,
    letterSpacing: 0.8,
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
  successBanner: {
    flexDirection: 'row',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  successIcon: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCol: {
    flex: 0.48,
  },
  spacer: {
    height: 8,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginPromptText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: '#0D9488',
    fontWeight: '700',
    fontSize: 14,
  },
  userLoginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  userPromptText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  userLoginLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

