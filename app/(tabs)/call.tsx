import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Platform,
  ScrollView,
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
  TALK_LANGUAGES,
  Tutor,
  TalkHistoryItem,
} from "../../lib/gemini";
import { playWavBase64, stopPlayback, blobToWavBase64, makeRingbackWavBase64 } from "../../lib/audio";
import { bump } from "../../lib/usage";

type CallStatus = "idle" | "listening" | "thinking" | "speaking" | "muted";
type Phase = "start" | "ringing" | "incall" | "summary";
interface LogLine {
  who: "you" | "teacher";
  text: string;
}

const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

const POLL_MS = 120;
const SILENCE_END_MS = 1300; // silence after speech => user finished
const MAX_UTTERANCE_MS = 25000;
const MIN_SPEECH_MS = 350; // ignore coughs / clicks shorter than this
const MAX_ERRORS_IN_ROW = 3;
const CALIBRATION_POLLS = 6; // ~0.7s at the start of each turn to learn the background noise
const VOICE_ABOVE_FLOOR_DB = 10; // speech = this much louder than the noise floor
const MIN_VOICE_DB = -52; // ...and never quieter than this
const NO_VOICE_HINT_MS = 9000;

const FALLBACK_GREETING = "Hello! I am your English teacher. How are you doing today?";

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

// RN-web's Alert.alert does nothing, so use the browser dialog there
const notify = (title: string, message: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

// Split a reply into sentences so the first one can be spoken while the rest are still being generated
const splitSentences = (t: string) => (t.match(/[^.!?।]+[.!?।]*/g) || [t]).map((s) => s.trim()).filter(Boolean);

// Web has no recorder metering, so we read the microphone level ourselves with an AnalyserNode
interface WebMeter {
  ctx: AudioContext;
  stream: MediaStream;
  analyser: AnalyserNode;
  buf: Float32Array<ArrayBuffer>;
}

export default function CallScreen() {
  const [phase, setPhase] = useState<Phase>("start");
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [userCaption, setUserCaption] = useState("");
  const [tutorCaption, setTutorCaption] = useState("");
  const [notice, setNotice] = useState("");
  const [tutor, setTutor] = useState<Tutor>(TUTORS[0]);
  const [language, setLanguage] = useState(TALK_LANGUAGES[1]); // English
  const [log, setLog] = useState<LogLine[]>([]);
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [finalTurns, setFinalTurns] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [hearing, setHearing] = useState(false);
  const [pulse] = useState(() => new Animated.Value(0));

  const recorder = useAudioRecorder(RECORDING_OPTIONS);

  // Refs so the long-running listen/speak loop always sees the latest values
  const runIdRef = useRef(0); // bumped on every start/end; stale async work checks it and quits
  const historyRef = useRef<TalkHistoryItem[]>([]);
  const speakerRef = useRef(true);
  const mutedRef = useRef(false);
  const finishRef = useRef<(() => void) | null>(null); // manual "send now"
  const skipRef = useRef(false); // user interrupted the teacher
  const errorsRef = useRef(0);
  const secondsRef = useRef(0);
  const turnsRef = useRef(0);
  const webMeterRef = useRef<WebMeter | null>(null);
  const webRecRef = useRef<{ rec: MediaRecorder; stopped: Promise<Blob> } | null>(null);
  const hearingRef = useRef(false);
  const tutorRef = useRef(tutor);
  const languageRef = useRef(language);

  useEffect(() => {
    tutorRef.current = tutor;
    languageRef.current = language;
  }, [tutor, language]);

  // --- animation -----------------------------------------------------------
  const animating = phase === "ringing" || status === "listening" || status === "speaking";
  useEffect(() => {
    if (!animating) {
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
  }, [animating, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  // --- call timer ----------------------------------------------------------
  useEffect(() => {
    if (phase !== "incall") return;
    const t = setInterval(() => {
      secondsRef.current += 1;
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // --- web microphone level ------------------------------------------------
  const startWebMeter = useCallback(async () => {
    if (Platform.OS !== "web" || webMeterRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      webMeterRef.current = { ctx, stream, analyser, buf: new Float32Array(analyser.fftSize) };
    } catch (e) {
      console.log("Web meter unavailable:", e);
    }
  }, []);

  const readWebLevel = (): number | undefined => {
    const m = webMeterRef.current;
    if (!m) return undefined;
    m.analyser.getFloatTimeDomainData(m.buf);
    let sum = 0;
    for (let i = 0; i < m.buf.length; i++) sum += m.buf[i] * m.buf[i];
    return 20 * Math.log10(Math.max(Math.sqrt(sum / m.buf.length), 1e-8));
  };

  const stopWebMeter = useCallback(() => {
    const m = webMeterRef.current;
    if (!m) return;
    m.stream.getTracks().forEach((t) => t.stop());
    m.ctx.close().catch(() => {});
    webMeterRef.current = null;
  }, []);

  // Record on the same microphone stream we already use for the level meter (no re-prompt, no re-prepare)
  const startWebRecording = useCallback(() => {
    const m = webMeterRef.current;
    if (!m) throw new Error("Microphone चालू नाही. Browser मध्ये Mic permission द्या.");
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    const rec = new MediaRecorder(m.stream, mime ? { mimeType: mime } : {});
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const stopped = new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    });
    rec.start();
    webRecRef.current = { rec, stopped };
  }, []);

  const stopWebRecording = useCallback(async (): Promise<Blob | null> => {
    const r = webRecRef.current;
    if (!r) return null;
    webRecRef.current = null;
    if (r.rec.state !== "inactive") r.rec.stop();
    return r.stopped;
  }, []);

  const updateHearing = useCallback((v: boolean) => {
    if (hearingRef.current !== v) {
      hearingRef.current = v;
      setHearing(v);
    }
  }, []);

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
    if (Platform.OS === "web") {
      await stopWebRecording();
      return;
    }
    try {
      if (recorder.getStatus().isRecording) await recorder.stop();
    } catch {
      // recorder was not running
    }
  }, [recorder, stopWebRecording]);

  const hardStopAll = useCallback(() => {
    runIdRef.current += 1;
    finishRef.current = null;
    stopPlayback();
    Speech.stop();
    stopRecorderQuietly();
    stopWebMeter();
  }, [stopRecorderQuietly, stopWebMeter]);

  const addLog = (who: LogLine["who"], text: string) => {
    if (text) setLog((l) => [...l, { who, text }]);
  };

  // Speak the tutor's reply. English etc: natural Gemini voice, sentence by sentence (the first sentence
  // starts playing while the others are still being generated). Marathi / failures: device voice.
  const speak = useCallback(
    async (text: string, runId: number) => {
      setStatus("speaking");
      skipRef.current = false;
      await applyAudioMode(false);
      const hasDevanagari = /[ऀ-ॿ]/.test(text);
      let playedAny = false;

      if (!hasDevanagari) {
        try {
          const jobs = splitSentences(text)
            .slice(0, 4)
            .map((s) => synthesizeSpeech(s, tutorRef.current.voice));
          for (const job of jobs) {
            const wav = await job;
            if (runId !== runIdRef.current || skipRef.current) return;
            playedAny = true;
            await playWavBase64(wav, speakerRef.current);
            if (runId !== runIdRef.current || skipRef.current) return;
          }
          return;
        } catch (e) {
          console.log("TTS error, using device voice:", e);
          if (runId !== runIdRef.current || skipRef.current || playedAny) return;
        }
      }

      await new Promise<void>((resolve) => {
        const guard = setTimeout(resolve, 30000);
        const done = () => {
          clearTimeout(guard);
          resolve();
        };
        Speech.speak(text, {
          language: hasDevanagari ? "hi-IN" : languageRef.current.speech,
          rate: 0.9,
          onDone: done,
          onStopped: done,
          onError: done,
        });
      });
    },
    [applyAudioMode]
  );

  // Record until the user stops talking (or taps "send now"). Returns audio or null if no speech.
  // Voice detection adapts to the room: it tracks the quietest recent level as the noise floor and treats
  // anything clearly above it as speech, so it works with different microphones and background noise.
  const recordUtterance = useCallback(
    async (runId: number): Promise<{ base64: string; mime: string } | null> => {
      const isWeb = Platform.OS === "web";
      if (isWeb) {
        startWebRecording();
      } else {
        await applyAudioMode(true);
        await recorder.prepareToRecordAsync();
        recorder.record();
      }
      setStatus("listening");
      updateHearing(false);

      const startedAt = Date.now();
      let polls = 0;
      let smooth = -100;
      let floor = 0;
      let speechMs = 0;
      let lastVoiceAt = 0;
      let speechStartedAt = 0;
      let manualSend = false;
      let hintShown = false;
      finishRef.current = () => {
        manualSend = true;
      };

      while (runId === runIdRef.current && !mutedRef.current) {
        await sleep(POLL_MS);
        const now = Date.now();
        const raw = isWeb ? readWebLevel() : recorder.getStatus().metering;

        if (typeof raw === "number") {
          polls += 1;
          smooth = polls === 1 ? raw : smooth * 0.4 + raw * 0.6;
          if (polls <= CALIBRATION_POLLS) {
            // first ~0.7s: the quietest moment is the background noise
            floor = polls === 1 ? smooth : Math.min(floor, smooth);
          } else {
            if (smooth < floor) floor = smooth; // quieter: noise floor drops at once
            else floor += (smooth - floor) * 0.02; // louder: rises slowly, so speech does not raise it
            const isVoice = smooth > floor + VOICE_ABOVE_FLOOR_DB && smooth > MIN_VOICE_DB;
            updateHearing(isVoice);
            if (isVoice) {
              if (!speechStartedAt) speechStartedAt = now;
              lastVoiceAt = now;
              speechMs = now - speechStartedAt;
              if (hintShown) setNotice("");
            }
          }
        }

        if (!speechStartedAt && !hintShown && now - startedAt > NO_VOICE_HINT_MS) {
          hintShown = true;
          setNotice("आवाज ऐकू येत नाही. Mic जवळ बोला किंवा तुमचा Mic चालू आहे का ते तपासा.");
        }

        const heardSpeech = speechMs >= MIN_SPEECH_MS;
        if (manualSend) break;
        if (heardSpeech && now - lastVoiceAt > SILENCE_END_MS) break;
        if (now - startedAt > MAX_UTTERANCE_MS) break;
      }
      finishRef.current = null;
      updateHearing(false);

      const heard = speechMs >= MIN_SPEECH_MS || manualSend;

      if (isWeb) {
        const blob = await stopWebRecording();
        if (runId !== runIdRef.current || mutedRef.current || !heard || !blob) return null;
        return { base64: await blobToWavBase64(blob), mime: "audio/wav" };
      }

      await stopRecorderQuietly();
      if (runId !== runIdRef.current || mutedRef.current) return null;
      const fileUri = recorder.uri; // read AFTER stop: it only points to this recording once stopped
      if (!heard || !fileUri) return null;
      return { base64: await new File(fileUri).base64(), mime: "audio/mp4" };
    },
    [applyAudioMode, recorder, stopRecorderQuietly, startWebRecording, stopWebRecording, updateHearing]
  );

  // The hands-free loop: listen -> think -> speak -> listen ...
  const finishCall = useCallback(() => {
    hardStopAll();
    setFinalSeconds(secondsRef.current);
    setFinalTurns(turnsRef.current);
    setStatus("idle");
    setNotice("");
    setPhase("summary");
  }, [hardStopAll]);

  const conversationLoop = useCallback(
    async (runId: number) => {
      while (runId === runIdRef.current) {
        if (mutedRef.current) {
          setStatus("muted");
          await sleep(300);
          continue;
        }
        try {
          const clip = await recordUtterance(runId);
          if (runId !== runIdRef.current) return;
          if (!clip) continue; // silence / muted: listen again

          setStatus("thinking");
          setNotice("");
          const turn = await sendCallTurn(
            languageRef.current.name,
            historyRef.current,
            { audioBase64: clip.base64, audioMimeType: clip.mime },
            { tutor: tutorRef.current }
          );
          if (runId !== runIdRef.current) return;
          errorsRef.current = 0;

          if (!turn.reply) {
            setNotice("काही ऐकू आलं नाही, पुन्हा बोला");
            continue;
          }

          turnsRef.current += 1;
          bump("talkTurns");
          historyRef.current = [
            ...historyRef.current,
            { role: "user", text: turn.transcript || "(unclear)" },
            { role: "tutor", text: turn.reply },
          ];
          setUserCaption(turn.transcript);
          setTutorCaption(turn.reply);
          setSuggestion(turn.suggestion);
          addLog("you", turn.transcript);
          addLog("teacher", turn.reply);
          await speak(turn.reply, runId);
        } catch (e: any) {
          if (runId !== runIdRef.current) return;
          errorsRef.current += 1;
          console.log("Call turn error:", e);
          if (errorsRef.current >= MAX_ERRORS_IN_ROW) {
            finishCall();
            notify("Call ended", "Internet किंवा server मध्ये अडचण आहे. थोड्या वेळाने पुन्हा try करा.");
            return;
          }
          setNotice(`अडचण: ${String(e?.message || "unknown").slice(0, 90)}. पुन्हा try करत आहे...`);
          await stopRecorderQuietly();
          await sleep(1200);
        }
      }
    },
    [recordUtterance, speak, finishCall, stopRecorderQuietly]
  );

  // --- user actions --------------------------------------------------------
  const startCall = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        notify("Permission required", "कॉलसाठी Microphone permission द्या (browser/phone Settings मध्ये).");
        return;
      }
    } catch (e: any) {
      notify("Error", e?.message || "Microphone चालू करता आला नाही");
      return;
    }

    hardStopAll();
    const runId = runIdRef.current;
    historyRef.current = [];
    errorsRef.current = 0;
    secondsRef.current = 0;
    turnsRef.current = 0;
    mutedRef.current = false;
    setIsMuted(false);
    setSeconds(0);
    setUserCaption("");
    setTutorCaption("");
    setSuggestion("");
    setLog([]);
    setNotice("");
    setStatus("idle");
    setPhase("ringing");
    await startWebMeter();

    // The teacher's greeting is prepared while the phone "rings"
    const greetingJob = sendCallTurn(languageRef.current.name, [], { start: true }, { tutor: tutorRef.current })
      .then((t) => ({ reply: t.reply || FALLBACK_GREETING, suggestion: t.suggestion }))
      .catch(() => ({ reply: FALLBACK_GREETING, suggestion: "I am fine, thank you." }));

    try {
      await applyAudioMode(false);
      await playWavBase64(makeRingbackWavBase64(), speakerRef.current);
    } catch (e) {
      console.log("Ringback error:", e);
      await sleep(1500);
    }
    if (runId !== runIdRef.current) return;

    const { reply: greeting, suggestion: firstSuggestion } = await greetingJob;
    if (runId !== runIdRef.current) return;
    setPhase("incall");
    setTutorCaption(greeting);
    setSuggestion(firstSuggestion);
    addLog("teacher", greeting);
    historyRef.current = [{ role: "tutor", text: greeting }];
    try {
      await speak(greeting, runId);
    } catch (e) {
      console.log("Greeting error:", e);
    }
    if (runId === runIdRef.current) conversationLoop(runId);
  };

  const endCall = useCallback(() => {
    if (phase === "ringing") {
      hardStopAll();
      setPhase("start");
      setStatus("idle");
      return;
    }
    finishCall();
  }, [phase, hardStopAll, finishCall]);

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

  // Interrupt the teacher mid-sentence, like talking over someone on a call
  const interrupt = () => {
    skipRef.current = true;
    stopPlayback();
    Speech.stop();
  };

  // Tabs stay mounted: hang up when the user leaves this tab or the app closes
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (phaseRef.current === "incall" || phaseRef.current === "ringing") {
          hardStopAll();
          setFinalSeconds(secondsRef.current);
          setFinalTurns(turnsRef.current);
          setStatus("idle");
          setPhase(phaseRef.current === "incall" ? "summary" : "start");
        }
      };
    }, [hardStopAll])
  );

  useEffect(() => () => hardStopAll(), [hardStopAll]);

  // --- UI ------------------------------------------------------------------
  if (phase === "start") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.startWrap}>
          <Text style={styles.avatarEmoji}>{tutor.emoji}</Text>
          <Text style={styles.startTitle}>Voice Call</Text>
          <Text style={styles.desc}>
            Teacher शी फोनवर बोलल्यासारखं बोला. बटण दाबायची गरज नाही, तुम्ही थांबलात की Teacher आपोआप उत्तर देते. मध्येच थांबवायचं असेल तर Interrupt दाबा.
          </Text>

          <Text style={styles.label}>कोणाला कॉल करायचा?</Text>
          <View style={styles.rowWrap}>
            {TUTORS.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.pick, t.id === tutor.id && styles.pickActive]} onPress={() => setTutor(t)}>
                <Text style={styles.pickEmoji}>{t.emoji}</Text>
                <Text style={styles.pickText}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>कोणत्या भाषेत?</Text>
          <View style={styles.rowWrap}>
            {TALK_LANGUAGES.map((l) => (
              <TouchableOpacity key={l.name} style={[styles.chip, l.name === language.name && styles.chipActive]} onPress={() => setLanguage(l)}>
                <Text style={[styles.chipText, l.name === language.name && { color: "#0F172A" }]}>
                  {l.name === "Auto" ? "🌐 Auto" : l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={startCall} activeOpacity={0.8}>
            <Ionicons name="call" size={32} color="#fff" />
            <Text style={styles.startBtnText}>Call {tutor.label}</Text>
          </TouchableOpacity>
          <Text style={styles.tip}>💡 शांत जागी बोला, म्हणजे आवाज नीट ओळखला जाईल.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === "summary") {
    const mins = Math.floor(finalSeconds / 60);
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.startWrap}>
          <Text style={styles.avatarEmoji}>✅</Text>
          <Text style={styles.startTitle}>Call संपला</Text>
          <Text style={styles.desc}>
            वेळ: {mins > 0 ? `${mins} मिनिट ` : ""}{finalSeconds % 60} सेकंद · तुम्ही {finalTurns} वेळा बोललात
          </Text>
          {log.length > 0 && <Text style={styles.label}>तुमचं संभाषण</Text>}
          {log.map((l, i) => (
            <View key={i} style={[styles.logLine, l.who === "you" ? styles.logYou : styles.logTeacher]}>
              <Text style={styles.logWho}>{l.who === "you" ? "You" : tutor.label}</Text>
              <Text style={styles.logText}>{l.text}</Text>
            </View>
          ))}
          <TouchableOpacity style={[styles.startBtn, { marginTop: 24 }]} onPress={() => setPhase("start")} activeOpacity={0.8}>
            <Ionicons name="call" size={28} color="#fff" />
            <Text style={styles.startBtnText}>पुन्हा कॉल करा</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const ringing = phase === "ringing";
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.callWrap}>
        <View style={styles.callHeader}>
          <Text style={styles.contactName}>Teacher {tutor.label}</Text>
          <Text style={styles.timer}>{ringing ? "Calling..." : formatTime(seconds)}</Text>
          <Text style={styles.statusText}>{ringing ? "रिंग वाजत आहे" : STATUS_TEXT[status]}</Text>
          {!ringing && status === "listening" && (
            <Text style={[styles.hearing, hearing && styles.hearingOn]}>
              {hearing ? "🎙️ तुमचा आवाज ऐकू येतोय..." : "🎙️ बोला, मी ऐकतोय"}
            </Text>
          )}
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
          {!!suggestion && status !== "thinking" && (
            <TouchableOpacity
              style={styles.suggestionBox}
              activeOpacity={0.8}
              onPress={() => {
                Speech.stop();
                Speech.speak(suggestion, { language: languageRef.current.speech, rate: 0.8 });
              }}
            >
              <Text style={styles.suggestionLabel}>💡 असं बोला (दाबून ऐका)</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomControls}>
          {!ringing && (
            <View style={styles.rowControls}>
              <TouchableOpacity style={[styles.circleBtn, !isSpeaker && styles.circleBtnActive]} onPress={toggleSpeaker}>
                <Ionicons name={isSpeaker ? "volume-high" : "ear"} size={26} color={!isSpeaker ? "#000" : "#fff"} />
                <Text style={styles.btnLabel}>{isSpeaker ? "Speaker" : "Earpiece"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.circleBtn, isMuted && styles.circleBtnActive]} onPress={toggleMute}>
                <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color={isMuted ? "#000" : "#fff"} />
                <Text style={styles.btnLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
              </TouchableOpacity>

              {status === "speaking" ? (
                <TouchableOpacity style={[styles.circleBtn, styles.circleBtnActiveBlue]} onPress={interrupt}>
                  <Ionicons name="hand-left" size={24} color="#fff" />
                  <Text style={styles.btnLabel}>Interrupt</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.circleBtn, status === "listening" && styles.circleBtnActiveBlue, status !== "listening" && styles.circleBtnDisabled]}
                  onPress={() => finishRef.current?.()}
                  disabled={status !== "listening"}
                >
                  <Ionicons name="send" size={24} color="#fff" />
                  <Text style={styles.btnLabel}>Send now</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
  startWrap: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  avatarEmoji: { fontSize: 72, marginBottom: 12 },
  startTitle: { fontSize: 30, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  desc: { color: "#94A3B8", fontSize: 16, lineHeight: 24, textAlign: "center", marginBottom: 24 },
  label: { color: "#E2E8F0", fontSize: 16, fontWeight: "700", alignSelf: "flex-start", marginTop: 8, marginBottom: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignSelf: "stretch", marginBottom: 12 },
  pick: { flex: 1, minWidth: 120, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 2, borderColor: "transparent" },
  pickActive: { borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.15)" },
  pickEmoji: { fontSize: 28 },
  pickText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" },
  chipActive: { backgroundColor: "#E2E8F0" },
  chipText: { color: "#E2E8F0", fontWeight: "600" },
  startBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#22C55E", paddingVertical: 18, paddingHorizontal: 36, borderRadius: 36, gap: 12, marginTop: 16 },
  startBtnText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  tip: { color: "#64748B", fontSize: 14, textAlign: "center", marginTop: 24 },
  logLine: { alignSelf: "stretch", padding: 12, borderRadius: 12, marginBottom: 8 },
  logYou: { backgroundColor: "rgba(59,130,246,0.2)" },
  logTeacher: { backgroundColor: "rgba(255,255,255,0.08)" },
  logWho: { color: "#94A3B8", fontSize: 12, fontWeight: "700", marginBottom: 2 },
  logText: { color: "#fff", fontSize: 16, lineHeight: 22 },
  callWrap: { flex: 1, width: "100%", alignItems: "center", justifyContent: "space-between", paddingVertical: 20 },
  callHeader: { alignItems: "center", marginTop: 24, paddingHorizontal: 24 },
  contactName: { fontSize: 30, fontWeight: "300", color: "#fff", marginBottom: 4 },
  timer: { color: "#CBD5E1", fontSize: 16, marginBottom: 6 },
  statusText: { color: "#94A3B8", fontSize: 18, fontWeight: "400" },
  hearing: { color: "#64748B", fontSize: 14, marginTop: 6 },
  hearingOn: { color: "#4ADE80", fontWeight: "700" },
  suggestionBox: { marginTop: 16, alignSelf: "stretch", backgroundColor: "rgba(250,204,21,0.12)", borderWidth: 1, borderColor: "rgba(250,204,21,0.4)", borderRadius: 14, padding: 12 },
  suggestionLabel: { color: "#FACC15", fontSize: 12, fontWeight: "700", marginBottom: 4 },
  suggestionText: { color: "#FEF9C3", fontSize: 17, lineHeight: 24 },
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
