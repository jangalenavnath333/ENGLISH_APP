import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PLAN, PlanDay } from "../../lib/plan";
import {
  TOPICS,
  checkWriting,
  checkSentence,
  lookupWord,
  WritingFeedback,
  SentenceFeedback,
  WordInfo,
} from "../../lib/gemini";
import { useVoiceRecorder } from "../../lib/useVoiceRecorder";
import { bump, getUsage, recordQuiz, formatDuration, todayKey, UsageData } from "../../lib/usage";

const STORAGE_KEY = "bolu_plan_done_v1";

type TaskKey = "vocab" | "quiz" | "grammar" | "verbs" | "sentences" | "speaking" | "writing";

const TASKS: { key: TaskKey; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { key: "vocab", icon: "book-outline", title: "१. शब्द शिका", sub: "१५ शब्द ऐका आणि म्हणा" },
  { key: "quiz", icon: "help-circle-outline", title: "२. क्विझ", sub: "शब्द आणि verbs लक्षात राहिले का?" },
  { key: "grammar", icon: "construct-outline", title: "३. व्याकरण", sub: "२ सोपे नियम + उदाहरणं" },
  { key: "verbs", icon: "swap-horizontal-outline", title: "४. Verbs (V1 V2 V3)", sub: "८ महत्त्वाचे verbs" },
  { key: "sentences", icon: "chatbubble-ellipses-outline", title: "५. वाक्य बनवा", sub: "मराठी वाक्य इंग्रजीत सांगा (बोलून/लिहून)" },
  { key: "speaking", icon: "mic-outline", title: "६. AI शी बोला", sub: "Madam / Sir शी गप्पा" },
  { key: "writing", icon: "create-outline", title: "७. लिहा", sub: "AI तुमच्या चुका सांगेल" },
];

const say = (text: string) => {
  Speech.stop();
  Speech.speak(text, { language: "en-US", rate: 0.8, volume: 1 });
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function VocabTask({ day }: { day: PlanDay }) {
  return (
    <View>
      {day.vocab.map((v) => (
        <TouchableOpacity key={v.word} style={styles.row} onPress={() => say(`${v.word}. ${v.example}`)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.word}>
              {v.word}  <Text style={styles.meaning}>{v.meaning}</Text>
            </Text>
            <Text style={styles.example}>{v.example}</Text>
          </View>
          <Ionicons name="volume-high" size={22} color="#145E4C" />
        </TouchableOpacity>
      ))}
      <Text style={styles.tipText}>💡 प्रत्येक शब्द ऐका, मग मोठ्याने ३ वेळा म्हणा.</Text>
    </View>
  );
}

interface Question {
  prompt: string;
  hint: string;
  options: string[];
  answer: string;
}

function buildQuiz(day: PlanDay): Question[] {
  const words = shuffle(day.vocab).slice(0, 6);
  const wordQs: Question[] = words.map((w) => {
    const wrong = shuffle(day.vocab.filter((x) => x.word !== w.word)).slice(0, 3).map((x) => x.word);
    return { prompt: w.meaning, hint: "इंग्रजीत काय म्हणतात?", options: shuffle([w.word, ...wrong]), answer: w.word };
  });
  const verbs = shuffle(day.verbs).slice(0, 4);
  const verbQs: Question[] = verbs.map((v) => {
    const wrong = shuffle(day.verbs.filter((x) => x.v1 !== v.v1)).slice(0, 3).map((x) => x.v2);
    return { prompt: v.v1, hint: `'${v.v1}' (${v.meaning}) चं V2 (past) कोणतं?`, options: shuffle([v.v2, ...wrong]), answer: v.v2 };
  });
  return shuffle([...wordQs, ...verbQs]);
}

function QuizTask({ day }: { day: PlanDay }) {
  const [questions, setQuestions] = useState(() => buildQuiz(day));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const finished = idx >= questions.length;

  const pick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === questions[idx].answer) setCorrect((c) => c + 1);
    say(questions[idx].answer);
  };

  const next = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= questions.length) {
      recordQuiz(day.day, correct, questions.length);
    }
    setIdx(nextIdx);
    setPicked(null);
  };

  const restart = () => {
    setQuestions(buildQuiz(day));
    setIdx(0);
    setPicked(null);
    setCorrect(0);
  };

  if (finished) {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <View style={styles.quizEnd}>
        <Text style={styles.score}>{correct}/{questions.length} बरोबर ({pct}%)</Text>
        <Text style={styles.rule}>{pct >= 80 ? "🎉 उत्तम! खूप छान लक्षात राहिलं." : "पुन्हा प्रयत्न करा, शब्द ऐका आणि परत सोडवा."}</Text>
        <TouchableOpacity style={styles.checkBtn} onPress={restart}>
          <Text style={styles.checkBtnText}>पुन्हा खेळा</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = questions[idx];
  return (
    <View>
      <Text style={styles.hintSmall}>प्रश्न {idx + 1}/{questions.length}</Text>
      <Text style={styles.quizPrompt}>{q.prompt}</Text>
      <Text style={styles.rule}>{q.hint}</Text>
      {q.options.map((o) => {
        const isAnswer = o === q.answer;
        const bg = picked ? (isAnswer ? "#DCFCE7" : o === picked ? "#FEE2E2" : "#fff") : "#fff";
        const border = picked ? (isAnswer ? "#22C55E" : o === picked ? "#EF4444" : "#E5E7EB") : "#E5E7EB";
        return (
          <TouchableOpacity key={o} style={[styles.option, { backgroundColor: bg, borderColor: border }]} onPress={() => pick(o)}>
            <Text style={styles.optionText}>{o}</Text>
          </TouchableOpacity>
        );
      })}
      {picked && (
        <TouchableOpacity style={styles.checkBtn} onPress={next}>
          <Text style={styles.checkBtnText}>{idx + 1 >= questions.length ? "निकाल पहा" : "पुढचा प्रश्न"}</Text>
        </TouchableOpacity>
      )}
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

function SentenceTask({ day }: { day: PlanDay }) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [fb, setFb] = useState<SentenceFeedback | null>(null);
  const voice = useVoiceRecorder();
  const marathi = day.sentences[i % day.sentences.length];

  const run = async (input: Parameters<typeof checkSentence>[1]) => {
    setLoading(true);
    setFb(null);
    try {
      const result = await checkSentence(marathi, input);
      setFb(result);
      bump("sentences");
      if (result.corrected) say(result.corrected);
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
  };

  return (
    <View>
      <Text style={styles.hintSmall}>वाक्य {(i % day.sentences.length) + 1}/{day.sentences.length}</Text>
      <Text style={styles.quizPrompt}>{marathi}</Text>
      <Text style={styles.rule}>हे वाक्य इंग्रजीत लिहा किंवा 🎤 दाबून बोला.</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.sentInput}
          placeholder="Type the English sentence..."
          placeholderTextColor="#9CA3AF"
          value={answer}
          onChangeText={setAnswer}
          editable={!voice.isRecording}
        />
        <TouchableOpacity style={[styles.micBtn, voice.isRecording && { backgroundColor: "#EF4444" }]} onPress={toggleMic} disabled={loading}>
          <Ionicons name={voice.isRecording ? "stop" : "mic"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {voice.isRecording && <Text style={styles.recHint}>ऐकत आहे... बोलून झालं की ⏹ दाबा</Text>}
      <TouchableOpacity
        style={[styles.checkBtn, answer.trim().length < 2 && { opacity: 0.5 }]}
        onPress={() => run({ text: answer.trim() })}
        disabled={loading || answer.trim().length < 2}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkBtnText}>तपासा</Text>}
      </TouchableOpacity>

      {fb && (
        <View style={[styles.feedback, !fb.isCorrect && { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
          <Text style={styles.score}>{fb.isCorrect ? "✓ बरोबर!" : "✗ थोडी चूक"}  {fb.score}/10</Text>
          {!!fb.transcript && <Text style={styles.example}>तुम्ही म्हणालात: {fb.transcript}</Text>}
          <Text style={styles.fbLabel}>बरोबर वाक्य:</Text>
          <TouchableOpacity onPress={() => say(fb.corrected)}>
            <Text style={styles.corrected}>{fb.corrected} 🔊</Text>
          </TouchableOpacity>
          <Text style={styles.example}>{fb.explanation}</Text>
          <TouchableOpacity style={[styles.checkBtn, { marginTop: 10 }]} onPress={next}>
            <Text style={styles.checkBtnText}>पुढचं वाक्य</Text>
          </TouchableOpacity>
        </View>
      )}
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
      bump("writings");
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

// Meaning lookup for any English word or phrase
function Dictionary() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<WordInfo | null>(null);

  const search = async () => {
    if (!word.trim()) return;
    setLoading(true);
    setInfo(null);
    try {
      setInfo(await lookupWord(word.trim()));
      bump("lookups");
    } catch (e: any) {
      Alert.alert("शब्द सापडला नाही", e.message || "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.dictBox}>
      <Text style={styles.grammarTitle}>🔎 कोणत्याही शब्दाचा अर्थ</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.sentInput}
          placeholder="English word... (उदा. appointment)"
          placeholderTextColor="#9CA3AF"
          value={word}
          onChangeText={setWord}
          onSubmitEditing={search}
        />
        <TouchableOpacity style={styles.micBtn} onPress={search} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
      {info && (
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity onPress={() => say(`${info.word}. ${info.example}`)}>
            <Text style={styles.word}>
              {info.word} <Text style={styles.example}>({info.partOfSpeech})</Text> 🔊
            </Text>
          </TouchableOpacity>
          <Text style={styles.meaningBig}>{info.meaning}</Text>
          {!!info.forms && <Text style={styles.example}>V1-V2-V3: {info.forms}</Text>}
          <Text style={styles.example}>{info.example}</Text>
          <Text style={styles.example}>{info.exampleMr}</Text>
        </View>
      )}
    </View>
  );
}

function ReportView({ done }: { done: Record<string, boolean> }) {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const refresh = () => getUsage().then((u) => alive && setUsage({ ...u, days: { ...u.days }, counters: { ...u.counters }, quizBest: { ...u.quizBest } }));
      refresh();
      const timer = setInterval(refresh, 5000);
      return () => {
        alive = false;
        clearInterval(timer);
      };
    }, [])
  );

  if (!usage) return <ActivityIndicator style={{ marginTop: 40 }} color="#145E4C" />;

  const entries = Object.entries(usage.days).sort(([a], [b]) => a.localeCompare(b));
  const totalSeconds = entries.reduce((n, [, s]) => n + s, 0);
  const today = usage.days[todayKey()] ?? 0;
  const maxSeconds = Math.max(60, ...entries.map(([, s]) => s));
  const totalTasks = PLAN.length * TASKS.length;
  const doneTasks = Object.values(done).filter(Boolean).length;
  const c = usage.counters;

  const stat = (label: string, value: string | number) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View>
      <View style={styles.themeBox}>
        <Text style={styles.themeTitle}>एकूण वेळ: {formatDuration(totalSeconds)}</Text>
        <Text style={styles.themeGoal}>आज: {formatDuration(today)} · अभ्यास केलेले दिवस: {entries.length}</Text>
      </View>

      <View style={styles.statGrid}>
        {stat("टास्क पूर्ण", `${doneTasks}/${totalTasks}`)}
        {stat("AI शी गप्पा (turns)", c.talkTurns)}
        {stat("वाक्यं बनवली", c.sentences)}
        {stat("लेखन तपासलं", c.writings)}
        {stat("क्विझ खेळलो", c.quizzes)}
        {stat("शब्द शोधले", c.lookups)}
      </View>

      <Text style={styles.stepTitle}>दिवसानुसार वेळ</Text>
      {entries.length === 0 && <Text style={styles.rule}>अजून वेळ नोंदवला गेला नाही. अभ्यास सुरू करा!</Text>}
      {entries.map(([date, secs]) => (
        <View key={date} style={styles.barRow}>
          <Text style={styles.barDate}>{date.slice(5)}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(secs / maxSeconds) * 100}%` }]} />
          </View>
          <Text style={styles.barTime}>{formatDuration(secs)}</Text>
        </View>
      ))}

      <Text style={styles.stepTitle}>क्विझ सर्वोत्तम गुण</Text>
      {PLAN.map((p) => (
        <View key={p.day} style={styles.barRow}>
          <Text style={styles.barDate}>Day {p.day}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { backgroundColor: "#3B82F6", width: `${usage.quizBest[String(p.day)] ?? 0}%` }]} />
          </View>
          <Text style={styles.barTime}>{usage.quizBest[String(p.day)] ?? 0}%</Text>
        </View>
      ))}

      <Text style={styles.tipText}>
        💡 रोज किमान २ तास आणि सगळे ७ टास्क केले तर ४ दिवसांत तुम्ही सोपी वाक्यं बनवून बोलू आणि लिहू शकाल. वेळ आणि टास्क इथे आपोआप मोजले जातात.
      </Text>
    </View>
  );
}

export default function PlanScreen() {
  const [mode, setMode] = useState<"plan" | "report">("plan");
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
  const totalDone = useMemo(() => Object.values(done).filter(Boolean).length, [done]);
  const total = PLAN.length * TASKS.length;

  const toggleDone = (k: TaskKey) => {
    const next = { ...done, [`${day.day}-${k}`]: !isDone(day.day, k) };
    setDone(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const renderTask = (k: TaskKey) => {
    switch (k) {
      case "vocab": return <VocabTask day={day} />;
      case "quiz": return <QuizTask key={day.day} day={day} />;
      case "grammar": return <GrammarTask day={day} />;
      case "verbs": return <VerbsTask day={day} />;
      case "sentences": return <SentenceTask key={day.day} day={day} />;
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
        <View style={styles.segment}>
          {(["plan", "report"] as const).map((m) => (
            <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segBtnActive]} onPress={() => setMode(m)}>
              <Text style={[styles.segText, mode === m && { color: "#fff" }]}>{m === "plan" ? "📅 प्लॅन" : "📊 रिपोर्ट"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {mode === "report" ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <ReportView done={done} />
        </ScrollView>
      ) : (
        <>
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

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.themeBox}>
              <Text style={styles.themeTitle}>{day.theme}</Text>
              <Text style={styles.themeGoal}>{day.goal}</Text>
            </View>

            <Dictionary />

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
        </>
      )}
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
  segment: { flexDirection: "row", gap: 8, marginTop: 10 },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, backgroundColor: "#F3F4F6" },
  segBtnActive: { backgroundColor: "#145E4C" },
  segText: { fontWeight: "700", color: "#374151" },
  dayBar: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  dayChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12, backgroundColor: "#F3F4F6" },
  dayChipActive: { backgroundColor: "#145E4C" },
  dayChipTop: { fontWeight: "700", color: "#111827" },
  dayChipSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  body: { padding: 16, paddingBottom: 32 },
  themeBox: { backgroundColor: "#E6F4EF", padding: 14, borderRadius: 14, marginBottom: 12 },
  themeTitle: { fontSize: 18, fontWeight: "700", color: "#145E4C" },
  themeGoal: { marginTop: 4, color: "#374151", lineHeight: 20 },
  dictBox: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", padding: 14, marginBottom: 12 },
  meaningBig: { fontSize: 20, fontWeight: "700", color: "#145E4C", marginVertical: 4 },
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
  hintSmall: { color: "#6B7280", marginBottom: 4 },
  grammarBox: { marginBottom: 14 },
  grammarTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  rule: { color: "#374151", lineHeight: 21, marginBottom: 6 },
  exampleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  verbRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  verbHead: { backgroundColor: "#E6F4EF", borderRadius: 8, paddingHorizontal: 4 },
  verbHeadText: { fontWeight: "700", color: "#145E4C" },
  verbCell: { flex: 1, fontSize: 15, color: "#111827" },
  quizPrompt: { fontSize: 22, fontWeight: "800", color: "#111827", marginVertical: 4 },
  option: { borderWidth: 2, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8 },
  optionText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  quizEnd: { alignItems: "center", paddingVertical: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  sentInput: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 12, fontSize: 16 },
  micBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#145E4C", alignItems: "center", justifyContent: "center" },
  recHint: { color: "#EF4444", marginTop: 6 },
  speakBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, backgroundColor: "#E6F4EF", marginTop: 8 },
  speakEmoji: { fontSize: 24 },
  speakLabel: { flex: 1, fontSize: 16, fontWeight: "600", color: "#145E4C" },
  writeInput: { minHeight: 120, textAlignVertical: "top", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 12, fontSize: 16, marginTop: 8 },
  checkBtn: { marginTop: 10, backgroundColor: "#145E4C", borderRadius: 12, paddingVertical: 13, alignItems: "center", paddingHorizontal: 16 },
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
  stepTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 16, marginBottom: 8 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "31%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", padding: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#145E4C" },
  statLabel: { fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 2 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  barDate: { width: 52, color: "#374151", fontWeight: "600" },
  barTrack: { flex: 1, height: 14, borderRadius: 7, backgroundColor: "#E5E7EB", overflow: "hidden" },
  barFill: { height: 14, borderRadius: 7, backgroundColor: "#22C55E" },
  barTime: { width: 96, textAlign: "right", color: "#6B7280", fontSize: 12 },
});
