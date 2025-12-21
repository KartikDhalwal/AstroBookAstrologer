import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AstrologerHome from '../screens/HomeScreen'
import AstrologerConsultationList from '../screens/AstrologerConsultationList';
import AstrologerProfile from '../screens/AstrologerProfile';
import AstrologerDetailsForm from '../screens/AstrologerDetailsForm';
import AstrologerEarnings from '../screens/AstrologerEarningsPage';
import AvailabilityStatusScreen from '../screens/AvailabilityStatusScreen';

const Stack = createNativeStackNavigator();

export default function EarningsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AstrologerEarnings" 
        component={AstrologerEarnings}
        options={{ title: "Home" ,
            headerShown: false
        }}
      />
    </Stack.Navigator>
  );
}
