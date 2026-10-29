import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants';
import { LoadingSpinner, ErrorMessage, ConfirmationDialog, AppInput, AppButton } from '../../components';
import { providerService } from '../../services/providerService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProviderProfileScreen({ navigation }) {
  const { user: authUser, updateUser, logout } = useAuth();
  const { t } = useLanguage();
  const [provider, setProvider] = useState(authUser || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [providerType, setProviderType] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const populateForm = (data) => {
    setFullName(data?.full_name || '');
    setMobile(data?.mobile || '');
    setEmail(data?.email || '');
    setProviderType(data?.provider_type || 'General Physician');
    setClinicName(data?.clinic_name || '');
    setCity(data?.city || '');
    setState(data?.state || '');
  };

  const fetchProviderProfile = async () => {
    try {
      setError('');
      const res = await providerService.getProfile();
      if (res && res.success && res.provider) {
        setProvider(res.provider);
        populateForm(res.provider);
      }
    } catch (err) {
      console.warn('[ProviderProfileScreen] fetch profile error:', err);
      setError(err.response?.data?.message || 'Failed to load provider profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProviderProfile();
  }, []);

  const handleStartEdit = () => {
    populateForm(provider);
    setError('');
    setSuccessMsg('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    populateForm(provider);
    setError('');
    setSuccessMsg('');
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccessMsg('');

    // Validation
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!mobile.trim()) {
      setError('Mobile number is required.');
      return;
    }

    if (mobile.trim().length !== 10 || !/^[0-9]+$/.test(mobile.trim())) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        full_name: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || null,
        provider_type: providerType.trim() || 'General Physician',
        clinic_name: clinicName.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
      };

      const res = await providerService.updateProfile(payload);
      if (res && res.success && res.provider) {
        setProvider(res.provider);
        populateForm(res.provider);
        if (updateUser) {
          await updateUser(res.provider);
        }
        setIsEditing(false);
        setSuccessMsg(res.message || 'Provider profile updated successfully.');
      } else {
        setError(res?.message || 'Failed to update provider profile.');
      }
    } catch (err) {
      console.warn('[ProviderProfileScreen] update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  const displayFullName = provider?.full_name || 'Dr. Rajesh Mehta';
  const displayProviderType = provider?.provider_type || 'General Physician';
  const displayClinicName = provider?.clinic_name || 'City Clinic, Pune';
  const displayMobile = provider?.mobile || 'Not available';
  const displayEmail = provider?.email || 'Not available';
  const displayCity = provider?.city || 'Pune';
  const displayState = provider?.state || 'Maharashtra';
  const providerId = provider?.provider_id ? `#PRV-${provider.provider_id}` : '#PRV-2394';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screenContainer}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (isEditing ? handleCancelEdit() : navigation.goBack())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Provider Profile' : t('provider.providerProfileTitle')}
        </Text>
        {!isEditing ? (
          <TouchableOpacity
            style={styles.headerSettingsBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.headerSettingsIcon}>⚙️</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProviderProfile();
            }}
            colors={[COLORS.secondary]}
          />
        }
      >
        {loading ? (
          <LoadingSpinner message="Loading provider profile..." />
        ) : (
          <>
            {error ? <ErrorMessage message={error} /> : null}
            {successMsg ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✓ {successMsg}</Text>
              </View>
            ) : null}

            {/* Profile Hero Card */}
            <View style={styles.profileHeroCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
              </View>
              <Text style={styles.providerName}>{displayFullName}</Text>
              <Text style={styles.providerType}>{displayProviderType}</Text>

              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>{t('common.verifiedProvider')}</Text>
                </View>
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>{providerId}</Text>
                </View>
              </View>
            </View>

            {isEditing ? (
              /* Edit Mode Form Card */
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>EDIT PROVIDER DETAILS</Text>

                <AppInput
                  label={`${t('profile.fullName')} *`}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Dr. Rajesh Mehta"
                  autoCapitalize="words"
                />

                <AppInput
                  label={`${t('auth.providerType')} *`}
                  value={providerType}
                  onChangeText={setProviderType}
                  placeholder="e.g. General Physician, Pediatrician"
                />

                <AppInput
                  label={t('auth.clinicName')}
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholder="e.g. City Clinic"
                />

                <AppInput
                  label={`${t('profile.mobileNumber')} *`}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <AppInput
                  label={t('profile.email')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. doctor@clinic.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <AppInput
                  label={t('profile.city')}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Pune"
                />

                <AppInput
                  label={t('profile.state')}
                  value={state}
                  onChangeText={setState}
                  placeholder="e.g. Maharashtra"
                />

                {/* Save and Cancel Buttons */}
                <View style={styles.editBtnRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <AppButton
                      title="Cancel"
                      variant="outline"
                      onPress={handleCancelEdit}
                      disabled={saving}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <AppButton
                      title="Save Changes"
                      variant="secondary"
                      onPress={handleSaveProfile}
                      loading={saving}
                      disabled={saving}
                    />
                  </View>
                </View>
              </View>
            ) : (
              /* View Mode Cards */
              <>
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.sectionLabel}>{t('provider.providerDetails')}</Text>
                    <TouchableOpacity
                      style={styles.editActionBtn}
                      onPress={handleStartEdit}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editActionText}>✏️ Edit</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{t('profile.fullName')}</Text>
                    <Text style={styles.fieldValue}>{displayFullName}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{t('auth.providerType')}</Text>
                    <Text style={styles.fieldValue}>{displayProviderType}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{t('auth.clinicName')}</Text>
                    <Text style={styles.fieldValue}>{displayClinicName}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{t('profile.mobileNumber')}</Text>
                    <Text style={styles.fieldValue}>{displayMobile}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{t('profile.email')}</Text>
                    <Text style={styles.fieldValue}>{displayEmail}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{t('profile.city')}</Text>
                    <Text style={styles.fieldValue}>{displayCity}</Text>
                  </View>

                  <View style={[styles.fieldRow, styles.noBorder]}>
                    <Text style={styles.fieldLabel}>{t('profile.state')}</Text>
                    <Text style={styles.fieldValue}>{displayState}</Text>
                  </View>
                </View>

                {/* Settings Quick Access Card */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>{t('profile.preferencesSecurity')}</Text>
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <Text style={styles.actionIcon}>⚙️</Text>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>{t('profile.settingsPermissions')}</Text>
                      <Text style={styles.actionSubtitle}>{t('profile.settingsSub')}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                </View>

                {/* Verified Provider Note Card */}
                <View style={styles.noteCard}>
                  <Text style={styles.noteHeading}>{t('provider.providerAccountNote')}</Text>
                  <Text style={styles.noteBody}>
                    {t('provider.providerAccountDesc')}
                  </Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={() => setShowLogoutDialog(true)}
                >
                  <Text style={styles.logoutBtnText}>{t('common.logout')}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Logout Confirmation Bottom Sheet */}
      <ConfirmationDialog
        visible={showLogoutDialog}
        title="Logout?"
        message="You'll be signed out of your Healthcare Provider portal."
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Provider background per UI_INSTRUCTIONS Section 4 & 32
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 52 : 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 20,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSettingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSettingsIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#A7F3D0',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  providerType: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  idBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  idBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    flex: 1.5,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  noteCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  noteHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
  },
  logoutBtn: {
    backgroundColor: COLORS.redBg,
    borderColor: COLORS.redBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editActionBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  editActionText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  editBtnRow: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 4,
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  successText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
});

