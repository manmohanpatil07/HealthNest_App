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
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import { useLanguage } from '../../context/LanguageContext';
import { SERVER_ROOT_URL } from '../../services/api';

export default function ProfileScreen({ navigation }) {
  const { user: authUser, updateUser, logout } = useAuth();
  const { t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const handlePickFromGallery = async () => {
    setPhotoModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError(t('profile.permissionDenied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[ProfileScreen] Gallery pick error:', err);
      setError('Failed to select photo from gallery.');
    }
  };

  const handleTakePhoto = async () => {
    setPhotoModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError(t('profile.cameraPermissionDenied'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[ProfileScreen] Camera capture error:', err);
      setError('Failed to capture photo with camera.');
    }
  };

  const handleUploadPhoto = async (uri) => {
    try {
      setUploadingPhoto(true);
      setError('');
      setSuccessMsg('');

      const response = await userService.uploadProfilePhoto(uri);
      if (response && response.success) {
        const updated = {
          ...profile,
          profile_image_url: response.profile_image_url,
        };
        setProfile(updated);
        updateUser(updated);
        setSuccessMsg(t('profile.photoUpdated'));
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(response?.message || 'Failed to upload photo.');
      }
    } catch (err) {
      console.warn('[ProfileScreen] Photo upload error:', err);
      setError(err.response?.data?.message || 'Error uploading profile photo. Check your connection.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoModalVisible(false);
    try {
      setUploadingPhoto(true);
      setError('');
      setSuccessMsg('');

      const response = await userService.removeProfilePhoto();
      if (response && response.success) {
        const updated = {
          ...profile,
          profile_image_url: null,
        };
        setProfile(updated);
        updateUser(updated);
        setSuccessMsg(t('profile.photoRemoved'));
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(response?.message || 'Failed to remove photo.');
      }
    } catch (err) {
      console.warn('[ProfileScreen] Photo removal error:', err);
      setError(err.response?.data?.message || 'Error removing photo.');
    } finally {
      setUploadingPhoto(false);
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
          <Text style={styles.headerTitle}>{t('profile.myProfile')}</Text>
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
            <Text style={styles.headerActionText}>{isEditing ? t('common.cancel') : t('common.edit')}</Text>
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

              {/* Profile Avatar Card per Section 23 with Real Photo Support */}
              <View style={styles.profileHeroCard}>
                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={() => setPhotoModalVisible(true)}
                  activeOpacity={0.8}
                >
                  {uploadingPhoto ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : profile?.profile_image_url ? (
                    <Image
                      source={{
                        uri: profile.profile_image_url.startsWith('http')
                          ? profile.profile_image_url
                          : `${SERVER_ROOT_URL}${profile.profile_image_url}`,
                      }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarEmoji}>
                      {profile?.gender === 'Female' ? '👩' : '👨'}
                    </Text>
                  )}
                  <View style={styles.cameraPill}>
                    <Text style={styles.cameraIcon}>📷</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPhotoModalVisible(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.changePhotoText}>{t('profile.changePhoto')}</Text>
                </TouchableOpacity>
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
                    <Text style={styles.sectionLabel}>{t('profile.healthInfo')}</Text>
                    <ProfileField
                      label={t('profile.bloodGroup')}
                      value={profile?.blood_group}
                    />
                    <ProfileField
                      label={t('profile.emergencyContact')}
                      value={profile?.emergency_contact}
                      isLast
                    />
                  </View>

                  {/* Personal Information Card per Section 23 */}
                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>{t('profile.personalInfo')}</Text>
                    <ProfileField label={t('profile.fullName')} value={profile?.full_name} />
                    <ProfileField label={t('profile.mobileNumber')} value={profile?.mobile} />
                    <ProfileField label={t('profile.email')} value={profile?.email} />
                    <ProfileField
                      label={t('profile.dob')}
                      value={
                        profile?.date_of_birth
                          ? profile.date_of_birth.substring(0, 10)
                          : null
                      }
                    />
                    <ProfileField label={t('profile.gender')} value={profile?.gender} />
                    <ProfileField label={t('profile.city')} value={profile?.city} />
                    <ProfileField label={t('profile.state')} value={profile?.state} isLast />
                  </View>

                  {/* Settings & Preferences Card */}
                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>{t('profile.preferencesSecurity')}</Text>
                    <TouchableOpacity
                      style={styles.settingsRow}
                      onPress={() => navigation.navigate('Settings')}
                    >
                      <Text style={styles.settingsRowIcon}>⚙️</Text>
                      <View style={styles.settingsRowContent}>
                        <Text style={styles.settingsRowTitle}>{t('profile.settingsPermissions')}</Text>
                        <Text style={styles.settingsRowSubtitle}>{t('profile.settingsSub')}</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Logout Action per Section 23 & 3.10 */}
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => setShowLogoutDialog(true)}
                  >
                    <Text style={styles.logoutBtnText}>{t('common.logout')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* Edit Mode Form */
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>{t('profile.editProfile')}</Text>

                  <AppInput
                    label={t('profile.fullName')}
                    value={fullName}
                    onChangeText={setFullName}
                    required
                  />

                  <AppInput
                    label={`${t('profile.mobileNumber')} (Immutable)`}
                    value={profile?.mobile}
                    editable={false}
                  />

                  <AppInput
                    label={t('profile.email')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                  />

                  <AppInput
                    label={t('profile.dob')}
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    placeholder="YYYY-MM-DD"
                  />

                  <View style={styles.genderContainer}>
                    <Text style={styles.fieldLabel}>{t('profile.gender')}</Text>
                    <View style={styles.genderRow}>
                      {[
                        { key: 'Male', label: t('auth.male') },
                        { key: 'Female', label: t('auth.female') },
                        { key: 'Other', label: t('auth.other') },
                      ].map((item) => (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.genderOption,
                            gender === item.key && styles.genderOptionActive,
                          ]}
                          onPress={() => setGender(item.key)}
                        >
                          <Text
                            style={[
                              styles.genderOptionText,
                              gender === item.key && styles.genderOptionTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <AppInput
                    label={t('profile.bloodGroup')}
                    placeholder="e.g. B+, O+, A+, AB-"
                    value={bloodGroup}
                    onChangeText={setBloodGroup}
                  />

                  <AppInput
                    label={t('profile.emergencyContact')}
                    placeholder="10-digit mobile number"
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    keyboardType="number-pad"
                    maxLength={10}
                  />

                  <AppInput
                    label={t('profile.city')}
                    value={city}
                    onChangeText={setCity}
                  />

                  <AppInput
                    label={t('profile.state')}
                    value={state}
                    onChangeText={setState}
                  />

                  <View style={styles.editActionRow}>
                    <AppButton
                      title={t('common.saveChanges')}
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

      {/* Photo Picker Bottom Action Sheet Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoModalVisible(false)}
        >
          <View style={styles.photoActionSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('profile.changePhoto')}</Text>

            <TouchableOpacity style={styles.sheetActionItem} onPress={handlePickFromGallery}>
              <Text style={styles.sheetActionEmoji}>🖼️</Text>
              <Text style={styles.sheetActionText}>{t('profile.chooseFromGallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetActionItem} onPress={handleTakePhoto}>
              <Text style={styles.sheetActionEmoji}>📸</Text>
              <Text style={styles.sheetActionText}>{t('profile.takePhoto')}</Text>
            </TouchableOpacity>

            {profile?.profile_image_url ? (
              <TouchableOpacity style={styles.sheetActionItem} onPress={handleRemovePhoto}>
                <Text style={styles.sheetActionEmoji}>🗑️</Text>
                <Text style={[styles.sheetActionText, styles.sheetActionDelete]}>
                  {t('profile.removePhoto')}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={styles.sheetCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  cameraPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  cameraIcon: {
    fontSize: 13,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  photoActionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetActionEmoji: {
    fontSize: 20,
    marginRight: 14,
  },
  sheetActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  sheetActionDelete: {
    color: '#DC2626',
  },
  sheetCancelBtn: {
    marginTop: 14,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
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
