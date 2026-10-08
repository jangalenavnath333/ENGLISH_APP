import { useEffect } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "bolu_usage_v1";
const TICK_SECONDS = 10;

export type Counter = "talkTurns" | "sentences" | "writings" | "quizzes" | "lookups";

export interface UsageData {
  days: Record<string, number>; // "YYYY-MM-DD" -> seconds in the app
  counters: Record<Counter, number>;
  quizBest: Record<string, number>; // "<dayNumber>" -> best percent
}

const EMPTY: UsageData = {
  days: {},
  counters: { talkTurns: 0, sentences: 0, writings: 0, quizzes: 0, lookups: 0 },
  quizBest: {},
};

let cache: UsageData | null = null;
let loading: Promise<UsageData> | null = null;

async function load(): Promise<UsageData> {
  if (cache) return cache;
  if (!loading) {
    loading = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : {};
        cache = {
          days: parsed.days ?? {},
          counters: { ...EMPTY.counters, ...(parsed.counters ?? {}) },
          quizBest: parsed.quizBest ?? {},
        };
        return cache;
      })
      .catch(() => {
        cache = { days: {}, counters: { ...EMPTY.counters }, quizBest: {} };
        return cache;
      });
  }
  return loading;
}

function save(data: UsageData) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function getUsage(): Promise<UsageData> {
  return load();
}

async function addSeconds(seconds: number) {
  const data = await load();
  const key = todayKey();
  data.days[key] = (data.days[key] ?? 0) + seconds;
  save(data);
}

export async function bump(counter: Counter, by = 1) {
  const data = await load();
  data.counters[counter] += by;
  save(data);
}

export async function recordQuiz(dayNumber: number, correct: number, total: number) {
  const data = await load();
  const pct = Math.round((correct / total) * 100);
  data.quizBest[String(dayNumber)] = Math.max(data.quizBest[String(dayNumber)] ?? 0, pct);
  data.counters.quizzes += 1;
  save(data);
}

// Counts the seconds the app is open in the foreground. Mount once in the tabs layout.
export function useUsageTracker() {
  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === "active") addSeconds(TICK_SECONDS);
    }, TICK_SECONDS * 1000);
    return () => clearInterval(timer);
  }, []);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} तास ${m} मिनिटं`;
  return `${m} मिनिटं`;
}
