import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import axios from 'axios';
import {
  api_url,
  astrologer_login,
  colors,
  fonts,
  getFontSize,
} from '../config/Constants';
import Toast from 'react-native-toast-message';
import { KeyboardAvoidingView, Platform } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState('f5n_wOeVSQKFxWloLWn4t_:APA91bEgqyLLahL7iG1b1J1disI9wA1wzZS-lrSI2vqNcNCjR4_ymMEIaohFyH_GqZLnzgMBbelt79-sVObid7S2o_JKI0-2MU3Amkl4oYR0PwDbxm-yFms');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateAstrologerLogin = async () => {
    if (email.trim().length === 0)
      return Alert.alert('Please enter your email');
    if (password.trim().length === 0)
      return Alert.alert('Please enter your password');

    setLoading(true);
    const loginTime = new Date().toISOString();
    // console.log(api_url + astrologer_login)
    try {
      const response = await axios.post(api_url + astrologer_login, {
        email: email.toLowerCase(),
        password,
        fcmToken,
        loginTime,
      });

      if (response?.data?.success === true) {
        await AsyncStorage.setItem('astrologerData', JSON.stringify(response.data.astrologer));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        Toast.show({
          type: "success",
          text1: "Login Successfull",
          text2: `Welcome back, ${response.data.astrologer.astrologerName}`,
        });
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Login Failed', response?.data?.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={[
              styles.loginCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>

            {/* Logo with shadow effect */}
            <View style={styles.logoContainer}>
              <View />
              <Image
                source={require('../assets/images/newLogo.png')}
                style={styles.logo}
              />
            </View>

            {/* Welcome text section */}
            <View style={styles.headerSection}>
              <Text style={styles.astroTitle}>AstroBook</Text>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <View style={styles.divider} />
              <Text style={styles.appName}>Astrologer Portal</Text>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="email"
                    color={colors.background_theme4}
                    size={22}
                  />
                </View>
                <TextInput
                  value={email}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  placeholderTextColor={colors.black_color5}
                  onChangeText={setEmail}
                  style={styles.inputText}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="lock"
                    color={colors.background_theme4}
                    size={22}
                  />
                </View>
                <TextInput
                  value={password}
                  placeholder="Password"
                  placeholderTextColor={colors.black_color5}
                  secureTextEntry={!passwordVisible}
                  onChangeText={setPassword}
                  style={styles.inputText}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.eyeIcon}>
                  <Ionicons
                    name={passwordVisible ? 'eye' : 'eye-off-sharp'}
                    color={colors.black_color6}
                    size={22}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            {/* <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => navigation.navigate('forgetPassword')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity> */}

            {/* Login Button */}
            <TouchableOpacity
              onPress={validateAstrologerLogin}
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={colors.white_color} size="small" />
              ) : (
                <>
                  <Text style={styles.loginText}>Login</Text>
                  <View style={styles.arrowContainer}>
                    <AntDesign
                      name="arrowright"
                      color={colors.white_color}
                      size={20}
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Divider with OR */}
            {/* <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View> */}

            {/* Signup Link */}
            {/* <TouchableOpacity
            onPress={() => navigation.navigate('astrologerSignUp')}
            style={styles.signupContainer}
            activeOpacity={0.7}>
            <Text style={styles.signupText}>
              AstroBook
            </Text>
          </TouchableOpacity> */}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>

  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background_theme2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 80,
  },
  circleTop: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.background_theme4,
    opacity: 0.1,
    top: -50,
    right: -50,
  },
  circleBottom: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.background_theme4,
    opacity: 0.08,
    bottom: 100,
    left: -40,
  },
  loginCard: {
    backgroundColor: colors.white_color,
    marginHorizontal: 20,
    marginTop: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    paddingVertical: 40,
    paddingHorizontal: 28,
    marginBottom: 30,
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  logoShadow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.background_theme4,
    opacity: 0.15,
    top: 5,
    left: -5,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 55,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: getFontSize(2.8),
    color: colors.black_color8,
    fontFamily: fonts.bold,
    marginTop: 10,
  },
  divider: {
    width: 50,
    height: 3,
    backgroundColor: colors.background_theme4,
    borderRadius: 2,
    marginVertical: 8,
  },
  appName: {
    fontSize: getFontSize(2.2),
    color: colors.background_theme4,
    fontFamily: fonts.bold,
    marginTop: 5,
  },
  astroTitle: {
    fontSize: 30,
    color: colors.black_color9,
    fontFamily: fonts.bold,
    fontWeight: '500',
    marginTop: 5,
  },
  subtitle: {
    fontSize: getFontSize(1.4),
    color: colors.black_color6,
    fontFamily: fonts.medium,
    marginTop: 6,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.black_color5,
    borderRadius: 16,
    backgroundColor: '#fafafa',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background_theme4 + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    color: colors.black_color9,
    fontFamily: fonts.medium,
    fontSize: getFontSize(1.5),
    paddingVertical: 12,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotText: {
    color: colors.background_theme4,
    fontFamily: fonts.semibold,
    fontSize: getFontSize(1.4),
  },
  loginButton: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background_theme6,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: colors.background_theme6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: colors.white_color,
    fontSize: getFontSize(1.8),
    fontFamily: fonts.bold,
  },
  arrowContainer: {
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.black_color5,
  },
  orText: {
    marginHorizontal: 15,
    color: colors.black_color6,
    fontSize: getFontSize(1.3),
    fontFamily: fonts.medium,
  },
  signupContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background_theme4 + '08',
  },
  signupText: {
    color: colors.black_color7,
    fontSize: getFontSize(1.5),
    fontFamily: fonts.medium,
  },
  signupBold: {
    color: colors.background_theme4,
    fontFamily: fonts.bold,
    textDecorationLine: 'underline',
  },
});