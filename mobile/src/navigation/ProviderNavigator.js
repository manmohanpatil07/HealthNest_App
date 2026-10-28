import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProviderTabNavigator from './ProviderTabNavigator';
import PatientDetailsScreen from '../screens/provider/PatientDetailsScreen';

const Stack = createNativeStackNavigator();

export default function ProviderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab navigator as the main provider UI */}
      <Stack.Screen name="ProviderTabs" component={ProviderTabNavigator} />
      {/* Detail screen for a scanned patient */}
      <Stack.Screen
        name="PatientDetails"
        component={PatientDetailsScreen}
        options={{ title: 'Patient Details' }}
      />
    </Stack.Navigator>
  );
}
