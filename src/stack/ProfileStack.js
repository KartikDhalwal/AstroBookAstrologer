import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AstrologerHome from '../screens/HomeScreen'
import AstrologerConsultationList from '../screens/AstrologerConsultationList';
import AstrologerProfile from '../screens/AstrologerProfile';
import AstrologerDetailsForm from '../screens/AstrologerDetailsForm';
import AstrologerEarnings from '../screens/AstrologerEarningsPage';
import AvailabilityStatusScreen from '../screens/AvailabilityStatusScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      

      <Stack.Screen 
        name="AstrologerProfile" 
        component={AstrologerProfile}
        options={{ title: "Profile" }}
      />

      <Stack.Screen 
        name="AstrologerDetailsForm" 
        component={AstrologerDetailsForm}
        options={{ title: "Details Form" }}
      />

    </Stack.Navigator>
  );
}
