// src/components/SidebarDrawer.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('screen');

const SidebarDrawer = ({ visible, onClose, astrologerData }) => {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;

  const [drawerVisible, setDrawerVisible] = useState(visible);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

React.useEffect(() => {
  if (visible) {
    setDrawerVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  } else {
    Animated.timing(slideAnim, {
      toValue: -width * 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  }
}, [visible]);


  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('astrologerData');
            await AsyncStorage.removeItem('isLoggedIn');
            navigation.replace('Login');
          } catch (error) {
            console.error('Error during logout:', error);
          }
        },
      },
    ]);
  };

  const drawerData = [
    { title: 'Profile', icon: 'account-circle-outline', route: 'Profile' },
    { title: 'My Consultations', icon: 'calendar-account-outline', route: 'Consultations' },
    { title: 'Earnings', icon: 'wallet-outline', route: 'Earnings' },
    // { title: 'Contact Us', icon: 'headset' },
    { title: 'Logout', icon: 'logout', color: '#DC2626' },
  ];

const handleItemPress = (item) => {
  if (item.title === 'Logout') {
    closeDrawerWithCallback(handleLogout);
    return;
  }

  if (item.title === 'Contact Us') {
    closeDrawerWithCallback(() => {
      setSupportModalVisible(true);
    });
    return;
  }

  if (item.route) {
    closeDrawerWithCallback(() => {
      navigation.navigate(item.route);
    });
  }
};


const closeDrawerWithCallback = (callback) => {
  // Tell parent to hide drawer
  onClose(); 

  Animated.timing(slideAnim, {
    toValue: -width * 0.8,
    duration: 300,
    useNativeDriver: true,
  }).start(() => {
    setDrawerVisible(false);
    if (callback) callback(); // run only AFTER drawer is fully closed
  });
};



  if (!drawerVisible) return null;

  return (
    <>
      <Modal visible={drawerVisible} animationType="fade" transparent onRequestClose={onClose}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={{
              width: width * 0.8,
              height: height,
              backgroundColor: '#FFFFFF',
              transform: [{ translateX: slideAnim }],
            }}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
              <ScrollView>
                {/* Header */}
                <View
                  style={{
                    backgroundColor: '#7F1D1D',
                    paddingTop: 40,
                    paddingBottom: 24,
                    paddingHorizontal: 20,
                    borderBottomRightRadius: 24,
                    alignItems: 'center',
                  }}
                >
                  <View style={{ marginBottom: 12 }}>
                    <View
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        backgroundColor: '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 3,
                        borderColor: '#FFFFFF',
                      }}
                    >
                      <Text style={{ fontSize: 28, fontWeight: '700', color: '#7F1D1D' }}>
                        {astrologerData?.astrologerName?.charAt(0) || 'A'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                    {astrologerData?.astrologerName || 'Astrologer'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#FFF5E6', marginTop: 2 }}>
                    {astrologerData?.specialization || 'Vedic Astrology'}
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginTop: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name="shield-star" size={12} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                      Premium Astrologer
                    </Text>
                  </View>
                </View>

                {/* Menu */}
                <View style={{ paddingTop: 16 }}>
                  {drawerData.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                      }}
                      onPress={() => handleItemPress(item)}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: item.color ? '#FEE2E2' : '#FFF5E6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 16,
                        }}
                      >
                        <Icon name={item.icon} size={20} color={item.color || '#7F1D1D'} />
                      </View>
                      <Text
                        style={{
                          fontSize: 15,
                          color: item.color || '#2C1810',
                          fontWeight: '500',
                          flex: 1,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Icon name="chevron-right" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Footer */}
                <View
                  style={{
                    marginTop: 24,
                    paddingTop: 20,
                    paddingHorizontal: 20,
                    borderTopWidth: 1,
                    borderTopColor: '#F0E8DC',
                  }}
                >
                  <Text style={{ color: '#999', fontSize: 11, textAlign: 'center', marginBottom: 24 }}>
                    Version 1.0.0 • Astrologer Portal
                  </Text>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ---------------- CONTACT US MODAL ---------------- */}
      <Modal
        visible={supportModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Contact Information</Text>

            {/* Email */}
            <View style={styles.row}>
              <Icon name="email-outline" size={22} color="#db9a4a" />
              <View style={styles.col}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>info@acharyalavbhushan.com</Text>
              </View>
            </View>

            {/* Website Queries */}
            <View style={styles.row}>
              <Icon name="phone" size={22} color="#db9a4a" />
              <View style={styles.col}>
                <Text style={styles.label}>Consultation related queries</Text>
                <Text style={styles.value}>+91 92579 91666</Text>
              </View>
            </View>

            {/* Reports Queries */}
            {/* <View style={styles.row}>
              <Icon name="phone" size={22} color="#db9a4a" />
              <View style={styles.col}>
                <Text style={styles.label}>Reports related queries</Text>
                <Text style={styles.value}>+91 97837 62666</Text>
              </View>
            </View> */}

            {/* Address */}
            <View style={styles.row}>
              <Icon name="map-marker-outline" size={24} color="#db9a4a" />
              <View style={styles.col}>
                <Text style={styles.label}>Office</Text>
                <Text style={styles.value}>
                  Plot no. 177, Near Suresh Gyan Vihar University,{'\n'}
                  OBC Colony, Jagatpura,{'\n'}
                  Jaipur, Rajasthan
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setSupportModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SidebarDrawer;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7F1D1D',
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  col: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#7F1D1D',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: '#7F1D1D',
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
});
