import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants';
import {
  ProfileField,
  AppInput,
  AppButton,
  LoadingSpinner,
  ErrorMessage,
  ConfirmationDialog,
  UserBottomNav,
} from '../../components';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user: authUser, updateUser, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Edit form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const fetchProfile = async () => {
    try {
      setError('');
      const response = await userService.getProfile();
      if (response && response.success && response.user) {
        setProfile(response.user);
        populateFields(response.user);
        updateUser(response.user);
      }
    } catch (err) {
      console.warn('[ProfileScreen] fetchProfile error:', err);
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const populateFields = (userData) => {
    setFullName(userData.full_name || '');
    setEmail(userData.email || '');
    setDateOfBirth(userData.date_of_birth ? userData.date_of_birth.substring(0, 10) : '');
    setGender(userData.gender || '');
    setCity(userData.city || '');
    setState(userData.state || '');
    setBloodGroup(userData.blood_group || '');
    setEmergencyContact(userData.emergency_contact || '');
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (emergencyContact.trim() && (!/^[0-9]{10}$/.test(emergencyContact.trim()))) {
      setError('Emergency contact must be a valid 10-digit number.');
      return;
    }

    try {
      setSaving(true);
      const updatePayload = {
        full_name: fullName.trim(),
        email: email.trim() || null,
        date_of_birth: dateOfBirth.trim() || null,
        gender: gender || null,
        city: city.trim() || null,
        state: state.trim() || null,
        blood_group: bloodGroup.trim() || null,
        emergency_contact: emergencyContact.trim() || null,
      };

      const response = await userService.updateProfile(updatePayload);
      if (response && response.success) {
        setProfile(response.user);
        populateFields(response.user);
        updateUser(response.user);
        setIsEditing(false);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(response.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.warn('[ProfileScreen] update error:', err);
      setError(err.response?.data?.message || 'Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header per Section 11 & 23 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerSettingsBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.headerSettingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {
              if (isEditing) {
                populateFields(profile || {});
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Text style={styles.headerActionText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProfile();
              }}
              colors={[COLORS.primary]}
            />
          }
        >
          {loading ? (
            <LoadingSpinner message="Loading profile..." />
          ) : (
            <>
              {error ? <ErrorMessage message={error} /> : null}

              {successMsg ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✓ {successMsg}</Text>
                </View>
              ) : null}

              {/* Profile Avatar Card per Section 23 */}
              <View style={styles.profileHeroCard}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarEmoji}>
                    {profile?.gender === 'Female' ? '👩' : '👨'}
                  </Text>
                </View>
                <Text style={styles.userName}>{profile?.full_name || 'HealthNest User'}</Text>
                <Text style={styles.userMobile}>{profile?.mobile}</Text>

                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>User</Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>Verified ✓</Text>
                  </View>
                </View>
              </View>

              {!isEditing ? (
                <>
                  {/* Health Info Card per Section 23 */}
                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>HEALTH INFO</Text>
                    <ProfileField
                      label="Blood Group"
                      value={profile?.blood_group}
                    />
                    <ProfileField
                      label="Emergency Contact"
                      value={profile?.emergency_contact}
                      isLast
                    />
                  </View>

                  {/* Personal Information Card per Section 23 */}
                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>
                    <ProfileField label="Full Name" value={profile?.full_name} />
                    <ProfileField label="Mobile Number" value={profile?.mobile} />
                    <ProfileField label="Email" value={profile?.email} />
                    <ProfileField
                      label="Date of Birth"
                      value={
                        profile?.date_of_birth
                          ? profile.date_of_birth.substring(0, 10)
                          : null
                      }
                    />
                    <ProfileField label="Gender" value={profile?.gender} />
                    <ProfileField label="City" value={profile?.city} />
                    <ProfileField label="State" value={profile?.state} isLast />
                  </View>

                  {/* Settings & Preferences Card */}
                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>PREFERENCES & SECURITY</Text>
                    <TouchableOpacity
                      style={styles.settingsRow}
                      onPress={() => navigation.navigate('Settings')}
                    >
                      <Text style={styles.settingsRowIcon}>⚙️</Text>
                      <View style={styles.settingsRowContent}>
                        <Text style={styles.settingsRowTitle}>Settings & Permissions</Text>
                        <Text style={styles.settingsRowSubtitle}>Language, notifications & device permissions</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Logout Action per Section 23 & 3.10 */}
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => setShowLogoutDialog(true)}
                  >
                    <Text style={styles.logoutBtnText}>Logout</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* Edit Mode Form */
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>EDIT PROFILE</Text>

                  <AppInput
                    label="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    required
                  />

                  <AppInput
                    label="Mobile Number (Immutable)"
                    value={profile?.mobile}
                    editable={false}
                  />

                  <AppInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                  />

                  <AppInput
                    label="Date of Birth (YYYY-MM-DD)"
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    placeholder="YYYY-MM-DD"
                  />

                  <View style={styles.genderContainer}>
                    <Text style={styles.fieldLabel}>Gender</Text>
                    <View style={styles.genderRow}>
                      {['Male', 'Female', 'Other'].map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderOption,
                            gender === g && styles.genderOptionActive,
                          ]}
                          onPress={() => setGender(g)}
                        >
                          <Text
                            style={[
                              styles.genderOptionText,
                              gender === g && styles.genderOptionTextActive,
                            ]}
                          >
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <AppInput
                    label="Blood Group"
                    placeholder="e.g. B+, O+, A+, AB-"
                    value={bloodGroup}
                    onChangeText={setBloodGroup}
                  />

                  <AppInput
                    label="Emergency Contact"
                    placeholder="10-digit mobile number"
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    keyboardType="number-pad"
                    maxLength={10}
                  />

                  <AppInput
                    label="City"
                    value={city}
                    onChangeText={setCity}
                  />

                  <AppInput
                    label="State"
                    value={state}
                    onChangeText={setState}
                  />

                  <View style={styles.editActionRow}>
                    <AppButton
                      title="Save Changes"
                      variant="primary"
                      onPress={handleSaveProfile}
                      loading={saving}
                    />
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Logout Confirmation Bottom Sheet per Section 23 */}
      <ConfirmationDialog
        visible={showLogoutDialog}
        title="Logout?"
        message="You'll be signed out. Your health data stays safe and secure."
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />

      {/* Bottom Navigation with Profile tab active per Section 12 & 23 */}
      <UserBottomNav activeTab="Profile" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  headerActionText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSettingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerSettingsIcon: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  userMobile: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  verifiedBadge: {
    backgroundColor: COLORS.greenBg,
    borderColor: COLORS.greenBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkTeal,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  successBanner: {
    backgroundColor: COLORS.greenBg,
    borderColor: COLORS.greenBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  successText: {
    color: COLORS.darkTeal,
    fontWeight: '700',
    fontSize: 14,
  },
  logoutBtn: {
    backgroundColor: COLORS.redBg,
    borderColor: COLORS.redBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  genderContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 3,
    backgroundColor: '#FFFFFF',
  },
  genderOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  genderOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genderOptionTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  editActionRow: {
    marginTop: 10,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingsRowIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsRowContent: {
    flex: 1,
  },
  settingsRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingsRowSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
});
