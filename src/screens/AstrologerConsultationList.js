// AstrologerConsultationList.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { api_url } from "../config/Constants";
import Modal from "react-native-modal";
import { RefreshControl } from "react-native";
import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Base width = 375 (Android/iPhone baseline)
const scale = (size) => (SCREEN_WIDTH / 375) * size;

// Font scaling that respects system font size
const fontScale = (size) => size * PixelRatio.getFontScale();
const AstrologerConsultationList = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("today");
  const [refreshing, setRefreshing] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusBooking, setStatusBooking] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("completed");
  const [statusComment, setStatusComment] = useState("");

  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const intervalRef = useRef(null);
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchConsultations();
    } catch (e) {
      console.log("Refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /*                         FETCH CONSULTATIONS                          */
  /* -------------------------------------------------------------------- */
  const fetchConsultations = async () => {
    try {
      setIsLoading(true);

      const raw = await AsyncStorage.getItem("astrologerData");
      const astrologer = raw ? JSON.parse(raw) : null;

      if (!astrologer?._id) {
        Alert.alert("Error", "Astrologer data missing");
        return;
      }

      const url = `${api_url}mobile/astrologer-consultations/${astrologer._id}`;
      const res = await axios.get(url);
      if (res?.data?.success) {
        setConsultations(res.data.bookings || []);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Unable to load consultations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  /* -------------------------------------------------------------------- */
  /*                10-second interval to update current time             */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };

    updateTime();
    intervalRef.current = setInterval(updateTime, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);

  /* -------------------------------------------------------------------- */
  /*                              SEARCH FILTER                           */
  /* -------------------------------------------------------------------- */
  /* -------------------------------------------------------------------- */
  /*                              SEARCH FILTER                           */
  /* -------------------------------------------------------------------- */
  const filteredSearch = consultations.filter((item) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();

    // 🔍 Name search
    const name =
      item?.customer?.customerName ||
      item?.customer?.name ||
      "";

    const nameMatch = name.toLowerCase().includes(query);

    // 📅 Date search (supports: 12 Jan, Jan 12, 2025, Mon Jan 12 2025)
    const dateStr = item?.date
      ? new Date(item.date).toDateString().toLowerCase()
      : "";

    const dateMatch = dateStr.includes(query);

    return nameMatch || dateMatch;
  });


  /* -------------------------------------------------------------------- */
  /*                         TIME PARSING                                 */
  /* -------------------------------------------------------------------- */
  const parseTimeRangeToMinutes = (from, to, date) => {
    const base = new Date(date);
    const [sh, sm] = from.split(":").map(Number);
    const [eh, em] = to.split(":").map(Number);

    const start = new Date(base);
    start.setHours(sh, sm, 0, 0);

    const end = new Date(base);
    end.setHours(eh, em, 0, 0);

    return {
      startMin: start.getHours() * 60 + start.getMinutes(),
      endMin: end.getHours() * 60 + end.getMinutes(),
      startDate: start,
      endDate: end,
    };
  };

  /* -------------------------------------------------------------------- */
  /*                         CLASSIFICATION LOGIC                          */
  /* -------------------------------------------------------------------- */
  const now = new Date();

  const isSameDay = (d1, d2) => {
    if (!d1) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayConsultations = filteredSearch.filter(
    (i) => i.status === "booked" && isSameDay(i.date, new Date())
  );

  const upcomingConsultations = filteredSearch.filter((item) => {
    if (item.status !== "booked") return false;

    const bookingDate = new Date(item.date);
    bookingDate.setHours(0, 0, 0, 0);

    // Future date
    if (bookingDate > today) return true;

    // Today but time not started yet
    if (bookingDate.getTime() === today.getTime()) {
      const { startMin } = parseTimeRangeToMinutes(
        item.fromTime,
        item.toTime,
        item.date
      );
      return currentTimeMinutes < startMin;
    }

    return false;
  });
  const failedConsultations = filteredSearch.filter((item) => {
    if (item.status !== "booked") return false;

    const bookingDate = new Date(item.date);
    bookingDate.setHours(0, 0, 0, 0);

    // Past date
    if (bookingDate < today) return true;

    // Today but time is over
    if (bookingDate.getTime() === today.getTime()) {
      const { endMin } = parseTimeRangeToMinutes(
        item.fromTime,
        item.toTime,
        item.date
      );
      return currentTimeMinutes > endMin;
    }

    return false;
  });

  const completedConsultations = filteredSearch.filter(
    (i) => i.status === "completed" || i.status === "user_not_joined"
  );

  const tabs = [
    { key: "today", label: "Today", count: todayConsultations.length },
    { key: "future", label: "Upcoming", count: upcomingConsultations.length },
    { key: "failed", label: "Review", count: failedConsultations.length },
    { key: "completed", label: "Completed", count: completedConsultations.length },
  ];


  const currentList =
    filterType === "today"
      ? todayConsultations
      : filterType === "future"
        ? upcomingConsultations
        : filterType === "failed"
          ? failedConsultations
          : completedConsultations;


  /* -------------------------------------------------------------------- */
  /*                         SEND INCOMING CALL API                       */
  /* -------------------------------------------------------------------- */
  const sendIncomingCall = async (booking) => {
    const raw = await AsyncStorage.getItem("astrologerData");
    const astrologer = raw ? JSON.parse(raw) : null;

    try {
      if (booking?.consultationType !== "chat") {
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

        navigation.navigate("VoiceVideoCallScreen", {
          isVideo: booking.consultationType === "videocall",
          channelName,
          astrologerData: astrologer,
          booking,
        });
      } else {
        navigation.navigate("ChatScreen", {
          astrologer: astrologer,
          userData: booking?.customer,
          booking,
        });
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Unable to start call");
    }
  };

  /* -------------------------------------------------------------------- */
  /*                    STATUS UPDATE API                                 */
  /* -------------------------------------------------------------------- */
  const updateStatusAPI = async () => {
    if (!statusBooking) return;

    if (statusBooking.status !== "booked") {
      Alert.alert("Info", "Status already updated");
      return;
    }

    try {
      setIsLoading(true);

      const res = await axios.post(
        `${api_url}mobile/update-consultation-status`,
        {
          bookingId: statusBooking._id,
          status: selectedStatus,
          comment: statusComment || "",
        }
      );

      if (res?.data?.success) {
        Alert.alert("Success", "Status updated");
        setShowStatusModal(false);
        setStatusBooking(null);
        setStatusComment("");
        fetchConsultations();
      }
    } catch {
      Alert.alert("Error", "Unable to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const generateKundli = async (customer) => {
    try {
      const customerId = customer?._id;
      if (!customerId) {
        Alert.alert("Error", "Customer ID not found");
        return;
      }

      const formatLatLng = (val, fallback) =>
        val != null && val !== ""
          ? Number(val).toFixed(2)
          : fallback;

      // ✅ Extract YYYY-MM-DD
      const dobDate = customer?.dateOfBirth
        ? customer.dateOfBirth.split("T")[0]
        : null;

      // ✅ Combine DOB + TOB → FULL DATETIME
      const tobDateTime = dobDate
        ? `${dobDate}T11:54:00.000Z`
        : null;
      console.log(customer, 'customer')
      const payload = {
        customerId,
        name: customer?.name,
        gender: customer?.gender,

        dob: dobDate,           // YYYY-MM-DD ✅
        tob: tobDateTime,       // FULL ISO DATE ✅

        place: customer?.placeOfBirth || "Ajmer, Rajasthan, India",
        lat: formatLatLng(customer?.lat, "25.76"),
        lon: formatLatLng(customer?.lon, "75.37"),
      };


      const res = await axios.post(
        "https://api.acharyalavbhushan.com/api/kundli/add_kundli",
        payload
      );


      if (res?.data?.success && res?.data?.kundli?._id) {
        navigation.navigate("KundliDetailScreen", {
          kundliId: res.data.kundli._id,
        });
      } else {
        Alert.alert("Error", "Failed to generate kundli");
      }
    } catch (err) {
      console.log("Kundli API error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";

      Alert.alert("Error", message);
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    const day = date.getDate();
    const year = date.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return `${day} ${monthNames[date.getMonth()]}, ${year}`;
  };

  /* -------------------------------------------------------------------- */
  /*                                UI RENDER                             */
  /* -------------------------------------------------------------------- */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F4EF" />

      {/* SEARCH BAR */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#999" style={{ marginRight: 8 }} />

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or date"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.8}
                onPress={() => setFilterType(t.key)}
                style={[
                  styles.tabButton,
                  filterType === t.key && styles.activeTabButton,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    filterType === t.key && styles.activeTabText,
                  ]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>

                {/* {t.count > 0 && (
                  <View
                    style={[
                      styles.badge,
                      filterType === t.key && styles.activeBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        filterType === t.key && styles.activeBadgeText,
                      ]}
                    >
                      {t.count}
                    </Text>
                  </View>
                )} */}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </View>

      {/* CONSULTATION LIST */}
      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7F1D1D"]}   // Android
            tintColor="#7F1D1D"   // iOS
          />
        }
      >
        {currentList.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="crystal-ball" size={60} color="#7F1D1D" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>No Consultations</Text>
            <Text style={styles.emptySubtext}>Please check back later</Text>
          </View>
        ) : (
          currentList.map((item, index) => {
            const bookingDate = new Date(item.date);
            bookingDate.setHours(0, 0, 0, 0);

            const { startMin, endMin } =
              parseTimeRangeToMinutes(
                item.fromTime,
                item.toTime,
                item.date
              );

            const isSameDayBooking = isSameDay(item.date, now);

            const isCallTime =
              item.status === "booked" &&
              isSameDayBooking &&
              startMin != null &&
              endMin != null &&
              currentTimeMinutes >= startMin &&
              currentTimeMinutes <= endMin;

            const isExpired =
              isSameDayBooking &&
              endMin != null &&
              currentTimeMinutes > endMin;

            const isToday = bookingDate.getTime() === today.getTime();
            const isPastDate = bookingDate < today;
            const isExpiredToday =
              isToday && currentTimeMinutes > endMin;
            const canChangeStatus =
              item.status === "booked" && (isPastDate || isExpiredToday);

            return (
              <View key={index} style={styles.card}>

                {/* NAME + START BUTTON ROW */}
                <View style={styles.nameRow}>
                  <Text style={styles.astrologerName}>
                    {item.customer?.customerName || item.customer?.name || "User"}
                  </Text>

                  {filterType === "today" && (
                    <TouchableOpacity
                      onPress={() => sendIncomingCall(item)}
                      style={[
                        styles.startButton,
                        !isCallTime && { opacity: 0.5 }
                      ]}
                      disabled={!isCallTime}
                    >
                      <Icon
                        name={
                          item.consultationType === "videocall"
                            ? "video"
                            : item.consultationType === "call"
                              ? "phone"
                              : "chat"
                        }
                        size={20}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.detailsButtonText}>
                        Start{" "}
                        {item.consultationType === "videocall"
                          ? "Video Call"
                          : item.consultationType === "call"
                            ? "Voice Call"
                            : "Chat"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.details}>
                  DOB: {item.customer?.dateOfBirth
                    ? new Date(item.customer.dateOfBirth).toDateString()
                    : "N/A"}</Text>
                <Text style={styles.details}>Birth Place: {item.customer?.placeOfBirth || "N/A"}</Text>

                <Text style={styles.details}>
                  Date: {item?.date
                    ? new Date(item.date).toDateString()
                    : "N/A"}
                </Text>

                <Text style={styles.details}>
                  Duration: {item?.fromTime} - {item?.toTime}
                </Text>

                <View style={styles.priceRow}>
                  <Icon
                    name={
                      item.consultationType === "videocall"
                        ? "video"
                        : item.consultationType === "call"
                          ? "phone"
                          : "chat"
                    }
                    size={20}
                    color="#7F1D1D"
                  />

                  <Text style={styles.divider}>|</Text>

                  <Text style={styles.price}>
                    ₹ {item?.duration?.price || "N/A"}
                  </Text>
                </View>

                <Text style={styles.details}>
                  {item?.consultationType === "chat"
                    ? "Chat"
                    : item?.consultationType === "call"
                      ? "Voice Call"
                      : "Video Call"}
                </Text>

                {/* ---------------- BUTTONS (UPDATED) ---------------- */}
                <View style={styles.buttonRow}>

                  {/* LEFT SIDE BUTTONS */}
                  <View style={styles.leftButtons}>
                    {/* View Kundli - ALWAYS visible */}
                    <TouchableOpacity
                      onPress={() => generateKundli(item?.customer)}
                      style={[styles.detailsButton, styles.callButton]}
                    >
                      <Text style={styles.detailsButtonText}>View Kundli</Text>
                    </TouchableOpacity>

                    {/* Change Status WHEN EXPIRED */}
                    {canChangeStatus && (
                      <TouchableOpacity
                        onPress={() => {
                          setStatusBooking(item);
                          setSelectedStatus("completed");
                          setStatusComment("");
                          setShowStatusModal(true);
                        }}
                        style={styles.statusButton}
                      >
                        <Icon name="clipboard-check-outline" size={18} color="#7F1D1D" />
                        <Text style={styles.statusButtonText}>Change Status</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* RIGHT SIDE – Start Call */}

                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* STATUS CHANGE MODAL */}
      <Modal isVisible={showStatusModal} onBackdropPress={() => setShowStatusModal(false)}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Update Status</Text>

          {/* Completed */}
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setSelectedStatus("completed")}
          >
            <Icon
              name={selectedStatus === "completed" ? "radiobox-marked" : "radiobox-blank"}
              size={22}
              color="#7F1D1D"
            />
            <Text style={styles.radioText}>Completed</Text>
          </TouchableOpacity>

          {/* User Didn't Join */}
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setSelectedStatus("user_not_joined")}
          >
            <Icon
              name={selectedStatus === "user_not_joined" ? "radiobox-marked" : "radiobox-blank"}
              size={22}
              color="#7F1D1D"
            />
            <Text style={styles.radioText}>User Didn't Join</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TextInput
            style={styles.commentBox}
            placeholder="Enter comment (optional)"
            placeholderTextColor="#888"
            multiline
            value={statusComment}
            onChangeText={setStatusComment}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={updateStatusAPI}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default AstrologerConsultationList;

/* -------------------------------------------------------------------- */
/*                               STYLES                                 */
/* -------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4EF",
  },

  /* ---------------- HEADER ---------------- */
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    elevation: 3,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F4EF",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: scale(44),
    borderWidth: 1,
    borderColor: "#E8DCC8",
  },

  searchInput: {
    flex: 1,
    color: "#333",
    fontSize: fontScale(14),
  },

  /* ---------------- TABS ---------------- */
  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 4,
    // borderBottomWidth: 1,
    // borderColor: '#E8DCC8',
  },

  tabsRow: {
    paddingHorizontal: scale(22),
    alignItems: "center",
  },

  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    marginRight: scale(8),
    borderRadius: scale(10),
    backgroundColor: "#F5F5F5",
  },

  activeTabButton: {
    backgroundColor: "#FFF5E8",
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },

  tabText: {
    fontSize: fontScale(13),
    color: "#666",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#7F1D1D",
  },

  badge: {
    marginLeft: scale(6),
    backgroundColor: "#ccc",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(12),
  },

  activeBadge: {
    backgroundColor: "#7F1D1D",
  },

  badgeText: {
    fontSize: fontScale(11),
    color: "#fff",
    fontWeight: "700",
  },

  activeBadgeText: {
    color: "#fff",
  },

  /* ---------------- LIST ---------------- */
  scrollContent: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
  },

  /* ---------------- CARD ---------------- */
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "#EEE2D3",
    elevation: 2,
  },

  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: scale(6),
  },
  emptyState: { alignItems: 'center', paddingVertical: 160 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#2C1810', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#666' },
  astrologerName: {
    fontSize: fontScale(16),
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: scale(4),
  },

  details: {
    fontSize: fontScale(13),
    color: "#555",
    marginBottom: scale(3),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  divider: {
    marginHorizontal: scale(6),
    color: '#7F1D1D',
    fontSize: fontScale(16),
    lineHeight: scale(20),
  },

  price: {
    fontSize: fontScale(15),
    marginTop: scale(6),
    fontWeight: "700",
    color: "#7F1D1D",
    marginBottom: scale(6)
  },

  /* ---------------- BUTTONS ---------------- */
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: scale(10),
  },

  leftButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
  },

  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7F1D1D",
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(8),
  },

  detailsButtonText: {
    color: "#fff",
    fontSize: fontScale(13),
    fontWeight: "600",
  },
/* ---------------- CHANGE STATUS BUTTON ---------------- */
statusButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFF5E8",
  borderWidth: 1,
  borderColor: "#7F1D1D",
  paddingVertical: scale(7),
  paddingHorizontal: scale(12),
  borderRadius: scale(8),
},

statusButtonText: {
  marginLeft: scale(6),
  fontSize: fontScale(13),
  fontWeight: "600",
  color: "#7F1D1D",
},

  startButton: {
    backgroundColor: "#7F1D1D",
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(8),
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(6),
  },

  /* ---------------- MODAL ---------------- */
  modalBox: {
    backgroundColor: "#fff",
    padding: scale(20),
    borderRadius: scale(14),
  },

  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: "700",
    marginBottom: scale(10),
    color: "#2C1810",
  },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: scale(8),
  },

  radioText: {
    marginLeft: scale(10),
    fontSize: fontScale(15),
    color: "#333",
  },

  commentBox: {
    height: scale(90),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    marginTop: scale(10),
    padding: scale(10),
    color: "#000",
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: "#7F1D1D",
    paddingVertical: scale(12),
    alignItems: "center",
    borderRadius: scale(10),
    marginTop: scale(12),
  },

  submitBtnText: {
    color: "#fff",
    fontSize: fontScale(15),
    fontWeight: "700",
  },

  noDataText: {
    textAlign: "center",
    marginTop: scale(40),
    color: "#999",
    fontSize: fontScale(14),
  },
});

