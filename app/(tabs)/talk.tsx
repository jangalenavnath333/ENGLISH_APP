import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  sendTalkTurn,
  synthesizeSpeech,
  TALK_LANGUAGES,
  TUTORS,
  TOPICS,
  AUTO_LANGUAGE,
  Tutor,
  Topic,
  TalkHistoryItem,
  TalkInput,
  TalkTurn,
} from "../../lib/gemini";
import { playWavBase64, stopPlayback, blobUriToWavBase64 } from "../../lib/audio";

type Status = "idle" | "listening" | "thinking" | "speaking";

interface Entry {
  userText: string; // "" when the tutor opened the conversation
  turn: TalkTurn;
}

const STATUS_TEXT: Record<Status, string> = {
  idle: "बोलायला खालचं 🎤 दाबा",
  listening: "ऐकत आहे... बोलून झाल्यावर 🎤 पुन्हा दाबा",
  thinking: "विचार करत आहे...",
  speaking: "बोलत आहे... (थांबवायला अवतार दाबा)",
};

function TutorAvatar({ tutor, status, onPress }: { tutor: Tutor; status: Status; onPress: () => void }) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [bars] = useState(() => [0, 1, 2, 3, 4].map(() => new Animated.Value(0.3)));

  useEffect(() => {
    pulse.stopAnimation();
    pulse.setValue(0);
    bars.forEach((b) => b.stopAnimation());

    if (status === "speaking" || status === "listening") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    }
    if (status === "speaking") {
      bars.forEach((b, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(b, { toValue: 1, duration: 220 + i * 70, useNativeDriver: false }),
            Animated.timing(b, { toValue: 0.25, duration: 220 + i * 70, useNativeDriver: false }),
          ])
        ).start()
      );
    }
  }, [status, pulse, bars]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, status === "speaking" ? 1.08 : 1.04] });
  const ringColor = status === "listening" ? "#EF4444" : "#145E4C";

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.avatarWrap}>
      <Animated.View
        style={[
          styles.avatarRing,
          { borderColor: status === "idle" || status === "thinking" ? "#E5E7EB" : ringColor, transform: [{ scale }] },
        ]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{tutor.emoji}</Text>
        </View>
      </Animated.View>
      <View style={styles.barsRow}>
        {bars.map((b, i) => (
          <Animated.View
            key={i}
            style={[styles.bar, { height: status === "speaking" ? b.interpolate({ inputRange: [0, 1], outputRange: [4, 26] }) : 4 }]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function TalkScreen() {
  const [language, setLanguage] = useState(TALK_LANGUAGES[0]);
  const [tutor, setTutor] = useState<Tutor>(TUTORS[0]);
  const [topic, setTopic] = useState<Topic | undefined>(undefined);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const scrollRef = useRef<ScrollView>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const busy = status === "thinking";

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [entries, status]);

  useEffect(() => () => {
    stopPlayback();
    Speech.stop();
  }, []);

  const history = (): TalkHistoryItem[] =>
    entries.flatMap((e) => {
      const items: TalkHistoryItem[] = [];
      const said = e.turn.transcript || e.userText;
      if (said) items.push({ role: "user", text: said });
      items.push({ role: "tutor", text: e.turn.reply });
      return items;
    });

  const stopSpeaking = () => {
    stopPlayback();
    Speech.stop();
    setStatus((s) => (s === "speaking" ? "idle" : s));
  };

  // Natural Gemini voice; falls back to the device voice if it fails
  const speak = async (text: string, lang?: string) => {
    if (!text) return;
    stopSpeaking();
    setStatus("thinking");
    try {
      const wav = await synthesizeSpeech(text, tutor.voice);
      setStatus("speaking");
      await playWavBase64(wav);
    } catch {
      setStatus("speaking");
      await new Promise<void>((resolve) =>
        Speech.speak(text, {
          language: lang || language.speech,
          rate: 0.9,
          volume: 1,
          onDone: () => resolve(),
          onStopped: () => resolve(),
          onError: () => resolve(),
        })
      );
    }
    setStatus((s) => (s === "speaking" ? "idle" : s));
  };

  const submit = async (input: TalkInput, activeTopic = topic) => {
    setStatus("thinking");
    try {
      const turn = await sendTalkTurn(language.name, history(), input, { tutor, topic: activeTopic });
      setEntries((prev) => [...prev, { userText: input.start ? "" : input.text ?? "🎤", turn }]);
      speak(turn.reply, turn.languageCode);
    } catch (e: any) {
      setStatus("idle");
      Alert.alert("काहीतरी चुकलं", e.message || "Something went wrong");
    }
  };

  const startTopic = (t: Topic) => {
    stopSpeaking();
    setTopic(t);
    setEntries([]);
    submit({ start: true }, t);
  };

  // Opened from the Plan tab with ?topic=<id>: start that topic once
  const { topic: topicParam } = useLocalSearchParams<{ topic?: string }>();
  const startedFromParam = useRef<string | null>(null);
  useEffect(() => {
    const t = TOPICS.find((x) => x.id === topicParam);
    if (t && startedFromParam.current !== t.id) {
      startedFromParam.current = t.id;
      startTopic(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicParam]);

  const sendText = () => {
    const text = inputText.trim();
    if (!text || busy) return;
    setInputText("");
    stopSpeaking();
    submit({ text });
  };

  const toggleMic = async () => {
    if (busy) return;
    if (recState.isRecording) {
      await finishRecording();
      return;
    }
    stopSpeaking();
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert("Microphone परवानगी द्या", "बोलण्यासाठी माइक चालू करा.");
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus("listening");
    } catch (e: any) {
      Alert.alert("माइक सुरू होत नाही", e.message || "Recording failed");
    }
  };

  const finishRecording = async () => {
    setStatus("thinking");
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!uri) throw new Error("रेकॉर्डिंग मिळालं नाही");
      if (Platform.OS === "web") {
        await submit({ audioBase64: await blobUriToWavBase64(uri), audioMimeType: "audio/wav" });
      } else {
        await submit({ audioBase64: await new File(uri).base64(), audioMimeType: "audio/mp4" });
      }
    } catch (e: any) {
      setStatus("idle");
      Alert.alert("आवाज समजला नाही", e.message || "Couldn't read recording");
    }
  };

  const reset = () => {
    stopSpeaking();
    setEntries([]);
    setTopic(undefined);
  };

  const pickLanguage = (l: (typeof TALK_LANGUAGES)[number]) => {
    setLanguage(l);
    reset();
  };

  const pickTutor = (t: Tutor) => {
    setTutor(t);
    reset();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bolu Talk 🌍</Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={reset}>
            <Text style={styles.resetText}>नवीन सुरुवात</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <TutorAvatar tutor={tutor} status={status} onPress={stopSpeaking} />
          <Text style={styles.statusText}>{STATUS_TEXT[status]}</Text>

          {entries.length === 0 && (
            <View>
              <Text style={styles.stepTitle}>१. कोणाशी बोलायचं?</Text>
              <View style={styles.row}>
                {TUTORS.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tutorCard, t.id === tutor.id && styles.cardActive]}
                    onPress={() => pickTutor(t)}
                  >
                    <Text style={styles.tutorEmoji}>{t.emoji}</Text>
                    <Text style={[styles.tutorLabel, t.id === tutor.id && { color: "#145E4C" }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.stepTitle}>२. कोणत्या भाषेत?</Text>
              <View style={styles.chipWrap}>
                {TALK_LANGUAGES.map((l) => (
                  <TouchableOpacity
                    key={l.name}
                    style={[styles.chip, l.name === language.name && styles.chipActive]}
                    onPress={() => pickLanguage(l)}
                  >
                    <Text style={[styles.chipText, l.name === language.name && styles.chipTextActive]}>
                      {l.name === AUTO_LANGUAGE ? "🌐 Auto (कोणतीही)" : l.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.stepTitle}>३. विषय निवडा आणि सुरू करा</Text>
              <View style={styles.chipWrap}>
                {TOPICS.map((t) => (
                  <TouchableOpacity key={t.id} style={styles.topicCard} onPress={() => startTopic(t)} disabled={busy}>
                    <Text style={styles.topicEmoji}>{t.emoji}</Text>
                    <Text style={styles.topicLabel}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.hint}>
                किंवा थेट खालचं 🎤 दाबून बोला / लिहा. चूक झाली तर {tutor.label} मराठीत समजावून सांगतील.
              </Text>
            </View>
          )}

          {entries.map((e, i) => (
            <View key={i}>
              {!!(e.turn.transcript || e.userText) && (
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{e.turn.transcript || e.userText}</Text>
                </View>
              )}

              {e.turn.hasMistake && (
                <View style={styles.mistakeBox}>
                  <Text style={styles.mistakeTitle}>✏️ बरोबर असं म्हणा</Text>
                  <TouchableOpacity onPress={() => speak(e.turn.corrected, e.turn.languageCode)}>
                    <Text style={styles.correctedText}>{e.turn.corrected} 🔊</Text>
                  </TouchableOpacity>
                  <Text style={styles.explanationText}>{e.turn.explanation}</Text>
                </View>
              )}

              <View style={styles.botBubble}>
                <TouchableOpacity onPress={() => speak(e.turn.reply, e.turn.languageCode)}>
                  <Text style={styles.botText}>{e.turn.reply} 🔊</Text>
                </TouchableOpacity>
                {!!e.turn.replyTranslation && <Text style={styles.translationText}>{e.turn.replyTranslation}</Text>}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={language.name === AUTO_LANGUAGE ? "इथे कोणत्याही भाषेत लिहा..." : `${language.name} मध्ये लिहा...`}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendText}
            editable={!recState.isRecording}
          />
          {inputText.trim() ? (
            <TouchableOpacity style={styles.roundBtn} onPress={sendText} disabled={busy}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.roundBtn, styles.micBtn, recState.isRecording && styles.recording]}
              onPress={toggleMic}
              disabled={busy}
            >
              <Ionicons name={recState.isRecording ? "stop" : "mic"} size={26} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#145E4C" },
  resetText: { color: "#145E4C", fontWeight: "600" },
  body: { padding: 16, paddingBottom: 24 },
  avatarWrap: { alignItems: "center", marginTop: 4 },
  avatarRing: { width: 132, height: 132, borderRadius: 66, borderWidth: 5, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: "#E6F4EF", alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 64 },
  barsRow: { flexDirection: "row", alignItems: "center", gap: 5, height: 30, marginTop: 8 },
  bar: { width: 5, borderRadius: 3, backgroundColor: "#145E4C" },
  statusText: { textAlign: "center", color: "#4B5563", fontSize: 15, marginBottom: 8 },
  stepTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 16, marginBottom: 8 },
  row: { flexDirection: "row", gap: 12 },
  tutorCard: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 16, backgroundColor: "#fff", borderWidth: 2, borderColor: "#E5E7EB" },
  cardActive: { borderColor: "#145E4C", backgroundColor: "#E6F4EF" },
  tutorEmoji: { fontSize: 38 },
  tutorLabel: { marginTop: 4, fontSize: 16, fontWeight: "700", color: "#4B5563" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: "#145E4C", borderColor: "#145E4C" },
  chipText: { color: "#4B5563", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  topicCard: { width: "48%", flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  topicEmoji: { fontSize: 24 },
  topicLabel: { flex: 1, fontWeight: "600", color: "#111827" },
  hint: { marginTop: 16, color: "#6B7280", lineHeight: 20, textAlign: "center" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#145E4C", padding: 12, borderRadius: 16, borderBottomRightRadius: 4, maxWidth: "80%", marginTop: 12 },
  userText: { color: "#fff", fontSize: 16 },
  mistakeBox: { backgroundColor: "#FEF2F2", borderLeftWidth: 4, borderLeftColor: "#EF4444", padding: 12, borderRadius: 10, marginTop: 8, maxWidth: "90%" },
  mistakeTitle: { fontWeight: "700", color: "#B91C1C", marginBottom: 4 },
  correctedText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  explanationText: { marginTop: 6, color: "#4B5563", lineHeight: 20 },
  botBubble: { alignSelf: "flex-start", backgroundColor: "#fff", padding: 12, borderRadius: 16, borderBottomLeftRadius: 4, maxWidth: "85%", marginTop: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  botText: { fontSize: 16, color: "#111827" },
  translationText: { marginTop: 6, color: "#6B7280", fontSize: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  input: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  roundBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#145E4C", alignItems: "center", justifyContent: "center" },
  micBtn: { width: 60, height: 60, borderRadius: 30 },
  recording: { backgroundColor: "#EF4444" },
});
