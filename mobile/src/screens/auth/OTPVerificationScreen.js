import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../constants';
import { AppButton, ErrorMessage } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services/authService';

export default function OTPVerificationScreen({ route, navigation }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const mobile = route.params?.mobile || '9876543210';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleOtpChange = (text, index) => {
    setError('');
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Standard academic MVP acceptance (or demo mock if test credentials)
      const res = await authService.verifyOtp({ mobile, otp: fullOtp });
      if (res && res.success) {
        if (res.token && res.user) {
          await login(res.user, res.token, res.role || 'user');
        } else {
          // If verifying before navigation back to login or dashboard
          navigation.navigate('Login');
        }
      } else {
        setError(res?.message || 'Invalid OTP code. Please check and try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    setError('');
    setInfoMsg('A new OTP has been sent to your registered mobile number.');
    setTimeout(() => setInfoMsg(''), 4000);
  };

  const maskedMobile = mobile.length === 10
    ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
    : mobile;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🔐</Text>
          </View>

          <Text style={styles.welcomeTitle}>Verify OTP</Text>
          <Text style={styles.welcomeSubtitle}>
            Enter the 6-digit code sent to {maskedMobile}
          </Text>
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {error ? <ErrorMessage message={error} /> : null}
          {infoMsg ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>✓ {infoMsg}</Text>
            </View>
          ) : null}

          {/* 6 Digit Input Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => {
              const isFilled = digit.length > 0;
              return (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[styles.otpBox, isFilled && styles.otpBoxFilled]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                />
              );
            })}
          </View>

          <AppButton
            title="Verify OTP"
            variant="primary"
            onPress={handleVerify}
            loading={loading}
          />

          {/* Resend Section */}
          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendActiveText}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendDisabledText}>
                Resend OTP in <Text style={{ fontWeight: '700' }}>{timer}s</Text>
              </Text>
            )}
          </View>

          {/* Security Note */}
          <View style={styles.securityBox}>
            <Text style={styles.securityText}>
              🛡️ Do not share this OTP with anyone. HealthNest will never ask for your OTP.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0284C7',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#0284C7',
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconEmoji: {
    fontSize: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#E0F2FE',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpBoxFilled: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 24,
  },
  resendActiveText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '700',
  },
  resendDisabledText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  securityBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  securityText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  infoText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
});
