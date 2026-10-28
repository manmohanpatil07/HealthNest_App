import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ScanQRScreen from '../screens/provider/ScanQRScreen';
import { MaterialIcons } from '@expo/vector-icons';


// Bottom tab navigator for Provider module – follows UI_INSTRUCTIONS colors and spacing.
// Includes only the destinations that actually exist in the codebase.

const Tab = createBottomTabNavigator();

export default function ProviderTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F8FAFC', // neutral surface per UI_INSTRUCTIONS
          borderTopColor: '#E2E8F0',
          height: 60,
        },
        tabBarActiveTintColor: '#0284C7', // primary
        tabBarInactiveTintColor: '#475569', // secondary text
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ProviderDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ScanQR"
        component={ScanQRScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="qr-code-scanner" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

