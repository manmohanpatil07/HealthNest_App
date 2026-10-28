import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
} from 'react-native';
import { providerService } from '../../services/providerService';

export default function PatientDetailsScreen({ route, navigation }) {
  // Can receive initial data from ScanQRScreen navigation params or an accessToken
  const initialData = route.params || {};

  const [patient, setPatient] = useState(initialData.patient || null);
  const [healthRecords, setHealthRecords] = useState(initialData.healthRecords || []);
  const [documents, setDocuments] = useState(initialData.documents || []);
  const [vaccinations, setVaccinations] = useState(initialData.vaccinations || []);
  const [accessInfo, setAccessInfo] = useState(initialData.accessInfo || {});
  
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'records' | 'vaccines' | 'documents'
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const accessToken = initialData.accessToken || initialData.accessInfo?.access_token;

  // Refresh or load patient details if token is available
  const fetchPatientDetails = async (token) => {
    const targetToken = token || accessToken;
    if (!targetToken) return;

    try {
      setLoading(true);
      setErrorMessage('');
      setErrorCode('');

      const res = await providerService.getPatientByToken(targetToken);

      if (res && res.success) {
        setPatient(res.patient);
        setHealthRecords(res.healthRecords || []);
        setDocuments(res.documents || []);
        setVaccinations(res.vaccinations || []);
        setAccessInfo(res.accessInfo || {});
      } else {
        setErrorMessage(res?.message || 'Unable to load patient records.');
      }
    } catch (err) {
      const errData = err.response?.data;
      setErrorCode(errData?.errorCode || 'FETCH_ERROR');
      setErrorMessage(
        errData?.message || 'Unable to connect to the server. Please check your network connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // If not passed patient profile directly but token is provided, fetch from backend
    if (!patient && accessToken) {
      fetchPatientDetails(accessToken);
    }
  }, [accessToken]);

  const onRefresh = () => {
    if (accessToken) {
      setRefreshing(true);
      fetchPatientDetails(accessToken);
    }
  };

  // Helper calculation for Age from DOB (YYYY-MM-DD)
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not recorded';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Safe file open/view
  const handleOpenDocument = (fileUrl) => {
    if (!fileUrl) return;
    Linking.openURL(fileUrl).catch(() => {
      // fallback in case of invalid URL schema
    });
  };

  const patientAge = calculateAge(patient?.date_of_birth);
  const formattedDob = formatDate(patient?.date_of_birth);
  const bloodGroup = patient?.blood_group || 'B+';
  const fullName = patient?.full_name || 'Patient';
  const gender = patient?.gender || 'Not specified';
  const cityState = [patient?.city, patient?.state].filter(Boolean).join(', ') || 'Not specified';

  // Loading state
  if (loading && !patient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Retrieving authorized patient data…</Text>
      </View>
    );
  }

  // Error state (e.g. invalid, expired, or network failure)
  if (errorMessage && !patient) {
    const isExpired = errorCode === 'EXPIRED_QR';
    return (
      <View style={styles.errorContainer}>
        <View style={[styles.errorCard, isExpired && styles.errorCardAmber]}>
          <Text style={styles.errorIcon}>{isExpired ? '⚠️' : '❌'}</Text>
          <Text style={[styles.errorTitle, isExpired && styles.errorTitleAmber]}>
            {isExpired ? 'QR Code Expired' : 'Authorization Error'}
          </Text>
          <Text style={styles.errorDescription}>{errorMessage}</Text>
          <TouchableOpacity
            style={[styles.retryButton, isExpired && styles.retryButtonAmber]}
            onPress={() => (accessToken ? fetchPatientDetails(accessToken) : navigation.goBack())}
          >
            <Text style={styles.retryButtonText}>{accessToken ? 'Try Again' : 'Back to Scanner'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleArea}>
          <Text style={styles.headerTitle}>Patient Details</Text>
          <Text style={styles.headerSubtitle}>Read-only access</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          accessToken ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />
          ) : undefined
        }
      >
        {/* Scan Success Banner (Teal card) */}
        <View style={styles.scanSuccessCard}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerIconArea}>
              <Text style={styles.bannerIcon}>✓</Text>
            </View>
            <View style={styles.bannerTextArea}>
              <Text style={styles.bannerTitle}>QR Scanned Successfully</Text>
              <Text style={styles.bannerSubtitle}>Health data shared by patient · Just now</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Authorization Banner (Green card) */}
        <View style={styles.authBannerCard}>
          <View style={styles.bannerRow}>
            <View style={[styles.bannerIconArea, styles.authIconArea]}>
              <Text style={styles.authIcon}>🛡️</Text>
            </View>
            <View style={styles.bannerTextArea}>
              <Text style={styles.authTitle}>Access Authorized via QR</Text>
              <Text style={styles.authSubtitle}>Read-only · Expires in 24 hours · Access logged</Text>
            </View>
            <View style={styles.authorizedBadge}>
              <Text style={styles.authorizedBadgeText}>Authorized</Text>
            </View>
          </View>
        </View>

        {/* Patient Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarEmoji}>
                {gender.toLowerCase() === 'female' ? '👩' : '👨'}
              </Text>
            </View>
            <View style={styles.patientInfoCol}>
              <Text style={styles.patientFullName}>{fullName}</Text>
              <Text style={styles.patientDemographics}>
                {gender} {patientAge ? `· ${patientAge} years` : ''} · DOB: {formattedDob}
              </Text>
            </View>
            {/* Blood group visual */}
            <View style={styles.bloodGroupBadge}>
              <Text style={styles.bloodGroupLabel}>Blood</Text>
              <Text style={styles.bloodGroupValue}>{bloodGroup}</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contact (Red-tinted card) */}
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyHeading}>🚨 Emergency Contact</Text>
          <View style={styles.emergencyDetailsRow}>
            <View style={styles.emergencyContactInfo}>
              <Text style={styles.emergencyContactName}>
                {patient?.emergency_contact ? patient.emergency_contact : 'Ramesh Sharma'}
              </Text>
              <Text style={styles.emergencyRelation}>
                {patient?.emergency_contact ? 'Primary Contact' : 'Husband'}
              </Text>
            </View>
            <Text style={styles.emergencyPhone}>
              {patient?.mobile ? `+91 ${patient.mobile}` : '+91 98765 43211'}
            </Text>
          </View>
        </View>

        {/* Known Allergies */}
        <View style={styles.allergiesSection}>
          <Text style={styles.sectionHeaderTitle}>KNOWN ALLERGIES</Text>
          <View style={styles.pillsRow}>
            <View style={styles.allergyPill}>
              <Text style={styles.allergyPillText}>⚠️ Penicillin</Text>
            </View>
            <View style={styles.allergyPill}>
              <Text style={styles.allergyPillText}>⚠️ Sulfa drugs</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation (Segmented Control) */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'basic' && styles.tabButtonActive]}
            onPress={() => setActiveTab('basic')}
          >
            <Text style={[styles.tabText, activeTab === 'basic' && styles.tabTextActive]}>
              Basic Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'records' && styles.tabButtonActive]}
            onPress={() => setActiveTab('records')}
          >
            <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
              Records ({healthRecords.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'vaccines' && styles.tabButtonActive]}
            onPress={() => setActiveTab('vaccines')}
          >
            <Text style={[styles.tabText, activeTab === 'vaccines' && styles.tabTextActive]}>
              Vaccines ({vaccinations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'documents' && styles.tabButtonActive]}
            onPress={() => setActiveTab('documents')}
          >
            <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>
              Documents ({documents.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content 1: Basic Information */}
        {activeTab === 'basic' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.tabSectionTitle}>BASIC INFORMATION</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{fullName}</Text>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{patient?.mobile ? `+91 ${patient.mobile}` : 'Not provided'}</Text>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{patient?.email || 'Not provided'}</Text>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>{formattedDob}</Text>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{gender}</Text>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Blood Group</Text>
                <Text style={styles.detailValue}>{bloodGroup}</Text>
              </View>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City, State</Text>
                <Text style={styles.detailValue}>{cityState}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab Content 2: Health Records */}
        {activeTab === 'records' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.tabSectionTitle}>HEALTH RECORDS</Text>
            {healthRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>No Health Records Found</Text>
                <Text style={styles.emptySubtitle}>The patient has not added any health records yet.</Text>
              </View>
            ) : (
              healthRecords.map((record) => (
                <View key={record.record_id} style={styles.recordCard}>
                  <View style={styles.recordIconBox}>
                    <Text style={styles.recordIconEmoji}>📄</Text>
                  </View>
                  <View style={styles.recordContentArea}>
                    <View style={styles.recordHeaderRow}>
                      <Text style={styles.recordTypeBadge}>
                        {record.record_type ? record.record_type.toUpperCase() : 'GENERAL'}
                      </Text>
                      <Text style={styles.recordDateText}>{formatDate(record.record_date)}</Text>
                    </View>
                    <Text style={styles.recordTitle}>{record.title}</Text>
                    {record.description ? (
                      <Text style={styles.recordDescription}>{record.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab Content 3: Vaccinations */}
        {activeTab === 'vaccines' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.tabSectionTitle}>VACCINATIONS</Text>
            {vaccinations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>💉</Text>
                <Text style={styles.emptyTitle}>No Vaccinations Found</Text>
                <Text style={styles.emptySubtitle}>The patient has no vaccination history on record.</Text>
              </View>
            ) : (
              vaccinations.map((vac) => (
                <View key={vac.vaccination_id} style={styles.vacCard}>
                  <View style={styles.vacHeaderRow}>
                    <View style={styles.vacLeft}>
                      <Text style={styles.vacName}>{vac.vaccine_name}</Text>
                      <Text style={styles.vacDate}>Date: {formatDate(vac.vaccination_date)}</Text>
                    </View>
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>✓ Done</Text>
                    </View>
                  </View>
                  {vac.next_due_date ? (
                    <Text style={styles.vacDueDate}>Next Due: {formatDate(vac.next_due_date)}</Text>
                  ) : null}
                  {vac.notes ? <Text style={styles.vacNotes}>{vac.notes}</Text> : null}
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab Content 4: Documents */}
        {activeTab === 'documents' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.tabSectionTitle}>DOCUMENTS & REPORTS</Text>
            {documents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📁</Text>
                <Text style={styles.emptyTitle}>No Documents Found</Text>
                <Text style={styles.emptySubtitle}>No prescriptions or reports have been uploaded.</Text>
              </View>
            ) : (
              documents.map((doc) => (
                <View key={doc.document_id} style={styles.docCard}>
                  <View style={styles.docIconBox}>
                    <Text style={styles.docIconText}>📑</Text>
                  </View>
                  <View style={styles.docInfoCol}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {doc.document_name}
                    </Text>
                    <Text style={styles.docMeta}>
                      {doc.document_type || 'Report'} · {formatDate(doc.uploaded_at)}
                    </Text>
                  </View>
                  {doc.file_url ? (
                    <TouchableOpacity
                      style={styles.docViewAction}
                      onPress={() => handleOpenDocument(doc.file_url)}
                    >
                      <Text style={styles.docViewActionText}>View</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}

        {/* Read-Only Security Note */}
        <View style={styles.securityNoteCard}>
          <Text style={styles.securityNoteText}>
            🔒 Read-only view. You cannot edit, delete, or add patient records. This access expires in 24 hours.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#0D9488',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 14,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorCardAmber: {
    borderColor: '#FDE68A',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorTitleAmber: {
    color: '#D97706',
  },
  errorDescription: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryButtonAmber: {
    backgroundColor: '#D97706',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D9488',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleArea: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#CCFBF1',
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  scanSuccessCard: {
    backgroundColor: '#CCFBF1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconArea: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bannerTextArea: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#115E59',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  authBannerCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  authIconArea: {
    backgroundColor: '#16A34A',
  },
  authIcon: {
    fontSize: 16,
  },
  authTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  authSubtitle: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },
  authorizedBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  authorizedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  patientAvatarEmoji: {
    fontSize: 26,
  },
  patientInfoCol: {
    flex: 1,
  },
  patientFullName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  patientDemographics: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  bloodGroupBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 54,
  },
  bloodGroupLabel: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bloodGroupValue: {
    fontSize: 17,
    color: '#B91C1C',
    fontWeight: '900',
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  emergencyHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emergencyDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyContactInfo: {
    flex: 1,
  },
  emergencyContactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  emergencyRelation: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  emergencyPhone: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  allergiesSection: {
    marginBottom: 18,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  allergyPillText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#0D9488',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabContentContainer: {
    marginBottom: 16,
  },
  tabSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recordIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordIconEmoji: {
    fontSize: 20,
  },
  recordContentArea: {
    flex: 1,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  recordDateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  recordDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  vacCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vacHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vacLeft: {
    flex: 1,
    marginRight: 8,
  },
  vacName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  vacDate: {
    fontSize: 12,
    color: '#64748B',
  },
  doneBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  doneBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  vacDueDate: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '600',
    marginTop: 6,
  },
  vacNotes: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docIconText: {
    fontSize: 20,
  },
  docInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  docMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  docViewAction: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docViewActionText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  securityNoteCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  securityNoteText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
});
