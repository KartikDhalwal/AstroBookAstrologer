import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api_url } from "../config/Constants";

const AstrologerDetailsForm = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { profile } = route.params || {};

  const [form, setForm] = useState({
    astrologerId: "",
    astrologerName: "",
    displayName: "",
    experience: "",
    long_bio: "",
    language: [],
    skill: [],
    mainExpertise: [],
    address: "",
  });

  useEffect(() => {
    loadInitialData();
  },[]);

  const loadInitialData = async () => {
    try {
      const stored = await AsyncStorage.getItem("astrolgerData");
      const astro = stored ? JSON.parse(stored) : profile;

      setForm({
        astrologerId: astro._id,
        astrologerName: astro.astrologerName || "",
        displayName: astro.displayName || astro.astrologerName || "",
        experience: astro.experience || "",
        long_bio: astro.long_bio || astro.about || "",
        language: astro.language || [],
        skill: astro.skill?.map((item) => item.skill) || [],
        mainExpertise: astro.mainExpertise?.map((item) => item.mainExpertise) || [],
        address: astro.address || "",
      });
    } catch (error) {
      console.log("Load error", error);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* MULTI-SELECT ADD / REMOVE */
  const toggleMulti = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleSubmit = async () => {
    if (!form.astrologerId) {
      return Alert.alert("Error", "Astrologer ID missing!");
    }
    try {
      const response = await axios.post(
        `${api_url}astrologer/update_astro_profile`,
        form,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data.success) {
        Alert.alert("Success", "Profile updated successfully!");
        await AsyncStorage.setItem("astrolgerData", JSON.stringify(form));

        navigation.goBack();
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  return (
    <View style={styles.safe}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#2C1810" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <View style={{ width: 30 }}></View>
      </View> */}

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* INPUT FIELD */}
        <Field label="Astrologer Name">
          <TextInput
            style={styles.input}
            value={form.astrologerName}
            onChangeText={(t) => updateField("astrologerName", t)}
            placeholder="Enter full name"
          />
        </Field>

        <Field label="Display Name">
          <TextInput
            style={styles.input}
            value={form.displayName}
            onChangeText={(t) => updateField("displayName", t)}
            placeholder="Enter display name"
          />
        </Field>

        <Field label="Experience (Years)">
          <TextInput
            style={styles.input}
            value={form.experience}
            onChangeText={(t) => updateField("experience", t)}
            keyboardType="numeric"
          />
        </Field>

        <Field label="Long Bio">
          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: "top" }]}
            multiline
            value={form.long_bio}
            onChangeText={(t) => updateField("long_bio", t)}
            placeholder="Write long description..."
          />
        </Field>

        {/* LANGUAGE MULTI SELECT */}
        <MultiSelect
          label="Languages"
          options={["Hindi", "English", "Tamil", "Bengali"]}
          selected={form.language}
          onSelect={(val) => toggleMulti("language", val)}
        />

        {/* SKILLS MULTI SELECT */}
        <MultiSelect
          label="Skills"
          options={[
            "Astrology",
            "Palm Reading",
            "Tarot",
            "Numerology",
            "Vastu",
            "Self-awareness",
          ]}
          selected={form.skill}
          onSelect={(val) => toggleMulti("skill", val)}
        />

        {/* EXPERTISE SELECT */}
        <MultiSelect
          label="Main Expertise"
          options={["Career", "Health", "Love", "Marriage", "Astrology"]}
          selected={form.mainExpertise}
          onSelect={(val) => toggleMulti("mainExpertise", val)}
        />

        <Field label="Address">
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={(t) => updateField("address", t)}
            placeholder="Enter address"
          />
        </Field>

        {/* BUTTON */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

/* REUSABLE FIELD WRAPPER */
const Field = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

/* MULTI SELECT COMPONENT */
const MultiSelect = ({ label, options, selected, onSelect }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>

    <View style={styles.multiWrap}>
      {options.map((opt, i) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(opt)}
            style={[styles.multiChip, active && styles.multiChipActive]}
          >
            <Text style={[styles.multiText, active && styles.multiTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default AstrologerDetailsForm;

/* STYLES */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F4EF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C1810",
  },

  field: {
    marginHorizontal: 16,
    marginTop: 16,
  },

  fieldLabel: {
    fontSize: 15,
    marginBottom: 6,
    color: "#2C1810",
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E7DCC8",
  },

  multiWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  multiChip: {
    borderWidth: 1,
    borderColor: "#7F1D1D",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  multiChipActive: {
    backgroundColor: "#7F1D1D",
  },

  multiText: {
    color: "#7F1D1D",
    fontWeight: "500",
  },

  multiTextActive: {
    color: "#FFF",
  },

  submitBtn: {
    marginTop: 30,
    marginHorizontal: 16,
    backgroundColor: "#7F1D1D",
    paddingVertical: 14,
    borderRadius: 14,
  },

  submitText: {
    textAlign: "center",
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
  },
});
