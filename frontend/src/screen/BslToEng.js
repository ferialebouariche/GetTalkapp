import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScrollView } from "react-native";
import { useSettings } from "../context/SettingsContext";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";

const ANDROID_EMULATOR_URL = "http://10.0.2.2:5000/predict";
// iPhone / real device needs your laptop IP on same Wi-Fi
const PC_LOCAL_IP_URL = "http://192.168.55.106:5000/predict"; //UPDATE THIS IP

export default function BSLToEng() {
  const { settings } = useSettings();
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();

  // auto-running by default (like Eng->BSL auto translate)
  const [isRunning, setIsRunning] = useState(true);
  const [englishText, setEnglishText] = useState("—");
  const [confidence, setConfidence] = useState(0);
  const [apiStatus, setApiStatus] = useState("Idle");
  const [recognisedText, setRecognisedText] = useState("");
  const [guidanceMessage, setGuidanceMessage] = useState(""); //warning message

  // smoothing
  const lastPredRef = useRef({ text: "", count: 0 });
  const CONF_THRESHOLD = 0.85; // increase if it shows letters randomly
  const STABLE_FRAMES = 3; // require same letter 3 times in a row

  const API_URL =
    Platform.OS === "android" ? ANDROID_EMULATOR_URL : PC_LOCAL_IP_URL;

  const fetchPredictionMobile = async () => {
    try {
      if (!cameraRef.current) {
        setApiStatus("Camera not ready");
        return;
      }

      // capture faster frame
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        setApiStatus("No frame captured");

        //Camera guidance message
        if (settings.cameraGuidance) {
          setGuidanceMessage("Camera not ready yet!");
        }
        return;
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: photo.base64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiStatus(`API error: ${res.status}`);

        //Guidance when API fialed
        if (settings.cameraGuidance) {
          setGuidanceMessage(
            "Unable tp process your sign right now, try again later.",
          );
        }
        return;
      }

      const text = String(data?.text ?? "—");
      const conf = Number(data?.confidence ?? 0);

      setConfidence(conf);

      // No hand detected
      if (text === "No hand") {
        setApiStatus("No hand detected");
        setEnglishText("—");
        lastPredRef.current = { text: "", count: 0 };

        //show guidance only if settings is enabled
        if (settings.cameraGuidance) {
          setGuidanceMessage("Place you hand clearly inside the camera frame.");
        } else {
          setGuidanceMessage("");
        }
        return;
      }

      if (text === "—" || conf < CONF_THRESHOLD) {
        setApiStatus(`Hold steady… (${conf.toFixed(2)})`);
        setEnglishText("—");
        lastPredRef.current = { text: "", count: 0 };

        //Show guidance warning only if the setting is enables
        if (settings.cameraGuidance) {
          setGuidanceMessage(
            "You may need to move closer and keep your hand steady",
          );
        } else {
          setGuidanceMessage("");
        }
        return;
      }

      // stability filter
      const last = lastPredRef.current;
      if (last.text === text) {
        last.count += 1;
      } else {
        last.text = text;
        last.count = 1;
      }
      lastPredRef.current = last;

      if (last.count >= STABLE_FRAMES) {
        setEnglishText(text);
        setApiStatus(`Detected (${conf.toFixed(2)})`);
        //clear guidance message when detection success
        setGuidanceMessage("");
        //
        setRecognisedText((prev) => {
          if (prev.endsWith(text)) return prev;
          return prev + text;
        });

        lastPredRef.current = { text: "", count: 0 };
      } else {
        setApiStatus(`Stabilizing… ${last.count}/${STABLE_FRAMES}`);

        //Small guidance while waiting
        if (settings.cameraGuidance) {
          setGuidanceMessage("Kepp your hand still for a moment");
        } else {
          setGuidanceMessage("");
        }
      }
    } catch (e) {
      setApiStatus("API connection failed");

      //Guidance when API failed
      if (settings.cameraGuidance) {
        setGuidanceMessage("Tryign to conncet the API...");
      }
    }
  };

  // auto loop
  useEffect(() => {
    if (!isRunning) return;

    // on web: don’t run (camera capture unreliable)
    if (Platform.OS === "web") {
      setApiStatus("Web mode: use mobile for sign capture.");
      setIsRunning(false);
      return;
    }

    const t = setInterval(fetchPredictionMobile, 900); // ~1 fps (good enough)
    return () => clearInterval(t);
  }, [isRunning]);

  // request permission once
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const onToggle = async () => {
    if (isRunning) {
      setIsRunning(false);
      setApiStatus("Stopped");
      //Clear guidance when stopped
      setGuidanceMessage("");
      return;
    }

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setApiStatus("Camera permission denied");
        if (settings.cameraGuidance) {
          setGuidanceMessage("Camera permision is required");
        }
        return;
      }
    }

    setEnglishText("—");
    setConfidence(0);
    lastPredRef.current = { text: "", count: 0 };
    setApiStatus("Starting…");
    setGuidanceMessage("");
    setIsRunning(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.topIconBtn}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </Pressable>

        <Text style={styles.topTitle}>BSL → English</Text>

        <Pressable style={styles.topIconBtnActive}>
          <View style={styles.liveDot} />
        </Pressable>
      </View>

      {/* Camera card */}
      <View style={styles.cameraCard}>
        <View style={styles.cameraBox}>
          {Platform.OS === "web" ? (
            <Text style={styles.placeholder}>
              Web mode is limited for real-time camera capture.
              {"\n"}Use iPhone/Android for sign detection.
            </Text>
          ) : !permission ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.small}>Loading camera permissions…</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.center}>
              <Text style={styles.placeholder}>
                Camera permission is needed to detect signs.
              </Text>
              <Pressable
                style={styles.secondaryBtn}
                onPress={requestPermission}
              >
                <Text style={styles.secondaryText}>Allow Camera</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ width: "100%", height: "100%" }}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
              />

              {settings.cameraGuidance && guidanceMessage !== "" && (
                <>
                  <View style={styles.cornerTopLeft} />
                  <View style={styles.cornerTopRight} />
                  <View style={styles.cornerBottomLeft} />
                  <View style={styles.cornerBottomRight} />
                </>
              )}

              {guidanceMessage !== "" && (
                <View style={styles.cameraStatusPill}>
                  <View style={styles.cameraStatusDot} />
                  <Text style={styles.cameraStatusText}>{apiStatus}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {settings.cameraGuidance && guidanceMessage !== "" && (
          <View style={styles.guidanceWarningBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#D07A62" />
            <Text style={styles.guidanceWarningText}>{guidanceMessage}</Text>
          </View>
        )}
      </View>

      {/* Detected letter card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardLabel}>DETECTED LETTER</Text>

        <View style={styles.detectedRow}>
          <View style={styles.letterBox}>
            <Text style={styles.letterBoxText}>{englishText}</Text>
          </View>

          <View style={styles.detectedMeta}>
            <Text style={styles.detectedStatus}>• {apiStatus}</Text>
            <Text style={styles.detectedConfidence}>
              Confidence: {confidence.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.progressLabel}>Confidence level</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(4, confidence * 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* English output card */}
      <View style={styles.infoCard}>
        <View style={styles.outputHeader}>
          <Text style={styles.cardLabel}>ENGLISH OUTPUT</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          <Text style={styles.outputValue}>{recognisedText || "—"}</Text>
        </ScrollView>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.mainBtn, isRunning && styles.mainBtnStop]}
          onPress={onToggle}
        >
          <View style={styles.mainBtnInner}>
            <Feather name="stop-circle" size={18} color="#fff" />
            <Text style={styles.mainBtnText}>
              {isRunning ? "Stop" : "Start Signing"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.trashBtn}
          onPress={() => setRecognisedText("")}
        >
          <MaterialIcons name="delete-outline" size={24} color="#666" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 32,
  },

  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  topIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7E2DE",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  topIconBtnActive: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0D5D0",
    backgroundColor: "#FFF3F1",
    alignItems: "center",
    justifyContent: "center",
  },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D99488",
  },

  topTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  cameraCard: {
    marginBottom: 14,
  },

  cameraBox: {
    height: 360,
    borderRadius: 28,
    backgroundColor: "#161616",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  camera: {
    width: "100%",
    height: "100%",
  },

  cornerTopLeft: {
    position: "absolute",
    top: 36,
    left: 36,
    width: 52,
    height: 52,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#E89282",
    borderTopLeftRadius: 10,
  },

  cornerTopRight: {
    position: "absolute",
    top: 36,
    right: 36,
    width: 52,
    height: 52,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#E89282",
    borderTopRightRadius: 10,
  },

  cornerBottomLeft: {
    position: "absolute",
    bottom: 36,
    left: 36,
    width: 52,
    height: 52,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#E89282",
    borderBottomLeftRadius: 10,
  },

  cornerBottomRight: {
    position: "absolute",
    bottom: 36,
    right: 36,
    width: 52,
    height: 52,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#E89282",
    borderBottomRightRadius: 10,
  },

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

  infoCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECE8E4",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },

  cardLabel: {
    fontSize: 12,
    color: "#A0A0A0",
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 14,
  },

  detectedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  letterBox: {
    width: 86,
    height: 86,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#DCD7D2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    backgroundColor: "#FAFAFA",
  },

  letterBoxText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#A0A0A0",
  },

  detectedMeta: {
    flex: 1,
  },

  detectedStatus: {
    fontSize: 16,
    fontWeight: "800",
    color: "#C84E45",
    marginBottom: 6,
  },

  detectedConfidence: {
    fontSize: 14,
    color: "#A0A0A0",
  },

  progressLabel: {
    fontSize: 12,
    color: "#9A9A9A",
    marginBottom: 8,
  },

  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#F1EFED",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#E89282",
  },

  outputHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  liveBadge: {
    backgroundColor: "#FFF3F1",
    borderWidth: 1,
    borderColor: "#EFC9C2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },

  liveBadgeText: {
    color: "#C06D5F",
    fontWeight: "700",
    fontSize: 13,
  },

  scrollArea: {
    maxHeight: 90,
  },

  outputValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  mainBtn: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#E97D6B",
    alignItems: "center",
    justifyContent: "center",
  },

  mainBtnStop: {
    backgroundColor: "#111",
  },

  mainBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  mainBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  trashBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6E1DD",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  placeholder: {
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: 16,
    color: "#fff",
  },

  small: {
    marginTop: 10,
    opacity: 0.7,
    fontSize: 12,
    color: "#fff",
  },

  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#333",
  },

  secondaryText: {
    color: "#fff",
    fontWeight: "800",
  },

  warning: {
    marginTop: 8,
    color: "#ff6b6b",
    fontWeight: "700",
  },
});
