import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function GuidanceWarningBox({ text }) {
  if (!text) return null;

  return (
    <View style={styles.guidanceWarningBox}>
      <Ionicons name="alert-circle-outline" size={18} color="#D07A62" />
      <Text style={styles.guidanceWarningText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  guidanceWarningBox: {
    marginTop: 12,
    backgroundColor: "#FFF3F0",
    borderWidth: 1,
    borderColor: "#EFC9C2",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  guidanceWarningText: {
    color: "#C06D5F",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
    flex: 1,
  },
});