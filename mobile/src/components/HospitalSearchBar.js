import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';

/**
 * HospitalSearchBar - Provides area/city search input with clear button
 */
export default function HospitalSearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search hospitals or areas...'
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCapitalize="words"
        autoCorrect={false}
      />
      {value ? (
        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 6,
  },
  clearText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
