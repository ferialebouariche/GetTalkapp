import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CameraStatusPill({ text }) {
  if (!text) return null;

  return (
    <View style={styles.cameraStatusPill}>
      <View style={styles.cameraStatusDot} />
      <Text style={styles.cameraStatusText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraStatusPill: {
    position: "absolute",
    bottom: 26,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  cameraStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E77B74",
    marginRight: 8,
  },

  cameraStatusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});