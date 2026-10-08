import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../lib/useAuth";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PLAN } from "../../lib/plan";
import { getUsage, computeStreak, formatDuration, todayKey } from "../../lib/usage";
import { getDueWords } from "../../lib/revision";

const PLAN_KEY = "bolu_plan_done_v1";
const TASKS_PER_DAY = 7;
const TASK_KEYS = ["vocab", "quiz", "grammar", "verbs", "sentences", "speaking", "writing"];

export default function HomeScreen() {
  const { profile, logout } = useAuth();
  const name = profile?.name || "Learner";

  const [streak, setStreak] = useState(0);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [doneToday, setDoneToday] = useState(0);
  const [allDone, setAllDone] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getUsage().then((u) => {
        setStreak(computeStreak(u));
        setTodaySeconds(u.days[todayKey()] ?? 0);
      });
      getDueWords().then((w) => setDueCount(w.length));
      AsyncStorage.getItem(PLAN_KEY)
        .then((raw) => {
          const saved: Record<string, boolean> = raw ? JSON.parse(raw) : {};
          const firstOpen = PLAN.findIndex((p) => TASK_KEYS.some((k) => !saved[`${p.day}-${k}`]));
          const idx = firstOpen === -1 ? PLAN.length - 1 : firstOpen;
          setDayIdx(idx);
          setDoneToday(TASK_KEYS.filter((k) => saved[`${PLAN[idx].day}-${k}`]).length);
          setAllDone(Object.values(saved).filter(Boolean).length);
        })
        .catch(() => {});
    }, [])
  );

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      if (window.confirm("तुम्हाला नक्की Logout करायचं आहे का? (Are you sure?)")) {
        await logout();
        router.replace("/");
      }
    } else {
      Alert.alert("Logout", "तुम्हाला नक्की Logout करायचं आहे का?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]);
    }
  };

  const day = PLAN[dayIdx];
  const wordOfDay = day.vocab[new Date().getDate() % day.vocab.length];
  const totalTasks = PLAN.length * TASKS_PER_DAY;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png" }} style={styles.logoSmall} />
          <View>
            <Text style={styles.headerTitle}>Bolu</Text>
            <Text style={styles.headerSubtitle}>Home</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#D97706" />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>नमस्कार, {name.split(" ")[0]}! 👋</Text>
        <Text style={styles.subGreeting}>
          {streak > 0 ? `🔥 ${streak} दिवसांची स्ट्रीक! आज सुद्धा सुरू ठेवा.` : "आजपासून सुरुवात करूया. रोज किमान ५ मिनिटं अभ्यास करा."}
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "#FEF3C7" }]}>
            <Text style={styles.statValue}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>दिवसांची स्ट्रीक</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#E0F2FE" }]}>
            <Text style={styles.statValue}>⏱ {formatDuration(todaySeconds)}</Text>
            <Text style={styles.statLabel}>आज अभ्यास</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#E6F4EA" }]}>
            <Text style={styles.statValue}>✅ {allDone}/{totalTasks}</Text>
            <Text style={styles.statLabel}>टास्क पूर्ण</Text>
          </View>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.goalTag}>आजचा प्लॅन · Day {day.day} / {PLAN.length}</Text>
          <Text style={styles.goalTitle}>{day.theme}</Text>
          <Text style={styles.goalDesc}>{day.goal}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(doneToday / TASKS_PER_DAY) * 100}%` }]} />
          </View>
          <Text style={styles.goalProgress}>{doneToday}/{TASKS_PER_DAY} टास्क पूर्ण</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => router.navigate("/(tabs)/plan")}>
            <Text style={styles.startBtnText}>{doneToday === 0 ? "आजचा प्लॅन सुरू करा" : "पुढे चला"}</Text>
            <Ionicons name="arrow-forward" size={18} color="#145E4C" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: "#EEF2FF" }]} onPress={() => router.navigate("/(tabs)/talk")}>
            <Text style={styles.actionEmoji}>🎤</Text>
            <Text style={styles.actionTitle}>AI शी बोला</Text>
            <Text style={styles.actionSub}>Madam / Sir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: dueCount ? "#FEF2F2" : "#F0FDF4" }]} onPress={() => router.navigate("/(tabs)/plan")}>
            <Text style={styles.actionEmoji}>🔁</Text>
            <Text style={styles.actionTitle}>उजळणी</Text>
            <Text style={styles.actionSub}>{dueCount ? `${dueCount} शब्द परत करा` : "आज काही नाही"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.projectCard} onPress={() => router.navigate("/(tabs)/project")}>
          <Text style={styles.actionEmoji}>🎓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>माझा प्रोजेक्ट इंग्रजीत समजवा</Text>
            <Text style={styles.actionSub}>स्क्रिप्ट बनवा, पाठ करा आणि प्रश्न-उत्तर सराव करा</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#145E4C" />
        </TouchableOpacity>

        <View style={styles.wordCard}>
          <Text style={styles.wordTag}>आजचा शब्द</Text>
          <Text style={styles.wordText}>{wordOfDay.word}</Text>
          <Text style={styles.wordMeaning}>{wordOfDay.meaning} · उच्चार: {wordOfDay.pron}</Text>
          <TouchableOpacity
            style={styles.listenBtn}
            onPress={() => {
              Speech.stop();
              Speech.speak(`${wordOfDay.word}. ${wordOfDay.example}`, { language: "en-US", rate: 0.8, volume: 1 });
            }}
          >
            <Ionicons name="volume-high" size={18} color="#145E4C" />
            <Text style={styles.listenText}>ऐका</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#F8FAFC" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoSmall: { width: 32, height: 32, backgroundColor: "#fff", borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#145E4C" },
  headerSubtitle: { fontSize: 12, color: "#6B7280" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  streakText: { fontSize: 14, fontWeight: "bold", color: "#D97706" },
  profileIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#145E4C", justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  subGreeting: { fontSize: 14, color: "#374151", fontWeight: "500", marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statBox: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  statValue: { fontSize: 15, fontWeight: "bold", color: "#111827", textAlign: "center" },
  statLabel: { fontSize: 11, color: "#4B5563", marginTop: 4, textAlign: "center" },
  goalCard: { backgroundColor: "#145E4C", borderRadius: 20, padding: 20, marginBottom: 16 },
  goalTag: { color: "#A7F3D0", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  goalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 6 },
  goalDesc: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20, marginBottom: 14 },
  progressBarBg: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: 8, backgroundColor: "#F59E0B", borderRadius: 4 },
  goalProgress: { color: "#fff", fontSize: 12, marginTop: 6, marginBottom: 14 },
  startBtn: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 24, gap: 8 },
  startBtnText: { color: "#145E4C", fontWeight: "bold", fontSize: 16 },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center" },
  actionEmoji: { fontSize: 32 },
  actionTitle: { fontSize: 16, fontWeight: "bold", color: "#111827", marginTop: 6 },
  actionSub: { fontSize: 12, color: "#6B7280", marginTop: 2, textAlign: "center" },
  projectCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFF7ED", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#FED7AA" },
  wordCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  wordTag: { fontSize: 11, fontWeight: "bold", color: "#6B7280", letterSpacing: 0.5 },
  wordText: { fontSize: 26, fontWeight: "800", color: "#111827", marginTop: 6 },
  wordMeaning: { color: "#4B5563", marginTop: 4 },
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  listenText: { color: "#145E4C", fontWeight: "700" },
});
