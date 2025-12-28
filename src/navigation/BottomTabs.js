import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeStack from '../stack/HomeStack';
import ConsultationStack from '../stack/ConsultationStack';
import EarningsStack from '../stack/EarningsStack';
import ProfileStack from '../stack/ProfileStack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#b3b1b1',

        tabBarStyle: {
          height: TAB_HEIGHT + insets.bottom, // ✅ key fix
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
          backgroundColor: '#fff',
          elevation: 12,
          borderTopWidth: 0,
        },

        tabBarLabelStyle: {
          fontSize: LABEL_SIZE,
          marginBottom: 4,
        },
        tabBarAllowFontScaling: false,

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
      <Tab.Screen name="Home" component={HomeStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Home', { screen: 'Home' });
          }
        })}
      />
      <Tab.Screen name="Consultations" component={ConsultationStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Consultations', { screen: 'Consultations' });
          }
        })}
      />
      <Tab.Screen name="Earnings" component={EarningsStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Earnings', { screen: 'Earnings' });
          }
        })}
      />
      <Tab.Screen name="Profile" component={ProfileStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Profile', { screen: 'Profile' });
          }
        })}
      />
    </Tab.Navigator>
  );
}

