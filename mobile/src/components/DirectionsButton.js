import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Linking, Platform } from 'react-native';

/**
 * DirectionsButton - Opens a map/directions service using hospital coordinates
 *
 * Rules:
 * - Use valid hospital latitude and longitude to open directions.
 * - Native linking approach without paid dependencies.
 * - Handles missing/invalid coordinates or unavailable map apps gracefully.
 * - Never invents hospital coordinates.
 */
export default function DirectionsButton({ latitude, longitude, hospitalName, address, style }) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  const hasValidCoords =
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const handleOpenDirections = async () => {
    if (!hasValidCoords) {
      Alert.alert(
        'Location Unavailable',
        'Hospital coordinates are not available for turn-by-turn directions.'
      );
      return;
    }

    const label = encodeURIComponent(hospitalName || 'Hospital');

    // Geo URI schemes:
    // Android: geo:0,0?q=lat,lng(label) or geo:lat,lng?q=lat,lng(label)
    // iOS: maps:0,0?q=label@lat,lng or maps:?daddr=lat,lng
    // Universal web fallback: https://www.google.com/maps/dir/?api=1&destination=lat,lng
    const googleWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`;
    const nativeUrl = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: googleWebUrl,
    });

    try {
      if (Platform.OS === 'web') {
        await Linking.openURL(googleWebUrl);
        return;
      }

      const supported = await Linking.canOpenURL(nativeUrl);
      if (supported) {
        await Linking.openURL(nativeUrl);
      } else {
        // Fallback to universal web maps URL
        const webSupported = await Linking.canOpenURL(googleWebUrl);
        if (webSupported) {
          await Linking.openURL(googleWebUrl);
        } else {
          Alert.alert(
            'Cannot Open Maps',
            'No navigation application could be opened on your device.'
          );
        }
      }
    } catch (err) {
      console.warn('[DirectionsButton] Linking error:', err);
      // Attempt web URL fallback on error
      try {
        await Linking.openURL(googleWebUrl);
      } catch (innerErr) {
        Alert.alert(
          'Directions Error',
          'Unable to open map application. Please ensure a map app or browser is installed.'
        );
      }
    }
  };

  if (!hasValidCoords) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.disabledButton, style]}
        activeOpacity={1}
        disabled={true}
        accessibilityRole="button"
        accessibilityLabel="Directions unavailable, coordinates missing"
      >
        <Text style={styles.disabledIcon}>🗺️</Text>
        <Text style={styles.disabledText}>No Location</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.secondaryButton, style]}
      onPress={handleOpenDirections}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Get directions to ${hospitalName || 'hospital'}`}
    >
      <Text style={styles.buttonIcon}>🗺️</Text>
      <Text style={styles.secondaryText}>Get Directions</Text>
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
  secondaryButton: {
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryText: {
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

