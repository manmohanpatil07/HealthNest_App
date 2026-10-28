import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * HospitalStatusBadge - Displays PM-JAY and hospital type badges
 * Complies with UI_INSTRUCTIONS.md Section 29 & Section 30
 *
 * Props:
 * - pmjayStatus: boolean/number (pmjay_status from DB)
 * - verifiedAt: string/date (verified_at timestamp from DB)
 * - hospitalType: string
 * - showVerificationLabel: boolean (optional, show full "✓ PM-JAY Empanelled" or "PM-JAY")
 */
export default function HospitalStatusBadge({
  pmjayStatus,
  verifiedAt,
  hospitalType,
  showVerificationLabel = false,
}) {
  const isPmjay = Boolean(pmjayStatus);
  const isVerified = isPmjay && Boolean(verifiedAt);

  return (
    <View style={styles.container}>
      {hospitalType ? (
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{hospitalType}</Text>
        </View>
      ) : null}

      {isPmjay ? (
        <View
          style={[
            styles.pmjayBadge,
            isVerified ? styles.pmjayVerifiedBadge : styles.pmjayUnverifiedBadge,
          ]}
        >
          <Text
            style={[
              styles.pmjayBadgeText,
              isVerified ? styles.pmjayVerifiedText : styles.pmjayUnverifiedText,
            ]}
          >
            {showVerificationLabel
              ? isVerified
                ? '✓ PM-JAY Empanelled'
                : 'PM-JAY Listed'
              : isVerified
              ? 'PM-JAY'
              : 'PM-JAY (Unverified)'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  pmjayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  pmjayVerifiedBadge: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  pmjayVerifiedText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },
  pmjayUnverifiedBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pmjayUnverifiedText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
});
