import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redBg,
    borderColor: COLORS.redBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 10,
    width: '100%',
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
  },
  message: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
