import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HospitalFinderScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PM-JAY Hospital Finder</Text>
      <Text style={styles.placeholder}>[Hospitals Module: Hospital Finder Screen]</Text>
      <Text style={styles.detail}>Locate nearby Ayushman Bharat / PM-JAY empanelled hospitals.</Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('HospitalDetails')}
      >
        <Text style={styles.buttonText}>View Sample Hospital Details</Text>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    padding: 16,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
