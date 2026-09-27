import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../lib/useAuth";
import { updateUserProgress } from "../../lib/userService";
import * as Speech from "expo-speech";

const QUESTIONS = [
  {
    id: 1,
    word: "Hello",
    pronunciation: "/həˈloʊ/ · हॅलो",
    question: "What does this greeting mean in Marathi?",
    category: "EVERYDAY GREETINGS",
    options: [
      { id: 'A', text: "🙏 नमस्कार", sub: "Namaskar (Greeting)" },
      { id: 'B', text: "👋 निरोप", sub: "Nirop (Goodbye)" },
      { id: 'C', text: "🙏 धन्यवाद", sub: "Dhanyavaad (Thank you)" },
      { id: 'D', text: "❓ कृपया", sub: "Krupaya (Please)" },
    ],
    correctOption: 'A'
  },
  {
    id: 2,
    word: "Water",
    pronunciation: "/ˈwɔːtər/ · वॉटर",
    question: "What is the Marathi word for Water?",
    category: "FOOD & DRINK",
    options: [
      { id: 'A', text: "☕ चहा", sub: "Chaha (Tea)" },
      { id: 'B', text: "💧 पाणी", sub: "Paani (Water)" },
      { id: 'C', text: "🥛 दूध", sub: "Dudh (Milk)" },
      { id: 'D', text: "🍲 जेवण", sub: "Jevan (Food)" },
    ],
    correctOption: 'B'
  },
  {
    id: 3,
    word: "Thank You",
    pronunciation: "/θæŋk juː/ · थँक यू",
    question: "How do you say Thank You in Marathi?",
    category: "POLITENESS",
    options: [
      { id: 'A', text: "🙏 नमस्कार", sub: "Namaskar (Hello)" },
      { id: 'B', text: "😔 माफ करा", sub: "Maaf kara (Sorry)" },
      { id: 'C', text: "🙏 धन्यवाद", sub: "Dhanyavaad (Thank you)" },
      { id: 'D', text: "👍 ठीक आहे", sub: "Theek aahe (Okay)" },
    ],
    correctOption: 'C'
  }
];

export default function AssessScreen() {
  const { user, profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'finished'>('idle');

  const streak = profile?.streak || 0;
  const currentQ = QUESTIONS[currentIndex];

  const handleSubmit = async () => {
    if (!selectedOption) {
      Alert.alert("थांबा!", "कृपया एक पर्याय निवडा. (Please select an option)");
      return;
    }

    if (selectedOption === currentQ.correctOption) {
      setStatus('correct');
      Speech.speak("Correct", { language: "en-US", rate: 1.2 });
    } else {
      setStatus('wrong');
      Speech.speak("Incorrect", { language: "en-US", rate: 1.2 });
    }
  };

  const handleContinue = async () => {
    if (status === 'correct') {
      if (currentIndex < QUESTIONS.length - 1) {
        setSelectedOption(null);
        setStatus('idle');
        setCurrentIndex(currentIndex + 1);
      } else {
        // Finished
        setStatus('finished');
        setLoading(true);
        if (user) {
          await updateUserProgress(user.uid, 50, streak);
        }
        setLoading(false);
        Alert.alert(
          "अभिनंदन! 🏆",
          "तुम्ही सर्व प्रश्नांची बरोबर उत्तरे दिली. तुम्हाला 50 XP मिळाले!",
          [{ text: "Home वर जा", onPress: () => router.replace('/(tabs)/home') }]
        );
      }
    } else if (status === 'wrong') {
      // Just reset to try again or skip? Let's just let them try again.
      setSelectedOption(null);
      setStatus('idle');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const playPronunciation = () => {
    Speech.speak(currentQ.word, { language: "en-US", rate: 0.7 });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
            style={styles.logoSmall} 
          />
          <View>
            <Text style={styles.headerTitle}>Bolu</Text>
            <Text style={styles.headerSubtitle}>Assess</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#D97706" />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Progress Row */}
        <View style={styles.topProgressRow}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleSkip}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            {QUESTIONS.map((_, idx) => (
              <View 
                key={idx} 
                style={idx <= currentIndex ? styles.progressBarSegmentFill : styles.progressBarSegment} 
              />
            ))}
          </View>
          <View style={styles.xpBadge}>
            <Ionicons name="flash" size={14} color="#D97706" />
            <Text style={styles.xpBadgeText}>50 XP</Text>
          </View>
        </View>

        {/* Question Header */}
        <View style={styles.questionHeader}>
          <Text style={styles.questionMeta}>LEVEL CHECK · Question {currentIndex + 1}/{QUESTIONS.length}</Text>
          <Text style={styles.questionTitle}>Step {currentIndex + 1}: Vocabulary & Meaning</Text>
          <Text style={styles.questionSubtitle}>
            {currentQ.question}
          </Text>
          <Text style={styles.questionSubtitleMarathi}>
            (खालील शब्दाचा योग्य अर्थ निवडा)
          </Text>
        </View>

        {/* Word Card */}
        <View style={styles.wordCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentQ.category}</Text>
          </View>
          
          <Text style={styles.wordText}>{currentQ.word}</Text>
          <Text style={styles.pronunciation}>{currentQ.pronunciation}</Text>
          
          <TouchableOpacity style={styles.listenBtn} onPress={playPronunciation}>
            <Ionicons name="volume-high-outline" size={16} color="#145E4C" />
            <Text style={styles.listenText}>Listen pronunciation</Text>
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQ.options.map((opt) => (
            <TouchableOpacity 
              key={opt.id}
              style={[styles.optionCard, selectedOption === opt.id && styles.optionSelected]}
              onPress={() => setSelectedOption(opt.id)}
            >
              <View style={[styles.optionLetterBox, selectedOption === opt.id && styles.optionLetterSelected]}>
                <Text style={selectedOption === opt.id ? styles.optionLetterTextSelected : styles.optionLetterText}>{opt.id}</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={selectedOption === opt.id ? styles.optionTextSelected : styles.optionText}>{opt.text}</Text>
                <Text style={selectedOption === opt.id ? styles.optionSubTextSelected : styles.optionSubText}>{opt.sub}</Text>
              </View>
              {selectedOption === opt.id ? (
                <Ionicons name="checkmark-circle" size={24} color="#1CB0F6" />
              ) : (
                <View style={styles.circleEmpty} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>मला माहित नाही · I don't know (Skip)</Text>
          <Ionicons name="arrow-forward" size={16} color="#4B5563" />
        </TouchableOpacity>

        {/* Tip Box */}
        <View style={styles.tipBox}>
          <View style={styles.tipIconContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
              style={styles.tipImage} 
            />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipMarathi}>घाई करू नका! रोजच्या संभाषणातील साधे शब्द आहेत.</Text>
            <Text style={styles.tipEnglish}>(Take your time! These are everyday words.)</Text>
          </View>
        </View>

        {/* Submit Button or Banner */}
        {status === 'idle' && (
          <TouchableOpacity 
            style={[styles.submitBtn, { opacity: selectedOption ? 1 : 0.6 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Checking..." : "Check"}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Bottom Result Banner */}
      {status !== 'idle' && status !== 'finished' && (
        <View style={[styles.bottomBanner, status === 'correct' ? styles.bannerCorrect : styles.bannerWrong]}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconContainer}>
              <Ionicons 
                name={status === 'correct' ? "checkmark-circle" : "close-circle"} 
                size={32} 
                color={status === 'correct' ? "#15803D" : "#B91C1C"} 
              />
            </View>
            <View>
              <Text style={[styles.bannerTitle, status === 'correct' ? styles.bannerTitleCorrect : styles.bannerTitleWrong]}>
                {status === 'correct' ? "Excellent!" : "Correct solution:"}
              </Text>
              {status === 'wrong' && (
                <Text style={styles.bannerSubtitle}>
                  {currentQ.options.find(o => o.id === currentQ.correctOption)?.text}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.bannerBtn, status === 'correct' ? styles.bannerBtnCorrect : styles.bannerBtnWrong]}
            onPress={handleContinue}
          >
            <Text style={[styles.bannerBtnText, status === 'correct' ? styles.bannerBtnTextCorrect : styles.bannerBtnTextWrong]}>
              {status === 'correct' ? "Continue" : "Got it"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F8FAFC' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoSmall: { width: 32, height: 32, backgroundColor: '#fff', borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#145E4C' },
  headerSubtitle: { fontSize: 12, color: '#6B7280' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  streakText: { fontSize: 14, fontWeight: 'bold', color: '#D97706' },
  profileIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#145E4C', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  topProgressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  progressBarContainer: { flexDirection: 'row', gap: 4, flex: 1, marginHorizontal: 16 },
  progressBarSegmentFill: { flex: 1, height: 6, backgroundColor: '#145E4C', borderRadius: 3 },
  progressBarSegment: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  xpBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#D97706' },
  questionHeader: { marginBottom: 20 },
  questionMeta: { fontSize: 12, fontWeight: 'bold', color: '#145E4C', letterSpacing: 0.5, marginBottom: 8 },
  questionTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  questionSubtitle: { fontSize: 15, color: '#374151' },
  questionSubtitleMarathi: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  wordCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E5E7EB' },
  categoryBadge: { backgroundColor: '#E6F4EA', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 16 },
  categoryText: { fontSize: 10, fontWeight: 'bold', color: '#145E4C', letterSpacing: 0.5 },
  wordText: { fontSize: 36, fontWeight: 'bold', color: '#145E4C', marginBottom: 4 },
  pronunciation: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  listenBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6, marginBottom: 20 },
  listenText: { fontSize: 14, fontWeight: '500', color: '#145E4C' },
  questionBox: { backgroundColor: '#F8FAFC', width: '100%', padding: 12, borderRadius: 12, alignItems: 'center' },
  questionBoxText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  optionsContainer: { gap: 12, marginBottom: 24 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  optionSelected: { backgroundColor: '#DDF4FF', borderColor: '#84D8FF' },
  optionLetterBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionLetterSelected: { backgroundColor: '#1CB0F6' },
  optionLetterText: { fontSize: 14, fontWeight: 'bold', color: '#4B5563' },
  optionLetterTextSelected: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  optionContent: { flex: 1 },
  optionText: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  optionTextSelected: { fontSize: 16, fontWeight: 'bold', color: '#1CB0F6', marginBottom: 2 },
  optionSubText: { fontSize: 13, color: '#6B7280' },
  optionSubTextSelected: { fontSize: 13, color: '#1CB0F6' },
  circleEmpty: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0' },
  skipBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, marginBottom: 24, gap: 6 },
  skipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  tipBox: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 24, alignItems: 'flex-start', gap: 12 },
  tipIconContainer: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tipImage: { width: 24, height: 24 },
  tipContent: { flex: 1 },
  tipMarathi: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  tipEnglish: { fontSize: 12, color: '#4B5563' },
  submitBtn: { backgroundColor: '#58CC02', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  bottomBanner: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 24, borderTopWidth: 1 },
  bannerCorrect: { backgroundColor: '#D7FFB8', borderColor: '#B5EA8E' },
  bannerWrong: { backgroundColor: '#FFDFE0', borderColor: '#FFC4C5' },
  bannerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  bannerIconContainer: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { fontSize: 24, fontWeight: '800' },
  bannerTitleCorrect: { color: '#58A700' },
  bannerTitleWrong: { color: '#EA2B2B' },
  bannerSubtitle: { fontSize: 16, color: '#EA2B2B', fontWeight: 'bold', marginTop: 4 },
  bannerBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  bannerBtnCorrect: { backgroundColor: '#58CC02' },
  bannerBtnWrong: { backgroundColor: '#FF4B4B' },
  bannerBtnText: { fontSize: 16, fontWeight: 'bold' },
  bannerBtnTextCorrect: { color: '#fff' },
  bannerBtnTextWrong: { color: '#fff' }
});
