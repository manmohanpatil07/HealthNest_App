import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ProviderLoginScreen from '../screens/auth/ProviderLoginScreen';
import ProviderRegisterScreen from '../screens/auth/ProviderRegisterScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: '#0284C7' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'HealthNest Login' }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Register Account' }} 
      />
      <Stack.Screen 
        name="OTPVerification" 
        component={OTPVerificationScreen} 
        options={{ title: 'Verify OTP' }} 
      />
      <Stack.Screen 
        name="ProviderLogin" 
        component={ProviderLoginScreen} 
        options={{ 
          title: 'Provider Portal Login',
          headerStyle: { backgroundColor: '#0D9488' }
        }} 
      />
      <Stack.Screen 
        name="ProviderRegister" 
        component={ProviderRegisterScreen} 
        options={{ 
          title: 'Register Provider',
          headerStyle: { backgroundColor: '#0D9488' }
        }} 
      />
    </Stack.Navigator>
  );
}
