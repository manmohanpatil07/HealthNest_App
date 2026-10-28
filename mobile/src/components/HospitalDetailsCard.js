import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * HospitalDetailsCard - Displays structured hospital details
 * Complies with UI_INSTRUCTIONS.md Section 30 ("HOSPITAL INFO" card)
 *
 * Rows:
 * - Hospital Name
 * - Type
 * - City
 * - Address
 * - PM-JAY Status
 * - Phone
 */
export default function HospitalDetailsCard({ hospital }) {
  if (!hospital) return null;

  const isPmjay = Boolean(hospital.pmjay_status);
  const isVerified = isPmjay && Boolean(hospital.verified_at);

  let pmjayLabel = 'Not empanelled';
  let pmjayColor = '#64748B';

  if (isVerified) {
    pmjayLabel = 'Empanelled ✓';
    pmjayColor = '#7C3AED';
  } else if (isPmjay) {
    // If pmjay_status is true but no verification record
    pmjayLabel = 'PM-JAY Listed (Unverified)';
    pmjayColor = '#D97706';
  }

  const phoneDisplay =
    hospital.phone && String(hospital.phone).trim().length > 0
      ? String(hospital.phone).trim()
      : 'Not available';

  const addressDisplay = [
    hospital.address,
    hospital.city,
    hospital.state,
    hospital.pincode,
  ]
    .filter(Boolean)
    .join(', ') || 'Not specified';

  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeader}>HOSPITAL INFO</Text>

      {/* Hospital Name Row */}
      <View style={styles.row}>
        <Text style={styles.label}>Hospital Name</Text>
        <Text style={styles.value} numberOfLines={2}>
          {hospital.hospital_name || 'Not specified'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Hospital Type Row */}
      <View style={styles.row}>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>
          {hospital.hospital_type || 'General'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* City & State Row */}
      <View style={styles.row}>
        <Text style={styles.label}>City</Text>
        <Text style={styles.value}>
          {hospital.city ? `${hospital.city}${hospital.state ? `, ${hospital.state}` : ''}` : 'Not specified'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Address Row */}
      <View style={styles.row}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value} numberOfLines={3}>
          {addressDisplay}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* PM-JAY Status Row */}
      <View style={styles.row}>
        <Text style={styles.label}>PM-JAY Status</Text>
        <Text style={[styles.value, { color: pmjayColor, fontWeight: '700' }]}>
          {pmjayLabel}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Phone Row */}
      <View style={[styles.row, styles.lastRow]}>
        <Text style={styles.label}>Phone</Text>
        <Text
          style={[
            styles.value,
            hospital.phone ? styles.phoneActive : styles.phoneMissing,
          ]}
        >
          {phoneDisplay}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  lastRow: {
    paddingBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  value: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  phoneActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  phoneMissing: {
    color: '#94A3B8',
    fontWeight: '500',
  },
});

