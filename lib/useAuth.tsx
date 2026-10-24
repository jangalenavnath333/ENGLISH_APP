import { useState, useEffect, createContext, useContext } from 'react';
import {
  onAuthStateChanged,
  User,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';
import { getUserProfile, createUserProfile, updateUserName, UserProfile } from './userService';

export function resolveDisplayName(
  profile?: UserProfile | null,
  user?: User | null,
  cachedName?: string | null
): string {
  const pName = profile?.name?.trim();
  if (pName && pName !== "Learner" && pName !== "Guest User" && pName !== "User") {
    return pName;
  }
  const dName = user?.displayName?.trim();
  if (dName && dName !== "Learner" && dName !== "Guest User" && dName !== "User") {
    return dName;
  }
  const cName = cachedName?.trim();
  if (cName && cName !== "Learner" && cName !== "Guest User" && cName !== "User") {
    return cName;
  }
  if (user?.email) {
    const prefix = user.email.split("@")[0]?.trim();
    if (prefix && prefix.toLowerCase() !== "guest") {
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  }
  return "Learner";
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  resolvedName: string;
  loginAsGuest: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  resolvedName: "Learner",
  loginAsGuest: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  updateName: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cachedName, setCachedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resolvedName = resolveDisplayName(profile, user, cachedName);

  const refreshProfile = async (uid?: string) => {
    const targetUid = uid || user?.uid;
    if (targetUid) {
      try {
        const p = await getUserProfile(targetUid);
        if (p) {
          setProfile(p);
          if (p.name && p.name !== "Learner" && p.name !== "Guest User") {
            await AsyncStorage.setItem(`bolu_user_name_${targetUid}`, p.name);
            setCachedName(p.name);
          }
        }
      } catch (err) {
        console.warn("Failed to refresh profile:", err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        let localName: string | null = null;
        try {
          localName = await AsyncStorage.getItem(`bolu_user_name_${authUser.uid}`);
          if (localName) setCachedName(localName);
        } catch {
          // ignore async storage error
        }

        const effectiveName =
          authUser.displayName?.trim() ||
          localName?.trim() ||
          (authUser.isAnonymous ? "Guest User" : "");

        if (effectiveName && effectiveName !== "Learner") {
          await createUserProfile(authUser.uid, {
            name: effectiveName,
            email: authUser.email || "",
          });
        } else {
          await createUserProfile(authUser.uid, {
            email: authUser.email || "",
          });
        }

        await refreshProfile(authUser.uid);
      } else {
        setProfile(null);
        setCachedName(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsGuest = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        const cached = await AsyncStorage.getItem(`bolu_user_name_${cred.user.uid}`);
        if (cached) setCachedName(cached);
        await refreshProfile(cred.user.uid);
      }
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      setLoading(true);
      const cleanName = name.trim();
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // 1. Immediately store displayName on Firebase Auth user
      await updateProfile(cred.user, { displayName: cleanName });

      // 2. Cache in AsyncStorage
      await AsyncStorage.setItem(`bolu_user_name_${cred.user.uid}`, cleanName);
      setCachedName(cleanName);

      // 3. Create user profile in Firestore
      await createUserProfile(cred.user.uid, {
        name: cleanName,
        email: cred.user.email || email,
      });

      // 4. Update state directly
      setProfile({
        uid: cred.user.uid,
        name: cleanName,
        email: cred.user.email || email,
        xp: 0,
        streak: 0,
        level: "Elementary Level 1",
        currentLesson: 1,
        completedLessons: [],
        lastPracticeDate: null,
        createdAt: null,
      });

      // Immediately sign out so user can sign in with credentials as designed
      await signOut(auth);
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateName = async (newName: string) => {
    const clean = newName.trim();
    if (!clean || !user) return;
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: clean });
      }
      await AsyncStorage.setItem(`bolu_user_name_${user.uid}`, clean);
      setCachedName(clean);
      await updateUserName(user.uid, clean);
      setProfile((prev) => (prev ? { ...prev, name: clean } : null));
    } catch (error) {
      console.error("Failed to update name:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        resolvedName,
        loginAsGuest,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshProfile,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
