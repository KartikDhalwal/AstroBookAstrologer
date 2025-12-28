import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import { api_url } from "../config/Constants";
import { RefreshControl } from "react-native";

const { width } = Dimensions.get("window");

// ⭐ Format Money Function
const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "0.00";
  return Number(value).toFixed(2);
};

const AstrologerEarnings = () => {
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState(null);
  const [filterType, setFilterType] = useState("today");
  const [month, setMonth] = useState(moment().format("YYYY-MM"));
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchEarnings();
    } catch (e) {
      console.log("Refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      setLoading(true);

      const astro = JSON.parse(await AsyncStorage.getItem("astrologerData"));
      const astrologerId = astro?._id;

      const payload = {
        astrologerId,
        filterType,
        month: filterType === "month" ? month : null,
      };

      const response = await axios.post(
        `${api_url}astrologer/get_astrologer_earning`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      setEarnings(response.data.results || null);
    } catch (error) {
      console.log("Earning Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [filterType]);

  return (
<SafeAreaView style={styles.safe} edges={["top"]}>
{/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Earnings</Text>

        <TouchableOpacity onPress={fetchEarnings} style={styles.refreshBtn}>
          <Icon name="refresh" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* FILTER BUTTONS */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            filterType === "today" && styles.activeFilter,
          ]}
          onPress={() => setFilterType("today")}
        >
          <Text
            style={[
              styles.filterText,
              filterType === "today" && styles.activeFilterText,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filterType === "month" && styles.activeFilter,
          ]}
          onPress={() => setFilterType("month")}
        >
          <Text
            style={[
              styles.filterText,
              filterType === "month" && styles.activeFilterText,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* LOADING */}
      {loading ? (
        <ActivityIndicator
          color="#7F1D1D"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7F1D1D"]}   // Android
              tintColor="#7F1D1D"   // iOS
            />
          }
        >
          {earnings && (
            <View style={styles.contentContainer}>

              {/* Total Earnings */}
              <View style={styles.totalCard}>
                <Text style={styles.cardLabel}>Total Earnings</Text>
                <Text style={styles.totalValue}>₹{formatMoney(earnings.totalEarning)}</Text>
              </View>

              {/* Two Small Cards */}
              <View style={styles.cardRow}>
                <View style={styles.smallCard}>
                  <Text style={styles.cardLabel}>Your Earnings</Text>
                  <Text style={styles.cardValue}>₹{formatMoney(earnings.totalAstrologerEarning)}</Text>
                </View>

                <View style={styles.smallCard}>
                  <Text style={styles.cardLabel}>Payable Amount</Text>
                  <Text style={styles.cardValue}>₹{formatMoney(earnings.totalPayableAmount)}</Text>
                </View>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.smallCard}>
                  <Text style={styles.cardLabel}>Admin Commission</Text>
                  <Text style={styles.cardValue}>₹{formatMoney(earnings.adminCommission)}</Text>
                </View>

                <View style={styles.smallCard}>
                  <Text style={styles.cardLabel}>TDS</Text>
                  <Text style={styles.cardValue}>₹{formatMoney(earnings.tdsCommission)}</Text>
                </View>
              </View>

              {/* Category Earnings */}
              <Text style={styles.sectionTitle}>Category Earnings</Text>

              <View style={styles.categoryRow}>
                <CategoryCard label="Chat" value={earnings.chatEarning} icon="message-text" />
                <CategoryCard label="Call" value={earnings.callEarning} icon="phone" />
              </View>

              <View style={styles.categoryRow}>
                <CategoryCard label="Video Call" value={earnings.videoCallEarning} icon="video" />
                <CategoryCard label="Pooja" value={earnings.pujaEarning} icon="campfire" />
              </View>

              <View style={styles.categoryRow}>
                {/* <CategoryCard label="Gift" value={earnings.giftEarning} icon="gift" /> */}
              </View>

              {/* Customer History */}
              {/* <Text style={styles.sectionTitle}>Customer History</Text>

              {earnings.customerEarnings.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Icon name="information-outline" size={40} color="#999" />
                  <Text style={styles.noData}>No earnings found.</Text>
                </View>
              ) : (
                earnings.customerEarnings.map((item, i) => (
                  <View key={i} style={styles.transactionCard}>
                    <View style={styles.customerAvatar}>
                      <Text style={styles.avatarText}>
                        {item.customerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text style={styles.customerName}>{item.customerName}</Text>

                      <Text style={styles.customerType}>
                        {item.type} • ₹{formatMoney(item.amount)}
                      </Text>

                      <Text style={styles.customerTime}>
                        {item.createdAt
                          ? new Date(item.createdAt).toDateString()
                          : "—"}
                      </Text>

                    </View>

                    <View style={styles.durationContainer}>
                      <Text style={styles.duration}>{item.duration}</Text>
                      <Text style={styles.durationLabel}>min</Text>
                    </View>
                  </View>
                ))
              )} */}
            </View>
          )}

          {/* <View style={{ height: 40 }} /> */}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const CategoryCard = ({ label, value, icon }) => (
  <View style={styles.categoryCard}>
    <View style={styles.iconContainer}>
      <Icon name={icon} size={28} color="#7F1D1D" />
    </View>
    <Text style={styles.categoryLabel}>{label}</Text>
    <Text style={styles.categoryValue}>₹{formatMoney(value)}</Text>
  </View>
);

export default AstrologerEarnings;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F4EF",
  },

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F4EF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5D5C8",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C1810",
  },

  refreshBtn: {
    backgroundColor: "#7F1D1D",
    padding: 10,
    borderRadius: 30,
    elevation: 3,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
  },

  filterBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#7F1D1D",
    borderRadius: 24,
  },

  activeFilter: {
    backgroundColor: "#7F1D1D",
  },

  filterText: {
    color: "#7F1D1D",
    fontWeight: "600",
    fontSize: 15,
  },

  activeFilterText: {
    color: "#FFF",
  },

  totalCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    elevation: 3,
  },

  totalValue: {
    color: "#7F1D1D",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 4,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  smallCard: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 18,
    elevation: 3,
  },

  cardLabel: {
    color: "#666",
    fontSize: 13,
  },

  cardValue: {
    color: "#7F1D1D",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#2C1810",
    marginTop: 28,
    marginBottom: 14,
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  categoryCard: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: "center",
    elevation: 3,
  },

  iconContainer: {
    marginBottom: 8,
  },

  categoryLabel: {
    fontSize: 13,
    color: "#2C1810",
    fontWeight: "500",
  },

  categoryValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#7F1D1D",
    marginTop: 6,
  },

  transactionCard: {
    backgroundColor: "#FFF",
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },

  customerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF5E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7F1D1D",
  },

  transactionInfo: {
    flex: 1,
  },

  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C1810",
    marginBottom: 3,
  },

  customerType: {
    fontSize: 13,
    color: "#555",
    marginBottom: 3,
  },

  customerTime: {
    fontSize: 12,
    color: "#777",
  },

  durationContainer: {
    alignItems: "center",
    marginLeft: 8,
  },

  duration: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7F1D1D",
  },

  durationLabel: {
    fontSize: 11,
    color: "#7F1D1D",
    fontWeight: "500",
  },

  noDataContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  noData: {
    textAlign: "center",
    color: "#777",
    fontSize: 15,
    marginTop: 12,
  },
});
