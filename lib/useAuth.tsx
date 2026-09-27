import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, createUserProfile, UserProfile } from './userService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginAsGuest: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginAsGuest: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (uid?: string) => {
    const targetUid = uid || user?.uid;
    if (targetUid) {
      const p = await getUserProfile(targetUid);
      setProfile(p);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Ensure profile exists in Firestore (name might be updated later for email users)
        await createUserProfile(authUser.uid, {
          name: authUser.isAnonymous ? "Guest User" : authUser.displayName || "Learner",
        });
        await refreshProfile(authUser.uid);
      } else {
        setProfile(null);
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
      setLoading(false);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Login failed", error);
      setLoading(false);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      // Create user profile with their provided name
      await createUserProfile(cred.user.uid, { name });
    } catch (error) {
      console.error("Registration failed", error);
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginAsGuest, loginWithEmail, registerWithEmail, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
