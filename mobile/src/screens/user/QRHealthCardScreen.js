import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Share,
  Pressable,
  Switch,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import userService from '../../services/userService';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatExpiry(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dateFormatted = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Valid until ${dateFormatted}, ${timeFormatted}`;
}

export default function QRHealthCardScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);

  // Permission toggles (Section 27: Health Records, Documents, Vaccination History, Emergency Info)
  const [permissions, setPermissions] = useState({
    healthRecords: true,
    documents: true,
    vaccinationHistory: true,
    emergencyInfo: true,
  });
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Fetch QR & User Data
  const fetchQR = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await userService.getQRCode();
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load QR Health Card.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQR();
  }, []);

  // Regenerate QR
  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate QR Code?',
      'This will invalidate your current QR code and access token immediately. Healthcare providers with old scans will no longer have access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try {
              const res = await userService.regenerateQR();
              if (res && res.qr) {
                setData((prev) => ({
                  ...prev,
                  qr: res.qr,
                }));
                Alert.alert('Success', 'New secure QR code generated successfully.');
              }
            } catch (err) {
              const msg = err?.response?.data?.message || 'Failed to regenerate QR code.';
              Alert.alert('Error', msg);
            } finally {
              setRegenerating(false);
            }
          },
        },
      ]
    );
  };

  // Share Actions
  const handleShareOption = async (platform) => {
    setShareModalVisible(false);
    const token = data?.qr?.access_token || '';
    const name = data?.user?.full_name || 'User';
    const message = `HealthNest Digital Health Card\nPatient: ${name}\nAccess Token: ${token}\n(Temporary one-time read-only healthcare access)`;

    try {
      await Share.share({
        message,
        title: 'HealthNest QR Health Card',
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      const selected = Object.keys(permissions)
        .filter((k) => permissions[k])
        .join(',');
      await userService.updateQRPermissions(selected || 'view');
      setPermissionModalVisible(false);
      Alert.alert('Saved', 'Access permissions updated successfully.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save permissions.';
      Alert.alert('Error', msg);
    } finally {
      setSavingPermissions(false);
    }
  };

  const user = data?.user || {};
  const qr = data?.qr || {};

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My QR Health Card</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading QR Health Card…</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchQR()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Gradient Card per Section 27: #0284C7 → #0D9488 */}
          <View style={styles.gradientCard}>
            {/* Card Header */}
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.brandText}>HealthNest</Text>
                <Text style={styles.patientName}>{user.full_name || 'Patient Name'}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Active</Text>
              </View>
            </View>

            {/* Blood group & DOB row */}
            <View style={styles.metaRow}>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodBadgeText}>
                  Blood: {user.blood_group || 'Not set'}
                </Text>
              </View>
              {user.date_of_birth ? (
                <Text style={styles.dobText}>
                  DOB: {formatDate(user.date_of_birth)}
                </Text>
              ) : null}
            </View>

            {/* Crisp QR Area: White rounded square, 180px */}
            <View style={styles.qrAreaWrapper}>
              <View style={styles.qrContainer}>
                {qr.access_token ? (
                  <QRCode
                    value={qr.access_token}
                    size={180}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                ) : (
                  <ActivityIndicator size="small" color="#0284C7" />
                )}
                {/* Centered cross icon logo mark */}
                <View style={styles.qrCenterLogo}>
                  <Text style={{ fontSize: 13, color: '#0284C7', fontWeight: '900' }}>+</Text>
                </View>
              </View>
            </View>

            {/* Token and Expiry */}
            <View style={styles.tokenSection}>
              <Text style={styles.tokenText}>
                Token: {qr.access_token || 'HN-2026-XXXX-XXXX'}
              </Text>
              <Text style={styles.expiryText}>
                {formatExpiry(qr.expires_at)}
              </Text>
            </View>
          </View>

          {/* Security Information Card: Amber left border */}
          <View style={styles.securityCard}>
            <Text style={styles.securityHeading}>🔐 Secure Access Token</Text>
            <Text style={styles.securityBody}>
              This QR contains a secure access token — not your medical data.
              Healthcare providers scan this to request access. You control what
              they can see.
            </Text>
          </View>

          {/* Information Shared On Scan */}
          <View style={styles.sharedSection}>
            <Text style={styles.sharedSectionTitle}>
              INFORMATION SHARED ON SCAN
            </Text>

            <View style={styles.sharedRow}>
              <Text style={styles.greenCheck}>✓</Text>
              <Text style={styles.sharedLabel}>Basic profile (name, blood group)</Text>
            </View>
            <View style={styles.sharedRow}>
              <Text style={styles.greenCheck}>✓</Text>
              <Text style={styles.sharedLabel}>Emergency contact</Text>
            </View>
            <View style={styles.sharedRow}>
              <Text style={styles.greenCheck}>✓</Text>
              <Text style={styles.sharedLabel}>Active allergies (if recorded)</Text>
            </View>
            <View style={styles.sharedRow}>
              <Text style={styles.greenCheck}>✓</Text>
              <Text style={styles.sharedLabel}>Current health records (read-only)</Text>
            </View>
            <View style={styles.sharedRow}>
              <Text style={styles.greenCheck}>✓</Text>
              <Text style={styles.sharedLabel}>Vaccination history</Text>
            </View>

            <TouchableOpacity
              style={styles.managePermissionsBtn}
              onPress={() => setPermissionModalVisible(true)}
            >
              <Text style={styles.managePermissionsText}>
                Manage Access Permissions →
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons: 2 columns (Share QR - outline, Download - secondary teal) */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.shareBtnOutline}
              onPress={() => setShareModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.shareBtnText}>Share QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadBtnTeal}
              onPress={() => {
                Alert.alert(
                  'Card Ready',
                  `QR Access Token: ${qr.access_token}\n\nYour digital health card is saved on this device and ready to present offline.`
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadBtnText}>Save Card</Text>
            </TouchableOpacity>
          </View>

          {/* Regeneration Action */}
          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.regenerateBtnText}>
                Regenerate QR (invalidates current)
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ───────────────── SHARE MODAL ───────────────── */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShareModalVisible(false)}
        />
        <View style={styles.modalWrapper}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share QR Health Card</Text>
            <Text style={styles.modalSupportingText}>
              Sharing allows one-time read-only access to your authorized health data.
            </Text>

            <View style={styles.shareOptionsRow}>
              <TouchableOpacity
                style={styles.shareOptionBox}
                onPress={() => handleShareOption('WhatsApp')}
              >
                <Text style={{ fontSize: 32, marginBottom: 6 }}>💬</Text>
                <Text style={styles.shareOptionLabel}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOptionBox}
                onPress={() => handleShareOption('Email')}
              >
                <Text style={{ fontSize: 32, marginBottom: 6 }}>📧</Text>
                <Text style={styles.shareOptionLabel}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOptionBox}
                onPress={() => handleShareOption('Copy Link')}
              >
                <Text style={{ fontSize: 32, marginBottom: 6 }}>🔗</Text>
                <Text style={styles.shareOptionLabel}>Copy Link</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ───────────────── ACCESS PERMISSIONS MODAL ───────────────── */}
      <Modal
        visible={permissionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPermissionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPermissionModalVisible(false)}
        />
        <View style={styles.modalWrapper}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Access Permissions</Text>
            <Text style={styles.modalSupportingText}>
              Control what healthcare providers can view when they scan your QR code.
            </Text>

            {/* Toggle Rows per Section 27 */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Health Records</Text>
              <Switch
                value={permissions.healthRecords}
                onValueChange={(val) =>
                  setPermissions((p) => ({ ...p, healthRecords: val }))
                }
                trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Documents</Text>
              <Switch
                value={permissions.documents}
                onValueChange={(val) =>
                  setPermissions((p) => ({ ...p, documents: val }))
                }
                trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Vaccination History</Text>
              <Switch
                value={permissions.vaccinationHistory}
                onValueChange={(val) =>
                  setPermissions((p) => ({ ...p, vaccinationHistory: val }))
                }
                trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Emergency Info</Text>
              <Switch
                value={permissions.emergencyInfo}
                onValueChange={(val) =>
                  setPermissions((p) => ({ ...p, emergencyInfo: val }))
                }
                trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
              />
            </View>

            {/* Primary Action: Save Settings */}
            <TouchableOpacity
              style={[styles.saveSettingsBtn, savingPermissions && { opacity: 0.7 }]}
              onPress={handleSavePermissions}
              disabled={savingPermissions}
            >
              {savingPermissions ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveSettingsBtnText}>Save Settings</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  backBtnText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },

  // Main QR card with gradient appearance: #0284C7 → #0D9488
  gradientCard: {
    backgroundColor: '#0369A1',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  brandText: {
    color: '#BAE6FD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  patientName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  bloodBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bloodBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dobText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '500',
  },

  // QR Container
  qrAreaWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  qrContainer: {
    width: 216,
    height: 216,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  qrCenterLogo: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0284C7',
  },

  // Token Section
  tokenSection: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expiryText: {
    color: '#BAE6FD',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },

  // Security card: Amber left border
  securityCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 16,
  },
  securityHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  securityBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },

  // Information shared section
  sharedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sharedSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  greenCheck: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '900',
  },
  sharedLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  managePermissionsBtn: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  managePermissionsText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },

  // Action Buttons
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  shareBtnOutline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  shareBtnText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 15,
  },
  downloadBtnTeal: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  regenerateBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  regenerateBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },

  // Centered states
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Modals
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSupportingText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
  },

  // Share Options Row
  shareOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  shareOptionBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 16,
  },
  shareOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  modalCloseBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },

  // Permissions Toggle Rows
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  saveSettingsBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveSettingsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
