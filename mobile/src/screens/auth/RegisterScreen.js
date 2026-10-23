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

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!mobile.trim() || mobile.trim().length !== 10 || !/^[0-9]+$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!dateOfBirth.trim()) {
      setError('Please enter your date of birth (YYYY-MM-DD).');
      return;
    }

    // Simple date format check YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      setError('Date of birth must be in YYYY-MM-DD format (e.g. 1995-03-15).');
      return;
    }

    if (!gender) {
      setError('Please select your gender.');
      return;
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
        date_of_birth: dateOfBirth.trim(),
        gender,
        city: city.trim() || null,
        state: state.trim() || null,
        password,
      };

      const response = await authService.register(payload);

      if (response && response.success && response.token) {
        await login(response.user, response.token, response.role);
      } else {
        setError(response.message || 'Registration failed.');
      }
    } catch (err) {
      console.warn('[RegisterScreen] Error:', err);
      const apiMessage = err.response?.data?.message;
      setError(apiMessage || 'Unable to complete registration. Please try again.');
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
        {/* Top Hero */}
        <View style={styles.heroSection}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subtitle}>Join HealthNest — free, secure health records</Text>
        </View>

        {/* Form Container */}
        <View style={styles.sheetContainer}>
          {error ? <ErrorMessage message={error} /> : null}

          {/* 1. Full Name * */}
          <AppInput
            label="Full Name"
            placeholder="Your full name"
            value={fullName}
            onChangeText={setFullName}
            required
          />

          {/* 2. Mobile Number * */}
          <AppInput
            label="Mobile Number"
            placeholder="10-digit mobile number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="number-pad"
            maxLength={10}
            required
          />

          {/* 3. Email (optional) */}
          <AppInput
            label="Email (optional)"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          {/* 4. Date of Birth * */}
          <AppInput
            label="Date of Birth (YYYY-MM-DD)"
            placeholder="YYYY-MM-DD (e.g. 1995-03-15)"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            required
          />

          {/* 5. Gender * */}
          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>
              Gender <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.genderButtonGroup}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === g && styles.genderButtonTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 6. City */}
          <AppInput
            label="City"
            placeholder="Your city"
            value={city}
            onChangeText={setCity}
          />

          {/* 7. State */}
          <AppInput
            label="State"
            placeholder="Your state"
            value={state}
            onChangeText={setState}
          />

          {/* 8. Password * */}
          <AppInput
            label="Password"
            placeholder="Create a strong password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            required
          />

          {/* 9. Confirm Password * */}
          <AppInput
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            required
          />

          {/* Terms Box */}
          <View style={styles.termsBox}>
            <Text style={styles.termsText}>
              By registering, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

          {/* Primary Submit Button */}
          <AppButton
            title="Create Account"
            variant="primary"
            onPress={handleRegister}
            loading={loading}
          />

          <View style={styles.loginRow}>
            <Text style={styles.alreadyAccountText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Sign In</Text>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingBottom: 36,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#E0F2FE',
  },
  sheetContainer: {
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
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.danger,
  },
  genderButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  genderButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  genderButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  termsBox: {
    backgroundColor: COLORS.neutralSurface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  alreadyAccountText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
