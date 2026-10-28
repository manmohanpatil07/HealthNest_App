import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ScanQRScreen from '../screens/provider/ScanQRScreen';
import PatientDetailsScreen from '../screens/provider/PatientDetailsScreen';

const Stack = createNativeStackNavigator();

export default function ProviderNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="ProviderDashboard"
      screenOptions={{ headerShown: false,
        headerStyle: { backgroundColor: '#0D9488' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="ProviderDashboard" 
        component={ProviderDashboardScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ScanQR" 
        component={ScanQRScreen} 
        options={{ title: 'Scan Patient QR' }} 
      />
      <Stack.Screen 
        name="PatientDetails" 
        component={PatientDetailsScreen} 
        options={{ title: 'Patient Details' }} 
      />
    </Stack.Navigator>
  );
}
