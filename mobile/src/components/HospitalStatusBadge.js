import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * HospitalStatusBadge - Displays PM-JAY and hospital type badges
 * Complies with UI_INSTRUCTIONS.md Section 29
 */
export default function HospitalStatusBadge({ pmjayStatus, hospitalType }) {
  const isPmjay = Boolean(pmjayStatus);

  return (
    <View style={styles.container}>
      {hospitalType ? (
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{hospitalType}</Text>
        </View>
      ) : null}

      {isPmjay ? (
        <View style={styles.pmjayBadge}>
          <Text style={styles.pmjayBadgeText}>PM-JAY</Text>
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
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pmjayBadgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },
});
