import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSettings } from "../context/SettingsContext";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { CameraStatusPill, GuidanceWarningBox } from "../components";
import { sendPredictionRequest } from "../services";
import {
  CONF_THRESHOLD,
  STABLE_FRAMES,
  BSL_TO_ENG_SCREEN_TITLE,
} from "../utils/predictionConstants";

export default function BSLToEng({ navigation }) {
  const { settings } = useSettings();
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();

  // auto-running by default (like Eng->BSL auto translate)
  const [isRunning, setIsRunning] = useState(false);
  const [englishText, setEnglishText] = useState("—");
  const [confidence, setConfidence] = useState(0);
  const [apiStatus, setApiStatus] = useState("Idle");
  const [recognisedText, setRecognisedText] = useState("");
  const [guidanceMessage, setGuidanceMessage] = useState(""); //warning message

  // smoothing
  const lastPredictionRef = useRef({ text: "", count: 0 });
  const isProcessingRef = useRef(false);
  const fetchPredictionMobile = async () => {
    if (isProcessingRef.current) return;
    try {
      isProcessingRef.current = true;
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

      console.log("Sending frame to backend");
      const { res, data } = await sendPredictionRequest(photo.base64);
      console.log("Backend response:", data);

      if (!res.ok) {
        setApiStatus(`API error: ${res.status}`);

        //Guidance when API fialed
        if (settings.cameraGuidance) {
          setGuidanceMessage(
            "Unable to process your sign right now, try again later.",
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
        lastPredictionRef.current = { text: "", count: 0 };

        //show guidance only if settings is enabled
        if (settings.cameraGuidance) {
          setGuidanceMessage(
            "Place your hand clearly inside the camera frame.",
          );
        } else {
          setGuidanceMessage("");
        }
        return;
      }

      if (text === "—" || conf < CONF_THRESHOLD) {
        setApiStatus(`Hold steady… (${conf.toFixed(2)})`);
        setEnglishText("—");
        lastPredictionRef.current = { text: "", count: 0 };

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
      const last = lastPredictionRef.current;
      if (last.text === text) {
        last.count += 1;
      } else {
        last.text = text;
        last.count = 1;
      }
      lastPredictionRef.current = last;

      if (last.count >= STABLE_FRAMES) {
        setEnglishText(text);
        setApiStatus(`Detected (${conf.toFixed(2)})`);
        //clear guidance message when detection success
        setGuidanceMessage("");
        //
        setRecognisedText((prev) => {
          const lastChar = prev.slice(-1);
          if (lastChar === text) return prev;
          return prev + text;
        });

        lastPredictionRef.current = { text: "", count: 0 };
      } else {
        setApiStatus(`Stabilizing… ${last.count}/${STABLE_FRAMES}`);

        //Small guidance while waiting
        if (settings.cameraGuidance) {
          setGuidanceMessage("Keep your hand still for a moment");
        } else {
          setGuidanceMessage("");
        }
      }
    } catch (e) {
      console.log("Prediction error: ", e);
      setApiStatus("API connection failed");

      //Guidance when API failed
      if (settings.cameraGuidance) {
        setGuidanceMessage("Trying to connect to the API...");
      }
    } finally {
      isProcessingRef.current = false;
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

    const t = setInterval(fetchPredictionMobile, 1800);
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
    lastPredictionRef.current = { text: "", count: 0 };
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
        <Pressable
          style={styles.topIconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
        </Pressable>

        <Text style={styles.topTitle}>{BSL_TO_ENG_SCREEN_TITLE}</Text>
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
            <View style={styles.cameraWrapper}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
              />

              {isRunning && <CameraStatusPill text={apiStatus} />}
            </View>
          )}
        </View>

        {settings.cameraGuidance && guidanceMessage !== "" && (
          <GuidanceWarningBox text={guidanceMessage} />
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

  cameraWrapper: {
    width: "100%",
    height: "100%",
  },
});
