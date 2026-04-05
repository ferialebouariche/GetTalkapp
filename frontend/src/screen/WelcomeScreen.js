import React from "react";
import { View, Text, StyleSheet, Pressable, StatusBar } from "react-native";

export default function WelcomeScreen({ navigation }) {
  const goNext = () => {
    // Your stack screen is called "MainTabs" (NOT "Home")
    navigation.replace("MainTabs");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Pink header */}
      <View style={styles.topPink} />

      {/* Fake wave (simple shape) */}
      <View style={styles.waveWrap}>
        <View style={styles.wave} />
      </View>

      {/* White content card area */}
      <View style={styles.bottomWhite}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          To GetTalk where communication{"\n"}is easy and smooth
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.continueText}>Continue</Text>

          <Pressable style={styles.arrowBtn} onPress={goNext}>
            <Text style={styles.arrow}>➜</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const PINK = "#F37E7E";
const PINK_DARK = "#E96C6C";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },

  topPink: {
    height: "55%",
    backgroundColor: PINK,
  },

  waveWrap: {
    position: "absolute",
    top: "42%",
    left: 0,
    right: 0,
    height: 140,
    overflow: "hidden",
  },

  wave: {
    position: "absolute",
    width: "140%",
    height: 180,
    backgroundColor: "#fff",
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    transform: [{ rotate: "-6deg" }],
    left: "-20%",
    top: 35,
  },

  bottomWhite: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 26,
    paddingTop: 40,
  },

  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#8A8A8A",
    lineHeight: 20,
    marginBottom: 30,
  },

  bottomRow: {
    marginTop: "auto",
    marginBottom: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 16,
  },

  continueText: {
    color: "#A6A6A6",
    fontSize: 14,
    fontWeight: "600",
  },

  arrowBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: PINK_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  arrow: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginLeft: 2,
  },
});
