import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Linking, Platform } from 'react-native';

/**
 * CallButton - Action button to dial a hospital's phone number
 *
 * Rules:
 * - Enable the action only when a usable phone number exists.
 * - Opens device phone app via Linking.openURL('tel:...').
 * - Handles missing numbers and cases where phone app cannot be opened.
 * - Never invents a telephone number.
 */
export default function CallButton({ phone, disabled: propDisabled, style }) {
  const hasPhone = Boolean(phone && String(phone).trim().length > 0);
  const isDisabled = propDisabled || !hasPhone;

  const handleCall = async () => {
    if (!hasPhone) {
      Alert.alert('Phone Unavailable', 'No phone number is listed for this hospital.');
      return;
    }

    // Clean phone number for tel: protocol (preserve numbers, +, and -)
    const sanitizedNumber = String(phone).trim().replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${sanitizedNumber || phone.trim()}`;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        // Fallback: try opening directly or alert user (e.g., simulators without telephony)
        try {
          await Linking.openURL(phoneUrl);
        } catch (innerErr) {
          Alert.alert(
            'Unable to Call',
            `Your device does not support placing phone calls or no phone application is installed.\n\nHospital contact: ${phone}`
          );
        }
      }
    } catch (err) {
      console.warn('[CallButton] Linking error:', err);
      Alert.alert(
        'Unable to Place Call',
        `Could not open phone application.\n\nHospital contact: ${phone}`
      );
    }
  };

  if (isDisabled) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.disabledButton, style]}
        activeOpacity={1}
        disabled={true}
        accessibilityRole="button"
        accessibilityLabel="No phone number listed"
      >
        <Text style={styles.disabledIcon}>📞</Text>
        <Text style={styles.disabledText}>No Phone Listed</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.primaryButton, style]}
      onPress={handleCall}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Call hospital at ${phone}`}
    >
      <Text style={styles.buttonIcon}>📞</Text>
      <Text style={styles.primaryText}>Call Hospital</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  buttonIcon: {
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  disabledIcon: {
    fontSize: 15,
    opacity: 0.5,
  },
});

