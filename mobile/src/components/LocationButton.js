import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

/**
 * LocationButton - Handles triggers for device current location
 * Section 29: White background, 2px neutral border, location icon, spinner while locating
 */
export default function LocationButton({ onPress, loading, isActive }) {
  return (
    <TouchableOpacity
      style={[styles.button, isActive && styles.activeButton]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#0284C7" style={styles.spinner} />
      ) : (
        <Text style={styles.icon}>📍</Text>
      )}
      <Text style={[styles.text, isActive && styles.activeText]}>
        Current Location
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  activeButton: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  spinner: {
    marginRight: 6,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  activeText: {
    color: '#0284C7',
  },
});
