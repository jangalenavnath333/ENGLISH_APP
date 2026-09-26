import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../lib/useAuth";
import { updateUserProgress } from "../../lib/userService";

export default function AssessScreen() {
  const { user, profile } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const streak = profile?.streak || 0;

  const handleSubmit = async () => {
    if (!selectedOption) {
      Alert.alert("थांबा!", "कृपया एक पर्याय निवडा. (Please select an option)");
      return;
    }

    if (selectedOption === 'A') {
      // Correct Answer
      setLoading(true);
      if (user) {
        await updateUserProgress(user.uid, 15, streak); // 15 XP for correct answer
      }
      setLoading(false);
      Alert.alert(
        "बरोबर उत्तर! 🎉",
        "तुम्हाला 15 XP मिळाले आहेत!",
        [{ text: "पुढे जा (Next)", onPress: () => router.replace('/(tabs)/home') }]
      );
    } else {
      // Wrong Answer
      Alert.alert(
        "चुकले! 😔",
        "योग्य उत्तर 'A' (नमस्कार) आहे. पुन्हा प्रयत्न करा!",
        [{ text: "ओके" }]
      );
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
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
            <View style={styles.progressBarSegmentFill} />
            <View style={styles.progressBarSegment} />
            <View style={styles.progressBarSegment} />
          </View>
          <View style={styles.xpBadge}>
            <Ionicons name="flash" size={14} color="#D97706" />
            <Text style={styles.xpBadgeText}>15 XP</Text>
          </View>
        </View>

        {/* Question Header */}
        <View style={styles.questionHeader}>
          <Text style={styles.questionMeta}>LEVEL CHECK · Question 1/3</Text>
          <Text style={styles.questionTitle}>Step 1: Vocabulary & Meaning</Text>
          <Text style={styles.questionSubtitle}>
            Match the English word with its Marathi meaning
          </Text>
          <Text style={styles.questionSubtitleMarathi}>
            (खालील शब्दाचा योग्य मराठी अर्थ निवडा)
          </Text>
        </View>

        {/* Word Card */}
        <View style={styles.wordCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>EVERYDAY GREETINGS</Text>
          </View>
          
          <Text style={styles.wordText}>Hello</Text>
          <Text style={styles.pronunciation}>/həˈloʊ/ · हॅलो</Text>
          
          <TouchableOpacity style={styles.listenBtn}>
            <Ionicons name="volume-high-outline" size={16} color="#145E4C" />
            <Text style={styles.listenText}>Listen pronunciation</Text>
          </TouchableOpacity>
          
          <View style={styles.questionBox}>
            <Text style={styles.questionBoxText}>What does this greeting mean in Marathi?</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionCard, selectedOption === 'A' && styles.optionSelected]}
            onPress={() => setSelectedOption('A')}
          >
            <View style={[styles.optionLetterBox, selectedOption === 'A' && styles.optionLetterSelected]}>
              <Text style={selectedOption === 'A' ? styles.optionLetterTextSelected : styles.optionLetterText}>A</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={selectedOption === 'A' ? styles.optionTextSelected : styles.optionText}>🙏 नमस्कार</Text>
              <Text style={selectedOption === 'A' ? styles.optionSubTextSelected : styles.optionSubText}>Namaskar (Greeting)</Text>
            </View>
            {selectedOption === 'A' ? (
              <Ionicons name="checkmark-circle" size={24} color="#145E4C" />
            ) : (
              <View style={styles.circleEmpty} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionCard, selectedOption === 'B' && styles.optionSelected]}
            onPress={() => setSelectedOption('B')}
          >
            <View style={[styles.optionLetterBox, selectedOption === 'B' && styles.optionLetterSelected]}>
              <Text style={selectedOption === 'B' ? styles.optionLetterTextSelected : styles.optionLetterText}>B</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={selectedOption === 'B' ? styles.optionTextSelected : styles.optionText}>👋 निरोप</Text>
              <Text style={selectedOption === 'B' ? styles.optionSubTextSelected : styles.optionSubText}>Nirop (Goodbye)</Text>
            </View>
            {selectedOption === 'B' ? (
              <Ionicons name="checkmark-circle" size={24} color="#145E4C" />
            ) : (
              <View style={styles.circleEmpty} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionCard, selectedOption === 'C' && styles.optionSelected]}
            onPress={() => setSelectedOption('C')}
          >
            <View style={[styles.optionLetterBox, selectedOption === 'C' && styles.optionLetterSelected]}>
              <Text style={selectedOption === 'C' ? styles.optionLetterTextSelected : styles.optionLetterText}>C</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={selectedOption === 'C' ? styles.optionTextSelected : styles.optionText}>🙏 धन्यवाद</Text>
              <Text style={selectedOption === 'C' ? styles.optionSubTextSelected : styles.optionSubText}>Dhanyavaad (Thank you)</Text>
            </View>
            {selectedOption === 'C' ? (
              <Ionicons name="checkmark-circle" size={24} color="#145E4C" />
            ) : (
              <View style={styles.circleEmpty} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionCard, selectedOption === 'D' && styles.optionSelected]}
            onPress={() => setSelectedOption('D')}
          >
            <View style={[styles.optionLetterBox, selectedOption === 'D' && styles.optionLetterSelected]}>
              <Text style={selectedOption === 'D' ? styles.optionLetterTextSelected : styles.optionLetterText}>D</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={selectedOption === 'D' ? styles.optionTextSelected : styles.optionText}>❓ कृपया</Text>
              <Text style={selectedOption === 'D' ? styles.optionSubTextSelected : styles.optionSubText}>Krupaya (Please)</Text>
            </View>
            {selectedOption === 'D' ? (
              <Ionicons name="checkmark-circle" size={24} color="#145E4C" />
            ) : (
              <View style={styles.circleEmpty} />
            )}
          </TouchableOpacity>
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

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitBtn, { opacity: selectedOption ? 1 : 0.6 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? "Checking..." : "Submit Answer (उत्तर सबमिट करा)"}
          </Text>
          {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
        </TouchableOpacity>

      </ScrollView>
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
  optionSelected: { backgroundColor: '#E6F4EA', borderColor: '#145E4C' },
  optionLetterBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionLetterSelected: { backgroundColor: '#145E4C' },
  optionLetterText: { fontSize: 14, fontWeight: 'bold', color: '#4B5563' },
  optionLetterTextSelected: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  optionContent: { flex: 1 },
  optionText: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  optionTextSelected: { fontSize: 16, fontWeight: 'bold', color: '#145E4C', marginBottom: 2 },
  optionSubText: { fontSize: 13, color: '#6B7280' },
  optionSubTextSelected: { fontSize: 13, color: '#145E4C' },
  circleEmpty: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0' },
  skipBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, marginBottom: 24, gap: 6 },
  skipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  tipBox: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 24, alignItems: 'flex-start', gap: 12 },
  tipIconContainer: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tipImage: { width: 24, height: 24 },
  tipContent: { flex: 1 },
  tipMarathi: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  tipEnglish: { fontSize: 12, color: '#4B5563' },
  submitBtn: { backgroundColor: '#145E4C', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' }
});
