import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/useAuth";
import { updateUserProgress } from "../../lib/userService";
import { sendChatMessage, ChatMessage } from "../../lib/openRouter";
import * as Speech from "expo-speech";

const LESSON_CONTEXTS: any = {
  "1": "Hello! Let's practice introducing yourself. What is your name and what do you do? (तुमचं नाव काय आणि तुम्ही काय करता?)",
  "2": "Hi! Let's talk about everyday objects. What are three things you see in your room right now? (तुम्हाला आता खोलीत कोणत्या ३ वस्तू दिसत आहेत?)",
  "3": "Hello! Let's practice asking for things. How would you ask for a glass of water? (तुम्ही पाण्याचा ग्लास कसा मागाल?)",
  "4": "Hi! Let's talk about things you like. What is your favorite food and why? (तुमचा आवडता पदार्थ कोणता?)",
  "5": "Hey! Imagine we are college friends. What classes do you have today? (तुझे आज कोणते क्लास आहेत?)",
  "6": "Hello! I am Bolu, your AI English coach. Let's practice ordering food at a cafe today. What would you like to order? (तुम्हाला काय ऑर्डर करायला आवडेल?)",
  "7": "Good morning! Tell me about your daily routine. What time do you wake up? (तू किती वाजता उठतोस?)",
  "8": "Hi! The weekend is almost here. What are your plans for Saturday? (शनिवारचे तुझे काय प्लॅन्स आहेत?)"
};

export default function PracticeScreen() {
  const { user } = useAuth();
  const { lesson } = useLocalSearchParams();
  const lessonId = typeof lesson === 'string' ? lesson : "6";
  const initialMsg = LESSON_CONTEXTS[lessonId] || LESSON_CONTEXTS["6"];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: initialMsg }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: textToSend };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    if (typeof overrideText !== 'string') {
      setInputText("");
    }
    setLoading(true);

    try {
      const botReply = await sendChatMessage(newMessages);
      setMessages([...newMessages, { role: "assistant", content: botReply }]);
      
      // Auto-speak the AI's reply (stripping out Marathi in parentheses for better English accent)
      const englishPart = botReply.replace(/\(.*?\)/g, '').trim();
      Speech.speak(englishPart, { language: "en-US", rate: 0.9 });

    } catch (e: any) {
      setMessages([...newMessages, { role: "assistant", content: `माफ करा, सर्व्हर एरर आला: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsListening(true);
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          sendMessage(transcript); // Automatically send immediately!
        };
        
        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        Alert.alert("Not Supported", "तुमच्या ब्राउझरमध्ये Voice Typing सपोर्ट करत नाही.");
      }
    } else {
      Alert.alert("Coming Soon", "मोबाईल ॲपमध्ये माईक लवकरच येत आहे!");
    }
  };

  const finishPractice = async () => {
    if (user) {
      await updateUserProgress(user.uid, 50, 6); // Add 50 XP for completing practice
    }
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
            style={styles.logoSmall} 
          />
          <Text style={styles.headerTitle}>Cafe Conversation</Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={finishPractice}>
          <Text style={styles.finishBtnText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContent}
        >
          {messages.map((msg, index) => (
            <View 
              key={index} 
              style={[
                styles.messageBubble, 
                msg.role === "user" ? styles.userBubble : styles.botBubble
              ]}
            >
              <Text style={styles.messageText}>{msg.content}</Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <ActivityIndicator size="small" color="#145E4C" />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.micBtn} onPress={startListening}>
            <Ionicons name="mic" size={22} color={isListening ? "#EF4444" : "#6B7280"} />
          </TouchableOpacity>
          <TextInput
            style={styles.inputField}
            placeholder={isListening ? "Listening..." : "Type your response in English..."}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Completion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sparkleLeft}>✨</Text>
            <Text style={styles.sparkleRight}>🎉</Text>
            
            <View style={styles.modalLogoContainer}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' }} 
                style={styles.modalLogo} 
              />
            </View>
            
            <Text style={styles.modalTitle}>Great Job!</Text>
            <Text style={styles.modalSubtitle}>You completed today's practice!</Text>
            <Text style={styles.modalSubtitleMarathi}>आजची प्रॅक्टिस पूर्ण झाली! उत्तम सुरुवात केलीस.</Text>

            <View style={styles.xpBadgeModal}>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.xpBadgeTextModal}>+50 XP Earned</Text>
            </View>

            <TouchableOpacity 
              style={styles.continueBtn} 
              onPress={() => {
                setModalVisible(false);
                router.replace('/(tabs)/home');
              }}
            >
              <Text style={styles.continueBtnText}>🎉 Continue to Home</Text>
              <Ionicons name="home-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoSmall: { width: 28, height: 28, backgroundColor: '#F1F5F9', borderRadius: 6 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#111827' },
  finishBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  finishBtnText: { color: '#D97706', fontWeight: 'bold' },
  chatContent: { padding: 16, gap: 12 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: { fontSize: 15, color: '#1F2937', lineHeight: 22 },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#145E4C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  sparkleLeft: { position: 'absolute', top: 20, left: 20, fontSize: 24 },
  sparkleRight: { position: 'absolute', top: 30, right: 20, fontSize: 24 },
  modalLogoContainer: {
    width: 80, height: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  modalLogo: { width: 50, height: 50 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#145E4C', marginBottom: 8 },
  modalSubtitle: { fontSize: 16, color: '#111827', fontWeight: '500', marginBottom: 4 },
  modalSubtitleMarathi: { fontSize: 13, color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  xpBadgeModal: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, gap: 6, marginBottom: 24,
  },
  xpBadgeTextModal: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  continueBtn: {
    backgroundColor: '#145E4C',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 16, width: '100%', gap: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' }
});
