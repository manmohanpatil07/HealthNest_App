import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ScanQRScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Patient QR</Text>
      <Text style={styles.placeholder}>[Provider Module: Scan QR Screen]</Text>
      <Text style={styles.detail}>Camera interface to scan patient QR and request records.</Text>
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
  },
});
