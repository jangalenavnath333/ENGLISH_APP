import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PLAN, PlanDay } from "../../lib/plan";
import { TOPICS, checkWriting, WritingFeedback } from "../../lib/gemini";

const STORAGE_KEY = "bolu_plan_done_v1";

type TaskKey = "vocab" | "grammar" | "verbs" | "speaking" | "writing";

const TASKS: { key: TaskKey; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { key: "vocab", icon: "book-outline", title: "शब्द शिका", sub: "१५ शब्द ऐका आणि म्हणा" },
  { key: "grammar", icon: "construct-outline", title: "व्याकरण", sub: "२ सोपे नियम + उदाहरणं" },
  { key: "verbs", icon: "swap-horizontal-outline", title: "Verbs (V1 V2 V3)", sub: "८ महत्त्वाचे verbs" },
  { key: "speaking", icon: "mic-outline", title: "AI शी बोला", sub: "Madam / Sir शी गप्पा" },
  { key: "writing", icon: "create-outline", title: "लिहा", sub: "AI तुमच्या चुका सांगेल" },
];

const say = (text: string) => {
  Speech.stop();
  Speech.speak(text, { language: "en-US", rate: 0.8, volume: 1 });
};

function VocabTask({ day }: { day: PlanDay }) {
  return (
    <View>
      {day.vocab.map((v) => (
        <TouchableOpacity key={v.word} style={styles.row} onPress={() => say(`${v.word}. ${v.example}`)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.word}>{v.word}  <Text style={styles.meaning}>{v.meaning}</Text></Text>
            <Text style={styles.example}>{v.example}</Text>
          </View>
          <Ionicons name="volume-high" size={22} color="#145E4C" />
        </TouchableOpacity>
      ))}
      <Text style={styles.tipText}>💡 प्रत्येक शब्द ऐका, मग मोठ्याने ३ वेळा म्हणा.</Text>
    </View>
  );
}

function GrammarTask({ day }: { day: PlanDay }) {
  return (
    <View>
      {day.grammar.map((g) => (
        <View key={g.title} style={styles.grammarBox}>
          <Text style={styles.grammarTitle}>{g.title}</Text>
          <Text style={styles.rule}>{g.rule}</Text>
          {g.examples.map((e) => (
            <TouchableOpacity key={e.en} style={styles.exampleRow} onPress={() => say(e.en)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.word}>{e.en}</Text>
                <Text style={styles.example}>{e.mr}</Text>
              </View>
              <Ionicons name="volume-high" size={20} color="#145E4C" />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

function VerbsTask({ day }: { day: PlanDay }) {
  return (
    <View>
      <View style={[styles.verbRow, styles.verbHead]}>
        <Text style={[styles.verbCell, styles.verbHeadText]}>V1</Text>
        <Text style={[styles.verbCell, styles.verbHeadText]}>V2 (past)</Text>
        <Text style={[styles.verbCell, styles.verbHeadText]}>V3</Text>
        <Text style={[styles.verbCell, styles.verbHeadText, { flex: 1.3 }]}>अर्थ</Text>
      </View>
      {day.verbs.map((v) => (
        <TouchableOpacity key={v.v1} style={styles.verbRow} onPress={() => say(`${v.v1}. ${v.v2}. ${v.v3}.`)}>
          <Text style={styles.verbCell}>{v.v1}</Text>
          <Text style={styles.verbCell}>{v.v2}</Text>
          <Text style={styles.verbCell}>{v.v3}</Text>
          <Text style={[styles.verbCell, { flex: 1.3, color: "#6B7280" }]}>{v.meaning}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.tipText}>💡 रांगेवर दाबा आणि तीन रूपं ऐका.</Text>
    </View>
  );
}

function SpeakingTask({ day }: { day: PlanDay }) {
  return (
    <View>
      <Text style={styles.rule}>खालच्या विषयावर किमान ५ मिनिटं AI शी बोला. चूक झाली तर AI मराठीत समजावेल.</Text>
      {day.speakingTopics.map((id) => {
        const t = TOPICS.find((x) => x.id === id);
        if (!t) return null;
        return (
          <TouchableOpacity key={id} style={styles.speakBtn} onPress={() => router.push({ pathname: "/talk", params: { topic: id } })}>
            <Text style={styles.speakEmoji}>{t.emoji}</Text>
            <Text style={styles.speakLabel}>{t.label}</Text>
            <Ionicons name="arrow-forward" size={20} color="#145E4C" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function WritingTask({ day }: { day: PlanDay }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fb, setFb] = useState<WritingFeedback | null>(null);

  const check = async () => {
    if (text.trim().length < 5) return;
    setLoading(true);
    setFb(null);
    try {
      setFb(await checkWriting(day.writingPrompt, text.trim()));
    } catch (e: any) {
      Alert.alert("चेक करता आलं नाही", e.message || "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text style={styles.grammarTitle}>{day.writingPrompt}</Text>
      <Text style={styles.rule}>{day.writingPromptMr}</Text>
      <TextInput
        style={styles.writeInput}
        multiline
        placeholder="Write in English here..."
        placeholderTextColor="#9CA3AF"
        value={text}
        onChangeText={setText}
      />
      <TouchableOpacity style={[styles.checkBtn, text.trim().length < 5 && { opacity: 0.5 }]} onPress={check} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkBtnText}>AI कडून तपासा</Text>}
      </TouchableOpacity>

      {fb && (
        <View style={styles.feedback}>
          <Text style={styles.score}>गुण: {fb.score}/10</Text>
          <Text style={styles.fbLabel}>बरोबर लिहिलेलं:</Text>
          <TouchableOpacity onPress={() => say(fb.corrected)}>
            <Text style={styles.corrected}>{fb.corrected} 🔊</Text>
          </TouchableOpacity>
          {fb.mistakes.length > 0 && <Text style={styles.fbLabel}>तुमच्या चुका:</Text>}
          {fb.mistakes.map((m, i) => (
            <View key={i} style={styles.mistakeRow}>
              <Text style={styles.wrong}>✗ {m.wrong}</Text>
              <Text style={styles.right}>✓ {m.right}</Text>
              <Text style={styles.example}>{m.why}</Text>
            </View>
          ))}
          {!!fb.tip && <Text style={styles.tipText}>💡 {fb.tip}</Text>}
        </View>
      )}
    </View>
  );
}

export default function PlanScreen() {
  const [dayIdx, setDayIdx] = useState(0);
  const [open, setOpen] = useState<TaskKey | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => v && setDone(JSON.parse(v)))
      .catch(() => {});
  }, []);

  const day = PLAN[dayIdx];
  const isDone = (d: number, k: TaskKey) => !!done[`${d}-${k}`];
  const dayCount = (d: number) => TASKS.filter((t) => isDone(d, t.key)).length;
  const totalDone = PLAN.reduce((n, p) => n + dayCount(p.day), 0);
  const total = PLAN.length * TASKS.length;

  const toggleDone = (k: TaskKey) => {
    const next = { ...done, [`${day.day}-${k}`]: !isDone(day.day, k) };
    setDone(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const renderTask = (k: TaskKey) => {
    switch (k) {
      case "vocab": return <VocabTask day={day} />;
      case "grammar": return <GrammarTask day={day} />;
      case "verbs": return <VerbsTask day={day} />;
      case "speaking": return <SpeakingTask day={day} />;
      case "writing": return <WritingTask key={day.day} day={day} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>४ दिवसांचा इंग्रजी प्लॅन 🚀</Text>
        <Text style={styles.headerSub}>{totalDone}/{total} टास्क पूर्ण</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(totalDone / total) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.dayBar}>
        {PLAN.map((p, i) => (
          <TouchableOpacity
            key={p.day}
            style={[styles.dayChip, i === dayIdx && styles.dayChipActive]}
            onPress={() => {
              setDayIdx(i);
              setOpen(null);
            }}
          >
            <Text style={[styles.dayChipTop, i === dayIdx && { color: "#fff" }]}>Day {p.day}</Text>
            <Text style={[styles.dayChipSub, i === dayIdx && { color: "#D1FAE5" }]}>
              {p.label} · {dayCount(p.day)}/{TASKS.length}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.themeBox}>
          <Text style={styles.themeTitle}>{day.theme}</Text>
          <Text style={styles.themeGoal}>{day.goal}</Text>
        </View>

        {TASKS.map((t) => (
          <View key={t.key} style={styles.taskCard}>
            <TouchableOpacity style={styles.taskHead} onPress={() => setOpen(open === t.key ? null : t.key)}>
              <View style={[styles.taskIcon, isDone(day.day, t.key) && { backgroundColor: "#145E4C" }]}>
                <Ionicons name={isDone(day.day, t.key) ? "checkmark" : t.icon} size={22} color={isDone(day.day, t.key) ? "#fff" : "#145E4C"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={styles.taskSub}>{t.sub}</Text>
              </View>
              <Ionicons name={open === t.key ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {open === t.key && (
              <View style={styles.taskBody}>
                {renderTask(t.key)}
                <TouchableOpacity style={[styles.doneBtn, isDone(day.day, t.key) && styles.doneBtnOn]} onPress={() => toggleDone(t.key)}>
                  <Text style={[styles.doneBtnText, isDone(day.day, t.key) && { color: "#fff" }]}>
                    {isDone(day.day, t.key) ? "✓ पूर्ण झालं" : "पूर्ण झालं म्हणून चिन्हांकित करा"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, backgroundColor: "#fff" },
  headerTitle: { fontSize: 19, fontWeight: "700", color: "#145E4C" },
  headerSub: { color: "#6B7280", marginTop: 2 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#E5E7EB", marginTop: 8, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  dayBar: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  dayChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12, backgroundColor: "#F3F4F6" },
  dayChipActive: { backgroundColor: "#145E4C" },
  dayChipTop: { fontWeight: "700", color: "#111827" },
  dayChipSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  body: { padding: 16, paddingBottom: 32 },
  themeBox: { backgroundColor: "#E6F4EF", padding: 14, borderRadius: 14, marginBottom: 12 },
  themeTitle: { fontSize: 18, fontWeight: "700", color: "#145E4C" },
  themeGoal: { marginTop: 4, color: "#374151", lineHeight: 20 },
  taskCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 10, overflow: "hidden" },
  taskHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  taskIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E6F4EF", alignItems: "center", justifyContent: "center" },
  taskTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  taskSub: { color: "#6B7280", marginTop: 2 },
  taskBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  word: { fontSize: 16, fontWeight: "600", color: "#111827" },
  meaning: { fontWeight: "400", color: "#145E4C" },
  example: { color: "#6B7280", marginTop: 2, lineHeight: 19 },
  tipText: { marginTop: 10, color: "#92400E", backgroundColor: "#FEF3C7", padding: 10, borderRadius: 10, lineHeight: 19 },
  grammarBox: { marginBottom: 14 },
  grammarTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  rule: { color: "#374151", lineHeight: 21, marginBottom: 6 },
  exampleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  verbRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  verbHead: { backgroundColor: "#E6F4EF", borderRadius: 8, paddingHorizontal: 4 },
  verbHeadText: { fontWeight: "700", color: "#145E4C" },
  verbCell: { flex: 1, fontSize: 15, color: "#111827" },
  speakBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, backgroundColor: "#E6F4EF", marginTop: 8 },
  speakEmoji: { fontSize: 24 },
  speakLabel: { flex: 1, fontSize: 16, fontWeight: "600", color: "#145E4C" },
  writeInput: { minHeight: 120, textAlignVertical: "top", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 12, fontSize: 16, marginTop: 8 },
  checkBtn: { marginTop: 10, backgroundColor: "#145E4C", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  checkBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  feedback: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" },
  score: { fontSize: 18, fontWeight: "800", color: "#166534" },
  fbLabel: { marginTop: 10, fontWeight: "700", color: "#374151" },
  corrected: { marginTop: 4, fontSize: 16, color: "#111827", lineHeight: 23 },
  mistakeRow: { marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: "#fff" },
  wrong: { color: "#B91C1C", fontWeight: "600" },
  right: { color: "#166534", fontWeight: "600", marginTop: 2 },
  doneBtn: { marginTop: 14, paddingVertical: 12, alignItems: "center", borderRadius: 12, borderWidth: 2, borderColor: "#145E4C" },
  doneBtnOn: { backgroundColor: "#145E4C" },
  doneBtnText: { fontWeight: "700", color: "#145E4C" },
});
