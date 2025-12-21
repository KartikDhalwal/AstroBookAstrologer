import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeStack from '../stack/HomeStack';
import ConsultationStack from '../stack/ConsultationStack';
import EarningsStack from '../stack/EarningsStack';
import ProfileStack from '../stack/ProfileStack';

const Tab = createBottomTabNavigator();

// 📱 Screen utils
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallDevice = width < 360;

// 📐 Scaled sizes
const TAB_HEIGHT = isTablet ? 72 : isSmallDevice ? 56 : 64;
const ICON_SIZE = isTablet ? 28 : isSmallDevice ? 20 : 24;
const LABEL_SIZE = isTablet ? 14 : 12;

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // 🎨 Colors
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#b3b1b1',

        // 📦 Tab bar styling
        tabBarStyle: {
          height: TAB_HEIGHT + 8,
          paddingBottom: Platform.OS === 'android' ? 6 : 0,
          paddingTop: 6,
          backgroundColor: '#fff',
          elevation: 12,
          borderTopWidth: 0,
        },

        // 🏷 Label styling
        tabBarLabelStyle: {
          fontSize: LABEL_SIZE,
          marginBottom: 4,
        },
        tabBarAllowFontScaling: false,

        // 🎯 Icons
        tabBarIcon: ({ color }) => {
          let iconName = 'home-outline';

          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Consultations') iconName = 'chatbubbles-outline';
          else if (route.name === 'Earnings') iconName = 'wallet-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';

          return <Icon name={iconName} size={ICON_SIZE} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Home', { screen: 'Home' });
          },
        })}
      />
      <Tab.Screen name="Consultations" component={ConsultationStack} />
      <Tab.Screen name="Earnings" component={EarningsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
