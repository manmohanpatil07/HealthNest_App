import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ScanQRScreen from '../screens/provider/ScanQRScreen';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const Tab = createBottomTabNavigator();

export default function ProviderTabNavigator() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F8FAFC',
          borderTopColor: '#E2E8F0',
          height: 60,
        },
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ProviderDashboardScreen}
        options={{
          tabBarLabel: t('nav.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ScanQR"
        component={ScanQRScreen}
        options={{
          tabBarLabel: t('nav.scan'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="qr-code-scanner" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
