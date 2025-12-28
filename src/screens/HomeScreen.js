// AstrologerHome.js (FULL — original UI preserved + dynamic upcoming consultations)

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { api_url } from "../config/Constants";
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  Modal,
  StatusBar,
  Animated,
  Linking,
  RefreshControl,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SidebarDrawer from '../components/SidebarDrawer';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('screen');

const AstrologerHome = ({ route }) => {
  const [astroData, setAstrologerData] = useState();
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const renderItem = ({ item }) => {
    return (
      <View style={styles.reviewCard}>
        {/* Quote */}
        {/* <Text style={styles.reviewQuote}>“</Text> */}

        {/* Review Text */}
        <Text style={styles.reviewText}>
          {item.reviewText}
        </Text>

        {/* Divider */}
        <View style={styles.reviewDivider} />

        {/* Footer */}
        <View style={styles.reviewFooter}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>
              {item.customerName?.charAt(0) || 'U'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.reviewName}>{item.customerName}</Text>
            <View style={styles.reviewRatingRow}>
              <Icon name="star" size={14} color="#FACC15" />
              <Text style={styles.reviewRatingText}>
                {item.rating || 5}.0
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchUpcomingConsultations();
      await fetchReviews();
    } catch (e) {
      console.log('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("astrologerData");

        if (storedData) {
          setAstrologerData(JSON.parse(storedData));
        } else {
          // default fallback data
          setAstrologerData({
            astrologerName: 'Dr. Rajesh Kumar',
            specialization: 'Vedic Astrology',
            experience: '15 Years',
            phoneNumber: '1234567890',
            rating: 4.8,
            consultations: 5234,
            image: null,
          });
        }
      } catch (err) {
        console.log("Error loading astrologerData:", err);
      }
    };

    loadData();
  }, []);
  const navigation = useNavigation();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;

  const drawerData = [
    // { title: 'Home', icon: 'home-outline' },
    { title: 'My Consultations', icon: 'account-group-outline' },
    // { title: 'Earnings & Wallet', icon: 'wallet-outline' },
    // { title: 'Schedule', icon: 'calendar-outline' },
    // { title: 'Performance', icon: 'chart-line' },
    // { title: 'Learning Center', icon: 'book-open-outline' },
    // { title: 'Customer Support', icon: 'headphones' },
    // { title: 'Settings', icon: 'cog-outline' },
    { title: 'Logout', icon: 'logout', color: '#DC2626' },
  ];

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleLogout = () => {
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

  const handleNavigation = (item) => {
    const { title } = item;
    toggleDrawer();

    switch (title) {
      case 'Logout':
        handleLogout();
        break;
      case 'My Consultations':
        Alert.alert('Navigation', 'Navigate to: Consultations');
        navigation.navigate('AstrologerConsultationList');
        break;
      case 'Earnings & Wallet':
        Alert.alert('Navigation', 'Navigate to: Wallet');
        break;
      case 'Schedule':
        Alert.alert('Navigation', 'Navigate to: Schedule');
        break;
      case 'Performance':
        Alert.alert('Navigation', 'Navigate to: Performance');
        break;
      default:
        Alert.alert('Navigation', `Navigate to: ${title}`);
        break;
    }
  };
  const BASE_URL = 'https://alb-web-assets.s3.ap-south-1.amazonaws.com/acharyalavbhushan/';
  const getImageUrl = (path) => {
    if (!path) return null;

    // If already a full URL
    if (path.startsWith('http')) {
      return `${path}?format=jpg`; // 👈 fixes RN no-extension issue
    }

    // Relative path from backend
    return `${BASE_URL}${path}?format=jpg`;
  };
  /* -------------------------
     NEW: upcoming consultations state & logic
     ------------------------- */
  const [upcomingConsultations, setUpcomingConsultations] = useState([]);
  const [consultationsCount, setConsultationsCount] = useState(0);

  // parse "HH:mm - HH:mm" into Date objects (using booking.date as base)
  const toDateFromTime = (bookingDate, timeStr) => {
    const [h, m] = timeStr.split(':').map((x) => Number(x));
    const d = new Date(bookingDate);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const fetchUpcomingConsultations = async () => {
    try {
      const raw = await AsyncStorage.getItem("astrologerData");
      const astrologer = raw ? JSON.parse(raw) : null;
      if (!astrologer?._id) return;

      const res = await axios.get(
        `${api_url}mobile/astrologer-consultations/${astrologer._id}`
      );

      if (!res?.data?.success) return;

      const now = new Date();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = res.data.bookings
        .filter(item => item.status === "booked")
        .filter(item => {
          if (!item?.date || !item?.fromTime || !item?.toTime) return false;

          // Normalize booking date
          const bookingDate = new Date(item.date);
          bookingDate.setHours(0, 0, 0, 0);

          const [sh, sm] = item.fromTime.split(":").map(Number);
          const [eh, em] = item.toTime.split(":").map(Number);

          const start = new Date(bookingDate);
          start.setHours(sh, sm, 0, 0);

          const end = new Date(bookingDate);
          end.setHours(eh, em, 0, 0);

          // Future date → upcoming
          if (bookingDate > today) return true;

          // Today → include if not ended
          if (bookingDate.getTime() === today.getTime()) {
            return end > now;
          }

          return false;
        })
        .sort((a, b) => {
          const aDate = new Date(a.date);
          const bDate = new Date(b.date);

          aDate.setHours(
            ...a.fromTime.split(":").map(Number),
            0,
            0
          );

          bDate.setHours(
            ...b.fromTime.split(":").map(Number),
            0,
            0
          );

          return aDate - bDate;
        })
        .slice(0, 3);

      setUpcomingConsultations(upcoming);
      setConsultationsCount(upcoming.length);
    } catch (err) {
      console.log("Upcoming Fetch Error:", err);
    }
  };
  const fetchReviews = async () => {
    try {
      const raw = await AsyncStorage.getItem("astrologerData");
      const astrologer = raw ? JSON.parse(raw) : null;
      console.log(astrologer?._id, 'astrologer?._id')
      if (!astrologer?._id) return;
      const response = await axios.post(
        `${api_url}admin/get-astrologer-review`,
        { astrologerId: astrologer?._id },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log(response?.data, 'response?.data')
      if (response?.data?.success) {
        setReviews(response?.data?.reviews || []);
      }
    } catch (err) {
      console.log("Upcoming Fetch Error:", err);
    }
  };



  useEffect(() => {
    fetchUpcomingConsultations();
    fetchReviews();
  }, []);

  // refresh when screen focused
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchUpcomingConsultations);
    return unsub;
  }, [navigation]);

  const handleJoin = async (booking) => {
    const raw = await AsyncStorage.getItem("astrologerData");
    const astrologer = raw ? JSON.parse(raw) : null;
    if (booking?.consultationType !== 'chat') {
      const fcmToken = booking?.customer?.fcmToken;
      if (!fcmToken) {
        Alert.alert("Error", "User does not have a valid FCM token!");
        return;
      }
      const channelName = booking.channelName || booking._id;
      await axios.post(`${api_url}mobile/send-incoming-call`, {
        fcmToken,
        booking,
        channelName,
        astrologerData: astrologer,
      });
      navigation.navigate('VoiceVideoCallScreen', {
        isVideo: booking.consultationType === 'videocall',
        channelName,
        astrologerData: booking.customer,
        booking,
      });
    } else {
      navigation.navigate('ChatScreen', {
        astrologer: astroData,
        userData: booking.customer,
        booking
      });
    }
  };
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    if (showDropdown) {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => setShowDropdown(false));
    } else {
      setShowDropdown(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  };
  const youtubeVideos = [
    { id: 1, url: "https://youtu.be/gJcMN2tIVT8?si=uXBmL-MptKmILxde", title: "Astrology & Real Life Incidents" },
    { id: 2, url: "https://youtu.be/7k1kigASoig?si=9qv-nn6Z1yTi5kMF", title: "Acharya Ji ne khola crorepati banne ka asli formula" },
    { id: 3, url: "https://youtu.be/s0TrbB1_qQU?si=P1Sx8mdtEnw_h-5j", title: "Why GenZ is Depressed & Struggling" },
  ];

  const getYouTubeThumbnail = (url) => {
    let videoId = null;
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    else if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    }
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <SidebarDrawer
          visible={drawerVisible}
          onClose={toggleDrawer}
          astrologerData={astroData}
        />
        <View>
          <Text style={styles.headerTitle}>AstroBook</Text>
          {/* <Text style={styles.headerSubtitle}>For Astrologer</Text> */}
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Profile')}>
          <Icon name="account" size={24} color="black" />
          {/* <View style={styles.notificationBadge} /> */}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7F1D1D']}        // Android spinner color
            tintColor="#7F1D1D"        // iOS spinner color
          />
        }
      >
        <View

          style={styles.profileCard}
        >

          {/* 🔥 Top-Right Tag */}
          <TouchableOpacity style={styles.editIconContainer} onPress={() => navigation.navigate('AstrologerProfile')}>
            <Icon name="eye-outline" size={20} color="#fff" />

          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarLarge}>
            <Image
              source={{ uri: getImageUrl(astroData?.profileImage) }}
              style={styles.profileImage}
            />
          </View>

          {/* Info Section */}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{astroData?.astrologerName}</Text>
            {/* Decoration */}
            <View style={styles.bannerDecoration}>
              <Text style={styles.bannerEmoji}>✨</Text>
            </View>
            <Text style={styles.profileSpecialization}>
              {astroData?.experience} Years of Experience
            </Text>

            {/* Rating */}
            <TouchableOpacity style={styles.ratingContainer}>
              {astroData?.rating !== 0 &&
                <>
                  <Icon name="star" size={16} color="#FFD580" />
                  <Text style={styles.ratingText}>{astroData?.rating}</Text>
                  <Text style={styles.consultationsText}>
                  {astroData?.title}
                  </Text>
                </>
              }
            </TouchableOpacity>


          </View>

          {/* ✏ Floating Edit Icon (Bottom Right) */}
          {/* <TouchableOpacity style={styles.editIconContainer} onPress={() => navigation.navigate('AstrologerProfile')}>
            <Icon name="eye-outline" size={20} color="#fff" />
          </TouchableOpacity> */}

        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Consultations</Text>
            {consultationsCount > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('AstrologerConsultationList')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingConsultations.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="crystal-ball" size={60} color="#7F1D1D" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No Upcoming Consultations</Text>
            </View>
          ) : (
            upcomingConsultations.map((item, index) => {
              const customer = item.customer || {};
              const startStr = item.fromTime;
              const endStr = item.toTime;
              const now = new Date();
              console.log(startStr, endStr, now)

              const bookingDate = new Date(item.date || now.toISOString());
              console.log(item.consultationType)
              const start = startStr ? toDateFromTime(bookingDate, startStr) : null;
              const end = endStr ? toDateFromTime(bookingDate, endStr) : null;
              const isJoinTime = start && end && now >= start && now <= end;
              console.log(start, end, now)
              const getModeIcon = (mode) => {
                switch (mode?.toLowerCase()) {
                  case "call":
                    return "phone"; // or "call-outline"
                  case "videocall":
                    return "video-outline"; // or "videocam-outline"
                  case "chat":
                    return "chat-outline"; // or "chatbubble-outline"
                  default:
                    return "help-circle-outline";
                }
              };
              const getDurationInMinutes = (fromTime, toTime) => {
                if (!fromTime || !toTime) return 0;

                const [fromH, fromM] = fromTime.split(':').map(Number);
                const [toH, toM] = toTime.split(':').map(Number);

                const fromTotal = fromH * 60 + fromM;
                const toTotal = toH * 60 + toM;

                return toTotal - fromTotal;
              };
              return (
                <View key={index} style={styles.consultationCard}>
                  <View style={styles.consultationAvatar}>
                    <Text style={styles.consultationAvatarText}>
                      {(customer?.customerName || customer?.name || 'U').charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.consultationInfo}>
                    <Text style={styles.consultationName}>
                      {customer?.customerName || customer?.name || 'Unknown'}
                    </Text>


                    <View style={styles.consultationTime}>
                      <Icon
                        name={getModeIcon(item.consultationType)}
                        size={18}
                        color="#7F1D1D"
                        style={{ marginVertical: 2 }}
                      />

                      <Text style={styles.consultationTopic}> | </Text>

                      <Text style={styles.consultationTopic}>
                        {getDurationInMinutes(item.fromTime, item.toTime)} min
                      </Text>
                    </View>
                    <View style={styles.consultationTime}>
                      <Icon name="calendar" size={12} color="#999" />
                      <Text style={styles.consultationTimeText}>
                        {bookingDate.toDateString()}
                      </Text>
                    </View>
                  </View>

                  {isJoinTime ? (
                    <TouchableOpacity style={styles.joinButton} onPress={() => handleJoin(item)}>
                      <Text style={styles.joinButtonText}>Join</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.timeButton}>
                      <Text style={styles.timeButtonText}>{startStr || '-'}</Text>
                    </View>
                  )}
                </View>

              );
            })
          )}
        </View>
        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('AstrologerConsultationList')}>
              <Icon name="account-group" size={28} color="#7F1D1D" />
              <Text style={styles.statNumber}>{consultationsCount}</Text>
              <Text style={styles.statLabel}>Consultations</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Earnings')}>
              <Icon name="wallet" size={28} color="#7F1D1D" />

              <Text style={styles.statNumber}>View</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </TouchableOpacity>

            {/* <View style={styles.statBox}>
              <Icon name="chart-line" size={28} color="#7F1D1D" />
              <Text style={styles.statNumber}>92%</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View> */}
          </View>
        </View>

        {/* Upcoming Consultations (DYNAMIC - next 3) */}


        {/* Quick Actions */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}
              onPress={() => navigation.navigate('AvailabilityStatusScreen')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#7F1D1D' }]}>
                <Icon name="file-document-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>Status</Text>
              <Text style={styles.actionSubtext}>Change your Current Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}
            // onPress={() => navigation.navigate('AvailabilityStatusScreen')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#7F1D1D' }]}>
                <Icon name="calendar-month-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>Weekly Time Table</Text>
              <Text style={styles.actionSubtext}>Create your Schedule</Text>
            </TouchableOpacity>
          </View>

        </View> */}
        <TouchableOpacity style={styles.specialCard} onPress={() => Linking.openURL("https://lifechangingastro.com/")}>
          <View style={styles.specialLeft}>
            <Icon name="store" size={36} color="#7F1D1D" />
          </View>
          <View style={styles.specialMiddle}>
            <Text style={styles.specialTitle}>Suggest Products from </Text>
            <Text style={styles.specialDescription}>AstroBook Store</Text>
            <View style={styles.specialRating}>
              {/* <Text style={styles.specialRatingText}>⭐ 4.9 • 2K+ bookings</Text> */}
            </View>
          </View>
          <View style={styles.specialRight}>
            <Icon name="arrow-right" size={24} color="#7F1D1D" />
          </View>
        </TouchableOpacity>

        <View style={styles.keyPointerCard}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Icon name="alert-circle-outline" size={22} color="#7F1D1D" />
            </View>

            <Text style={styles.title}>Key Points To Remember</Text>
          </View>

          <View style={styles.listContainer}>
            {[
              "Do not share any personal contact details (phone number, email, social media) with customers.",
              "Never request favors, gifts, or payments from customers in any form.",
              "Maintain professionalism at all times to ensure high customer satisfaction and positive reviews.",
              "Respect customer privacy and platform policies without exception.",
              "Report any suspicious or inappropriate customer requests immediately via the app.",
            ].map((text, index) => (
              <View key={index} style={styles.pointRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.pointText}>{text}</Text>
              </View>
            ))}
          </View>

        </View>
        {reviews?.length > 0 &&
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Your Users Say</Text>

            <FlatList
              ref={flatListRef}
              data={reviews}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={width - 48 + 16} // card width + margin
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={renderItem}
              keyExtractor={(item, index) => item._id || index.toString()}
            />

          </View>
        }
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watch Our Videos</Text>

          <FlatList
            data={youtubeVideos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.videoCard}
                onPress={() => Linking.openURL(item.url)}
              >
                <Image
                  source={{ uri: getYouTubeThumbnail(item.url) }}
                  style={styles.videoThumbnail}
                />
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        {/* Performance Insights */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month's Performance</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <View>
                <Text style={styles.performanceLabel}>Total Earnings</Text>
                <Text style={styles.performanceValue}>₹48,350</Text>
              </View>
              <View style={styles.performanceBadge}>
                <Text style={styles.performanceBadgeText}>+18.5%</Text>
              </View>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceStats}>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceStatLabel}>Consultations</Text>
                <Text style={styles.performanceStatValue}>287</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceStatLabel}>Avg. Rating</Text>
                <Text style={styles.performanceStatValue}>4.8 ⭐</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceStatLabel}>Response Time</Text>
                <Text style={styles.performanceStatValue}>2.5m</Text>
              </View>
            </View>
          </View>
        </View> */}

        {/* <View style={{ height: 30 }} /> */}
      </ScrollView>

      {/* Drawer Modal */}
      <Modal visible={drawerVisible} animationType="fade" transparent onRequestClose={toggleDrawer}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={toggleDrawer}>
          <Animated.View
            style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
              <ScrollView>
                {/* Drawer Header */}
                <View style={styles.drawerHeader}>
                  <View style={styles.drawerAvatarWrapper}>
                    <View style={styles.drawerAvatar}>
                      <Text style={styles.drawerAvatarText}>
                        {astroData?.astrologerName ? astroData?.astrologerName.charAt(0) : 'A'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.drawerName}>{astroData?.astrologerName}</Text>
                  <Text style={styles.drawerSpecialization}>{astroData?.specialization}</Text>
                  <View style={styles.drawerBadge}>
                    <Icon name="shield-star" size={12} color="#FFFFFF" />
                    <Text style={styles.drawerBadgeText}>Premium Astrologer</Text>
                  </View>
                </View>

                {/* Drawer Menu */}
                <View style={styles.menuWrapper}>
                  {drawerData.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.menuItem}
                      onPress={() => handleNavigation(item)}
                    >
                      <View
                        style={[
                          styles.menuIconWrapper,
                          item.color && { backgroundColor: '#FEE2E2' },
                        ]}
                      >
                        <Icon
                          name={item.icon}
                          size={20}
                          color={item.color || '#7F1D1D'}
                        />
                      </View>
                      <Text
                        style={[styles.menuText, item.color && { color: item.color }]}
                      >
                        {item.title}
                      </Text>
                      <Icon name="chevron-right" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.drawerFooter}>
                  <Text style={styles.versionText}>
                    Version 1.0.0 • Astrologer Portal
                  </Text>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
      {showDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleDropdown}
        >
          <Animated.View
            style={[
              styles.dropdownContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            {/* Arrow */}
            <View style={styles.arrowUp} />

            <View style={styles.dropdownBox}>
              <Text style={styles.title}>Notifications</Text>

              <ScrollView style={{ maxHeight: 250 }}>
                {[
                  "Notifications"
                ].map((item, index) => (
                  <View key={index} style={styles.notificationItem}>
                    <Text style={styles.notificationText}>• {item}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default AstrologerHome;

const styles = StyleSheet.create({
  /* =====================
   REVIEWS SECTION
===================== */
/* =====================
   REVIEWS SECTION
===================== */

reviewCard: {
  width: width - 48,
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  padding: 20,
  marginRight: 16,
  marginVertical: 10,

  // Android shadow
  elevation: 2,

  // iOS shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
},

reviewText: {
  fontSize: 14,
  color: '#444',
  lineHeight: 22,
  fontStyle: 'italic',
},

reviewDivider: {
  height: 1,
  backgroundColor: '#F0E8DC',
  marginVertical: 14,
},

reviewFooter: {
  flexDirection: 'row',
  alignItems: 'center',
},

reviewAvatar: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: '#FFF5E6',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},

reviewAvatarText: {
  fontSize: 17,
  fontWeight: '700',
  color: '#7F1D1D',
},

reviewName: {
  fontSize: 14,
  fontWeight: '600',
  color: '#2C1810',
},

reviewRatingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
},

reviewRatingText: {
  fontSize: 12,
  color: '#777',
  marginLeft: 4,
},

 
  reviewQuote: {
    fontSize: 42,
    color: '#7F1D1D',
    lineHeight: 40,
    marginBottom: -10,
    fontWeight: '700',
  },

 
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    marginVertical: 8,
  },
  overlay: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    bottom: 0,
  },

  dropdownContainer: {
    position: "absolute",
    top: 55, // distance from top header
    right: 15, // align to bell icon
    zIndex: 999,
    alignItems: "flex-end",
  },
  specialCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: 'center',
  },
  specialLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  specialIcon: {
    fontSize: 28,
  },
  specialMiddle: {
    flex: 1,
  },
  specialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C1810',
    marginBottom: 4,
  },
  specialDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },


  reviewText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },

  specialRating: {
    flexDirection: 'row',
  },
  specialRatingText: {
    fontSize: 11,
    color: '#999',
  },
  specialRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialArrow: {
    fontSize: 18,
    color: '#7F1D1D',
    fontWeight: 'bold',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#7F1D1D",
    marginRight: 10,
  },

  dropdownBox: {
    width: 250,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  title: {
    fontWeight: "700",
    marginBottom: 10,
    fontSize: 16,
  },

  notificationItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },

  notificationText: {
    fontSize: 14,
    color: "#333",
  },

  leftIconWrapper: {
    width: 55,
    height: 55,
    backgroundColor: '#f7f1d7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },

  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F4EF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    elevation: 3,
  },
  menuButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  menuLine: {
    width: 22,
    height: 2,
    backgroundColor: '#000',
    marginVertical: 2,
    borderRadius: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9C7A56',
    marginTop: -2,
    alignItems: 'center'
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#7F1D1D',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  editIconContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#db9a4a",
    padding: 10,
    borderRadius: 20,
    zIndex: 50,
    elevation: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD580',
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 5,
    marginTop: 5
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileSpecialization: {
    fontSize: 13,
    color: '#FFF5E6',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD580',
    marginLeft: 4,
  },
  consultationsText: {
    fontSize: 12,
    color: '#FFF5E6',
    marginLeft: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    // paddingHorizontal: 2,   // aligns text with other section titles
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C1810',
    padding: 10
  },

  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F1D1D',
    paddingVertical: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFD580',
  },
  expertTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#db9a4a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 99,
    elevation: 5,
  },

  expertTagText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C1810',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  actionCard: {
    width: '48%',          // 2 cards per row
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: 'center',

    // Shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },


  bannerDecoration: {
    position: 'absolute',
    right: -50,
    top: -160,
    opacity: 0.15,
  },
  bannerEmoji: {
    fontSize: 120,
  },
  // actionCard: {
  //   width: (width - 44),
  //   backgroundColor: '#FFFFFF',
  //   borderRadius: 16,
  //   padding: 16,
  //   alignItems: 'center',
  //   elevation: 2,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 1 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 3,
  // },
  actionIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C1810',
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  consultationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyPointerCard: {
    backgroundColor: '#7F1D1D',       // same yellow card color as image
    borderRadius: 12,
    padding: 16,
    margin: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  bullet: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    marginRight: 8,
  },

  pointText: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
  },
  videoCard: {
    width: 200,
    marginRight: 12,
    marginLeft: 4,
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },

  videoThumbnail: {
    width: '100%',
    height: 120,
  },

  videoTitle: {
    padding: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#2C1810',
  },
  listContainer: {
    marginTop: 12,
  },

  point: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    borderRadius: 12,
    marginHorizontal: -3,

  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#7F1D1D', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#666' },
  consultationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  consultationAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  consultationInfo: {
    flex: 1,
  },
  consultationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C1810',
  },
  consultationTopic: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  consultationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  consultationTimeText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timeButton: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeButtonText: {
    color: '#f4efefff',
    fontSize: 12,
    fontWeight: '600',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7F1D1D',
    marginTop: 4,
  },
  performanceBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  performanceBadgeText: {
    color: '#ffffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  performanceDivider: {
    height: 1,
    backgroundColor: '#F0E8DC',
    marginVertical: 12,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  performanceStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C1810',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: width * 0.8,
    height: height,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    backgroundColor: '#7F1D1D',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  drawerAvatarWrapper: {
    marginBottom: 12,
  },
  drawerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  drawerAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  drawerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  drawerSpecialization: {
    fontSize: 13,
    color: '#FFF5E6',
    marginTop: 2,
  },
  drawerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  menuWrapper: {
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#2C1810',
    fontWeight: '500',
    flex: 1,
  },
  drawerFooter: {
    marginTop: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DC',
  },
  versionText: {
    color: '#999',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 24,
  },
});
