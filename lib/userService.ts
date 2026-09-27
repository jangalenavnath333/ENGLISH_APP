import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  level: string;
  currentLesson: number;
  completedLessons: number[];
  lastPracticeDate: string | null;
  createdAt: any;
}

// Create or update user profile in Firestore
export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid,
      name: data.name || "User",
      email: data.email || "",
      xp: 0,
      streak: 0,
      level: "Elementary Level 1",
      currentLesson: 1,
      completedLessons: [],
      lastPracticeDate: null,
      createdAt: serverTimestamp(),
      ...data,
    });
  } else {
    // Update name if it's explicitly provided and valid
    if (data.name && data.name !== "Learner" && data.name !== "Guest User") {
      await updateDoc(userRef, { name: data.name });
    }
  }
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

// Update XP and streak after practice
export async function updateUserProgress(
  uid: string,
  xpGained: number,
  lessonCompleted: number
) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data() as UserProfile;
  const today = new Date().toISOString().split("T")[0];
  const lastDate = data.lastPracticeDate;

  // Calculate streak
  let newStreak = data.streak;
  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (lastDate === yesterdayStr) {
      newStreak = data.streak + 1;
    } else {
      newStreak = 1;
    }
  }

  // Update completed lessons
  const completedLessons = data.completedLessons || [];
  if (lessonCompleted > 0 && !completedLessons.includes(lessonCompleted)) {
    completedLessons.push(lessonCompleted);
  }

  await updateDoc(userRef, {
    xp: (data.xp || 0) + xpGained,
    streak: newStreak,
    lastPracticeDate: today,
    completedLessons,
    currentLesson: Math.max(data.currentLesson || 1, lessonCompleted + 1),
  });
}

import { collection, addDoc } from "firebase/firestore";

// Save a mistake to the mistake_book collection
export async function saveMistake(uid: string, originalText: string, correctedText: string, explanation: string) {
  try {
    const mistakesRef = collection(db, "mistake_book");
    await addDoc(mistakesRef, {
      uid,
      originalText,
      correctedText,
      explanation,
      createdAt: serverTimestamp(),
      revised: false
    });
  } catch (error) {
    console.error("Error saving mistake:", error);
  }
}
