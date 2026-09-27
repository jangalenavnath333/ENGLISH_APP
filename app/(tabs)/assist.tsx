import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { getNativeTranslation } from "../../lib/openRouter";
import * as Speech from "expo-speech";

export default function AssistScreen() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{english: string, explanation: string} | null>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setResult(null);
    try {
      const res = await getNativeTranslation(inputText);
      setResult(res);
    } catch (error) {
      alert("Error: Couldn't translate right now.");
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = () => {
    if (result) {
      Speech.speak(result.english, { language: "en-US", rate: 0.8 });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bolu Smart Assist 🧠</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.introBox}>
            <Ionicons name="bulb-outline" size={24} color="#D97706" />
            <Text style={styles.introText}>
              कोणतही मराठी वाक्य टाईप करा. Bolu तुम्हाला सांगेल की नेटिव्ह इंग्रज लोक ते वाक्य त्यांच्या भाषेत कसं बोलतात! (e.g. Slangs, Idioms)
            </Text>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Marathi Phrase:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="उदा. माझं डोकं खाऊ नकोस..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity 
              style={[styles.translateBtn, !inputText.trim() && { opacity: 0.6 }]} 
              onPress={handleTranslate}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="language" size={18} color="#fff" />
                  <Text style={styles.translateBtnText}>Native Translate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultLabel}>Native English Phrase:</Text>
                <TouchableOpacity style={styles.listenBtn} onPress={playPronunciation}>
                  <Ionicons name="volume-high" size={20} color="#145E4C" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.englishText}>{result.english}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.explanationBox}>
                <Ionicons name="information-circle-outline" size={18} color="#4B5563" />
                <Text style={styles.explanationText}>{result.explanation}</Text>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#145E4C',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  translateBtn: {
    backgroundColor: '#1CB0F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  translateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#E6F4EA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#145E4C',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#145E4C',
    letterSpacing: 0.5,
  },
  listenBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  englishText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#145E4C',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(20, 94, 76, 0.2)',
    marginBottom: 16,
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  }
});
