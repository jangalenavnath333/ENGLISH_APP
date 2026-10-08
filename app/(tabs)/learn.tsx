import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";

const LESSON_DATA: any = {
  1: {
    title: "Introduce Yourself",
    subtitle: "स्वतःची ओळख करून द्यायला शिका",
    concept: "In English, we usually start by saying 'Hello' and then our name. It's polite to also ask 'How are you?'",
    words: [
      { id: 1, word: "Hello", meaning: "नमस्कार", emoji: "👋", ipa: "/həˈloʊ/" },
      { id: 2, word: "My name is...", meaning: "माझं नाव... आहे", emoji: "👤", ipa: "/maɪ neɪm ɪz/" },
      { id: 3, word: "How are you?", meaning: "तू कसा/कशी आहेस?", emoji: "❓", ipa: "/haʊ ɑːr juː/" },
      { id: 4, word: "I am fine", meaning: "मी ठीक आहे", emoji: "😊", ipa: "/aɪ æm faɪn/" },
    ]
  },
  2: {
    title: "Everyday Objects",
    subtitle: "दैनंदिन वस्तूंची नावे",
    concept: "We use 'This is' for things near us, and 'That is' for things far away.",
    words: [
      { id: 1, word: "Water", meaning: "पाणी", emoji: "💧", ipa: "/ˈwɔːtər/" },
      { id: 2, word: "Book", meaning: "पुस्तक", emoji: "📚", ipa: "/bʊk/" },
      { id: 3, word: "Phone", meaning: "फोन", emoji: "📱", ipa: "/foʊn/" },
      { id: 4, word: "Bag", meaning: "पिशवी/बॅग", emoji: "🎒", ipa: "/bæɡ/" },
    ]
  },
  // Default fallback for any other lesson number
  default: {
    title: "Vocabulary Building",
    subtitle: "नवीन शब्द शिका",
    concept: "Listen to the pronunciation carefully and try to repeat it aloud.",
    words: [
      { id: 1, word: "Thank you", meaning: "धन्यवाद", emoji: "🙏", ipa: "/θæŋk juː/" },
      { id: 2, word: "Please", meaning: "कृपया", emoji: "🙏", ipa: "/pliːz/" },
      { id: 3, word: "Sorry", meaning: "माफ करा", emoji: "😔", ipa: "/ˈsɒri/" },
      { id: 4, word: "Excuse me", meaning: "मला माफ करा (लक्ष वेधण्यासाठी)", emoji: "🙋", ipa: "/ɪkˈskjuːs miː/" },
    ]
  }
};

export default function LearnScreen() {
  const { lesson } = useLocalSearchParams();
  const lessonNumber = parseInt(lesson as string) || 1;
  const currentData = LESSON_DATA[lessonNumber] || LESSON_DATA.default;

  const playAudio = (text: string) => {
    Speech.speak(text, { language: "en-US", rate: 0.8 });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#145E4C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson {lessonNumber}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleSection}>
          <View style={styles.lessonTag}>
            <Ionicons name="book" size={14} color="#145E4C" />
            <Text style={styles.lessonTagText}>LEARN</Text>
          </View>
          <Text style={styles.title}>{currentData.title}</Text>
          <Text style={styles.subtitle}>{currentData.subtitle}</Text>
        </View>

        {/* Concept Card */}
        <View style={styles.conceptCard}>
          <View style={styles.conceptHeader}>
            <Ionicons name="bulb-outline" size={20} color="#D97706" />
            <Text style={styles.conceptTitle}>Bolu's Grammar Tip</Text>
          </View>
          <Text style={styles.conceptText}>{currentData.concept}</Text>
        </View>

        <Text style={styles.sectionTitle}>Vocabulary (शब्दार्थ)</Text>
        
        <View style={styles.vocabList}>
          {currentData.words.map((item: any) => (
            <View key={item.id} style={styles.vocabCard}>
              <View style={styles.emojiBox}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={styles.vocabInfo}>
                <Text style={styles.englishWord}>{item.word}</Text>
                <Text style={styles.ipaText}>{item.ipa}</Text>
                <Text style={styles.marathiMeaning}>{item.meaning}</Text>
              </View>
              <TouchableOpacity style={styles.audioBtn} onPress={() => playAudio(item.word)}>
                <Ionicons name="volume-high" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.continueBtn} 
          onPress={() => router.navigate(`/(tabs)/assess?lesson=${lessonNumber}`)}
        >
          <Text style={styles.continueBtnText}>Take Quiz (क्विझ सुरू करा)</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 24,
  },
  lessonTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  lessonTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#145E4C',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  conceptCard: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 24,
  },
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  conceptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B45309',
  },
  conceptText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  vocabList: {
    gap: 12,
    marginBottom: 32,
  },
  vocabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emojiBox: {
    width: 48,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emoji: {
    fontSize: 24,
  },
  vocabInfo: {
    flex: 1,
  },
  englishWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  ipaText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  marathiMeaning: {
    fontSize: 14,
    color: '#145E4C',
    fontWeight: '500',
  },
  audioBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtn: {
    backgroundColor: '#58CC02',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  }
});
