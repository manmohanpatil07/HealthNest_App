import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function OTPVerificationScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.placeholder}>[Auth Module: OTP Verification Screen]</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Back to Login</Text>
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
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 32,
    fontWeight: '500',
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
