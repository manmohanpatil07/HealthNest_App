import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Pressable,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import userService from '../../services/userService';
import { API_BASE_URL } from '../../services/api';

// Supported mime types & extensions (PDF, JPG, PNG - Max 10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DocumentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // State
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('Prescription'); // 'Prescription' or 'Medical Report'
  const [pickedFile, setPickedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // Upload progress state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ visible: false, document: null });
  const [deleting, setDeleting] = useState(false);

  // Fetch documents
  const fetchDocuments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await userService.getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load documents. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Open Upload Modal
  const openUploadModal = (type) => {
    setSelectedType(type);
    setPickedFile(null);
    setFileError('');
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadModalVisible(true);
  };

  // Document Picker
  const pickDocument = async () => {
    try {
      setFileError('');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets && result.assets[0] ? result.assets[0] : result;
      
      // Validate file size (10 MB limit)
      if (file.size && file.size > MAX_FILE_SIZE) {
        setFileError('File size exceeds 10 MB limit. Please select a smaller file.');
        return;
      }

      setPickedFile(file);
    } catch (err) {
      console.warn('Error picking document:', err);
      setFileError('Unable to select file. Please try again.');
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!pickedFile) {
      setFileError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFileError('');

    try {
      const formData = new FormData();

      // Normalize file URI for platform
      let uri = pickedFile.uri;
      if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
        uri = `file://${uri}`;
      }

      const fileObj = {
        uri: uri,
        name: pickedFile.name || `doc_${Date.now()}`,
        type: pickedFile.mimeType || 'application/octet-stream',
      };

      formData.append('file', fileObj);
      formData.append('document_type', selectedType);
      formData.append('document_name', pickedFile.name || selectedType);

      await userService.uploadDocument(formData, (percent) => {
        setUploadProgress(percent);
      });

      setUploadSuccess(true);
      await fetchDocuments();

      setTimeout(() => {
        setUploadModalVisible(false);
        setUploading(false);
        setUploadSuccess(false);
        setPickedFile(null);
      }, 1000);
    } catch (err) {
      setUploading(false);
      const msg = err?.response?.data?.message || 'Upload failed. Please check your connection and try again.';
      setFileError(msg);
    }
  };

  // Open/Download Document
  const handleOpenDocument = (doc) => {
    try {
      // Determine full URL for file download/view
      let fileUrl = doc.file_url;
      if (fileUrl.startsWith('/')) {
        const baseHost = API_BASE_URL.replace('/api', '');
        fileUrl = `${baseHost}${fileUrl}`;
      }
      Linking.openURL(fileUrl).catch(() => {
        Alert.alert('Cannot Open Document', 'Could not open the document URL.');
      });
    } catch (e) {
      Alert.alert('Error', 'Unable to open document.');
    }
  };

  // Delete document
  const confirmDelete = async () => {
    if (!deleteModal.document) return;
    setDeleting(true);
    try {
      await userService.deleteDocument(deleteModal.document.document_id);
      setDeleteModal({ visible: false, document: null });
      await fetchDocuments();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete document.';
      setDeleteModal({ visible: false, document: null });
      Alert.alert('Error', msg);
    } finally {
      setDeleting(false);
    }
  };

  // Render individual document card
  const renderItem = ({ item }) => {
    const isPrescription = (item.document_type || '').toLowerCase().includes('prescription');
    const badgeBg = isPrescription ? '#F3E8FF' : '#E0F2FE';
    const badgeColor = isPrescription ? '#9333EA' : '#0284C7';
    const cardBorder = isPrescription ? '#E9D5FF' : '#BAE6FD';
    const icon = isPrescription ? '💊' : '🔬';

    return (
      <View style={[styles.docCard, { borderColor: cardBorder }]}>
        <View style={styles.docHeaderRow}>
          <View style={[styles.docIconBox, { backgroundColor: badgeBg }]}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docName} numberOfLines={1}>
              {item.document_name}
            </Text>
            <View style={styles.docMetaRow}>
              <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.typeBadgeText, { color: badgeColor }]}>
                  {item.document_type}
                </Text>
              </View>
              <Text style={styles.docDate}>
                {formatDate(item.uploaded_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action row: Download / Delete */}
        <View style={styles.docActionRow}>
          <TouchableOpacity
            style={styles.actionBtnDownload}
            onPress={() => handleOpenDocument(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnDownloadText}>⬇ View / Download</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnDelete}
            onPress={() => setDeleteModal({ visible: true, document: item })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.actionBtnDeleteText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📄</Text>
      <Text style={styles.emptyTitle}>No documents found</Text>
      <Text style={styles.emptySubtitle}>
        Upload your prescriptions or medical reports to access them anytime.
      </Text>
    </View>
  );

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
          <View>
            <Text style={styles.headerTitle}>Documents</Text>
            <Text style={styles.headerSubtitle}>
              {documents.length} {documents.length === 1 ? 'file' : 'files'}
            </Text>
          </View>
        </View>
      </View>

      {/* Top Upload Action Grid (2-column: Prescription & Report per Section 25) */}
      <View style={styles.uploadGridWrapper}>
        <View style={styles.uploadGrid}>
          {/* Prescription: Purple Soft Card */}
          <TouchableOpacity
            style={[styles.uploadCard, styles.purpleCard]}
            onPress={() => openUploadModal('Prescription')}
            activeOpacity={0.8}
          >
            <View style={[styles.uploadIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Text style={{ fontSize: 24 }}>💊</Text>
            </View>
            <Text style={styles.uploadCardTitle}>Upload Prescription</Text>
            <Text style={styles.uploadCardSub}>Rx & Doctor slips</Text>
          </TouchableOpacity>

          {/* Report: Sky Soft Card */}
          <TouchableOpacity
            style={[styles.uploadCard, styles.skyCard]}
            onPress={() => openUploadModal('Medical Report')}
            activeOpacity={0.8}
          >
            <View style={[styles.uploadIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Text style={{ fontSize: 24 }}>🔬</Text>
            </View>
            <Text style={styles.uploadCardTitle}>Upload Report</Text>
            <Text style={styles.uploadCardSub}>Lab tests & scans</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upload progress banner if actively uploading in background */}
      {uploading && (
        <View style={styles.uploadProgressCard}>
          <View style={styles.uploadProgressHeader}>
            <ActivityIndicator size="small" color="#0284C7" />
            <Text style={styles.uploadProgressTitle}>Uploading document…</Text>
            <Text style={styles.uploadProgressPercent}>{uploadProgress}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDocuments()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => String(item.document_id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            documents.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={() => fetchDocuments(true)}
          refreshing={refreshing}
        />
      )}

      {/* ───────────────── UPLOAD MODAL ───────────────── */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !uploading && setUploadModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !uploading && setUploadModalVisible(false)}
        />
        <View style={styles.modalWrapper}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedType === 'Prescription' ? 'Upload Prescription' : 'Upload Medical Report'}
              </Text>
              {!uploading && (
                <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {fileError ? (
              <View style={styles.formError}>
                <Text style={styles.formErrorText}>⚠ {fileError}</Text>
              </View>
            ) : null}

            {uploadSuccess ? (
              <View style={styles.formSuccess}>
                <Text style={styles.formSuccessText}>✓ Document uploaded successfully!</Text>
              </View>
            ) : null}

            {/* File Area (Dashed border per UI spec) */}
            <TouchableOpacity
              style={[
                styles.dashedDropzone,
                pickedFile && styles.dashedDropzoneSelected,
              ]}
              onPress={pickDocument}
              disabled={uploading}
              activeOpacity={0.7}
            >
              <Text style={styles.dropzoneIcon}>{pickedFile ? '📄' : '📁'}</Text>
              <Text style={styles.dropzoneTitle}>
                {pickedFile ? pickedFile.name : 'Tap to choose a file'}
              </Text>
              <Text style={styles.dropzoneSubtitle}>
                {pickedFile
                  ? `${formatBytes(pickedFile.size)} • Tap to change`
                  : 'PDF, JPG, PNG — Max 10 MB'}
              </Text>
            </TouchableOpacity>

            {/* Modal Upload Progress Bar */}
            {uploading && (
              <View style={{ marginVertical: 14 }}>
                <View style={styles.uploadProgressHeader}>
                  <Text style={styles.uploadProgressTitle}>Uploading document…</Text>
                  <Text style={styles.uploadProgressPercent}>{uploadProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
                </View>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setUploadModalVisible(false)}
                disabled={uploading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryUploadBtn,
                  (!pickedFile || uploading) && styles.btnDisabled,
                ]}
                onPress={handleUpload}
                disabled={!pickedFile || uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryUploadBtnText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ───────────────── DELETE MODAL ───────────────── */}
      <Modal
        visible={deleteModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteModal({ visible: false, document: null })}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteSheet}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🗑️</Text>
            <Text style={styles.deleteTitle}>Delete Document?</Text>
            <Text style={styles.deleteMessage}>
              This document will be permanently deleted.
            </Text>

            {deleteModal.document && (
              <View style={styles.deleteDocPreview}>
                <Text style={styles.deleteDocName} numberOfLines={1}>
                  {deleteModal.document.document_name}
                </Text>
                <Text style={styles.deleteDocType}>
                  {deleteModal.document.document_type}
                </Text>
              </View>
            )}

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeleteModal({ visible: false, document: null })}
                disabled={deleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, deleting && styles.btnDisabled]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
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
  headerSubtitle: {
    fontSize: 13,
    color: '#BAE6FD',
    marginTop: 2,
    fontWeight: '500',
  },

  // 2-column upload grid
  uploadGridWrapper: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  uploadGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  purpleCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
  },
  skyCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  uploadCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Upload progress card
  uploadProgressCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  uploadProgressTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  uploadProgressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },

  // Document list
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  docDate: {
    fontSize: 12,
    color: '#64748B',
  },
  docActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 4,
  },
  actionBtnDownload: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  actionBtnDownloadText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnDelete: {
    padding: 6,
  },
  actionBtnDeleteText: {
    fontSize: 16,
  },

  // States
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Upload Modal
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
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  modalClose: {
    fontSize: 17,
    color: '#94A3B8',
    padding: 4,
  },
  dashedDropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0284C7',
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dashedDropzoneSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  dropzoneIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  dropzoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  dropzoneSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 15,
  },
  primaryUploadBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryUploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  formError: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  formErrorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  formSuccess: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  formSuccessText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600',
  },

  // Delete modal
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteDocPreview: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteDocName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  deleteDocType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
