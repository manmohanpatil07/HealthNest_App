import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants';
import { LoadingSpinner, ErrorMessage, ConfirmationDialog } from '../../components';
import { providerService } from '../../services/providerService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProviderProfileScreen({ navigation }) {
  const { user: authUser, logout } = useAuth();
  const { t } = useLanguage();
  const [provider, setProvider] = useState(authUser || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const fetchProviderProfile = async () => {
    try {
      setError('');
      const res = await providerService.getProfile();
      if (res && res.success && res.provider) {
        setProvider(res.provider);
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

  const handleConfirmLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  const fullName = provider?.full_name || 'Dr. Rajesh Mehta';
  const providerType = provider?.provider_type || 'General Physician';
  const clinicName = provider?.clinic_name || 'City Clinic, Pune';
  const mobile = provider?.mobile || 'Not available';
  const email = provider?.email || 'Not available';
  const city = provider?.city || 'Pune';
  const state = provider?.state || 'Maharashtra';
  const providerId = provider?.provider_id ? `#PRV-${provider.provider_id}` : '#PRV-2394';

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('provider.providerProfileTitle')}</Text>
        <TouchableOpacity
          style={styles.headerSettingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.headerSettingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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

            {/* Profile Hero Card */}
            <View style={styles.profileHeroCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
              </View>
              <Text style={styles.providerName}>{fullName}</Text>
              <Text style={styles.providerType}>{providerType}</Text>

              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>{t('common.verifiedProvider')}</Text>
                </View>
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>{providerId}</Text>
                </View>
              </View>
            </View>

            {/* Provider Details Card */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>{t('provider.providerDetails')}</Text>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('profile.fullName')}</Text>
                <Text style={styles.fieldValue}>{fullName}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('auth.providerType')}</Text>
                <Text style={styles.fieldValue}>{providerType}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('auth.clinicName')}</Text>
                <Text style={styles.fieldValue}>{clinicName}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('profile.mobileNumber')}</Text>
                <Text style={styles.fieldValue}>{mobile}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('profile.email')}</Text>
                <Text style={styles.fieldValue}>{email}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('profile.city')}</Text>
                <Text style={styles.fieldValue}>{city}</Text>
              </View>

              <View style={[styles.fieldRow, styles.noBorder]}>
                <Text style={styles.fieldLabel}>{t('profile.state')}</Text>
                <Text style={styles.fieldValue}>{state}</Text>
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
    </View>
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
});

