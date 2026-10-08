import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
  TALK_LANGUAGES,
  TalkHistoryItem,
  TalkTurn,
} from "../../lib/gemini";

interface Entry {
  userText: string;
  turn: TalkTurn;
}

export default function TalkScreen() {
  const [language, setLanguage] = useState(TALK_LANGUAGES[0]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [entries, loading]);

  const history = (): TalkHistoryItem[] =>
    entries.flatMap((e) => [
      { role: "user" as const, text: e.turn.transcript || e.userText },
      { role: "tutor" as const, text: e.turn.reply },
    ]);

  const speak = (text: string, lang?: string) => {
    Speech.stop();
    Speech.speak(text, { language: lang || language.speech, rate: 0.9 });
  };

  const submit = async (input: { text?: string; audioBase64?: string; audioMimeType?: string }) => {
    setLoading(true);
    try {
      const turn = await sendTalkTurn(language.name, history(), input);
      setEntries((prev) => [...prev, { userText: input.text ?? "🎤", turn }]);
      speak(turn.reply, turn.languageCode);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const sendText = () => {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText("");
    submit({ text });
  };

  const startRecording = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert("Microphone permission denied");
      return;
    }
    Speech.stop();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    if (!uri) return;
    try {
      const base64 = await new File(uri).base64();
      const mime = Platform.OS === "web" ? "audio/webm" : "audio/mp4";
      submit({ audioBase64: base64, audioMimeType: mime });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Couldn't read recording");
    }
  };

  const changeLanguage = (l: (typeof TALK_LANGUAGES)[number]) => {
    setLanguage(l);
    setEntries([]);
    Speech.stop();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bolu Talk 🌍</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langBar} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {TALK_LANGUAGES.map((l) => (
          <TouchableOpacity
            key={l.name}
            style={[styles.chip, l.name === language.name && styles.chipActive]}
            onPress={() => changeLanguage(l)}
          >
            <Text style={[styles.chipText, l.name === language.name && styles.chipTextActive]}>{l.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.chat} showsVerticalScrollIndicator={false}>
          {entries.length === 0 && !loading && (
            <View style={styles.introBox}>
              <Ionicons name="mic-outline" size={24} color="#D97706" />
              <Text style={styles.introText}>
                {language.name === "Auto" ? "कोणत्याही भाषेत" : `${language.name} मध्ये`} बोला (🎤 दाबून ठेवा) किंवा लिहा. Bolu त्याच भाषेत उत्तर देईल आणि चूक झाली तर मराठीत समजावून सांगेल.
              </Text>
            </View>
          )}

          {entries.map((e, i) => (
            <View key={i}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{e.turn.transcript || e.userText}</Text>
              </View>

              {e.turn.hasMistake && (
                <View style={styles.mistakeBox}>
                  <Text style={styles.mistakeTitle}>✏️ Correction</Text>
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
                <Text style={styles.translationText}>{e.turn.replyTranslation}</Text>
              </View>
            </View>
          ))}

          {loading && <ActivityIndicator style={{ marginTop: 12 }} color="#145E4C" />}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={language.name === "Auto" ? "Write in any language..." : `Write in ${language.name}...`}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendText}
            editable={!recState.isRecording}
          />
          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={sendText} disabled={loading}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, recState.isRecording && styles.recording]}
              onPressIn={startRecording}
              onPressOut={() => recState.isRecording && stopRecording()}
              disabled={loading}
            >
              <Ionicons name="mic" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        {recState.isRecording && <Text style={styles.recHint}>Recording... सोडल्यावर पाठवला जाईल</Text>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#145E4C" },
  langBar: { flexGrow: 0, paddingVertical: 10, backgroundColor: "#fff" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F3F4F6", marginRight: 8 },
  chipActive: { backgroundColor: "#145E4C" },
  chipText: { color: "#4B5563", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  chat: { padding: 16, paddingBottom: 24 },
  introBox: { flexDirection: "row", gap: 10, backgroundColor: "#FEF3C7", padding: 14, borderRadius: 12 },
  introText: { flex: 1, color: "#92400E", lineHeight: 20 },
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
  input: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#145E4C", alignItems: "center", justifyContent: "center" },
  recording: { backgroundColor: "#EF4444" },
  recHint: { textAlign: "center", color: "#EF4444", paddingBottom: 6, backgroundColor: "#fff" },
});
