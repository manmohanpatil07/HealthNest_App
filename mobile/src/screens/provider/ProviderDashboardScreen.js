import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProviderDashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Provider Portal</Text>
      <Text style={styles.subtitle}>Doctor & Clinic Staff Dashboard</Text>
      <Text style={styles.placeholder}>[Provider Module: Provider Dashboard]</Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('ScanQR')}
      >
        <Text style={styles.buttonText}>Scan Patient QR</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('PatientDetails')}
      >
        <Text style={styles.secondaryButtonText}>View Patient Details</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    padding: 16,
    backgroundColor: '#059669',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
});
