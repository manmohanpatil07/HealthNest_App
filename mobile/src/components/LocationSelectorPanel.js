import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';

/**
 * Administrative Location Selector Modal Dropdown
 */
function SelectorDropdown({ label, value, placeholder, options, onSelect, disabled, loading }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.selectorGroup}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          disabled && styles.dropdownDisabled,
          modalVisible && styles.dropdownActive,
        ]}
        onPress={() => {
          if (!disabled && !loading) {
            setModalVisible(true);
          }
        }}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text
          style={[
            styles.dropdownValueText,
            !value && styles.dropdownPlaceholder,
            disabled && styles.dropdownDisabledText,
          ]}
          numberOfLines={1}
        >
          {loading ? 'Loading...' : value || placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#0284C7" />
        ) : (
          <Text style={[styles.dropdownArrow, disabled && styles.dropdownDisabledText]}>▼</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item, index) => `${item}_${index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item === value && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item === value && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === value && <Text style={styles.checkmarkText}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyOptions}>
                  <Text style={styles.emptyOptionsText}>No options available</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/**
 * LocationSelectorPanel Component
 * Provides Country (India, fixed), State, District, and Sub-district cascading dropdowns.
 */
export default function LocationSelectorPanel({
  country = 'India',
  selectedState,
  selectedDistrict,
  selectedSubDistrict,
  states = [],
  districts = [],
  subDistricts = [],
  loadingStates = false,
  loadingDistricts = false,
  loadingSubDistricts = false,
  onSelectState,
  onSelectDistrict,
  onSelectSubDistrict,
  onReset,
  onSearch,
  isSearching = false,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.panelTitle}>Manual Location Filter</Text>
          <TouchableOpacity onPress={onReset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.panelSubtitle}>
          Select State, District, and Sub-district to narrow down hospitals
        </Text>
      </View>

      {/* 1. Country (Fixed & Non-editable) */}
      <View style={styles.selectorGroup}>
        <Text style={styles.selectorLabel}>Country</Text>
        <View style={[styles.dropdownTrigger, styles.countryBox]}>
          <Text style={styles.countryText}>🇮🇳 {country} (Fixed)</Text>
        </View>
      </View>

      {/* 2. State */}
      <SelectorDropdown
        label="State *"
        value={selectedState}
        placeholder="Select Indian State"
        options={states}
        onSelect={onSelectState}
        loading={loadingStates}
        disabled={loadingStates}
      />

      {/* 3. District (Disabled until State chosen) */}
      <SelectorDropdown
        label="District"
        value={selectedDistrict}
        placeholder={selectedState ? 'Select District' : 'Select State First'}
        options={districts}
        onSelect={onSelectDistrict}
        loading={loadingDistricts}
        disabled={!selectedState || loadingDistricts}
      />

      {/* 4. Sub-district / Taluka (Disabled until District chosen) */}
      <SelectorDropdown
        label="Sub-district / Taluka"
        value={selectedSubDistrict}
        placeholder={selectedDistrict ? 'Select Sub-district / Taluka' : 'Select District First'}
        options={subDistricts}
        onSelect={onSelectSubDistrict}
        loading={loadingSubDistricts}
        disabled={!selectedDistrict || loadingSubDistricts}
      />

      {/* Search Button */}
      <TouchableOpacity
        style={[
          styles.searchButton,
          !selectedState && styles.searchButtonDisabled,
          isSearching && styles.searchButtonLoading,
        ]}
        onPress={onSearch}
        disabled={!selectedState || isSearching}
        activeOpacity={0.8}
      >
        {isSearching ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.searchButtonText}>Apply Location Filter</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  selectorGroup: {
    marginBottom: 10,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  dropdownTrigger: {
    height: 42,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryBox: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  countryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  dropdownActive: {
    borderColor: '#0284C7',
  },
  dropdownDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.65,
  },
  dropdownValueText: {
    fontSize: 13,
    color: '#0F172A',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#94A3B8',
  },
  dropdownDisabledText: {
    color: '#94A3B8',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 6,
  },
  searchButton: {
    backgroundColor: '#0284C7',
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  searchButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  searchButtonLoading: {
    backgroundColor: '#0369A1',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  optionText: {
    fontSize: 13,
    color: '#1E293B',
  },
  optionTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
  checkmarkText: {
    color: '#0284C7',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyOptions: {
    padding: 24,
    alignItems: 'center',
  },
  emptyOptionsText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});

