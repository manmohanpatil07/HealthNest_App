// PatientDetailsScreen.js – Provider module (HealthNest)
// Implements the read‑only view of a patient after a QR scan.
// Displays patient profile, health records with attachments, documents, and vaccinations.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
  Image,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { providerService } from '../../services/providerService';
import { formatDate } from '../../utils';
import { useLanguage } from '../../context/LanguageContext';
import { SERVER_ROOT_URL } from '../../services/api';

export default function PatientDetailsScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { patient, healthRecords, documents, vaccinations, accessInfo, token, accessId } = route.params || {};

  const [loading, setLoading] = useState((!patient && (!!token || !!accessId)));
  const [data, setData] = useState({ patient, healthRecords, documents, vaccinations, accessInfo });
  const [errorState, setErrorState] = useState(null); // { title, message, isExpired, isRevoked }
  const [attachmentModal, setAttachmentModal] = useState({ visible: false, attachment: null });

  // Reset local state if route params change (e.g. Navigating between different patients)
  useEffect(() => {
    setData({ patient, healthRecords, documents, vaccinations, accessInfo });
    setErrorState(null);

    if (!patient && (token || accessId)) {
      setLoading(true);
      (async () => {
        try {
          let res;
          if (accessId) {
            res = await providerService.getPatientByHistoryId(accessId);
          } else if (token) {
            res = await providerService.getPatientByToken(token);
          }
          if (res && res.success) {
            setData(res);
          } else {
            setErrorState({
              title: 'Access Error',
              message: res?.message || 'Unable to load patient records.',
            });
          }
        } catch (e) {
          const errData = e.response?.data;
          const errorCode = errData?.errorCode;
          const msg = errData?.message;

          if (errorCode === 'EXPIRED_ACCESS' || errorCode === 'EXPIRED_QR') {
            setErrorState({
              title: 'Access Expired',
              message: msg || 'This patient authorization has expired. Ask the patient to generate a new QR code.',
              isExpired: true,
            });
          } else if (errorCode === 'REVOKED_ACCESS' || errorCode === 'UNAUTHORIZED_ACCESS') {
            setErrorState({
              title: 'Access Revoked',
              message: msg || 'The patient has revoked authorization for this provider.',
              isRevoked: true,
            });
          } else if (errorCode === 'UNAUTHORIZED_PROVIDER') {
            setErrorState({
              title: 'Access Denied',
              message: msg || 'You are not authorized to view this patient record.',
            });
          } else if (errorCode === 'PATIENT_NOT_FOUND') {
            setErrorState({
              title: 'Patient Not Found',
              message: msg || 'Patient record could not be found.',
            });
          } else {
            setErrorState({
              title: 'Failed to Load Patient',
              message: msg || 'Could not retrieve patient data. Please check connection and try again.',
            });
          }
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [accessId, token, patient]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading patient data…</Text>
      </View>
    );
  }

  if (errorState) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>←</Text>
          </Pressable>
          <Text style={styles.title}>{t('provider.patientDetailsTitle')}</Text>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>
            {errorState.isExpired ? '⏳' : errorState.isRevoked ? '🔒' : '⚠️'}
          </Text>
          <Text style={styles.errorTitle}>{errorState.title}</Text>
          <Text style={styles.errorMessage}>{errorState.message}</Text>

          <TouchableOpacity
            style={styles.scanNewQRBtn}
            onPress={() => navigation.navigate('ScanQR')}
            activeOpacity={0.8}
          >
            <Text style={styles.scanNewQRBtnText}>Scan Fresh Patient QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.returnHistoryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.returnHistoryBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { patient: p, healthRecords: hr, documents: docs, vaccinations: vxs, accessInfo: acc } = data;
  const granted = acc?.granted_categories || {};
  const isAll = !acc?.permission || acc?.permission === 'view' || acc?.permission === 'all';

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <Text style={styles.title}>{t('provider.patientDetailsTitle')}</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.card}>
        <Text style={styles.name}>{p?.fullName || p?.full_name || 'Patient'}</Text>
        <Text style={styles.row}>
          {t('profile.dob')}: {p?.dob || p?.date_of_birth ? formatDate(p?.dob || p?.date_of_birth) : '—'}
        </Text>
        <Text style={styles.row}>
          {t('profile.bloodGroup')}: {p?.blood_group || p?.bloodGroup || '—'}
        </Text>
        {p?.emergency_contact && (
          <Text style={styles.row}>
            {t('profile.emergencyContact')}: {p.emergency_contact}
          </Text>
        )}
      </View>

      {/* Health Records Section with Attachment support */}
      {(!isAll && granted.healthRecords === false) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('records.title')}</Text>
          <Text style={styles.restrictedText}>🔒 Not shared by patient</Text>
        </View>
      ) : (
        <Section title={t('records.title')} emptyMsg={t('records.noRecordsFound')}>
          {hr?.map((r) => {
            const recordKey = r.record_id || r.id;
            const attachments = r.attachments || [];
            return (
              <View key={recordKey} style={styles.item}>
                <View style={styles.recordHeader}>
                  <Text style={styles.itemTitle}>{r.title}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{r.record_type}</Text>
                  </View>
                </View>
                <Text style={styles.itemMeta}>
                  {formatDate(r.record_date || r.recorded_at)}
                </Text>
                {r.description ? <Text style={styles.itemDesc}>{r.description}</Text> : null}

                {/* Attachments */}
                {attachments.length > 0 && (
                  <View style={styles.attachmentsContainer}>
                    {attachments.map((att) => (
                      <TouchableOpacity
                        key={att.attachment_id || att.file_url}
                        style={styles.attachmentButton}
                        onPress={() => setAttachmentModal({ visible: true, attachment: att })}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.attachmentIcon}>📎</Text>
                        <Text style={styles.attachmentText} numberOfLines={1}>
                          {att.file_name || 'Document Proof'} (View)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </Section>
      )}

      {/* Documents Section */}
      {(!isAll && granted.documents === false) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('documents.title')}</Text>
          <Text style={styles.restrictedText}>🔒 Not shared by patient</Text>
        </View>
      ) : (
        <Section title={t('documents.title')} emptyMsg={t('documents.noDocsTitle')}>
          {docs?.map((d) => (
            <Pressable
              key={d.document_id || d.id}
              style={styles.item}
              onPress={() => {
                const url = d.file_url?.startsWith('http')
                  ? d.file_url
                  : `${SERVER_ROOT_URL}${d.file_url}`;
                Linking.openURL(url);
              }}
            >
              <Text style={styles.itemTitle}>{d.document_name}</Text>
              <Text style={styles.itemMeta}>{d.document_type}</Text>
              <Text style={styles.link}>{t('common.view')}</Text>
            </Pressable>
          ))}
        </Section>
      )}

      {/* Vaccinations Section */}
      {(!isAll && granted.vaccinations === false) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('vaccine.title')}</Text>
          <Text style={styles.restrictedText}>🔒 Not shared by patient</Text>
        </View>
      ) : (
        <Section title={t('vaccine.title')} emptyMsg={t('vaccine.noCompleted')}>
          {vxs?.map((v) => (
            <View key={v.vaccination_id || v.id} style={styles.item}>
              <Text style={styles.itemTitle}>{v.vaccine_name}</Text>
              <Text style={styles.itemMeta}>
                {t('vaccine.administeredOn')}: {formatDate(v.vaccination_date || v.administered_at)}
              </Text>
            </View>
          ))}
        </Section>
      )}

      {/* Footer audit info */}
      <View style={styles.footer}>
        <Text style={styles.audit}>
          Access granted via QR authorization • Expires {formatDate(acc?.expires_at)}
        </Text>
      </View>

      {/* Attachment Image Viewer Modal */}
      <Modal
        visible={attachmentModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() => setAttachmentModal({ visible: false, attachment: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {attachmentModal.attachment?.file_name || 'Record Attachment'}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setAttachmentModal({ visible: false, attachment: null })}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {attachmentModal.attachment?.file_type &&
            attachmentModal.attachment.file_type.startsWith('image/') ? (
              <Image
                source={{
                  uri: attachmentModal.attachment.file_url.startsWith('http')
                    ? attachmentModal.attachment.file_url
                    : `${SERVER_ROOT_URL}${attachmentModal.attachment.file_url}`,
                }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.nonImageBox}>
                <Text style={{ fontSize: 56, marginBottom: 10 }}>📄</Text>
                <Text style={styles.nonImageName}>
                  {attachmentModal.attachment?.file_name}
                </Text>
                <Text style={styles.nonImageSub}>
                  Document stored securely in patient records
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Section({ title, children, emptyMsg }) {
  const hasContent = React.Children.count(children) > 0;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hasContent ? children : <Text style={styles.empty}>{emptyMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { padding: 8 },
  backTxt: { fontSize: 20 },
  title: { fontSize: 22, fontWeight: '600', marginLeft: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 6 },
  row: { fontSize: 14, color: '#374151', marginBottom: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '500', marginBottom: 6 },
  item: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', flex: 1 },
  typeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  itemMeta: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  itemDesc: { fontSize: 14, marginTop: 4, color: '#374151' },
  link: { color: '#2563EB', marginTop: 4 },
  empty: { fontStyle: 'italic', color: '#6B7280' },
  restrictedText: {
    fontStyle: 'italic',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  attachmentsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  attachmentIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  attachmentText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
  },
  footer: { paddingVertical: 12, borderTopWidth: 1, borderColor: '#E5E7EB' },
  audit: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#374151' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  nonImageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  nonImageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  nonImageSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 60,
  },
  errorIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scanNewQRBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  scanNewQRBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  returnHistoryBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  returnHistoryBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 15,
  },
});
