import React, { useState, useEffect, useCallback } from 'react';
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

// Helper date formatting
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

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function validateDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return false;
  const d = new Date(dateStr.trim());
  return !isNaN(d.getTime());
}

export default function VaccinationScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Data state
  const [vaccinations, setVaccinations] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Add modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form, setForm] = useState({
    vaccine_name: '',
    vaccination_date: todayISO(),
    next_due_date: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ visible: false, vaccination: null });
  const [deleting, setDeleting] = useState(false);

  // Fetch vaccinations
  const fetchVaccinations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await userService.getVaccinations();
      setVaccinations(data.vaccinations || []);
      setUpcoming(data.upcoming || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load vaccination history.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVaccinations();
  }, []);

  // Open add modal
  const openAddModal = () => {
    setForm({
      vaccine_name: '',
      vaccination_date: todayISO(),
      next_due_date: '',
      notes: '',
    });
    setFormErrors({});
    setSaveSuccess(false);
    setAddModalVisible(true);
  };

  // Form validation
  const validateForm = () => {
    const errs = {};
    if (!form.vaccine_name.trim()) errs.vaccine_name = 'Vaccine Name is required.';
    if (!form.vaccination_date.trim()) {
      errs.vaccination_date = 'Vaccination Date is required.';
    } else if (!validateDate(form.vaccination_date)) {
      errs.vaccination_date = 'Enter a valid date (YYYY-MM-DD).';
    }

    if (form.next_due_date.trim() && !validateDate(form.next_due_date)) {
      errs.next_due_date = 'Enter a valid date (YYYY-MM-DD).';
    }
    return errs;
  };

  // Save vaccination
  const handleSaveVaccination = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSaving(true);
    setFormErrors({});
    try {
      await userService.createVaccination({
        vaccine_name: form.vaccine_name.trim(),
        vaccination_date: form.vaccination_date.trim(),
        next_due_date: form.next_due_date.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });

      setSaveSuccess(true);
      await fetchVaccinations();

      setTimeout(() => {
        setAddModalVisible(false);
        setSaveSuccess(false);
      }, 800);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save vaccination record.';
      setFormErrors({ general: msg });
    } finally {
      setSaving(false);
    }
  };

  // Delete vaccination
  const confirmDelete = async () => {
    if (!deleteModal.vaccination) return;
    setDeleting(true);
    try {
      await userService.deleteVaccination(deleteModal.vaccination.vaccination_id);
      setDeleteModal({ visible: false, vaccination: null });
      await fetchVaccinations();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete vaccination.';
      setDeleteModal({ visible: false, vaccination: null });
      Alert.alert('Error', msg);
    } finally {
      setDeleting(false);
    }
  };

  // Render Upcoming Cards per Section 26: Amber left border, 💉 icon, Due warning badge
  const renderUpcomingSection = () => {
    if (upcoming.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderTitle}>UPCOMING</Text>
        {upcoming.map((item) => (
          <View key={`upcoming-${item.vaccination_id}`} style={styles.upcomingCard}>
            <View style={styles.upcomingLeft}>
              <View style={styles.upcomingIconCircle}>
                <Text style={{ fontSize: 20 }}>💉</Text>
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingName}>{item.vaccine_name}</Text>
                <Text style={styles.upcomingDate}>
                  Next due: {formatDate(item.next_due_date)}
                </Text>
                {item.notes ? (
                  <Text style={styles.upcomingNotes} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>Due</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Render History Cards per Section 26: Green check icon, Vaccine name, Vaccinated: {date}, Done badge
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.historyLeft}>
          <View style={styles.checkCircle}>
            <Text style={{ fontSize: 16 }}>✓</Text>
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyName}>{item.vaccine_name}</Text>
            <Text style={styles.historyDate}>
              Vaccinated: {formatDate(item.vaccination_date)}
            </Text>
            {item.next_due_date ? (
              <Text style={styles.historyNextDate}>
                Next due: {formatDate(item.next_due_date)}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.historyRight}>
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>Done</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setDeleteModal({ visible: true, vaccination: item })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 16 }}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {item.notes ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💉</Text>
      <Text style={styles.emptyTitle}>No vaccination records</Text>
      <Text style={styles.emptySubtitle}>
        Add your vaccination history to keep track
      </Text>
      <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
        <Text style={styles.emptyAddBtnText}>Add Vaccine</Text>
      </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Vaccination</Text>
            <Text style={styles.headerSubtitle}>
              {vaccinations.length} {vaccinations.length === 1 ? 'record' : 'records'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading vaccinations…</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchVaccinations()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vaccinations}
          keyExtractor={(item) => String(item.vaccination_id)}
          ListHeaderComponent={renderUpcomingSection}
          renderItem={renderHistoryItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            vaccinations.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={() => fetchVaccinations(true)}
          refreshing={refreshing}
        />
      )}

      {/* ───────────────── ADD VACCINATION MODAL ───────────────── */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !saving && setAddModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !saving && setAddModalVisible(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Vaccination</Text>
                {!saving && (
                  <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {formErrors.general ? (
                <View style={styles.formError}>
                  <Text style={styles.formErrorText}>⚠ {formErrors.general}</Text>
                </View>
              ) : null}

              {saveSuccess ? (
                <View style={styles.formSuccess}>
                  <Text style={styles.formSuccessText}>✓ Vaccination record added!</Text>
                </View>
              ) : null}

              {/* 1. Vaccine Name * */}
              <Text style={styles.fieldLabel}>
                Vaccine Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.vaccine_name && styles.inputError]}
                placeholder="e.g. Hepatitis B, COVID-19, Covaxin"
                placeholderTextColor="#94A3B8"
                value={form.vaccine_name}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, vaccine_name: v }));
                  setFormErrors((e) => ({ ...e, vaccine_name: '' }));
                }}
                maxLength={150}
              />
              {formErrors.vaccine_name ? (
                <Text style={styles.fieldError}>{formErrors.vaccine_name}</Text>
              ) : null}

              {/* 2. Vaccination Date * */}
              <Text style={styles.fieldLabel}>
                Vaccination Date <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.vaccination_date && styles.inputError]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={form.vaccination_date}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, vaccination_date: v }));
                  setFormErrors((e) => ({ ...e, vaccination_date: '' }));
                }}
                keyboardType="numeric"
                maxLength={10}
              />
              {formErrors.vaccination_date ? (
                <Text style={styles.fieldError}>{formErrors.vaccination_date}</Text>
              ) : null}

              {/* 3. Next Due Date (if any) */}
              <Text style={styles.fieldLabel}>Next Due Date (if any)</Text>
              <TextInput
                style={[styles.input, formErrors.next_due_date && styles.inputError]}
                placeholder="YYYY-MM-DD (Optional for booster)"
                placeholderTextColor="#94A3B8"
                value={form.next_due_date}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, next_due_date: v }));
                  setFormErrors((e) => ({ ...e, next_due_date: '' }));
                }}
                keyboardType="numeric"
                maxLength={10}
              />
              {formErrors.next_due_date ? (
                <Text style={styles.fieldError}>{formErrors.next_due_date}</Text>
              ) : null}

              {/* 4. Notes */}
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Dose number, batch number, clinic name..."
                placeholderTextColor="#94A3B8"
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setAddModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.btnDisabled]}
                  onPress={handleSaveVaccination}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: 28 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────────── DELETE MODAL ───────────────── */}
      <Modal
        visible={deleteModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteModal({ visible: false, vaccination: null })}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteSheet}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🗑️</Text>
            <Text style={styles.deleteTitle}>Delete Vaccination?</Text>
            <Text style={styles.deleteMessage}>
              This vaccination record will be permanently deleted.
            </Text>

            {deleteModal.vaccination && (
              <View style={styles.deletePreview}>
                <Text style={styles.deletePreviewTitle}>
                  {deleteModal.vaccination.vaccine_name}
                </Text>
                <Text style={styles.deletePreviewDate}>
                  Dose: {formatDate(deleteModal.vaccination.vaccination_date)}
                </Text>
              </View>
            )}

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeleteModal({ visible: false, vaccination: null })}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 14,
  },

  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Upcoming Section per UI_INSTRUCTIONS.md §26
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  upcomingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  upcomingIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 2,
  },
  upcomingDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  upcomingNotes: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  dueBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  dueBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Vaccination History Cards
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  historyNextDate: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
    fontWeight: '600',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  notesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#CBD5E1',
  },
  notesText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
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
    marginBottom: 20,
  },
  emptyAddBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Add Modal
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
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
    marginLeft: 2,
  },
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
    backgroundColor: '#0284C7',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
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
  deletePreview: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deletePreviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  deletePreviewDate: {
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
