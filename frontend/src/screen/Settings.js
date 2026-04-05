import { View, Text, StyleSheet, Switch } from "react-native";
import { useSettings } from "../context/SettingsContext";
import { ActivityIndicator } from "react-native";

export default function Settings() {
  const { settings, setSetting, loaded } = useSettings();

  if (!loaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.LoadingBox}>
          <ActivityIndicator size="small" color="#ff7a7" />
          <Text style={styles.LoadingText}>Loading ...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Personalise the translation experience and reduce recognition errors.
      </Text>

      <View style={styles.card}>
        <View style={styles.textWrap}>
          <Text style={styles.label}>Camera guidance</Text>
          <Text style={styles.helper}>
            {" "}
            Show guidance to help position the hand correctly in the camera
            view.
          </Text>
        </View>
        <Switch
          value={settings.cameraGuidance}
          onValueChange={(v) => setSetting("cameraGuidance", v)}
          trackColor={{ false: "#d9d9d9", true: "#59d37a" }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.card}>
        <View style={styles.textWrap}>
          <Text style={styles.label}>Lighting warning</Text>
          <Text style={styles.helper}>
            {" "}
            Warn when lighting may reduce detection accuracy.
          </Text>
        </View>

        <Switch
          value={settings.lightingWarning}
          onValueChange={(v) => setSetting("lightingWarning", v)}
          trackColor={{ false: "#d9d9d9", true: "#59d37a" }}
          thumbColor="#fff"
        />
      </View>

      <Text style={styles.desc}>
        These settings support accessibility and reduce errors during real-time
        translation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f6f7fb" },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 16, color: "#111" },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: { fontSize: 16, fontWeight: "700", color: "#111" },

  desc: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  helper: {
    fontSize: 12,
    color: "#7a7a7a",
  },
  LoadingBox: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  LoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#6b7280",
  },
});
