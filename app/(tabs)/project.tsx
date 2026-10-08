import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateProjectScript, synthesizeSpeech, checkSentence, ProjectScript, SentenceFeedback, TUTORS } from "../../lib/gemini";
import { playWavBase64, stopPlayback } from "../../lib/audio";
import { useVoiceRecorder } from "../../lib/useVoiceRecorder";
import { bump } from "../../lib/usage";

const SCRIPT_KEY = "bolu_project_script_v1";
const DESC_KEY = "bolu_project_desc_v1";

type Tab = "script" | "memory" | "qa";

const voiceCache = new Map<string, string>();

// Natural Gemini voice (cached), falls back to the device voice
async function speakNatural(text: string) {
  stopPlayback();
  Speech.stop();
  try {
    let wav = voiceCache.get(text);
    if (!wav) {
      wav = await synthesizeSpeech(text, TUTORS[0].voice);
      voiceCache.set(text, wav);
    }
    await playWavBase64(wav);
  } catch {
    await new Promise<void>((resolve) =>
      Speech.speak(text, { language: "en-US", rate: 0.85, volume: 1, onDone: () => resolve(), onStopped: () => resolve(), onError: () => resolve() })
    );
  }
}

function SpeakButton({ text, size = 22 }: { text: string; size?: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <TouchableOpacity
      onPress={async () => {
        setBusy(true);
        await speakNatural(text);
        setBusy(false);
      }}
      hitSlop={8}
    >
      {busy ? <ActivityIndicator size="small" color="#145E4C" /> : <Ionicons name="volume-high" size={size} color="#145E4C" />}
    </TouchableOpacity>
  );
}

function MemoryPractice({ script }: { script: ProjectScript }) {
  const all = script.sections.flatMap((s) => s.sentences.map((x) => ({ ...x, section: s.title })));
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [fb, setFb] = useState<SentenceFeedback | null>(null);
  const [peek, setPeek] = useState(false);
  const voice = useVoiceRecorder();

  if (all.length === 0) return <Text style={styles.rule}>आधी स्क्रिप्ट बनवा.</Text>;
  const item = all[i % all.length];

  const run = async (input: Parameters<typeof checkSentence>[1]) => {
    setLoading(true);
    setFb(null);
    try {
      setFb(await checkSentence(item.mr, input));
      bump("sentences");
    } catch (e: any) {
      Alert.alert("चेक करता आलं नाही", e.message || "Try again");
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = async () => {
    try {
      if (voice.isRecording) {
        const clip = await voice.stop();
        await run({ audioBase64: clip.base64, audioMimeType: clip.mime });
      } else {
        await voice.start();
      }
    } catch (e: any) {
      Alert.alert("माइकची अडचण", e.message || "Recording failed");
    }
  };

  const next = () => {
    setI(i + 1);
    setAnswer("");
    setFb(null);
    setPeek(false);
  };

  return (
    <View>
      <Text style={styles.hintSmall}>{item.section} · वाक्य {(i % all.length) + 1}/{all.length}</Text>
      <Text style={styles.quizPrompt}>{item.mr}</Text>
      <Text style={styles.rule}>हे इंग्रजीत पाठ म्हणा (बघून नाही). अडलं तर उत्तर पहा.</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type or speak in English..."
          placeholderTextColor="#9CA3AF"
          value={answer}
          onChangeText={setAnswer}
          editable={!voice.isRecording}
        />
        <TouchableOpacity style={[styles.roundBtn, voice.isRecording && { backgroundColor: "#EF4444" }]} onPress={toggleMic} disabled={loading}>
          <Ionicons name={voice.isRecording ? "stop" : "mic"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {voice.isRecording && <Text style={styles.recHint}>ऐकत आहे... बोलून झालं की ⏹ दाबा</Text>}

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.primaryBtn, { flex: 1 }, answer.trim().length < 2 && { opacity: 0.5 }]}
          onPress={() => run({ text: answer.trim() })}
          disabled={loading || answer.trim().length < 2}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>तपासा</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ghostBtn, { flex: 1 }]} onPress={() => setPeek(!peek)}>
          <Text style={styles.ghostText}>{peek ? "उत्तर लपवा" : "उत्तर पहा"}</Text>
        </TouchableOpacity>
      </View>

      {peek && (
        <View style={styles.peekBox}>
          <Text style={styles.sentence}>{item.en}</Text>
          <SpeakButton text={item.en} />
        </View>
      )}

      {fb && (
        <View style={[styles.feedback, !fb.isCorrect && { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
          <Text style={styles.score}>{fb.isCorrect ? "✓ बरोबर!" : "✗ थोडी चूक"}  {fb.score}/10</Text>
          {!!fb.transcript && <Text style={styles.meaning}>तुम्ही म्हणालात: {fb.transcript}</Text>}
          <Text style={styles.fbLabel}>स्क्रिप्ट मधलं वाक्य:</Text>
          <Text style={styles.sentence}>{item.en}</Text>
          <Text style={styles.meaning}>{fb.explanation}</Text>
          {!!fb.pronunciation && <Text style={styles.tipText}>🗣️ उच्चार: {fb.pronunciation}</Text>}
        </View>
      )}

      <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={next}>
        <Text style={styles.primaryText}>पुढचं वाक्य</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProjectScreen() {
  const [desc, setDesc] = useState("");
  const [script, setScript] = useState<ProjectScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("script");
  const [playing, setPlaying] = useState(false);
  const stopFlag = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(SCRIPT_KEY)
      .then((v) => v && setScript(JSON.parse(v)))
      .catch(() => {});
    AsyncStorage.getItem(DESC_KEY)
      .then((v) => v && setDesc(v))
      .catch(() => {});
    return () => {
      stopFlag.current = true;
      stopPlayback();
      Speech.stop();
    };
  }, []);

  const generate = async () => {
    if (desc.trim().length < 20) {
      Alert.alert("थोडं जास्त लिहा", "प्रोजेक्टबद्दल किमान ३-४ वाक्यं लिहा (मराठीत लिहिलं तरी चालेल).");
      return;
    }
    setLoading(true);
    try {
      const s = await generateProjectScript(desc.trim());
      setScript(s);
      setTab("script");
      AsyncStorage.setItem(SCRIPT_KEY, JSON.stringify(s)).catch(() => {});
      AsyncStorage.setItem(DESC_KEY, desc).catch(() => {});
    } catch (e: any) {
      Alert.alert("स्क्रिप्ट बनली नाही", e.message || "Try again");
    } finally {
      setLoading(false);
    }
  };

  const playAll = async () => {
    if (!script) return;
    if (playing) {
      stopFlag.current = true;
      stopPlayback();
      Speech.stop();
      setPlaying(false);
      return;
    }
    stopFlag.current = false;
    setPlaying(true);
    for (const s of script.sections) {
      if (stopFlag.current) break;
      await speakNatural(s.sentences.map((x) => x.en).join(" "));
    }
    setPlaying(false);
  };

  const reset = () => {
    setScript(null);
    AsyncStorage.removeItem(SCRIPT_KEY).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate("/(tabs)/home")}>
          <Ionicons name="arrow-back" size={24} color="#145E4C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>माझा प्रोजेक्ट इंग्रजीत 🎓</Text>
        {script ? (
          <TouchableOpacity onPress={reset}>
            <Text style={styles.resetText}>नवीन</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!script ? (
            <View>
              <View style={styles.planBox}>
                <Text style={styles.planTitle}>२-३ दिवसांचा मार्ग</Text>
                <Text style={styles.planLine}>दिवस १: स्क्रिप्ट बनवा, रोज ऐका आणि वाचा 📄</Text>
                <Text style={styles.planLine}>दिवस २: पाठांतर सराव, न बघता बोला 🧠</Text>
                <Text style={styles.planLine}>दिवस ३: प्रश्न-उत्तर आणि पूर्ण ४-५ मिनिटं सादरीकरण ❓</Text>
              </View>
              <Text style={styles.stepTitle}>तुमच्या प्रोजेक्टबद्दल लिहा (मराठीत चालेल)</Text>
              <Text style={styles.rule}>
                नाव, काय करतो, कोणती समस्या सोडवतो, मुख्य features, कोणतं तंत्रज्ञान वापरलं, आणि तुमचं काम काय. जितकं जास्त लिहाल तितकी स्क्रिप्ट चांगली.
              </Text>
              <TextInput
                style={styles.descInput}
                multiline
                placeholder={"उदा. माझ्या प्रोजेक्टचं नाव Bolu English आहे. हे मराठी लोकांना इंग्रजी बोलायला शिकवणारं मोबाइल अॅप आहे. यात AI शी बोलता येतं आणि चुका मराठीत सांगितल्या जातात. मी React Native आणि Firebase वापरलं."}
                placeholderTextColor="#9CA3AF"
                value={desc}
                onChangeText={setDesc}
              />
              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={generate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>इंग्रजी स्क्रिप्ट बनवा ✨</Text>}
              </TouchableOpacity>
              {loading && <Text style={styles.rule}>स्क्रिप्ट बनत आहे... ३०-४० सेकंद लागू शकतात.</Text>}
            </View>
          ) : (
            <View>
              <Text style={styles.scriptTitle}>{script.title}</Text>
              <View style={styles.tabs}>
                {(["script", "memory", "qa"] as const).map((t) => (
                  <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
                    <Text style={[styles.tabText, tab === t && { color: "#fff" }]}>
                      {t === "script" ? "📄 स्क्रिप्ट" : t === "memory" ? "🧠 पाठांतर" : "❓ प्रश्न"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {tab === "script" && (
                <View>
                  <TouchableOpacity style={[styles.primaryBtn, playing && { backgroundColor: "#EF4444" }]} onPress={playAll}>
                    <Text style={styles.primaryText}>{playing ? "⏹ थांबवा" : "▶ पूर्ण स्क्रिप्ट ऐका"}</Text>
                  </TouchableOpacity>
                  {script.sections.map((s) => (
                    <View key={s.title} style={styles.card}>
                      <Text style={styles.sectionTitle}>{s.title} <Text style={styles.meaning}>({s.titleMr})</Text></Text>
                      {s.sentences.map((x) => (
                        <View key={x.en} style={styles.sentRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.sentence}>{x.en}</Text>
                            <Text style={styles.meaning}>{x.mr}</Text>
                          </View>
                          <SpeakButton text={x.en} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {tab === "memory" && <MemoryPractice script={script} />}

              {tab === "qa" && (
                <View>
                  <Text style={styles.rule}>परीक्षक/सर हे प्रश्न विचारू शकतात. उत्तरं पाठ करा.</Text>
                  {script.questions.map((q) => (
                    <View key={q.q} style={styles.card}>
                      <View style={styles.sentRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.question}>Q: {q.q}</Text>
                          <Text style={styles.meaning}>{q.qMr}</Text>
                        </View>
                        <SpeakButton text={q.q} />
                      </View>
                      <View style={[styles.sentRow, { marginTop: 8 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sentence}>A: {q.a}</Text>
                          <Text style={styles.meaning}>{q.aMr}</Text>
                        </View>
                        <SpeakButton text={q.a} />
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={() => router.navigate({ pathname: "/talk", params: { topic: "free" } })}>
                    <Text style={styles.primaryText}>🎤 AI शी प्रश्न-उत्तर सराव करा</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#145E4C" },
  resetText: { color: "#145E4C", fontWeight: "700" },
  body: { padding: 16, paddingBottom: 40 },
  planBox: { backgroundColor: "#E6F4EF", borderRadius: 14, padding: 14, marginBottom: 8 },
  planTitle: { fontSize: 16, fontWeight: "800", color: "#145E4C", marginBottom: 6 },
  planLine: { color: "#374151", lineHeight: 22 },
  stepTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 12, marginBottom: 4 },
  rule: { color: "#374151", lineHeight: 21, marginBottom: 8 },
  descInput: { minHeight: 170, textAlignVertical: "top", backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, fontSize: 16 },
  primaryBtn: { backgroundColor: "#145E4C", borderRadius: 12, paddingVertical: 14, alignItems: "center", paddingHorizontal: 16 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  ghostBtn: { borderWidth: 2, borderColor: "#145E4C", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  ghostText: { color: "#145E4C", fontWeight: "700" },
  scriptTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 10 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 10, backgroundColor: "#F3F4F6" },
  tabBtnActive: { backgroundColor: "#145E4C" },
  tabText: { fontWeight: "700", color: "#374151" },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", padding: 14, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#145E4C", marginBottom: 6 },
  sentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  sentence: { fontSize: 16, color: "#111827", lineHeight: 23, fontWeight: "600" },
  question: { fontSize: 16, color: "#B45309", fontWeight: "700" },
  meaning: { color: "#6B7280", lineHeight: 20, marginTop: 2 },
  hintSmall: { color: "#6B7280", marginBottom: 4 },
  quizPrompt: { fontSize: 22, fontWeight: "800", color: "#111827", marginVertical: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  input: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, fontSize: 16 },
  roundBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#145E4C", alignItems: "center", justifyContent: "center" },
  recHint: { color: "#EF4444", marginTop: 6 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  peekBox: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, backgroundColor: "#FEF3C7", padding: 12, borderRadius: 12 },
  feedback: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" },
  score: { fontSize: 18, fontWeight: "800", color: "#166534" },
  fbLabel: { marginTop: 10, fontWeight: "700", color: "#374151" },
  tipText: { marginTop: 10, color: "#92400E", backgroundColor: "#FEF3C7", padding: 10, borderRadius: 10, lineHeight: 19 },
});
