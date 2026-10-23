import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';

export default function UserBottomNav({ activeTab = 'Home', navigation }) {
  const tabs = [
    { name: 'Home', icon: '🏠', screen: 'Dashboard' },
    { name: 'Records', icon: '📋', screen: 'HealthRecords' },
    { name: 'Vaccine', icon: '💉', screen: 'Vaccination' },
    { name: 'QR Card', icon: '🪪', screen: 'QRHealthCard' },
    { name: 'Profile', icon: '👤', screen: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate(tab.screen);
              }
            }}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.name}
            </Text>
            {isActive ? <View style={styles.activeIndicator} /> : <View style={styles.inactiveSpace} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    height: 3,
    width: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: 4,
  },
  inactiveSpace: {
    height: 3,
    marginTop: 4,
  },
});
