import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/components/splash';
import LoginScreen from './src/screens/LoginScreen';
import BottomTabs from './src/navigation/BottomTabs';
import { useCallState } from "./src/context/CallStateContext";
import Toast from "react-native-toast-message";
import ChatScreen from './src/screens/ChatScreen';
import VoiceVideoCallScreen from './src/screens/VoiceVideoCallScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const { callUI, isMinimized } = useCallState();

  return (
    <>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        
        {/* No header screens */}
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />

        {/* Whole app after login */}
        <Stack.Screen 
          name="MainTabs" 
          component={BottomTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ChatScreen" 
          component={ChatScreen} 
          options={{ headerShown: true,title:'Connect with Chat' }}
        />
<Stack.Screen 
        name="VoiceVideoCallScreen" 
        component={VoiceVideoCallScreen}
        options={{ title: "Connect",headerShown: false }}
      />
        </Stack.Navigator>
    </NavigationContainer>
      {callUI}
    <Toast />

    </>
  );
}
