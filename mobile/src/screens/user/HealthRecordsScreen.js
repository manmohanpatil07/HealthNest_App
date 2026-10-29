import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import userService from '../../services/userService';
import HealthRecordCard from '../../components/HealthRecordCard';
import { useLanguage } from '../../context/LanguageContext';

// ─── Category options (matches UI_INSTRUCTIONS.md §24) ───────────────────────
const RECORD_TYPES = [
  'Blood Test',
  'Prescription',
  'Consultation',
  'Radiology',
  'Other',
];

// ─── Form initial state ───────────────────────────────────────────────────────
const FORM_INITIAL = {
  record_type: '',
  title: '',
  description: '',
  record_date: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function validateDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return false;
  const d = new Date(dateStr.trim());
  return !isNaN(d.getTime());
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HealthRecordsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // Data
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, record: null });

  // Add form
  const [form, setForm] = useState(FORM_INITIAL);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Deleting
  const [deleting, setDeleting] = useState(false);

  // General error
  const [error, setError] = useState('');

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await userService.getHealthRecords();
      const list = data.records || [];
      setRecords(list);
      applySearch(list, searchQuery);
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Failed to load health records. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRecords();
  }, []);

  // ─── Search filter ────────────────────────────────────────────────────────
  const applySearch = (list, query) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFilteredRecords(list);
      return;
    }
    setFilteredRecords(
      list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.record_type.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q)
      )
    );
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applySearch(records, text);
  };

  // ─── Add record ───────────────────────────────────────────────────────────
  const openAddModal = () => {
    setForm({ ...FORM_INITIAL, record_date: todayISO() });
    setFormErrors({});
    setSaveSuccess(false);
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.record_type) errors.record_type = 'Record Type is required.';
    if (!form.title.trim()) errors.title = 'Title is required.';
    if (!form.record_date.trim()) {
      errors.record_date = 'Record Date is required.';
    } else if (!validateDate(form.record_date)) {
      errors.record_date = 'Enter a valid date (YYYY-MM-DD).';
    }
    return errors;
  };

  const handleSaveRecord = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setSaving(true);
    setFormErrors({});
    try {
      await userService.createHealthRecord({
        record_type: form.record_type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        record_date: form.record_date.trim(),
      });
      setSaveSuccess(true);
      await fetchRecords();
      // close after short success flash
      setTimeout(() => {
        setAddModalVisible(false);
        setSaveSuccess(false);
      }, 800);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save record. Please try again.';
      setFormErrors({ general: msg });
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete record ────────────────────────────────────────────────────────
  const handleDeletePress = (record) => {
    setDeleteModal({ visible: true, record });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.record) return;
    setDeleting(true);
    try {
      await userService.deleteHealthRecord(deleteModal.record.record_id);
      setDeleteModal({ visible: false, record: null });
      await fetchRecords();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete record.';
      setDeleteModal({ visible: false, record: null });
      Alert.alert('Error', msg);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>{t('records.noRecordsFound')}</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? t('records.noRecordsSub')
          : t('records.noRecordsSub')}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
          <Text style={styles.emptyAddBtnText}>{t('records.addRecord')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('records.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {records.length} {t('records.recordsCount')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openAddModal}
          accessibilityLabel="Add health record"
        >
          <Text style={styles.addBtnText}>{t('records.addRecord')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('records.searchPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading records…</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRecords()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => String(item.record_id)}
          renderItem={({ item }) => (
            <HealthRecordCard
              record={item}
              onDelete={() => handleDeletePress(item)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            filteredRecords.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={() => fetchRecords(true)}
          refreshing={refreshing}
        />
      )}

      {/* ─────────────────── ADD MODAL ─────────────────── */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAddModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAddModal} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Health Record</Text>
                <TouchableOpacity onPress={closeAddModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* General error */}
              {formErrors.general ? (
                <View style={styles.formError}>
                  <Text style={styles.formErrorText}>⚠ {formErrors.general}</Text>
                </View>
              ) : null}

              {/* Success flash */}
              {saveSuccess ? (
                <View style={styles.formSuccess}>
                  <Text style={styles.formSuccessText}>✓ Record added successfully!</Text>
                </View>
              ) : null}

              {/* 1. Record Type */}
              <Text style={styles.fieldLabel}>
                Record Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.typeGrid}>
                {RECORD_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      form.record_type === type && styles.typeChipActive,
                    ]}
                    onPress={() => {
                      setForm((f) => ({ ...f, record_type: type }));
                      setFormErrors((e) => ({ ...e, record_type: '' }));
                    }}
                  >
                    <Text style={styles.typeChipLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.record_type ? (
                <Text style={styles.fieldError}>{formErrors.record_type}</Text>
              ) : null}

              {/* 2. Title */}
              <Text style={styles.fieldLabel}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.title && styles.inputError]}
                placeholder="e.g. Annual Blood Panel"
                placeholderTextColor="#94A3B8"
                value={form.title}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, title: v }));
                  setFormErrors((e) => ({ ...e, title: '' }));
                }}
                maxLength={200}
                returnKeyType="next"
              />
              {formErrors.title ? (
                <Text style={styles.fieldError}>{formErrors.title}</Text>
              ) : null}

              {/* 3. Description */}
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional notes about this record"
                placeholderTextColor="#94A3B8"
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={1000}
              />

              {/* 4. Record Date */}
              <Text style={styles.fieldLabel}>
                Record Date <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.record_date && styles.inputError]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={form.record_date}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, record_date: v }));
                  setFormErrors((e) => ({ ...e, record_date: '' }));
                }}
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="done"
              />
              {formErrors.record_date ? (
                <Text style={styles.fieldError}>{formErrors.record_date}</Text>
              ) : null}

              {/* Action buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeAddModal} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSaveRecord}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Record</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Bottom padding for keyboard */}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─────────────────── DELETE MODAL ─────────────────── */}
      <Modal
        visible={deleteModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteModal({ visible: false, record: null })}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteSheet}>
            <Text style={styles.deleteIcon}>🗑️</Text>
            <Text style={styles.deleteTitle}>Delete Record?</Text>
            <Text style={styles.deleteMessage}>
              This record will be permanently deleted and cannot be recovered.
            </Text>

            {deleteModal.record && (
              <View style={styles.deleteRecordPreview}>
                <Text style={styles.deleteRecordTitle} numberOfLines={1}>
                  {deleteModal.record.title}
                </Text>
                <Text style={styles.deleteRecordType}>{deleteModal.record.record_type}</Text>
              </View>
            )}

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteModal({ visible: false, record: null })}
                disabled={deleting}
              >
                <Text style={styles.deleteCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, deleting && styles.deleteConfirmBtnDisabled]}
                onPress={handleDeleteConfirm}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#BFDBFE',
    marginTop: 2,
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Search
  searchWrapper: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  searchClear: {
    fontSize: 13,
    color: '#94A3B8',
    paddingLeft: 8,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
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
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty state
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
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── ADD MODAL ─────────────────────────────────────────────────────────────
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
    maxHeight: '92%',
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
    marginBottom: 20,
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

  // Form fields
  formError: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
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
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  formSuccessText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
    marginBottom: 8,
    marginLeft: 2,
  },

  // Record type chips
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  typeChipActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  typeChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  // Modal action buttons
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── DELETE MODAL ──────────────────────────────────────────────────────────
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
  deleteIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  deleteMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteRecordPreview: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteRecordTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  deleteRecordType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  deleteCancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 15,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteConfirmBtnDisabled: {
    opacity: 0.7,
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
