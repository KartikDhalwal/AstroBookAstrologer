import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AstrologerHome from '../screens/HomeScreen'
import AstrologerConsultationList from '../screens/AstrologerConsultationList';
import AstrologerProfile from '../screens/AstrologerProfile';
import AstrologerDetailsForm from '../screens/AstrologerDetailsForm';
import AstrologerEarnings from '../screens/AstrologerEarningsPage';
import AvailabilityStatusScreen from '../screens/AvailabilityStatusScreen';
import ChatScreen from '../screens/ChatScreen';
import VoiceVideoCallScreen from '../screens/VoiceVideoCallScreen';
import KundliDetailScreen from '../screens/KundliDetailScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Home"
                component={AstrologerHome}
                options={{
                    title: "Home",
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="AstrologerConsultationList"
                component={AstrologerConsultationList}
                options={{ title: "Consultations" }}
            />

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

            <Stack.Screen
                name="AstrologerEarningsPage"
                component={AstrologerEarnings}
                options={{ title: "Earnings" }}
            />

            <Stack.Screen
                name="AvailabilityStatusScreen"
                component={AvailabilityStatusScreen}
                options={{ title: "Availability Status" }}
            />
            {/* <Stack.Screen
                name="ChatScreen"
                component={ChatScreen}
                options={{
                    title: "Connect with chat", headerShown: true
                }}
            /> */}
            {/* <Stack.Screen
                name="VoiceVideoCallScreen"
                component={VoiceVideoCallScreen}
                options={{ title: "Connect", headerShown: false }}
            /> */}
            <Stack.Screen
                name="KundliDetailScreen"
                component={KundliDetailScreen}
                options={{ title: "Kundli Details" }}
            />

        </Stack.Navigator>
    );
}
