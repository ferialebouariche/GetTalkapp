import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons, Feather } from "@expo/vector-icons";
import { normalizeText } from "../utils/textUtils";
import { BSL_VIDEO_MAP } from "../utils/bslVideoMap";

const DEFAULT_MESSAGE = 'Type something like "hello" or "Thank you".';
const SCREEN_TITLE = "English → BSL";

export default function EngToBSL({ navigation }) {
  const [text, setText] = useState("");
  const [videoSource, setVideoSource] = useState(null);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  // Auto-translate whenever text changes
  useEffect(() => {
    const clean = normalizeText(text);

    if (!clean) {
      setVideoSource(null);
      setMessage(DEFAULT_MESSAGE);
      return;
    }

    // Convert spaces to underscore for dictionary keys: "thank you" -> "thank_you"
    const key = clean.replace(/\s+/g, "_");

    if (BSL_VIDEO_MAP[key]) {
      setVideoSource(BSL_VIDEO_MAP[key]);
      setMessage(`Matched phrase: "${clean}"`);
    } else {
      setVideoSource(null);
      setMessage("No matching BSL video yet.");
    }
  }, [text]);

  const onClear = () => {
    setText("");
    setVideoSource(null);
    setMessage(DEFAULT_MESSAGE);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable
          style={styles.topIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#111" />
        </Pressable>
        <Text style={styles.title}>{SCREEN_TITLE}</Text>
        <View style={styles.topIconBtnPlaceholder} />
      </View>
      {/*Input section */}
      <Text style={styles.label}>Enter English text</Text>

      <View style={styles.inputWrap}>
        <Feather
          name="edit-3"
          size={16}
          color="#111"
          style={styles.inputIcon}
        />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder='Type here... e.g. "thank you"'
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.messageText}>{message}</Text>

      <View style={styles.chipsRow}>
        <Text style={styles.chipsLabel}>Try:</Text>
        <View style={styles.chips}>
          <Pressable onPress={() => setText("Hello")}>
            <Text style={styles.chip}>Hello</Text>
          </Pressable>
          <Pressable onPress={() => setText("Thank you")}>
            <Text style={styles.chip}>Thank you</Text>
          </Pressable>
          <Pressable onPress={() => setText("Good morning")}>
            <Text style={styles.chip}>Good morning</Text>
          </Pressable>
        </View>
      </View>
      {/* Translation section */}
      <Text style={styles.videoLabel}>BSL TRANSLATION</Text>
      <View style={styles.avatarBox}>
        {videoSource ? (
          <Video
            source={videoSource}
            style={styles.video}
            resizeMode="cover"
            shouldPlay
            isLooping
            useNativeControls={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="hand-left-outline" size={30} color="#E97D6B" />
            </View>
            <Text style={styles.titlePlaceholder}>
              Type something above to see{"\n"} the BSL translation here
            </Text>
            <Text style={styles.subtitlePlaceholder}>
              e.g "Hello" or "Thank you"
            </Text>
          </View>
        )}
      </View>

      {/*Clear button */}
      <Pressable style={styles.clearBtn} onPress={onClear}>
        <Text style={styles.clearText}>Clear</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f6f7fb",
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  label: {
    fontSize: 20,
    color: "#A0A0A0",
    marginBottom: 4,
    fontWeight: "800",
    letterSpacing: 2,
  },
  videoLabel: {
    fontSize: 20,
    color: "#A0A0A0",
    marginTop: 15,
    fontWeight: "800",
    letterSpacing: 2,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111",
  },

  chipsRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  chipsLabel: {
    fontSize: 13,
    color: "#7A7A7A",
    fontWeight: "700",
  },

  chips: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  chip: {
    fontSize: 12,
    color: "#C96557",
    backgroundColor: "#FFF3F1",
    borderWidth: 1,
    borderColor: "#F2C8C2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "700",
  },

  avatarBox: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ececec",
    overflow: "hidden",
    height: 260,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    zIndex: 1,
  },

  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ececec",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  titlePlaceholder: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    lineHeight: 24,
    marginBottom: 8,
  },
  subtitlePlaceholder: {
    textAlign: "center",
    fontSize: 13,
    color: "#666",
  },
  clearBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    backgroundColor: "#d5060698",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  clearText: {
    color: "#f6f2f2",
    fontWeight: "700",
    fontSize: 16,
  },
  messageText: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  topIconBtnPlaceholder: {
    width: 38,
    height: 38,
  },
});
