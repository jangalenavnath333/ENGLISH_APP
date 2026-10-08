import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "bolu_revision_v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeakWord {
  word: string;
  meaning: string;
  pron: string;
  streak: number; // correct answers in a row during revision
  due: number; // timestamp: ask again at/after this time
}

type Store = Record<string, WeakWord>;

let cache: Store | null = null;

async function load(): Promise<Store> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache as Store;
}

function save(store: Store) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store)).catch(() => {});
}

// A word the learner got wrong: ask it again soon
export async function addWeakWord(word: string, meaning: string, pron: string) {
  const store = await load();
  store[word] = { word, meaning, pron, streak: 0, due: Date.now() };
  save(store);
}

// After a revision answer: wrong -> restart, right -> push later, 3 right in a row -> word is learned
export async function recordRevision(word: string, correct: boolean) {
  const store = await load();
  const w = store[word];
  if (!w) return;
  if (!correct) {
    w.streak = 0;
    w.due = Date.now();
  } else {
    w.streak += 1;
    if (w.streak >= 3) delete store[word];
    else w.due = Date.now() + w.streak * DAY_MS;
  }
  save(store);
}

export async function getDueWords(): Promise<WeakWord[]> {
  const store = await load();
  const now = Date.now();
  return Object.values(store).filter((w) => w.due <= now);
}

export async function getWeakCount(): Promise<number> {
  return Object.keys(await load()).length;
}
