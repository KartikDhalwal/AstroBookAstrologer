import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AstrologerHome from '../screens/HomeScreen'
import AstrologerConsultationList from '../screens/AstrologerConsultationList';
import VoiceVideoCallScreen from '../screens/VoiceVideoCallScreen';
import ChatScreen from '../screens/ChatScreen';
import AstrologerProfile from '../screens/AstrologerProfile';
import AstrologerDetailsForm from '../screens/AstrologerDetailsForm';
import AstrologerEarnings from '../screens/AstrologerEarningsPage';
import KundliDetailScreen from '../screens/KundliDetailScreen';

const Stack = createNativeStackNavigator();

export default function ConsultationStack() {
  return (
    <Stack.Navigator>

      <Stack.Screen 
        name="ConsultationList" 
        component={AstrologerConsultationList}
        options={{ title: "Consultations" }}
      />
      {/* <Stack.Screen 
        name="VoiceVideoCallScreen" 
        component={VoiceVideoCallScreen}
        options={{ title: "Connect",headerShown: false }}
      /> */}
      {/* <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen}
        options={{ title: "Connect with Chat" ,headerShown: true,
          presentation: 'card', }}
      /> */}
      <Stack.Screen 
        name="KundliDetailScreen" 
        component={KundliDetailScreen}
        options={{ title: "Kundli Details",headerShown: true }}
      />

    </Stack.Navigator>
  );
}
