import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../lib/useAuth";
import { useState } from "react";

export default function LoginScreen() {
  const { loginAsGuest, loginWithEmail, registerWithEmail, loading: authLoading } = useAuth();
  
  const [view, setView] = useState<'home' | 'login' | 'register'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("थांबा!", "कृपया Email आणि Password टाका.");
      return;
    }
    setLocalLoading(true);
    try {
      const formattedEmail = email.includes('@') ? email.trim() : `${email.trim()}@bolu.app`;
      await loginWithEmail(formattedEmail, password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      Alert.alert("चुकले!", "Email किंवा Password चुकीचा आहे. किंवा तुम्ही Firebase मध्ये Email Auth ऑन केले नसेल.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name || !confirmPassword) {
      Alert.alert("थांबा!", "कृपया तुमचे नाव, Email आणि Password टाका.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("थांबा!", "दोन्ही पासवर्ड मॅच होत नाहीत. (Passwords do not match)");
      return;
    }
    if (password.length < 6) {
      Alert.alert("थांबा!", "पासवर्ड किमान ६ अक्षरांचा असावा.");
      return;
    }
    setLocalLoading(true);
    try {
      const formattedEmail = email.includes('@') ? email.trim() : `${email.trim()}@bolu.app`;
      await registerWithEmail(formattedEmail, password, name);
      Alert.alert("अभिनंदन!", "तुमचं अकाउंट तयार झालं आहे! आता लॉगिन करा.");
      setPassword('');
      setConfirmPassword('');
      setView('login');
    } catch (e: any) {
      Alert.alert("एरर (Error)", "अकाउंट बनवता आले नाही. तुम्ही Firebase Console मध्ये 'Email/Password' चालू केले आहे का ते तपासा! \n\n(" + e.message + ")");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLocalLoading(true);
    try {
      await loginAsGuest();
      router.replace("/(tabs)/home");
    } catch (e) {
      Alert.alert("Error", "Guest login failed.");
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = authLoading || localLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>
            <Text style={styles.titleDark}>Bolu </Text>
            <Text style={styles.titleGreen}>English</Text>
          </Text>
          {view === 'home' && (
            <>
              <Text style={styles.subtitleMarathi}>इंग्रजी बोलायला शिका — तुमच्या भाषेत!</Text>
              <Text style={styles.subtitleEnglish}>
                Learn confident spoken English with gentle Marathi support
              </Text>
            </>
          )}
        </View>

        {view === 'home' && (
          <>
            {/* Info Cards */}
            <View style={styles.cardsContainer}>
              <View style={[styles.infoCard, styles.promptCard]}>
                <View style={styles.promptHeaderRow}>
                  <View style={styles.promptLabel}>
                    <View style={styles.greenDot} />
                    <Text style={styles.cardSubtitleGreen}>DAILY MARATHI PROMPT</Text>
                  </View>
                  <Text style={styles.promptTime}>2 mins / day</Text>
                </View>
                <View style={styles.promptBox}>
                  <View style={styles.promptIconContainer}>
                    <Ionicons name="person-circle-outline" size={24} color="#D97706" />
                  </View>
                  <View style={styles.promptTextContainer}>
                    <Text style={styles.promptMarathi}>"मला कॅम्पस इंटरव्ह्यूची तयारी करायची ..."</Text>
                    <Text style={styles.promptEnglish}>"I want to prepare for campus interviews."</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Main Buttons */}
            <View style={styles.loginSection}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('login')}>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Login with Email / Username</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setView('register')}>
                <Ionicons name="person-add-outline" size={20} color="#145E4C" />
                <Text style={styles.secondaryBtnText}>Create Account</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity style={styles.guestBtn} onPress={handleGuestLogin} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#6B7280" /> : <Ionicons name="person-outline" size={20} color="#6B7280" />}
                <Text style={styles.guestBtnText}>Guest Entry</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {view === 'login' && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back!</Text>
            <Text style={styles.formSubtitle}>Enter your Username/Email to login</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Username or Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEmailLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => setView('home')}>
              <Text style={styles.backBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {view === 'register' && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Join Bolu English to save your progress</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Your Name (e.g. Rahul)"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Username or Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password (min 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Register Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => setView('home')}>
              <Text style={styles.backBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  logoContainer: { width: 80, height: 80, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  logo: { width: 50, height: 50 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  titleDark: { color: '#111827' },
  titleGreen: { color: '#145E4C' },
  subtitleMarathi: { fontSize: 18, fontWeight: 'bold', color: '#145E4C', marginBottom: 4 },
  subtitleEnglish: { fontSize: 14, color: '#4B5563', textAlign: 'center', paddingHorizontal: 20 },
  cardsContainer: { width: '100%', marginBottom: 32 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  promptCard: { backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#E0F2FE' },
  promptHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  promptLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#145E4C' },
  cardSubtitleGreen: { fontSize: 10, fontWeight: 'bold', color: '#145E4C', letterSpacing: 0.5 },
  promptTime: { fontSize: 10, color: '#6B7280' },
  promptBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 12 },
  promptIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  promptTextContainer: { flex: 1 },
  promptMarathi: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  promptEnglish: { fontSize: 13, color: '#145E4C' },
  loginSection: { width: '100%', gap: 12 },
  primaryBtn: { backgroundColor: '#145E4C', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  secondaryBtn: { backgroundColor: '#EEF2FF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#145E4C' },
  guestBtn: { backgroundColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  guestBtnText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText: { marginHorizontal: 10, color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
  formContainer: { width: '100%', gap: 16, marginTop: 20 },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  formSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#111827' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingRight: 16 },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#111827' },
  eyeIcon: { padding: 4 },
  backBtn: { paddingVertical: 12, alignItems: 'center' },
  backBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' }
});
