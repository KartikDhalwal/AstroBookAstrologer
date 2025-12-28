import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config/Screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }) => {

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const astrologerDataString = await AsyncStorage.getItem('astrologerData');
        const astrologerData = astrologerDataString
          ? JSON.parse(astrologerDataString)
          : null;

        if (isLoggedIn === "true") {
          navigation.replace('MainTabs', { astrologerData });
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        navigation.replace('Login');
      }
    }, 1500); // ⏳ 1.5 seconds splash delay

    return () => clearTimeout(timer); // cleanup
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../assets/images/splashAstro.png')}
        style={styles.splashImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  splashImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'cover',
  },
});

export default SplashScreen;
