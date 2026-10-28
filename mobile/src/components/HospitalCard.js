import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HospitalStatusBadge from './HospitalStatusBadge';
import DistanceBadge from './DistanceBadge';

/**
 * HospitalCard - Reusable component for displaying hospital information in lists
 * Conforms to UI_INSTRUCTIONS.md Section 29
 * Government hospitals: Sky background icon area (#E0F2FE)
 * Private hospitals: Purple background icon area (#F3E8FF)
 */
export default function HospitalCard({ hospital, onPress }) {
  if (!hospital) return null;

  const isGovernment =
    hospital.hospital_type &&
    hospital.hospital_type.toLowerCase().includes('government');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(hospital)}
      activeOpacity={0.75}
    >
      <View style={styles.cardRow}>
        {/* Hospital Icon */}
        <View
          style={[
            styles.iconArea,
            isGovernment ? styles.govIconArea : styles.privateIconArea,
          ]}
        >
          <Text style={styles.hospitalEmoji}>🏥</Text>
        </View>

        {/* Hospital Info */}
        <View style={styles.infoArea}>
          <View style={styles.nameDistanceRow}>
            <Text style={styles.hospitalName} numberOfLines={1}>
              {hospital.hospital_name}
            </Text>
            <DistanceBadge distanceKm={hospital.distance_km} />
          </View>

          <Text style={styles.addressText} numberOfLines={2}>
            {hospital.address ? `${hospital.address}, ` : ''}{hospital.city}
          </Text>

          <HospitalStatusBadge
            pmjayStatus={hospital.pmjay_status}
            verifiedAt={hospital.verified_at}
            hospitalType={hospital.hospital_type}
          />
        </View>

        {/* Right Chevron */}
        <View style={styles.chevronArea}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconArea: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  govIconArea: {
    backgroundColor: '#E0F2FE', // Sky background for government hospitals
  },
  privateIconArea: {
    backgroundColor: '#F3E8FF', // Purple background for private hospitals
  },
  hospitalEmoji: {
    fontSize: 22,
  },
  infoArea: {
    flex: 1,
    marginRight: 8,
  },
  nameDistanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  hospitalName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  chevronArea: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  chevronText: {
    fontSize: 22,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
});
