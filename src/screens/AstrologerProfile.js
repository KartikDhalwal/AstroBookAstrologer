import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('screen');

const AstrologerProfile = () => {
  const [profile, setProfile] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadAstrologerData();
  }, []);

  const loadAstrologerData = async () => {
    try {
      const data = await AsyncStorage.getItem('astrologerData');
      if (data) {
        setProfile(JSON.parse(data));
      }
    } catch (error) {
      console.log('Error loading astrologer data:', error);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: '#7F1D1D' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

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

  return (
    <View style={styles.safe}>
      <StatusBar backgroundColor="#7F1D1D" barStyle="dark-content" />

      {/* HEADER + EDIT BUTTON */}
      <View style={styles.topHeader}>
        {/* <Text style={styles.pageTitle}>Profile View</Text> */}

        {/* <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("AstrologerDetailsForm", { profile })}
        >
          <Icon name="pencil-outline" size={20} color="#fff" />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity> */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE HEADER */}
        <View style={styles.headerCard}>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: getImageUrl(profile.profileImage) }}
              style={styles.profileImage}
            />

            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.name}>{profile.astrologerName}</Text>
              <Text style={styles.tagline}>
                {profile.short_bio || profile.title || 'AstroBook Astrologer'}
              </Text>

              {/* <View style={styles.ratingRow}>
                <Icon name="star" size={18} color="#FFD580" />
                <Text style={styles.ratingText}>{profile.rating || 0}</Text>
                <Text style={styles.ratingCount}>({profile.ratingCount})</Text>
              </View> */}
            </View>
          </View>
        </View>

        {/* BASIC INFORMATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.infoCard}>
            <InfoRow label="Name" value={profile.astrologerName} />
            <InfoRow label="Gender" value={profile.gender} />
            <InfoRow label="Experience" value={`${profile.experience} Years`} />
            <InfoRow label="Phone" value={`+91 - ${profile.phoneNumber}`} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Languages" value={profile.language} />
            <InfoRow label="City" value={profile.city} />
            <InfoRow label="State" value={profile.state} />
            <InfoRow label="Zip Code" value={profile.zipCode} />
          </View>
        </View>

        {/* ABOUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoCard}>
            <Text style={styles.aboutText}>{profile.about}</Text>
          </View>
        </View>

        {/* SKILLS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>

          <View style={styles.infoCard}>
            <View style={styles.chipWrapper}>
              {profile.skill?.map((item, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{item.skill}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* EXPERTISE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>

          <View style={styles.infoCard}>
            <View style={styles.chipWrapper}>
              {profile.mainExpertise?.map((item, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{item.mainExpertise}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* REMEDIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remedies</Text>

          <View style={styles.infoCard}>
            <View style={styles.chipWrapper}>
              {profile.remedies?.map((item, index) => (
                <View key={index} style={styles.remedyChip}>
                  <Text style={styles.remedyTitle}>{item.title}</Text>
                  <Text style={styles.remedyDesc}>{item.description}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

/* SAFE INFO COMPONENT */
const InfoRow = ({ label, value }) => {
  let display = value;

  if (Array.isArray(value)) {
    display = value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object')
          return item.skill || item.mainExpertise || item.title;
        return '';
      })
      .join(', ');
  }

  if (typeof display === 'object') display = '--';

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{display || '--'}</Text>
    </View>
  );
};

export default AstrologerProfile;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F4EF",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 6,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C1810",
  },

  editButton: {
    flexDirection: "row",
    backgroundColor: "#7F1D1D",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },

  editText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 13,
  },

  headerCard: {
    backgroundColor: '#7F1D1D',
    margin: 16,
    padding: 20,
    borderRadius: 20,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFD580',
  },

  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },

  tagline: {
    fontSize: 12,
    color: '#FFE9C6',
    marginTop: 2,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  ratingText: {
    color: '#FFD580',
    marginLeft: 4,
    fontWeight: 'bold',
  },

  ratingCount: {
    color: '#FFE9C6',
    marginLeft: 6,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },

  infoRow: {
    flexDirection: 'column',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  infoLabel: {
    fontSize: 14,
    color: '#7F1D1D',
    fontWeight: '600',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
  },

  aboutText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },

  chipWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  skillChip: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  skillText: {
    color: '#FFF',
    fontSize: 13,
  },

  remedyChip: {
    width: '100%',
    backgroundColor: '#F8F4EF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  remedyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7F1D1D',
  },

  remedyDesc: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
});