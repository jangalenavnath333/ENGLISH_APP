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
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Speech from "expo-speech";
import {
  useAudioRecorder,
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
import { playWavBase64, stopPlayback } from "../../lib/audio";

type CallStatus = "idle" | "listening" | "thinking" | "speaking" | "muted";

const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

const POLL_MS = 120;
const SILENCE_END_MS = 1300; // silence after speech => user finished
const MAX_UTTERANCE_MS = 25000;
const MIN_SPEECH_MS = 350; // ignore coughs / clicks shorter than this
const MAX_ERRORS_IN_ROW = 3;

const GREETING = "Hello! I am your English teacher. How are you doing today?";

const STATUS_TEXT: Record<CallStatus, string> = {
  idle: "Connecting...",
  listening: "ऐकत आहे... बोला",
  thinking: "विचार करत आहे...",
  speaking: "Teacher बोलत आहे",
  muted: "Mic बंद आहे",
};

const formatTime = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CallScreen() {
  const [inCall, setInCall] = useState(false);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [userCaption, setUserCaption] = useState("");
  const [tutorCaption, setTutorCaption] = useState("");
  const [notice, setNotice] = useState("");
  const [pulse] = useState(() => new Animated.Value(0));

  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const tutor = TUTORS[0];

  // Refs so the long-running listen/speak loop always sees the latest values
  const runIdRef = useRef(0); // bumped on every start/end; stale async work checks it and quits
  const historyRef = useRef<TalkHistoryItem[]>([]);
  const speakerRef = useRef(true);
  const mutedRef = useRef(false);
  const finishRef = useRef<(() => void) | null>(null); // manual "send now"
  const errorsRef = useRef(0);

  // --- animation -----------------------------------------------------------
  useEffect(() => {
    if (status !== "listening" && status !== "speaking") {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  // --- call timer ----------------------------------------------------------
  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  // --- helpers -------------------------------------------------------------
  const applyAudioMode = useCallback(async (recording: boolean) => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: recording || !speakerRef.current,
        shouldRouteThroughEarpiece: !speakerRef.current,
      });
    } catch (e) {
      console.log("Audio mode error:", e);
    }
  }, []);

  const stopRecorderQuietly = useCallback(async () => {
    try {
      if (recorder.getStatus().isRecording) await recorder.stop();
    } catch {
      // recorder was not running
    }
  }, [recorder]);

  const hardStopAll = useCallback(() => {
    runIdRef.current += 1;
    finishRef.current = null;
    stopPlayback();
    Speech.stop();
    stopRecorderQuietly();
  }, [stopRecorderQuietly]);

  // Speak the tutor's reply (Gemini voice for English, device voice for Marathi / fallback)
  const speak = useCallback(
    async (text: string, runId: number) => {
      setStatus("speaking");
      await applyAudioMode(false);
      const hasDevanagari = /[ऀ-ॿ]/.test(text);

      if (!hasDevanagari) {
        try {
          const wav = await synthesizeSpeech(text, tutor.voice);
          if (runId !== runIdRef.current) return;
          await playWavBase64(wav, speakerRef.current);
          return;
        } catch (e) {
          console.log("TTS error, using device voice:", e);
          if (runId !== runIdRef.current) return;
        }
      }

      await new Promise<void>((resolve) => {
        const guard = setTimeout(resolve, 30000);
        const done = () => {
          clearTimeout(guard);
          resolve();
        };
        Speech.speak(text, {
          language: hasDevanagari ? "hi-IN" : "en-US",
          rate: 0.9,
          onDone: done,
          onStopped: done,
          onError: done,
        });
      });
    },
    [applyAudioMode, tutor.voice]
  );

  // Record until the user stops talking (or taps "send now"). Returns audio or null if no speech.
  const recordUtterance = useCallback(
    async (runId: number): Promise<string | null> => {
      await applyAudioMode(true);
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus("listening");

      const startedAt = Date.now();
      let noiseFloor = -160;
      let samples = 0;
      let speechMs = 0;
      let lastVoiceAt = 0;
      let speechStartedAt = 0;
      let manualSend = false;
      finishRef.current = () => {
        manualSend = true;
      };

      while (runId === runIdRef.current && !mutedRef.current) {
        await sleep(POLL_MS);
        const st = recorder.getStatus();
        const now = Date.now();
        const level = st.metering;

        if (typeof level === "number") {
          // first ~0.6s: learn the background noise level
          if (samples < 5) {
            noiseFloor = samples === 0 ? level : Math.max(noiseFloor, level);
            samples += 1;
          } else {
            const threshold = Math.max(-42, noiseFloor + 12);
            if (level > threshold) {
              if (!speechStartedAt) speechStartedAt = now;
              lastVoiceAt = now;
              speechMs = now - speechStartedAt;
            }
          }
        }

        const heardSpeech = speechMs >= MIN_SPEECH_MS;
        if (manualSend) break;
        if (heardSpeech && now - lastVoiceAt > SILENCE_END_MS) break;
        if (now - startedAt > MAX_UTTERANCE_MS) break;
      }
      finishRef.current = null;

      const uri = recorder.uri;
      await stopRecorderQuietly();
      if (runId !== runIdRef.current || mutedRef.current) return null;

      // Metering unavailable (e.g. some devices): only a manual send produces audio
      const heard = speechMs >= MIN_SPEECH_MS || manualSend;
      const fileUri = uri ?? recorder.uri;
      if (!heard || !fileUri) return null;
      return new File(fileUri).base64();
    },
    [applyAudioMode, recorder, stopRecorderQuietly]
  );

  // The hands-free loop: listen -> think -> speak -> listen ...
  const conversationLoop = useCallback(
    async (runId: number) => {
      while (runId === runIdRef.current) {
        if (mutedRef.current) {
          setStatus("muted");
          await sleep(300);
          continue;
        }
        try {
          const audio = await recordUtterance(runId);
          if (runId !== runIdRef.current) return;
          if (!audio) continue; // silence / muted: listen again

          setStatus("thinking");
          setNotice("");
          const turn = await sendCallTurn(
            "English",
            historyRef.current,
            { audioBase64: audio, audioMimeType: "audio/mp4" },
            { tutor }
          );
          if (runId !== runIdRef.current) return;
          errorsRef.current = 0;

          if (!turn.reply) {
            setNotice("काही ऐकू आलं नाही, पुन्हा बोला");
            continue;
          }

          historyRef.current = [
            ...historyRef.current,
            { role: "user", text: turn.transcript || "(unclear)" },
            { role: "tutor", text: turn.reply },
          ];
          setUserCaption(turn.transcript);
          setTutorCaption(turn.reply);
          await speak(turn.reply, runId);
        } catch (e: any) {
          if (runId !== runIdRef.current) return;
          errorsRef.current += 1;
          console.log("Call turn error:", e);
          if (errorsRef.current >= MAX_ERRORS_IN_ROW) {
            hardStopAll();
            setInCall(false);
            setStatus("idle");
            Alert.alert("Call ended", "Internet किंवा server मध्ये अडचण आहे. थोड्या वेळाने पुन्हा try करा.");
            return;
          }
          setNotice("Network slow आहे, पुन्हा try करत आहे...");
          await stopRecorderQuietly();
          await sleep(1200);
        }
      }
    },
    [recordUtterance, speak, tutor, hardStopAll, stopRecorderQuietly]
  );

  // --- user actions --------------------------------------------------------
  const startCall = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "कॉलसाठी Microphone permission द्या (Settings मध्ये).");
        return;
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Microphone चालू करता आला नाही");
      return;
    }

    hardStopAll();
    const runId = runIdRef.current;
    historyRef.current = [];
    errorsRef.current = 0;
    mutedRef.current = false;
    setIsMuted(false);
    setSeconds(0);
    setUserCaption("");
    setTutorCaption(GREETING);
    setNotice("");
    setInCall(true);

    try {
      await speak(GREETING, runId);
      historyRef.current = [{ role: "tutor", text: GREETING }];
    } catch (e) {
      console.log("Greeting error:", e);
    }
    if (runId === runIdRef.current) conversationLoop(runId);
  };

  const endCall = useCallback(() => {
    hardStopAll();
    setInCall(false);
    setStatus("idle");
    setNotice("");
  }, [hardStopAll]);

  const toggleSpeaker = () => {
    const next = !speakerRef.current;
    speakerRef.current = next;
    setIsSpeaker(next);
    applyAudioMode(status === "listening");
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setIsMuted(next);
    if (next) {
      setStatus("muted");
      stopRecorderQuietly();
    }
  };

  // Tabs stay mounted: hang up when the user leaves this tab or the app closes
  useFocusEffect(
    useCallback(() => {
      return () => endCall();
    }, [endCall])
  );

  useEffect(() => () => hardStopAll(), [hardStopAll]);

  // --- UI ------------------------------------------------------------------
  if (!inCall) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.startWrap}>
          <Text style={styles.avatarEmoji}>{tutor.emoji}</Text>
          <Text style={styles.startTitle}>English Voice Call</Text>
          <Text style={styles.desc}>
            Teacher शी फोनवर बोलल्यासारखं English बोला. बटण दाबायची गरज नाही - तुम्ही थांबलात की Teacher आपोआप उत्तर देते.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={startCall} activeOpacity={0.8}>
            <Ionicons name="call" size={32} color="#fff" />
            <Text style={styles.startBtnText}>Start Call</Text>
          </TouchableOpacity>
          <Text style={styles.tip}>💡 शांत जागी बोला, म्हणजे आवाज नीट ओळखला जाईल.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.callWrap}>
        <View style={styles.callHeader}>
          <Text style={styles.contactName}>Teacher Madam</Text>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
          <Text style={styles.statusText}>{STATUS_TEXT[status]}</Text>
          {!!notice && <Text style={styles.notice}>{notice}</Text>}
        </View>

        <View style={styles.avatarSection}>
          <Animated.View
            style={[
              styles.avatarRing,
              { transform: [{ scale }], borderColor: status === "listening" ? "#3B82F6" : status === "muted" ? "#64748B" : "#22C55E" },
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.emoji}>{tutor.emoji}</Text>
            </View>
          </Animated.View>

          <View style={styles.captions}>
            {!!tutorCaption && <Text style={styles.tutorCaption}>{tutorCaption}</Text>}
            {!!userCaption && <Text style={styles.userCaption}>You: {userCaption}</Text>}
          </View>
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.rowControls}>
            <TouchableOpacity style={[styles.circleBtn, !isSpeaker && styles.circleBtnActive]} onPress={toggleSpeaker}>
              <Ionicons name={isSpeaker ? "volume-high" : "ear"} size={26} color={!isSpeaker ? "#000" : "#fff"} />
              <Text style={styles.btnLabel}>{isSpeaker ? "Speaker" : "Earpiece"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.circleBtn, isMuted && styles.circleBtnActive]} onPress={toggleMute}>
              <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color={isMuted ? "#000" : "#fff"} />
              <Text style={styles.btnLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.circleBtn, status === "listening" && styles.circleBtnActiveBlue, status !== "listening" && styles.circleBtnDisabled]}
              onPress={() => finishRef.current?.()}
              disabled={status !== "listening"}
            >
              <Ionicons name="send" size={24} color="#fff" />
              <Text style={styles.btnLabel}>Send now</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.endBtn} onPress={endCall} activeOpacity={0.8}>
            <Ionicons name="call" size={36} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  startWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  avatarEmoji: { fontSize: 72, marginBottom: 12 },
  startTitle: { fontSize: 30, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  desc: { color: "#94A3B8", fontSize: 16, lineHeight: 24, textAlign: "center", marginBottom: 36 },
  startBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#22C55E", paddingVertical: 18, paddingHorizontal: 36, borderRadius: 36, gap: 12 },
  startBtnText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  tip: { color: "#64748B", fontSize: 14, textAlign: "center", marginTop: 28 },
  callWrap: { flex: 1, width: "100%", alignItems: "center", justifyContent: "space-between", paddingVertical: 20 },
  callHeader: { alignItems: "center", marginTop: 24, paddingHorizontal: 24 },
  contactName: { fontSize: 30, fontWeight: "300", color: "#fff", marginBottom: 4 },
  timer: { color: "#CBD5E1", fontSize: 16, marginBottom: 6 },
  statusText: { color: "#94A3B8", fontSize: 18, fontWeight: "400" },
  notice: { color: "#FBBF24", fontSize: 14, marginTop: 8, textAlign: "center" },
  avatarSection: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  avatarRing: { width: 190, height: 190, borderRadius: 95, borderWidth: 4, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  avatar: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#E6F4EF", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 84 },
  captions: { marginTop: 28, minHeight: 90, alignItems: "center", gap: 8 },
  tutorCaption: { color: "#fff", fontSize: 18, lineHeight: 26, textAlign: "center" },
  userCaption: { color: "#93C5FD", fontSize: 15, textAlign: "center" },
  bottomControls: { width: "100%", paddingHorizontal: 24, paddingBottom: 24, alignItems: "center", gap: 36 },
  rowControls: { flexDirection: "row", width: "100%", justifyContent: "space-around" },
  circleBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  circleBtnActive: { backgroundColor: "#fff" },
  circleBtnActiveBlue: { backgroundColor: "#3B82F6" },
  circleBtnDisabled: { opacity: 0.4 },
  btnLabel: { position: "absolute", bottom: -22, color: "#cbd5e1", fontSize: 12, width: 80, textAlign: "center" },
  endBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", marginTop: 12 },
});
