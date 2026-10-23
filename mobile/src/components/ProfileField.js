import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export default function ProfileField({ label, value, isLast = false }) {
  return (
    <View style={[styles.fieldRow, isLast && styles.noBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, !value && styles.emptyValue]}>
        {value || 'Not added'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  emptyValue: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
});
