import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { providerService } from '../../services/providerService';
import { ConfirmationDialog } from '../../components';

export default function ProviderDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [providerData, setProviderData] = useState(user || null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);

  const fetchProviderProfile = async () => {
    try {
      setLoading(true);
      const res = await providerService.getProfile();
      if (res && res.success && res.provider) {
        setProviderData(res.provider);
      }
    } catch (err) {
      console.warn('[ProviderDashboardScreen] Error fetching profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProviderProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProviderProfile();
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  const providerName = providerData?.full_name || 'Dr. Rajesh Mehta';
  const providerType = providerData?.provider_type || 'General Physician';
  const clinicName = providerData?.clinic_name || 'City Clinic, Pune';
  const providerId = providerData?.provider_id ? `#PRV-${providerData.provider_id}` : '#PRV-2394';
  const cityState = [providerData?.city, providerData?.state].filter(Boolean).join(', ') || 'Pune, MH';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* Hero Section with Teal / Emerald Theme */}
        <View style={styles.heroSection}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.roleHeader}>{t('provider.roleHeader')}</Text>
              <Text style={styles.providerNameText}>{providerName}</Text>
              <Text style={styles.clinicSubtitle}>{providerType} · {clinicName}</Text>
            </View>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('ProviderProfile')}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* Secure Provider Session Card */}
          <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => setSessionModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.sessionLeft}>
              <View style={styles.shieldIconBg}>
                <Text style={styles.shieldIcon}>🛡️</Text>
              </View>
              <View style={styles.sessionTextCol}>
                <Text style={styles.sessionTitle}>{t('provider.secureSession')}</Text>
                <Text style={styles.sessionSubtext}>{t('provider.secureSessionSub')}</Text>
              </View>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>{t('common.active')}</Text>
            </View>
          </TouchableOpacity>

          {/* Primary CTA - Scan Patient QR Card */}
          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => navigation.navigate('ScanQR')}
            activeOpacity={0.85}
          >
            <View style={styles.ctaIconArea}>
              <Text style={styles.ctaIcon}>📷</Text>
            </View>
            <View style={styles.ctaTextArea}>
              <Text style={styles.ctaTitle}>{t('provider.scanPatientQR')}</Text>
              <Text style={styles.ctaSubtitle}>{t('provider.scanQRSub')}</Text>
            </View>
            <View style={styles.ctaArrow}>
              <Text style={styles.ctaArrowText}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Info Cards (Two-column layout) */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t('provider.todaysScans')}</Text>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statFooter}>{t('provider.patientRecordsAccessed')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t('provider.providerId')}</Text>
              <Text style={[styles.statNumber, { fontSize: 20 }]}>{providerId}</Text>
              <Text style={styles.statFooter}>{t('common.verifiedProvider')}</Text>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('provider.recentActivity')}</Text>
            <Text style={styles.sectionCount}>{t('common.today')}</Text>
          </View>

          <View style={styles.activityList}>
            <View style={styles.activityCard}>
              <View style={styles.activityIconBg}>
                <Text style={styles.activityEmoji}>👤</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityPatient}>Anita Joshi</Text>
                <Text style={styles.activityDetail}>Patient record · 10:32 AM</Text>
              </View>
              <View style={styles.statusSuccessBadge}>
                <Text style={styles.statusSuccessText}>{t('provider.accessed')}</Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <View style={styles.activityIconBg}>
                <Text style={styles.activityEmoji}>👤</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityPatient}>Ramesh Patil</Text>
                <Text style={styles.activityDetail}>Patient record · 9:15 AM</Text>
              </View>
              <View style={styles.statusSuccessBadge}>
                <Text style={styles.statusSuccessText}>{t('provider.accessed')}</Text>
              </View>
            </View>

            <View style={styles.activityCard}>
              <View style={styles.activityIconBg}>
                <Text style={styles.activityEmoji}>👤</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityPatient}>Sunita Desai</Text>
                <Text style={styles.activityDetail}>Patient record · Yesterday</Text>
              </View>
              <View style={styles.statusSuccessBadge}>
                <Text style={styles.statusSuccessText}>{t('provider.accessed')}</Text>
              </View>
            </View>
          </View>

          {/* Read-only Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerHeading}>{t('provider.readOnlyAccess')}</Text>
            <Text style={styles.disclaimerBody}>
              {t('provider.readOnlyDesc')}
            </Text>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setLogoutModalVisible(true)}
          >
            <Text style={styles.logoutButtonIcon}>🚪</Text>
            <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        visible={logoutModalVisible}
        title="Logout?"
        message="You'll be signed out of your provider session."
        confirmText="Logout"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />

      {/* Session & Access Info Modal */}
      <Modal
        visible={sessionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSessionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Session & Access Info</Text>

            <View style={styles.activeSessionBanner}>
              <Text style={styles.modalActiveHeader}>✓ Active Session</Text>
              <Text style={styles.modalProviderText}>
                Logged in as {providerName} · Provider ID {providerId}
              </Text>
              <Text style={styles.modalTimeText}>
                Session started: Today, 9:00 AM
              </Text>
            </View>

            <Text style={styles.modalSubHeader}>TODAY'S ACCESS LOG</Text>

            <View style={styles.modalLogRow}>
              <Text style={styles.modalLogPatient}>• Anita Joshi</Text>
              <Text style={styles.modalLogAction}>Viewed health records · 10:32 AM</Text>
            </View>
            <View style={styles.modalLogRow}>
              <Text style={styles.modalLogPatient}>• Ramesh Patil</Text>
              <Text style={styles.modalLogAction}>Viewed vaccination history · 9:15 AM</Text>
            </View>

            <View style={styles.modalFooterBox}>
              <Text style={styles.modalFooterText}>
                All access requires patient QR consent and is permanently logged.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSessionModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: '#0D9488',
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleHeader: {
    fontSize: 13,
    color: '#CCFBF1',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  providerNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  clinicSubtitle: {
    fontSize: 13,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  bodyContent: {
    paddingHorizontal: 16,
    marginTop: -12,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  shieldIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shieldIcon: {
    fontSize: 18,
  },
  sessionTextCol: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sessionSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  activeBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  ctaCard: {
    backgroundColor: '#0D9488',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 18,
  },
  ctaIconArea: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ctaIcon: {
    fontSize: 26,
  },
  ctaTextArea: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: '#CCFBF1',
    lineHeight: 16,
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaArrowText: {
    color: '#0D9488',
    fontSize: 18,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 0.485,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 6,
  },
  statFooter: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activityList: {
    marginBottom: 18,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityInfo: {
    flex: 1,
  },
  activityPatient: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusSuccessBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusSuccessText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  disclaimerCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  disclaimerHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  disclaimerBody: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  activeSessionBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  modalActiveHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 4,
  },
  modalProviderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  modalTimeText: {
    fontSize: 11,
    color: '#047857',
  },
  modalSubHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 10,
    letterSpacing: 0.6,
  },
  modalLogRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalLogPatient: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalLogAction: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    paddingLeft: 10,
  },
  modalFooterBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  modalFooterText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
