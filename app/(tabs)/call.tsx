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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Call 📞</Text>
        <TouchableOpacity style={styles.speakerBtn} onPress={() => setIsSpeaker(!isSpeaker)}>
          <Ionicons name={isSpeaker ? "volume-high" : "ear"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.main}>
        {status === "idle" && history.length === 0 ? (
          <View style={styles.startWrap}>
            <Text style={styles.desc}>Practice speaking English on a real-time voice call.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={startCall}>
              <Ionicons name="call" size={32} color="#fff" />
              <Text style={styles.startBtnText}>Start Call</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.callWrap}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale }], borderColor: status === "listening" ? "#EF4444" : "#145E4C" }]}>
              <View style={styles.avatar}>
                <Text style={styles.emoji}>{tutor.emoji}</Text>
              </View>
            </Animated.View>
            
            <Text style={styles.statusText}>
              {status === "listening" ? "Listening... (Tap mic to send)" :
               status === "thinking" ? "Thinking..." :
               status === "speaking" ? "Teacher is speaking..." : "Waiting"}
            </Text>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.endBtn} onPress={endCall}>
                <Ionicons name="call" size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.micBtn, recState.isRecording && styles.micBtnActive]} onPress={toggleMic}>
                <Ionicons name={recState.isRecording ? "send" : "mic"} size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#064E3B" },
  header: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  speakerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  main: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  startWrap: { alignItems: "center" },
  desc: { color: "#A7F3D0", fontSize: 18, textAlign: "center", marginBottom: 40, paddingHorizontal: 20 },
  startBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#10B981", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, gap: 12 },
  startBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  callWrap: { flex: 1, width: "100%", alignItems: "center", justifyContent: "space-between", paddingVertical: 40 },
  avatarRing: { width: 180, height: 180, borderRadius: 90, borderWidth: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#064E3B" },
  avatar: { width: 150, height: 150, borderRadius: 75, backgroundColor: "#E6F4EF", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 80 },
  statusText: { color: "#fff", fontSize: 20, fontWeight: "600", marginTop: 40 },
  controls: { flexDirection: "row", alignItems: "center", gap: 30, marginTop: "auto" },
  endBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" },
  micBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  micBtnActive: { backgroundColor: "#3B82F6" },
});
