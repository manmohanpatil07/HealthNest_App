import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * HospitalFilter - Handles PM-JAY Only toggle
 * Inactive: White background, Neutral border, Dark text
 * Active: Purple background (#7C3AED), Purple border, White text
 */
export default function HospitalFilter({ active, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.button, active ? styles.activeButton : styles.inactiveButton]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, active ? styles.activeText : styles.inactiveText]}>
        PM-JAY Only
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  activeButton: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  inactiveText: {
    color: '#0F172A',
  },
  activeText: {
    color: '#FFFFFF',
  },
});
