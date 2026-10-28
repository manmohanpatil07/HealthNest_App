import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// User Screens
import DashboardScreen from '../screens/user/DashboardScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import HealthRecordsScreen from '../screens/user/HealthRecordsScreen';
import DocumentsScreen from '../screens/user/DocumentsScreen';
import VaccinationScreen from '../screens/user/VaccinationScreen';
import QRHealthCardScreen from '../screens/user/QRHealthCardScreen';
import SettingsScreen from '../screens/user/SettingsScreen';

// Provider Screens
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ScanQRScreen from '../screens/provider/ScanQRScreen';
import PatientDetailsScreen from '../screens/provider/PatientDetailsScreen';

// Hospital Screens
import HospitalFinderScreen from '../screens/hospitals/HospitalFinderScreen';
import HospitalDetailsScreen from '../screens/hospitals/HospitalDetailsScreen';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false,
        headerStyle: { backgroundColor: '#0284C7' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {/* User Module Screens */}
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'HealthNest' }} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }} 
      />
      <Stack.Screen 
        name="HealthRecords" 
        component={HealthRecordsScreen} 
        options={{ title: 'Health Records' }} 
      />
      <Stack.Screen 
        name="Documents" 
        component={DocumentsScreen} 
        options={{ title: 'Medical Documents' }} 
      />
      <Stack.Screen 
        name="Vaccination" 
        component={VaccinationScreen} 
        options={{ title: 'Vaccinations' }} 
      />
      <Stack.Screen 
        name="QRHealthCard" 
        component={QRHealthCardScreen} 
        options={{ title: 'QR Health Card' }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />

      {/* Provider Module Screens */}
      <Stack.Screen 
        name="ProviderDashboard" 
        component={ProviderDashboardScreen} 
        options={{ title: 'Provider Portal' }} 
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

      {/* Hospital Module Screens */}
      <Stack.Screen 
        name="HospitalFinder" 
        component={HospitalFinderScreen} 
        options={{ title: 'Hospital Finder' }} 
      />
      <Stack.Screen 
        name="HospitalDetails" 
        component={HospitalDetailsScreen} 
        options={{ title: 'Hospital Details' }} 
      />
    </Stack.Navigator>
  );
}
