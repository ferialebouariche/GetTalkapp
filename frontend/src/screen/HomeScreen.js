import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>GetTalk</Text>
          <Text style={styles.title}>Your sign langue {"\n"} translator</Text>
          <Text style={styles.subtitle}>
            Instant BSL to English translation
          </Text>
        </View>

        {/* White card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CHOOSE DIRECTION</Text>

          <Pressable
            style={({ pressed }) => [
              styles.mainCard,
              styles.signCard,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate("BSL → ENG")}
          >
            <View style={styles.cardLeft}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <View style={styles.iconBoxPink}>
                  <Feather name="edit-3" size={16} color="#fff" />
                </View>
                <Text style={styles.cardTagPink}>SIGN TO TEXT</Text>
              </View>
              <Text style={styles.cardTitle}>
                BSL <Text style={styles.pinkArrow}>→</Text> English
              </Text>
              <Text style={styles.cardDescription}>
                Use camera to translate your signs
              </Text>
            </View>

            <View style={styles.circleBtnPink}>
              <Text style={styles.circleArrow}>→</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.mainCard,
              styles.textCard,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate("ENG → BSL")}
          >
            <View style={styles.cardLeft}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <View style={styles.iconBoxDark}>
                  <Feather name="type" size={16} color="#fff" />
                </View>
                <Text style={styles.cardTagDark}>TEXT TO SIGN</Text>
              </View>
              <Text style={styles.cardTitle}>
                Enlish <Text style={styles.darkArrow}>→</Text> BSL
              </Text>
              <Text style={styles.cardDescription}>
                Type text and see it signed
              </Text>
            </View>
            <View style={styles.circleBtnDark}>
              <Text style={styles.circleArrow}>→</Text>
            </View>
          </Pressable>

          <View style={styles.tipBox}>
            <Text style={styles.tipEmojie}>.</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}> Quick tip</Text>
              <Text style={styles.tipText}>
                Make sure you have good lighting when signign for best
                recognition accuracy
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fc8484",
  },
  container: {
    flex: 1,
    backgroundColor: "#fc8484",
  },
  header: {
    backgroundColor: "PINK",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 42,
  },
  logo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 22,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "100",
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  mainCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItem: "center",
  },
  sectionTitle: {
    fontSize: 14,
    color: "#9B9B9B",
    marginBottom: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  signCard: {
    backgroundColor: "#FDF0EE",
    borderWidth: 2,
    borderColor: "#F4CFC9",
  },
  textCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#EAEAEA",
  },
  iconBoxPink: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F07B6B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  iconBoxDark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  cardLeft: {
    flex: 1,
    marginRight: 16,
  },
  cardTagPink: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C7503F",
    marginBottom: 10,
    letterSpacing: 1,
  },
  cardTagDark: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B6B6B",
    marginBottom: 10,
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
    marginBottom: 8,
  },
  pinkArrow: {
    color: "#F07B6B",
  },
  darkArrow: {
    color: "#111",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B6B6B",
    lineHeight: 20,
  },
  circleBtnPink: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F07B6B",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnDark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  circleArrow: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: -2,
  },
  tipBox: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF7F6",
    borderWidth: 1,
    borderColor: "#F4CFC9",
    borderStyle: "dashed",
    borderRadius: 18,
    padding: 16,
  },
  tipEmojie: {
    fontSize: 100,
    marginRight: 10,
    marginTop: -75,
    color: "#F07B6B",
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    lineHeight: 20,
  },
  tipText: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
