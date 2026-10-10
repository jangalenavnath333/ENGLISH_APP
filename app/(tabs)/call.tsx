import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useRef } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Speech from "expo-speech";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { File } from "expo-file-system";
import {
  sendCallTurn,
  synthesizeSpeech,
  TUTORS,
  TalkHistoryItem,
} from "../../lib/gemini";
import { playWavBase64, stopPlayback, blobUriToWavBase64 } from "../../lib/audio";

type CallStatus = "idle" | "listening" | "thinking" | "speaking";

export default function CallScreen() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [history, setHistory] = useState<TalkHistoryItem[]>([]);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [pulse] = useState(() => new Animated.Value(0));
  
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const tutor = TUTORS[0]; // Default to Madam

  useEffect(() => {
    return () => {
      stopPlayback();
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (status === "listening" || status === "speaking") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [status, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const startCall = async () => {
    setHistory([]);
    await speak("Hello there! I am your English teacher. How are you doing today?", "en-US", true);
  };

  const endCall = () => {
    stopPlayback();
    Speech.stop();
    if (recState.isRecording) recorder.stop();
    setStatus("idle");
    setHistory([]);
  };

  const toggleMic = async () => {
    if (status === "thinking") return;
    if (recState.isRecording) {
      await finishRecording();
      return;
    }
    
    stopPlayback();
    Speech.stop();
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Please enable microphone access.");
      return;
    }
    
    try {
      await setAudioModeAsync({ 
        allowsRecording: true, 
        playsInSilentMode: true,
        playThroughEarpieceAndroid: !isSpeaker
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus("listening");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to start microphone");
    }
  };

  const finishRecording = async () => {
    setStatus("thinking");
    try {
      await recorder.stop();
      await setAudioModeAsync({ 
        allowsRecording: false, 
        playsInSilentMode: true,
        playThroughEarpieceAndroid: !isSpeaker 
      });
      const uri = recorder.uri;
      if (!uri) throw new Error("No recording found");
      
      const audioBase64 = await new File(uri).base64();
      
      const turn = await sendCallTurn("English", history, { audioBase64, audioMimeType: "audio/mp4" }, { tutor });
      
      const newHistory = [...history];
      newHistory.push({ role: "user", text: "(Audio)" });
      newHistory.push({ role: "tutor", text: turn.reply });
      setHistory(newHistory);
      
      await speak(turn.reply, turn.languageCode, true);
    } catch (e: any) {
      setStatus("idle");
      Alert.alert("Error", e.message || "Could not process audio");
    }
  };

  const speak = async (text: string, lang: string, autoMic: boolean = false) => {
    setStatus("thinking");
    const hasMarathi = /[\u0900-\u097F]/.test(text);
    
    if (!hasMarathi) {
      try {
        const wav = await synthesizeSpeech(text, tutor.voice);
        setStatus("speaking");
        await playWavBase64(wav, isSpeaker);
        setStatus("idle");
        if (autoMic) toggleMic();
        return;
      } catch (e) {
        console.log("TTS Error:", e);
      }
    }

    setStatus("speaking");
    await new Promise<void>((resolve) =>
      Speech.speak(text, {
        language: hasMarathi ? 'hi-IN' : 'en-US',
        rate: 0.85,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      })
    );
    setStatus("idle");
    if (autoMic) toggleMic();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {status === "idle" && history.length === 0 ? (
        <View style={styles.startWrap}>
          <Text style={styles.startTitle}>English Voice Call</Text>
          <Text style={styles.desc}>Practice speaking English in a real-time voice call.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={startCall}>
            <Ionicons name="call" size={32} color="#fff" />
            <Text style={styles.startBtnText}>Start Call</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.callWrap}>
          <View style={styles.callHeader}>
            <Text style={styles.contactName}>Teacher Madam</Text>
            <Text style={styles.statusText}>
              {status === "listening" ? "Listening... (Tap Mic to Send)" :
               status === "thinking" ? "Thinking..." :
               status === "speaking" ? "Teacher is speaking..." : "Waiting"}
            </Text>
          </View>

          <View style={styles.avatarSection}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale }], borderColor: status === "listening" ? "#3B82F6" : "#22C55E" }]}>
              <View style={styles.avatar}>
                <Text style={styles.emoji}>{tutor.emoji}</Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.rowControls}>
              <TouchableOpacity style={[styles.circleBtn, !isSpeaker && styles.circleBtnActive]} onPress={() => setIsSpeaker(!isSpeaker)}>
                <Ionicons name={isSpeaker ? "volume-high" : "ear"} size={28} color={!isSpeaker ? "#000" : "#fff"} />
                <Text style={styles.btnLabel}>{isSpeaker ? "Speaker" : "Earpiece"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.circleBtn, recState.isRecording && styles.circleBtnActiveBlue]} onPress={toggleMic}>
                <Ionicons name={recState.isRecording ? "send" : "mic"} size={28} color="#fff" />
                <Text style={styles.btnLabel}>{recState.isRecording ? "Send" : "Mic"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.endBtn} onPress={endCall}>
              <Ionicons name="call" size={36} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  startWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  startTitle: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  desc: { color: "#94A3B8", fontSize: 18, textAlign: "center", marginBottom: 40 },
  startBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#22C55E", paddingVertical: 18, paddingHorizontal: 36, borderRadius: 36, gap: 12 },
  startBtnText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  callWrap: { flex: 1, width: "100%", alignItems: "center", justifyContent: "space-between", paddingVertical: 20 },
  callHeader: { alignItems: "center", marginTop: 40 },
  contactName: { fontSize: 32, fontWeight: "300", color: "#fff", marginBottom: 8 },
  statusText: { color: "#94A3B8", fontSize: 18, fontWeight: "400" },
  avatarSection: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarRing: { width: 200, height: 200, borderRadius: 100, borderWidth: 4, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  avatar: { width: 170, height: 170, borderRadius: 85, backgroundColor: "#E6F4EF", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 90 },
  bottomControls: { width: "100%", paddingHorizontal: 40, paddingBottom: 40, alignItems: "center", gap: 40 },
  rowControls: { flexDirection: "row", width: "100%", justifyContent: "space-around" },
  circleBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  circleBtnActive: { backgroundColor: "#fff" },
  circleBtnActiveBlue: { backgroundColor: "#3B82F6" },
  btnLabel: { position: "absolute", bottom: -24, color: "#cbd5e1", fontSize: 13, width: 80, textAlign: "center" },
  endBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", marginTop: 20 },
});
