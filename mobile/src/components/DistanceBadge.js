import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * DistanceBadge - Displays approximate distance (e.g., '1.2 km')
 * Only displayed when distance is numeric and valid.
 */
export default function DistanceBadge({ distanceKm }) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return null;
  }

  const formattedDistance = parseFloat(distanceKm).toFixed(1);

  return (
    <View style={styles.badge}>
      <Text style={styles.distanceText}>{formattedDistance} km</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
});
