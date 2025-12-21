import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AgoraMiniView() {
  return (
    <View style={styles.box}>
      <Text style={{ color: "#fff" }}>Mini Call View</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});
