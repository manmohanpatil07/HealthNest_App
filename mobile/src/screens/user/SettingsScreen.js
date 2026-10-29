import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { COLORS } from '../../constants';
import { ConfirmationDialog } from '../../components';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { role, logout } = useAuth();
  const isProvider = role === 'healthcare_provider';

  // State
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [language, setLanguage] = useState('English'); // English / Marathi
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Permission statuses: 'granted' | 'denied' | 'undetermined' | 'checking'
  const [cameraStatus, setCameraStatus] = useState('checking');
  const [locationStatus, setLocationStatus] = useState('checking');

  const checkPermissions = async () => {
    try {
      // Check Camera Permission
      if (Camera && Camera.getCameraPermissionsAsync) {
        const cam = await Camera.getCameraPermissionsAsync();
        setCameraStatus(cam.status);
      } else {
        setCameraStatus('undetermined');
      }
    } catch (e) {
      console.warn('Error checking camera permission:', e);
      setCameraStatus('undetermined');
    }

    try {
      // Check Location Permission
      if (Location && Location.getForegroundPermissionsAsync) {
        const loc = await Location.getForegroundPermissionsAsync();
        setLocationStatus(loc.status);
      } else {
        setLocationStatus('undetermined');
      }
    } catch (e) {
      console.warn('Error checking location permission:', e);
      setLocationStatus('undetermined');
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const handleRequestCamera = async () => {
    try {
      if (Camera && Camera.requestCameraPermissionsAsync) {
        const res = await Camera.requestCameraPermissionsAsync();
        setCameraStatus(res.status);
        if (res.status === 'granted') {
          Alert.alert('Permission Granted', 'Camera access has been enabled for QR scanning.');
        } else if (!res.canAskAgain) {
          showOpenSettingsAlert('Camera');
        }
      } else {
        openSystemSettings();
      }
    } catch (e) {
      console.warn('Error requesting camera permission:', e);
      openSystemSettings();
    }
  };

  const handleRequestLocation = async () => {
    try {
      if (Location && Location.requestForegroundPermissionsAsync) {
        const res = await Location.requestForegroundPermissionsAsync();
        setLocationStatus(res.status);
        if (res.status === 'granted') {
          Alert.alert('Permission Granted', 'Location access has been enabled for Hospital Finder.');
        } else if (!res.canAskAgain) {
          showOpenSettingsAlert('Location');
        }
      } else {
        openSystemSettings();
      }
    } catch (e) {
      console.warn('Error requesting location permission:', e);
      openSystemSettings();
    }
  };

  const showOpenSettingsAlert = (permName) => {
    Alert.alert(
      `${permName} Permission Required`,
      `${permName} permission is blocked in system settings. Please enable it in device settings to use this feature.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openSystemSettings },
      ]
    );
  };

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  const renderStatusBadge = (status) => {
    if (status === 'granted') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeGranted]}>
          <Text style={[styles.statusBadgeText, styles.statusTextGranted]}>Allowed ✓</Text>
        </View>
      );
    }
    if (status === 'denied') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeDenied]}>
          <Text style={[styles.statusBadgeText, styles.statusTextDenied]}>Denied ✕</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusBadgePending]}>
        <Text style={[styles.statusBadgeText, styles.statusTextPending]}>Not Set</Text>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              if (isProvider) {
                navigation.navigate('ProviderProfile');
              } else {
                navigation.navigate('Profile');
              }
            }}
          >
            <Text style={styles.rowIcon}>👤</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>{isProvider ? 'Provider Profile' : 'Edit Profile'}</Text>
              <Text style={styles.rowSubtitle}>
                {isProvider ? 'View provider credentials & details' : 'Update personal health information'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences: Language & Notifications */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>

          {/* Language Selector */}
          <View style={styles.rowBetween}>
            <View style={styles.iconWithText}>
              <Text style={styles.rowIcon}>🌐</Text>
              <View>
                <Text style={styles.rowTitle}>Language</Text>
                <Text style={styles.rowSubtitle}>Choose app display language</Text>
              </View>
            </View>
            <View style={styles.pillContainer}>
              <TouchableOpacity
                style={[styles.langPill, language === 'English' && styles.langPillActive]}
                onPress={() => setLanguage('English')}
              >
                <Text style={[styles.langPillText, language === 'English' && styles.langPillTextActive]}>
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langPill, language === 'Marathi' && styles.langPillActive]}
                onPress={() => setLanguage('Marathi')}
              >
                <Text style={[styles.langPillText, language === 'Marathi' && styles.langPillTextActive]}>
                  मराठी
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Notifications Toggle */}
          <View style={styles.rowBetween}>
            <View style={styles.iconWithText}>
              <Text style={styles.rowIcon}>🔔</Text>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.rowTitle}>Notifications</Text>
                <Text style={styles.rowSubtitle}>
                  {isProvider ? 'Access audit logs & session alerts' : 'Vaccination reminders & health updates'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: isProvider ? '#99F6E4' : '#BAE6FD' }}
              thumbColor={notificationsEnabled ? (isProvider ? COLORS.secondary : COLORS.primary) : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Device Permissions Overview */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>PERMISSIONS MANAGEMENT</Text>
            <TouchableOpacity onPress={checkPermissions}>
              <Text style={styles.refreshLink}>Refresh ↻</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.permissionIntro}>
            Android permissions are managed by system security. You can request access or open App Settings below:
          </Text>

          {/* Camera Permission */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionHeaderRow}>
              <View style={styles.permTitleRow}>
                <Text style={styles.rowIcon}>📷</Text>
                <View>
                  <Text style={styles.permName}>Camera</Text>
                  <Text style={styles.permDesc}>Required for scanning Patient QR codes</Text>
                </View>
              </View>
              {renderStatusBadge(cameraStatus)}
            </View>
            <View style={styles.permActionRow}>
              {cameraStatus !== 'granted' ? (
                <TouchableOpacity
                  style={styles.permRequestBtn}
                  onPress={handleRequestCamera}
                >
                  <Text style={styles.permRequestBtnText}>Request Access</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.permSettingsBtn}
                onPress={openSystemSettings}
              >
                <Text style={styles.permSettingsBtnText}>System Settings ↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Location Permission */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionHeaderRow}>
              <View style={styles.permTitleRow}>
                <Text style={styles.rowIcon}>📍</Text>
                <View>
                  <Text style={styles.permName}>Location</Text>
                  <Text style={styles.permDesc}>Used to find nearby PM-JAY empanelled hospitals</Text>
                </View>
              </View>
              {renderStatusBadge(locationStatus)}
            </View>
            <View style={styles.permActionRow}>
              {locationStatus !== 'granted' ? (
                <TouchableOpacity
                  style={styles.permRequestBtn}
                  onPress={handleRequestLocation}
                >
                  <Text style={styles.permRequestBtnText}>Request Access</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.permSettingsBtn}
                onPress={openSystemSettings}
              >
                <Text style={styles.permSettingsBtnText}>System Settings ↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Documents / Storage Note */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionHeaderRow}>
              <View style={styles.permTitleRow}>
                <Text style={styles.rowIcon}>📄</Text>
                <View>
                  <Text style={styles.permName}>Medical Documents & Storage</Text>
                  <Text style={styles.permDesc}>Managed safely via System File Picker</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, styles.statusBadgeGranted]}>
                <Text style={[styles.statusBadgeText, styles.statusTextGranted]}>System Picker ✓</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>ℹ️</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>About HealthNest</Text>
              <Text style={styles.rowSubtitle}>Version 1.0.0 (Production Release)</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowIcon}>🛡️</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Consent & Audit Security</Text>
              <Text style={styles.rowSubtitle}>Role-based access with encrypted QR tokens</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutDialog(true)}
        >
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          HealthNest v1.0 · Secure Digital Health Platform
        </Text>
      </ScrollView>

      {/* Logout Confirmation Bottom Sheet */}
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
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  refreshLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  langPillTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  permissionIntro: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  permissionItem: {
    paddingVertical: 6,
  },
  permissionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  permName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  permDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeGranted: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeDenied: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgePending: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextGranted: {
    color: '#059669',
  },
  statusTextDenied: {
    color: '#DC2626',
  },
  statusTextPending: {
    color: COLORS.textSecondary,
  },
  permActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingLeft: 32,
  },
  permRequestBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permRequestBtnText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  permSettingsBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permSettingsBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
});
